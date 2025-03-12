const express = require('express');
const multer = require('multer');
const { extractInvoiceData } = require('../utils/visionApi');
const Invoice = require('../models/Invoice');

const router = express.Router();

// Configure multer for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// POST /api/invoices/upload
router.post('/upload', upload.single('invoice'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('Processing file:', req.file.originalname);

        // Process the image with Google Vision API
        const result = await extractInvoiceData(req.file.buffer);

        if (!result.success) {
            return res.status(422).json({
                message: 'Failed to process invoice',
                error: result.error
            });
        }

        // Create a new invoice record
        const invoice = new Invoice({
            invoiceNumber: result.data.invoiceNumber || 'UNKNOWN',
            vendor: result.data.vendor || 'Unknown Vendor',
            amount: result.data.amount || 0,
            issueDate: result.data.date ? new Date(result.data.date) : new Date(),
            dueDate: result.data.date ? new Date(result.data.date) : new Date(),
            status: 'review',
            description: 'Automatically processed invoice'
        });

        await invoice.save();

        res.json({
            message: 'Invoice processed successfully',
            invoice,
            extractedData: result.data,
            rawText: result.rawText
        });

    } catch (error) {
        console.error('Error processing invoice:', error);
        res.status(500).json({
            message: 'Error processing invoice',
            error: error.message
        });
    }
});

// GET /api/invoices
router.get('/', async (req, res) => {
    try {
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching invoices' });
    }
});

module.exports = router; 