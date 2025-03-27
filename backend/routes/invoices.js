const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Invoice = require('../models/Invoice');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/invoices';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
        }
    }
});

// Get all invoices
router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Upload new invoice
router.post('/upload', upload.single('invoice'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create new invoice with file information
        const invoice = new Invoice({
            invoiceNumber: 'PENDING', // Will be updated after OCR
            vendor: 'PENDING', // Will be updated after OCR
            amount: 0, // Will be updated after OCR
            currency: 'GBP',
            issueDate: new Date(), // Will be updated after OCR
            status: 'pending',
            file: {
                originalName: req.file.originalname,
                path: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size
            },
            ocrResults: {
                confidence: 0,
                rawText: '',
                processedAt: null,
                extractedData: {
                    detectedInvoiceNumber: '',
                    detectedVendor: '',
                    detectedAmount: 0,
                    detectedDate: null,
                    confidence: {
                        invoiceNumber: 0,
                        vendor: 0,
                        amount: 0,
                        date: 0
                    }
                }
            }
        });

        const savedInvoice = await invoice.save();
        
        // Return the saved invoice
        res.status(201).json({
            message: 'Invoice uploaded successfully',
            invoice: savedInvoice,
            nextSteps: [
                'OCR processing will begin automatically',
                'Once OCR is complete, the invoice details will be updated',
                'The system will then attempt to match with Xero transactions'
            ]
        });

    } catch (error) {
        // Clean up uploaded file if there's an error
        if (req.file) {
            fs.unlink(req.file.path, () => {});
        }
        res.status(500).json({ message: error.message });
    }
});

// Get specific invoice
router.get('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (invoice) {
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an invoice
router.put('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json(invoice);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an invoice
router.delete('/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.json({ message: 'Invoice deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 