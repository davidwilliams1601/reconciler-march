const mongoose = require('mongoose');

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