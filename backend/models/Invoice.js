const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    unitPrice: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    costCenter: {
        code: String,
        name: String,
        confidence: Number,
        predictedAt: Date,
        manuallySet: {
            type: Boolean,
            default: false
        }
    },
    categorization: {
        category: String,
        subcategory: String,
        confidence: Number,
        predictedAt: Date,
        manuallySet: {
            type: Boolean,
            default: false
        },
        keywords: [String]
    }
});

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true
    },
    vendor: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'GBP'
    },
    status: {
        type: String,
        enum: ['pending', 'review', 'approved', 'rejected'],
        default: 'pending'
    },
    issueDate: {
        type: Date,
        required: true
    },
    dueDate: {
        type: Date
    },
    description: String,
    notes: String,
    // Line items
    lineItems: [lineItemSchema],
    // Cost center and categorization for the entire invoice (default values)
    costCenter: {
        code: String,
        name: String,
        confidence: Number,
        predictedAt: Date,
        manuallySet: {
            type: Boolean,
            default: false
        }
    },
    categorization: {
        category: String,
        subcategory: String,
        confidence: Number,
        predictedAt: Date,
        manuallySet: {
            type: Boolean,
            default: false
        },
        keywords: [String]
    },
    // New fields for file handling
    file: {
        originalName: String,
        path: String,
        mimeType: String,
        size: Number
    },
    // OCR results
    ocrResults: {
        confidence: Number,
        rawText: String,
        processedAt: Date,
        extractedData: {
            detectedInvoiceNumber: String,
            detectedVendor: String,
            detectedAmount: Number,
            detectedDate: Date,
            confidence: {
                invoiceNumber: Number,
                vendor: Number,
                amount: Number,
                date: Number
            }
        }
    },
    // Xero matching
    xeroMatching: {
        matchedTransactionId: String,
        confidence: Number,
        matchedAt: Date,
        status: {
            type: String,
            enum: ['pending', 'matched', 'no_match', 'multiple_matches'],
            default: 'pending'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp before saving
invoiceSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Invoice', invoiceSchema); 