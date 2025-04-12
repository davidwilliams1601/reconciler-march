const express = require('express');
const multer = require('multer');
const { extractInvoiceData } = require('../utils/visionApi');
const xeroService = require('../services/xeroService');
const costCenterService = require('../services/costCenterService');
const Invoice = require('../models/Invoice');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const reconciliationService = require('../services/reconciliationService');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPEG, PNG) and PDFs are allowed'));
        }
    }
});

// Initialize service
router.use(async (req, res, next) => {
    try {
        await reconciliationService.initialize();
        next();
    } catch (error) {
        console.error('Failed to initialize reconciliation service:', error);
        next();
    }
});

// POST /api/invoices/upload
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No document uploaded' });
        }

        const filePath = req.file.path;
        console.log(`Processing uploaded document: ${filePath}`);
        
        // Extract metadata from request body
        const metadata = {
            vendor: req.body.vendor,
            invoiceNumber: req.body.invoiceNumber,
            amount: req.body.amount ? parseFloat(req.body.amount) : undefined,
            currency: req.body.currency || 'GBP',
            issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
            description: req.body.description
        };
        
        // Process the invoice using the reconciliation service
        const result = await reconciliationService.processInvoice(filePath, {
            includeRawVisionData: false,
            attachmentPaths: [filePath],
            ...metadata
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to process document');
        }
        
        return res.status(201).json({
            message: 'Invoice processed successfully',
            invoice: result.invoice,
            xeroMatch: result.xeroResults.success ? result.xeroResults : null
        });
    } catch (error) {
        console.error('Error processing invoice:', error);
        res.status(500).json({ message: 'Error processing invoice', error: error.message });
    }
});

// POST /api/invoices/:id/train
router.post('/:id/train', async (req, res) => {
    try {
        const { costCenter } = req.body;
        if (!costCenter) {
            return res.status(400).json({ message: 'Cost center is required' });
        }

        const result = await costCenterService.trainModel(req.params.id, costCenter);
        if (!result.success) {
            return res.status(400).json(result);
        }

        res.json(result);
    } catch (error) {
        console.error('Error training model:', error);
        res.status(500).json({
            message: 'Error training model',
            error: error.message
        });
    }
});

// GET /api/invoices
router.get('/', async (req, res) => {
    try {
        // Pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Filtering parameters
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.vendor) filter.vendor = { $regex: req.query.vendor, $options: 'i' };
        if (req.query.fromDate) filter.issueDate = { $gte: new Date(req.query.fromDate) };
        if (req.query.toDate) {
            if (filter.issueDate) {
                filter.issueDate.$lte = new Date(req.query.toDate);
            } else {
                filter.issueDate = { $lte: new Date(req.query.toDate) };
            }
        }
        
        // Execute query with pagination
        const invoices = await Invoice.find(filter)
            .sort({ issueDate: -1 })
            .skip(skip)
            .limit(limit);
        
        // Get total count for pagination
        const total = await Invoice.countDocuments(filter);
        
        res.json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: invoices
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ message: 'Error fetching invoices', error: error.message });
    }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({
            message: 'Error fetching invoice',
            error: error.message
        });
    }
});

// Add route to update line item cost center
router.put('/:id/line-items/:lineItemId/cost-center', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const lineItem = invoice.lineItems.id(req.params.lineItemId);
        if (!lineItem) {
            return res.status(404).json({ message: 'Line item not found' });
        }

        lineItem.costCenter = {
            code: req.body.code,
            name: req.body.name,
            manuallySet: true,
            predictedAt: new Date()
        };

        await invoice.save();
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add route to train cost center model with line item
router.post('/:id/line-items/:lineItemId/train', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const lineItem = invoice.lineItems.id(req.params.lineItemId);
        if (!lineItem) {
            return res.status(404).json({ message: 'Line item not found' });
        }

        const result = await costCenterService.trainModel({
            description: lineItem.description,
            vendor: invoice.vendor,
            amount: lineItem.amount,
            costCenter: req.body.costCenter
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST manually reconcile an invoice with a Xero transaction
router.post('/:id/reconcile', async (req, res) => {
    try {
        const { id } = req.params;
        const { transactionId, updateCostCenter, reference } = req.body;
        
        if (!transactionId) {
            return res.status(400).json({ message: 'Transaction ID is required' });
        }
        
        const result = await reconciliationService.reconcileInvoice(id, transactionId, {
            updateCostCenter: updateCostCenter !== false, // Default to true
            reference
        });
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        res.json({
            message: 'Invoice reconciled successfully',
            invoice: result.invoice
        });
    } catch (error) {
        console.error('Error reconciling invoice:', error);
        res.status(500).json({ message: 'Error reconciling invoice', error: error.message });
    }
});

// DELETE an invoice
router.delete('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        
        res.json({
            message: 'Invoice deleted successfully',
            invoice
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ message: 'Error deleting invoice', error: error.message });
    }
});

module.exports = router; 