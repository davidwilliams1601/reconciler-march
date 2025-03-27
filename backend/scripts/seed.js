const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');

mongoose.connect('mongodb://localhost:27017/reconciler', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

const sampleInvoices = [
    {
        invoiceNumber: 'INV-2024-001',
        vendor: 'Acme Corp',
        amount: 1500.00,
        currency: 'GBP',
        status: 'pending',
        issueDate: new Date('2024-03-01'),
        dueDate: new Date('2024-03-31'),
        description: 'Office supplies Q1 2024'
    },
    {
        invoiceNumber: 'INV-2024-002',
        vendor: 'Tech Solutions Ltd',
        amount: 2750.50,
        currency: 'GBP',
        status: 'review',
        issueDate: new Date('2024-03-05'),
        dueDate: new Date('2024-04-04'),
        description: 'IT Services - March 2024'
    },
    {
        invoiceNumber: 'INV-2024-003',
        vendor: 'Marketing Experts',
        amount: 3200.00,
        currency: 'GBP',
        status: 'approved',
        issueDate: new Date('2024-03-10'),
        dueDate: new Date('2024-04-09'),
        description: 'Digital Marketing Campaign'
    }
];

async function seedDatabase() {
    try {
        // Clear existing invoices
        await Invoice.deleteMany({});
        console.log('Cleared existing invoices');

        // Insert new invoices
        const insertedInvoices = await Invoice.insertMany(sampleInvoices);
        console.log('Inserted sample invoices:', insertedInvoices);

        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 