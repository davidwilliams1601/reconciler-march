const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const CostCenter = require('../models/CostCenter');
const nodemailer = require('nodemailer');

// Get all settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

// Get organization settings
router.get('/organization', async (req, res) => {
    try {
        console.log('Fetching organization settings...');
        let settings = await Settings.findOne();
        console.log('Settings found:', settings ? 'Yes' : 'No');
        
        if (!settings) {
            console.log('Creating default settings...');
            settings = await Settings.create({});
            console.log('Default settings created:', settings);
        }
        
        console.log('Returning organization settings:', settings.organization);
        res.json(settings.organization);
    } catch (error) {
        console.error('Error fetching organization settings:', error);
        res.status(500).json({ message: 'Error fetching organization settings', error: error.message });
    }
});

// Update organization settings
router.put('/organization', async (req, res) => {
    try {
        console.log('Updating organization settings...');
        console.log('Request body:', req.body);
        
        let settings = await Settings.findOne();
        console.log('Existing settings found:', settings ? 'Yes' : 'No');
        
        if (!settings) {
            console.log('Creating new settings...');
            settings = new Settings();
        }

        settings.organization = {
            ...settings.organization,
            ...req.body
        };

        console.log('Saving updated settings...');
        await settings.save();
        console.log('Settings saved successfully');
        
        res.json(settings.organization);
    } catch (error) {
        console.error('Error updating organization settings:', error);
        res.status(500).json({ message: 'Error updating organization settings', error: error.message });
    }
});

// Get API settings
router.get('/api', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings.api);
    } catch (error) {
        console.error('Error fetching API settings:', error);
        res.status(500).json({ message: 'Error fetching API settings' });
    }
});

// Update API settings
router.put('/api', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        settings.api = {
            ...settings.api,
            ...req.body
        };

        await settings.save();
        res.json(settings.api);
    } catch (error) {
        console.error('Error updating API settings:', error);
        res.status(500).json({ message: 'Error updating API settings' });
    }
});

// Get reconciliation settings
router.get('/reconciliation', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings.reconciliation);
    } catch (error) {
        console.error('Error fetching reconciliation settings:', error);
        res.status(500).json({ message: 'Error fetching reconciliation settings' });
    }
});

// Update reconciliation settings
router.put('/reconciliation', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }

        settings.reconciliation = {
            ...settings.reconciliation,
            ...req.body
        };

        await settings.save();
        res.json(settings.reconciliation);
    } catch (error) {
        console.error('Error updating reconciliation settings:', error);
        res.status(500).json({ message: 'Error updating reconciliation settings' });
    }
});

// Test route to check current settings
router.get('/test', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(404).json({ message: 'No settings found' });
        }
        
        // Log the settings (excluding sensitive data)
        console.log('Current settings:', {
            hasGoogleVisionKey: !!settings.googleVisionApiKey,
            googleVisionKeyLength: settings.googleVisionApiKey ? settings.googleVisionApiKey.length : 0,
            googleVisionProjectId: settings.googleVisionProjectId,
            updatedAt: settings.updatedAt
        });
        
        res.json({
            message: 'Settings found',
            hasGoogleVisionKey: !!settings.googleVisionApiKey,
            googleVisionKeyLength: settings.googleVisionApiKey ? settings.googleVisionApiKey.length : 0,
            googleVisionProjectId: settings.googleVisionProjectId,
            updatedAt: settings.updatedAt
        });
    } catch (error) {
        console.error('Error checking settings:', error);
        res.status(500).json({ message: 'Error checking settings', error: error.message });
    }
});

// Get all cost centers
router.get('/cost-centers', async (req, res) => {
    try {
        console.log('Fetching cost centers...');
        const costCenters = await CostCenter.find().sort({ code: 1 });
        console.log(`Found ${costCenters.length} cost centers`);
        res.json(costCenters);
    } catch (error) {
        console.error('Error fetching cost centers:', error);
        res.status(500).json({ 
            message: 'Error fetching cost centers',
            error: error.message 
        });
    }
});

// Create a new cost center
router.post('/cost-centers', async (req, res) => {
    try {
        console.log('Creating new cost center:', req.body);
        const costCenter = new CostCenter({
            code: req.body.code,
            name: req.body.name,
            keywords: req.body.keywords
        });

        const newCostCenter = await costCenter.save();
        console.log('Cost center created successfully:', newCostCenter);
        res.status(201).json(newCostCenter);
    } catch (error) {
        console.error('Error creating cost center:', error);
        res.status(400).json({ 
            message: 'Error creating cost center',
            error: error.message 
        });
    }
});

