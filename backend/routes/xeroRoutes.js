const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const Settings = require('../models/Settings');

// The scopes we need for the application
const XERO_SCOPES = 'offline_access accounting.transactions accounting.settings';

// Get the frontend URL based on environment
const getFrontendURL = () => {
    return process.env.NODE_ENV === 'production'
        ? 'https://frontend-new-er0k.onrender.com'
        : 'http://localhost:3000';
};

// Check Xero connection status
router.get('/status', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        
        // Check if we have Xero settings and tokens
        if (!settings || !settings.xeroConfig || !settings.xeroConfig.accessToken) {
            return res.json({
                isAuthenticated: false,
                tokenExpiry: null,
                tenantId: null,
                tenantName: null
            });
        }

        // Check if token has expired
        const isExpired = settings.xeroConfig.tokenExpiry && 
            new Date(settings.xeroConfig.tokenExpiry) < new Date();

        if (isExpired) {
            console.log('Xero token has expired. Needs refresh.');
            // For a proper implementation, we would refresh the token here
            // This is just a placeholder
            return res.json({
                isAuthenticated: false,
                tokenExpiry: settings.xeroConfig.tokenExpiry,
                tenantId: settings.xeroConfig.tenantId,
                tenantName: settings.xeroConfig.tenantName || 'Your Organization'
            });
        }

        // Return authenticated status
        return res.json({
            isAuthenticated: true,
            tokenExpiry: settings.xeroConfig.tokenExpiry,
            tenantId: settings.xeroConfig.tenantId,
            tenantName: settings.xeroConfig.tenantName || 'Your Organization'
        });
    } catch (error) {
        console.error('Error checking Xero status:', error);
        res.status(500).json({ 
            message: 'Error checking Xero connection status', 
            error: error.message 
        });
    }
});

// Generate Xero authorization URL
router.get('/auth-url', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.xeroConfig.clientId) {
            return res.status(400).json({ message: 'Xero configuration not found' });
        }

        console.log('Generating Xero auth URL with redirect URI:', settings.xeroConfig.redirectUri);

        const authUrl = `https://login.xero.com/identity/connect/authorize?` +
            `response_type=code` +
            `&client_id=${settings.xeroConfig.clientId}` +
            `&redirect_uri=${encodeURIComponent(settings.xeroConfig.redirectUri)}` +
            `&scope=${encodeURIComponent(XERO_SCOPES)}` +
            `&state=${generateState()}`;

        res.json({ url: authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ message: 'Error generating authorization URL', error: error.message });
    }
});

// Disconnect from Xero
router.post('/disconnect', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.status(400).json({ message: 'Settings not found' });
        }

        // Update settings to remove Xero tokens
        settings.xeroConfig.accessToken = null;
        settings.xeroConfig.refreshToken = null;
        settings.xeroConfig.tokenExpiry = null;
        
        await settings.save();
        
        console.log('Successfully disconnected from Xero');
        
        res.json({ 
            success: true, 
            message: 'Successfully disconnected from Xero'
        });
    } catch (error) {
        console.error('Error disconnecting from Xero:', error);
        res.status(500).json({ 
            message: 'Error disconnecting from Xero', 
            error: error.message 
        });
    }
});

// New endpoint for Xero sync
router.post('/sync', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        
        // Check if we have Xero settings and tokens
        if (!settings || !settings.xeroConfig || !settings.xeroConfig.accessToken) {
            return res.status(400).json({ 
                success: false,
                message: 'Not connected to Xero' 
            });
        }

        // In a real implementation, this would sync data with Xero
        // This is just a placeholder
        console.log('Syncing with Xero...');

        // Update the last sync time
        settings.xeroConfig.lastSync = new Date();
        await settings.save();
        
        // Return success
        return res.json({
            success: true,
            message: 'Successfully synchronized with Xero',
            lastSync: settings.xeroConfig.lastSync
        });
    } catch (error) {
        console.error('Error syncing with Xero:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error syncing with Xero', 
            error: error.message 
        });
    }
});

// New endpoint for getting last sync time
router.get('/last-sync', async (req, res) => {
    try {
        const settings = await Settings.findOne();
        
        // Check if we have Xero settings and tokens
        if (!settings || !settings.xeroConfig) {
            return res.json({ 
                lastSync: null
            });
        }

        return res.json({
            lastSync: settings.xeroConfig.lastSync || null
        });
    } catch (error) {
        console.error('Error getting last sync time:', error);
        res.status(500).json({ 
            message: 'Error getting last sync time', 
            error: error.message 
        });
    }
});

// Handle Xero OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    console.log('Received Xero callback with code:', code ? 'present' : 'missing');

    if (!code) {
        return res.redirect(`${getFrontendURL()}/settings?xero=error&message=no_code`);
    }

    try {
        const settings = await Settings.findOne();
        if (!settings) {
            return res.redirect(`${getFrontendURL()}/settings?xero=error&message=no_settings`);
        }

        console.log('Exchanging code for tokens with redirect URI:', settings.xeroConfig.redirectUri);

        // Exchange the authorization code for tokens
        const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    `${settings.xeroConfig.clientId}:${settings.xeroConfig.clientSecret}`
                ).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: settings.xeroConfig.redirectUri
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.text();
            console.error('Xero token exchange failed:', errorData);
            return res.redirect(`${getFrontendURL()}/settings?xero=error&message=token_exchange_failed`);
        }

        const tokens = await tokenResponse.json();
        console.log('Successfully received Xero tokens');

        // Store the tokens securely
        settings.xeroConfig.accessToken = tokens.access_token;
        settings.xeroConfig.refreshToken = tokens.refresh_token;
        settings.xeroConfig.tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
        
        await settings.save();

        // Redirect back to the settings page
        res.redirect(`${getFrontendURL()}/settings/xero?success=true`);
    } catch (error) {
        console.error('Error in Xero callback:', error);
        res.redirect(`${getFrontendURL()}/settings?xero=error&message=server_error`);
    }
});

// Generate a random state parameter for security
function generateState() {
    return Math.random().toString(36).substring(7);
}

module.exports = router; 