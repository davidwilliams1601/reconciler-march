const express = require('express');
const Invoice = require('../models/Invoice');

const router = express.Router();

// Helper function to generate test data
async function generateTestData() {
    try {
        // Check if we already have invoices
        const count = await Invoice.countDocuments();
        if (count > 0) {
            console.log('Test data already exists');
            return;
        }

        const testInvoices = [
            {
                invoiceNumber: 'INV-001',
                vendor: 'Office Supplies Ltd',
                amount: 1250.50,
                status: 'approved',
                issueDate: new Date('2024-01-15'),
                dueDate: new Date('2024-02-15'),
                description: 'Office supplies Q1'
            },
            {
                invoiceNumber: 'INV-002',
                vendor: 'IT Services Co',
                amount: 2499.99,
                status: 'review',
                issueDate: new Date('2024-01-20'),
                dueDate: new Date('2024-02-20'),
                description: 'IT Support January'
            },
            {
                invoiceNumber: 'INV-003',
                vendor: 'Marketing Agency',
                amount: 5000.00,
                status: 'pending',
                issueDate: new Date('2024-01-25'),
                dueDate: new Date('2024-02-25'),
                description: 'Marketing Campaign Q1'
            },
            {
                invoiceNumber: 'INV-004',
                vendor: 'Cleaning Services',
                amount: 750.00,
                status: 'review',
                issueDate: new Date('2024-01-28'),
                dueDate: new Date('2024-02-28'),
                description: 'Office Cleaning January'
            }
        ];

        await Invoice.insertMany(testInvoices);
        console.log('Test data generated successfully');
    } catch (error) {
        console.error('Error generating test data:', error);
    }
}

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
    try {
        // Generate test data if none exists
        await generateTestData();

        // Get real statistics
        const totalInvoices = await Invoice.countDocuments();
        const pendingReview = await Invoice.countDocuments({ status: 'review' });
        const processedInvoices = await Invoice.countDocuments({ status: 'approved' });
        const totalValueAgg = await Invoice.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalValue = totalValueAgg.length > 0 ? totalValueAgg[0].total : 0;

        // Calculate minutes saved (1 minute per processed invoice)
        const minutesSaved = processedInvoices;

        const stats = {
            totalInvoices,
            pendingReview,
            totalValue,
            minutesSaved
        };
        
        console.log('Sending dashboard stats:', stats);
        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            message: 'Error fetching dashboard stats',
            error: error.message 
        });
    }
});

module.exports = router; 