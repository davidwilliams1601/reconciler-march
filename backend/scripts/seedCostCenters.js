const mongoose = require('mongoose');
const CostCenter = require('../models/CostCenter');
require('dotenv').config();

const initialCostCenters = [
  {
    code: 'IT001',
    name: 'IT Infrastructure',
    keywords: ['computer', 'software', 'hardware', 'network', 'server', 'cloud', 'digital']
  },
  {
    code: 'HR001',
    name: 'Human Resources',
    keywords: ['salary', 'employee', 'training', 'recruitment', 'benefits', 'payroll']
  },
  {
    code: 'MKT001',
    name: 'Marketing',
    keywords: ['advertising', 'promotion', 'brand', 'campaign', 'social media', 'content']
  },
  {
    code: 'OPS001',
    name: 'Operations',
    keywords: ['facility', 'maintenance', 'office', 'supplies', 'equipment', 'utilities']
  },
  {
    code: 'SAL001',
    name: 'Sales',
    keywords: ['sales', 'revenue', 'client', 'customer', 'deal', 'contract']
  }
];

async function seedCostCenters() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing cost centers
    await CostCenter.deleteMany({});
    console.log('Cleared existing cost centers');

    // Insert new cost centers
    const result = await CostCenter.insertMany(initialCostCenters);
    console.log(`Successfully seeded ${result.length} cost centers`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding cost centers:', error);
    process.exit(1);
  }
}

seedCostCenters(); 