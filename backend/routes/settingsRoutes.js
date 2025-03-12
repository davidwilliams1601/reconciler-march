const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');

// Get settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        if (!settings) {
            // Create initial settings with empty values
            settings = new Settings();
            await settings.save();
        }

        // Mask sensitive data before sending
        const maskedSettings = {
            googleVisionApiKey: settings.googleVisionApiKey ? '********' : '',
            dextApiKey: settings.dextApiKey ? '********' : '',
            xeroConfig: {
                clientId: settings.xeroConfig.clientId ? '********' : '',
                clientSecret: settings.xeroConfig.clientSecret ? '********' : '',
                redirectUri: settings.xeroConfig.redirectUri || '',
                scope: settings.xeroConfig.scope
            }
        };

        res.json(maskedSettings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Error fetching settings', error: error.message });
    }
});

// Update settings
router.post('/', async (req, res) => {
    try {
        const { googleVisionApiKey, dextApiKey, xeroConfig } = req.body;

        let settings = await Settings.findOne();

        if (!settings) {
            settings = new Settings();
        }

        // Update fields if they're not masked
        if (googleVisionApiKey && googleVisionApiKey !== '********') {
            settings.googleVisionApiKey = googleVisionApiKey;
        }
        if (dextApiKey && dextApiKey !== '********') {
            settings.dextApiKey = dextApiKey;
        }
        if (xeroConfig) {
            if (xeroConfig.clientId && xeroConfig.clientId !== '********') {
                settings.xeroConfig.clientId = xeroConfig.clientId;
            }
            if (xeroConfig.clientSecret && xeroConfig.clientSecret !== '********') {
                settings.xeroConfig.clientSecret = xeroConfig.clientSecret;
            }
            if (xeroConfig.redirectUri) {
                settings.xeroConfig.redirectUri = xeroConfig.redirectUri;
            }
            if (xeroConfig.scope) {
                settings.xeroConfig.scope = xeroConfig.scope;
            }
        }

        await settings.save();
        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Error updating settings', error: error.message });
    }
});

module.exports = router; 