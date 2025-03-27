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

// POST /api/invoices/upload
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('Processing file:', req.file.originalname);
        console.log('File type:', req.file.mimetype);
        console.log('File size:', req.file.size);

        let imageBuffer = req.file.buffer;
        
        // If the file is a PDF, convert it to an image
        if (req.file.mimetype === 'application/pdf') {
            console.log('Processing PDF...');
            try {
                // Create a temporary directory with subdirectories
                const tempDir = path.join(os.tmpdir(), `invoice-${Math.random().toString(36).substring(7)}`);
                const outputDir = path.join(tempDir, 'output');
                fs.mkdirSync(outputDir, { recursive: true });
                
                const tempPdfPath = path.join(tempDir, 'temp.pdf');
                const outputImagePath = path.join(outputDir, 'page.png');
                
                // Write PDF to temp file
                fs.writeFileSync(tempPdfPath, req.file.buffer);
                console.log('PDF written to:', tempPdfPath);
                
                // Load the PDF to verify it's valid and get page count
                const pdfDoc = await PDFDocument.load(req.file.buffer);
                const pages = pdfDoc.getPages();
                if (pages.length === 0) {
                    throw new Error('PDF has no pages');
                }
                
                const firstPage = pages[0];
                console.log('PDF loaded successfully');
                console.log('First page dimensions:', { width: firstPage.getWidth(), height: firstPage.getHeight() });
                
                // Convert PDF to image using sharp
                try {
                    imageBuffer = await sharp(tempPdfPath, {
                        density: 300
                    })
                    .jpeg({
                        quality: 100,
                        chromaSubsampling: '4:4:4'
                    })
                    .toBuffer();
                    
                    console.log('PDF converted to image successfully');
                } catch (conversionError) {
                    console.error('Error converting PDF to image:', conversionError);
                    throw new Error('Failed to convert PDF to image: ' + conversionError.message);
                } finally {
                    // Clean up temporary files
                    try {
                        fs.rmSync(tempDir, { recursive: true, force: true });
                        console.log('Temporary files cleaned up');
                    } catch (cleanupError) {
                        console.error('Error cleaning up temporary files:', cleanupError);
                    }
                }
            } catch (error) {
                console.error('Error processing PDF:', error);
                return res.status(422).json({
                    message: 'Failed to process PDF file',
                    error: error.message
                });
            }
        }

        // Process with Google Vision API
        console.log('Starting Google Vision API processing...');
        const result = await extractInvoiceData(imageBuffer);
        console.log('Vision API result:', JSON.stringify(result, null, 2));

        if (!result.success) {
            console.error('Vision API processing failed:', result.error);
            return res.status(422).json({
                message: 'Failed to process invoice',
                error: result.error
            });
        }

        // Extract line items from OCR results
        const lineItems = extractLineItems(result.rawText);
        
        // Create invoice with line items
        const invoice = new Invoice({
            invoiceNumber: result.data.invoiceNumber,
            vendor: result.data.vendor,
            amount: result.data.amount,
            currency: 'GBP',
            issueDate: result.data.date,
            description: result.data.description,
            file: {
                originalName: req.file.originalname,
                path: req.file.path,
                mimeType: req.file.mimetype,
                size: req.file.size
            },
            ocrResults: {
                confidence: result.confidence,
                rawText: result.rawText,
                processedAt: new Date(),
                extractedData: {
                    detectedInvoiceNumber: result.data.invoiceNumber,
                    detectedVendor: result.data.vendor,
                    detectedAmount: result.data.amount,
                    detectedDate: result.data.date,
                    confidence: result.confidence
                }
            },
            lineItems: lineItems
        });

        // Save invoice
        const savedInvoice = await invoice.save();

        // Predict cost centers for each line item
        for (let i = 0; i < savedInvoice.lineItems.length; i++) {
            const lineItem = savedInvoice.lineItems[i];
            const prediction = await costCenterService.predictCostCenter({
                description: lineItem.description,
                vendor: savedInvoice.vendor,
                amount: lineItem.amount
            });

            lineItem.costCenter = prediction.costCenter;
            lineItem.categorization = prediction.categorization;
        }

        // Calculate overall invoice cost center based on line items
        const overallPrediction = await costCenterService.predictCostCenter({
            description: savedInvoice.description,
            vendor: savedInvoice.vendor,
            amount: savedInvoice.amount
        });

        savedInvoice.costCenter = overallPrediction.costCenter;
        savedInvoice.categorization = overallPrediction.categorization;

        await savedInvoice.save();

        // Attempt to match with Xero transaction
        try {
            const matchResult = await xeroService.findMatchingTransaction(savedInvoice);
            savedInvoice.xeroMatching = matchResult;
            await savedInvoice.save();
        } catch (error) {
            console.error('Error matching Xero transaction:', error);
            savedInvoice.xeroMatching = {
                status: 'pending',
                error: error.message
            };
            await savedInvoice.save();
        }

        res.status(201).json(savedInvoice);
    } catch (error) {
        console.error('Error processing invoice:', error);
        res.status(500).json({ message: error.message });
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
        const invoices = await Invoice.find().sort({ createdAt: -1 });
        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({
            message: 'Error fetching invoices',
            error: error.message
        });
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

module.exports = router; 