// Update a cost center
router.put('/cost-centers/:code', async (req, res) => {
    try {
        console.log('Updating cost center:', req.params.code);
        const costCenter = await CostCenter.findOne({ code: req.params.code });
        if (!costCenter) {
            console.log('Cost center not found:', req.params.code);
            return res.status(404).json({ message: 'Cost center not found' });
        }

        costCenter.name = req.body.name;
        costCenter.keywords = req.body.keywords;
        const updatedCostCenter = await costCenter.save();
        console.log('Cost center updated successfully:', updatedCostCenter);
        res.json(updatedCostCenter);
    } catch (error) {
        console.error('Error updating cost center:', error);
        res.status(400).json({ 
            message: 'Error updating cost center',
            error: error.message 
        });
    }
});

// Delete a cost center
router.delete('/cost-centers/:code', async (req, res) => {
    try {
        console.log('Deleting cost center:', req.params.code);
        const costCenter = await CostCenter.findOne({ code: req.params.code });
        if (!costCenter) {
            console.log('Cost center not found:', req.params.code);
            return res.status(404).json({ message: 'Cost center not found' });
        }

        await costCenter.deleteOne();
        console.log('Cost center deleted successfully:', req.params.code);
        res.json({ message: 'Cost center deleted' });
    } catch (error) {
        console.error('Error deleting cost center:', error);
        res.status(500).json({ 
            message: 'Error deleting cost center',
            error: error.message 
        });
    }
});

// Get email processing settings
router.get('/email-processing', async (req, res) => {
    try {
        console.log('Fetching email processing settings...');
        let settings = await Settings.findOne();
        console.log('Settings found:', settings ? 'Yes' : 'No');
        
        if (!settings) {
            console.log('Creating default settings...');
            settings = await Settings.create({});
            console.log('Default settings created:', settings);
        }
        
        // Initialize email processing settings if they don't exist
        if (!settings.emailProcessing) {
            settings.emailProcessing = {
                enabled: false,
                emailAddress: '',
                emailProvider: 'gmail',
                smtpConfig: {
                    host: '',
                    port: 587,
                    secure: false,
                    username: '',
                    password: '',
                },
                processingRules: {
                    allowedSenders: [],
                    allowedFileTypes: ['.pdf', '.jpg', '.jpeg', '.png'],
                    autoProcess: false,
                    defaultCostCenter: '',
                    defaultCategory: '',
                }
            };
            await settings.save();
        }
        
        console.log('Returning email processing settings:', settings.emailProcessing);
        res.json(settings.emailProcessing);
    } catch (error) {
        console.error('Error fetching email processing settings:', error);
        res.status(500).json({ message: 'Error fetching email processing settings', error: error.message });
    }
});

// Update email processing settings
router.put('/email-processing', async (req, res) => {
    try {
        console.log('Updating email processing settings...');
        console.log('Request body:', req.body);
        
        let settings = await Settings.findOne();
        console.log('Existing settings found:', settings ? 'Yes' : 'No');
        
        if (!settings) {
            console.log('Creating new settings...');
            settings = new Settings();
        }

        settings.emailProcessing = {
            ...settings.emailProcessing,
            ...req.body
        };

        console.log('Saving updated settings...');
        await settings.save();
        console.log('Settings saved successfully');
        
        res.json(settings.emailProcessing);
    } catch (error) {
        console.error('Error updating email processing settings:', error);
        res.status(500).json({ message: 'Error updating email processing settings', error: error.message });
    }
});

// Test email configuration
router.post('/email-processing/test', async (req, res) => {
    try {
        console.log('Testing email configuration...');
        const settings = await Settings.findOne();
        
        if (!settings?.emailProcessing?.enabled) {
            return res.status(400).json({ message: 'Email processing is not enabled' });
        }

        const { emailProvider, smtpConfig } = settings.emailProcessing;
        let transporter;

        if (emailProvider === 'gmail') {
            transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: smtpConfig.username,
                    pass: smtpConfig.password
                }
            });
        } else if (emailProvider === 'outlook') {
            transporter = nodemailer.createTransport({
                service: 'outlook',
                auth: {
                    user: smtpConfig.username,
                    pass: smtpConfig.password
                }
            });
        } else {
            transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.secure,
                auth: {
                    user: smtpConfig.username,
                    pass: smtpConfig.password
                }
            });
        }

        // Test the connection
        await transporter.verify();
        console.log('Email configuration test successful');
        res.json({ message: 'Email configuration test successful' });
    } catch (error) {
        console.error('Error testing email configuration:', error);
        res.status(500).json({ message: 'Error testing email configuration', error: error.message });
    }
});

module.exports = router; 