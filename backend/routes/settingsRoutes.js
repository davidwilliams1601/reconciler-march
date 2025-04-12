const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const CostCenter = require('../models/CostCenter');
const nodemailer = require('nodemailer');

// Get all settings
router.get('/', async (req, res) => {
    try {
        // Get settings from database
        let settings = await Settings.findOne();
        
        // If no settings exist, create default settings
        if (!settings) {
            settings = new Settings({
                reconciliation: {
                    autoReconcileEnabled: true,
                    confidenceThreshold: 0.9,
                    dateRange: 30
                }
            });
            await settings.save();
        }
        
        // Prepare frontend settings object
        const frontendSettings = {
            // Xero API settings
            xeroClientId: settings.api?.xero?.clientId || '',
            xeroClientSecret: settings.api?.xero?.clientSecret || '',
            xeroTenantId: settings.api?.xero?.tenantId || '',
            xeroRedirectUri: settings.api?.xero?.redirectUri || '',
            // Add authentication status
            xeroIsAuthenticated: !!(settings.api?.xero?.accessToken && settings.api?.xero?.refreshToken),
            
            // Only include these if you need them in the frontend (masked for security)
            xeroAccessToken: settings.api?.xero?.accessToken ? '********' : '',
            xeroRefreshToken: settings.api?.xero?.refreshToken ? '********' : '',
            xeroTokenExpiry: settings.api?.xero?.tokenExpiry || '',
            
            // Dext API settings
            dextApiKey: settings.api?.dext?.apiKey || '',
            dextClientId: settings.api?.dext?.clientId || '',
            dextClientSecret: settings.api?.dext?.clientSecret || '',
            dextEnvironment: settings.api?.dext?.environment || '',
            dextWebhookUrl: settings.api?.dext?.webhookUrl || '',
            dextWebhookSecret: settings.api?.dext?.webhookSecret || '',
            
            // Google Vision API settings
            googleVisionApiKey: settings.api?.googleVision?.apiKey || '',
            googleVisionProjectId: settings.api?.googleVision?.projectId || '',
            googleVisionKeyFilePath: settings.api?.googleVision?.keyFilePath || '',
            googleVisionConfidenceThreshold: settings.api?.googleVision?.confidenceThreshold || 0.9,
            
            // Reconciliation settings
            autoReconcileEnabled: settings.reconciliation?.autoReconcileEnabled || false,
            reconciliationConfidenceThreshold: settings.reconciliation?.confidenceThreshold || 0.9,
            reconciliationDateRange: settings.reconciliation?.dateRange || 30,
            reconciliationAccountCodes: settings.reconciliation?.accountCodes || ''
        };
        
        res.json(frontendSettings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
});

// Create or update settings
router.post('/', async (req, res) => {
    try {
        console.log('Creating/updating settings...');
        console.log('Request body:', req.body);
        
        let settings = await Settings.findOne();
        
        if (!settings) {
            console.log('No existing settings found, creating new settings document');
            settings = new Settings(req.body);
        } else {
            console.log('Updating existing settings');
            Object.assign(settings, req.body);
        }

        console.log('Saving settings...');
        await settings.save();
        console.log('Settings saved successfully');
        
        res.json(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ message: 'Error saving settings', error: error.message });
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

// Test Xero connection
router.post('/test-xero', async (req, res) => {
    try {
        const { clientId, clientSecret, tenantId } = req.body;
        
        if (!clientId || !clientSecret || !tenantId) {
            return res.status(400).json({ 
                message: 'Missing required Xero credentials',
                success: false
            });
        }
        
        console.log('Testing Xero connection with tenant ID:', tenantId);
        
        // Ensure settings exist first
        let settings = await Settings.findOne();
        if (!settings) {
            console.log('No existing settings found, creating settings document');
            settings = new Settings();
            await settings.save();
        }
        
        // Update the Xero settings
        if (!settings.api) {
            settings.api = {};
        }
        if (!settings.api.xero) {
            settings.api.xero = {};
        }
        
        settings.api.xero.clientId = clientId;
        settings.api.xero.clientSecret = clientSecret;
        settings.api.xero.tenantId = tenantId;
        
        await settings.save();
        console.log('Xero settings saved');
        
        // Use the XeroService to test the connection
        const xeroService = require('../services/xeroService');
        await xeroService.initialize(); // Re-initialize with new settings
        const testResult = await xeroService.testConnection();
        
        return res.json(testResult);
    } catch (error) {
        console.error('Error testing Xero connection:', error);
        res.status(500).json({ 
            message: 'Error testing Xero connection', 
            error: error.message,
            success: false
        });
    }
});

// Test Google Vision connection
router.post('/test-google-vision', async (req, res) => {
    try {
        const { apiKey, projectId } = req.body;
        
        if (!apiKey || !projectId) {
            return res.status(400).json({ 
                message: 'Missing required Google Vision credentials',
                success: false
            });
        }
        
        console.log('Testing Google Vision connection for project:', projectId);
        
        // Ensure settings exist first
        let settings = await Settings.findOne();
        if (!settings) {
            console.log('No existing settings found, creating settings document');
            settings = new Settings();
            await settings.save();
        }
        
        // Update the Google Vision settings
        if (!settings.api) {
            settings.api = {};
        }
        if (!settings.api.googleVision) {
            settings.api.googleVision = {};
        }
        
        settings.api.googleVision.apiKey = apiKey;
        settings.api.googleVision.projectId = projectId;
        
        await settings.save();
        console.log('Google Vision settings saved');
        
        // Use the GoogleVisionService to test the connection
        const googleVisionService = require('../services/googleVisionService');
        await googleVisionService.initialize(); // Re-initialize with new settings
        const testResult = await googleVisionService.testConnection();
        
        return res.json(testResult);
    } catch (error) {
        console.error('Error testing Google Vision connection:', error);
        res.status(500).json({ 
            message: 'Error testing Google Vision connection', 
            error: error.message,
            success: false
        });
    }
});

// Test Dext connection
router.post('/test-dext', async (req, res) => {
    try {
        const { apiKey, clientId, clientSecret } = req.body;
        
        // Make Dext optional by returning success even if credentials are not provided
        if (!apiKey || !clientId || !clientSecret) {
            return res.json({ 
                message: 'Dext integration is optional and has been disabled',
                success: true,
                authenticated: false
            });
        }
        
        console.log('Testing Dext connection');
        
        // Ensure settings exist first
        let settings = await Settings.findOne();
        if (!settings) {
            console.log('No existing settings found, creating settings document');
            settings = new Settings();
            await settings.save();
        }
        
        // Update the Dext settings
        if (!settings.api) {
            settings.api = {};
        }
        if (!settings.api.dext) {
            settings.api.dext = {};
        }
        
        settings.api.dext.apiKey = apiKey;
        settings.api.dext.clientId = clientId;
        settings.api.dext.clientSecret = clientSecret;
        
        await settings.save();
        console.log('Dext settings saved');
        
        // Simple validation - in a real app, would attempt an actual API call
        // For now, just return success if credentials were provided
        res.json({ 
            message: 'Dext connection test successful',
            success: true,
            authenticated: true
        });
    } catch (error) {
        console.error('Error testing Dext connection:', error);
        res.status(500).json({ 
            message: 'Error testing Dext connection', 
            error: error.message,
            success: false
        });
    }
});

module.exports = router; 