/**
 * This script initializes default settings in the database
 * Run it with: node backend/scripts/initializeSettings.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Settings = require('../models/Settings');

// Load environment variables
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config();
}

// Validate required environment variables
if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI environment variable');
    process.exit(1);
}

// Get the frontend URL based on environment
const getFrontendURL = () => {
    return process.env.NODE_ENV === 'production'
        ? 'https://frontend-new-er0k.onrender.com'
        : 'http://localhost:3000';
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        // Check if settings already exist
        let settings = await Settings.findOne();
        
        if (!settings) {
            console.log('No settings found. Creating default settings...');
            
            // Create default settings
            settings = new Settings({
                organization: {
                    name: 'Reconciler Demo',
                    defaultCurrency: 'GBP',
                    defaultLanguage: 'en',
                    timezone: 'Europe/London',
                },
                xeroConfig: {
                    clientId: process.env.XERO_CLIENT_ID || 'your-xero-client-id',
                    clientSecret: process.env.XERO_CLIENT_SECRET || 'your-xero-client-secret',
                    redirectUri: process.env.NODE_ENV === 'production'
                        ? 'https://reconciler-march.onrender.com/api/xero/callback'
                        : 'http://localhost:5001/api/xero/callback',
                    isConnected: false
                },
                emailProcessing: {
                    enabled: false,
                },
                reconciliation: {
                    autoReconcileEnabled: true,
                    confidenceThreshold: 0.95,
                    dateRange: 30,
                }
            });
            
            await settings.save();
            console.log('Default settings created successfully');
        } else {
            console.log('Settings already exist. Updating Xero configuration...');
            
            // Update Xero configuration if not already set
            if (!settings.xeroConfig || !settings.xeroConfig.clientId) {
                settings.xeroConfig = {
                    clientId: process.env.XERO_CLIENT_ID || 'your-xero-client-id',
                    clientSecret: process.env.XERO_CLIENT_SECRET || 'your-xero-client-secret',
                    redirectUri: process.env.NODE_ENV === 'production'
                        ? 'https://reconciler-march.onrender.com/api/xero/callback'
                        : 'http://localhost:5001/api/xero/callback',
                    isConnected: false
                };
                
                await settings.save();
                console.log('Xero configuration updated successfully');
            } else {
                console.log('Xero configuration already exists. No changes made.');
            }
        }
    } catch (error) {
        console.error('Error initializing settings:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
})
.catch(error => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
}); 