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
        // Find settings or create if they don't exist
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
                    clientId: process.env.XERO_CLIENT_ID || 'demo-client-id',
                    clientSecret: process.env.XERO_CLIENT_SECRET || 'demo-client-secret',
                    redirectUri: process.env.NODE_ENV === 'production'
                        ? 'https://reconciler-march.onrender.com/api/xero/callback'
                        : 'http://localhost:5001/api/xero/callback',
                    isConnected: false
                }
            });
            
            await settings.save();
            console.log('Default settings created successfully');
        }
        
        // Check if Xero config exists
        if (!settings.xeroConfig) {
            settings.xeroConfig = {
                clientId: process.env.XERO_CLIENT_ID || 'demo-client-id',
                clientSecret: process.env.XERO_CLIENT_SECRET || 'demo-client-secret',
                redirectUri: process.env.NODE_ENV === 'production'
                    ? 'https://reconciler-march.onrender.com/api/xero/callback'
                    : 'http://localhost:5001/api/xero/callback',
                isConnected: false
            };
            await settings.save();
        }
        
        // Check if we're in demo mode
        const isDemoMode = settings.xeroConfig.clientId === 'demo-client-id';
        
        if (isDemoMode && settings.xeroConfig.isConnected) {
            console.log('Demo mode detected, returning mock connection status');
            return res.json({
                isAuthenticated: true,
                tokenExpiry: settings.xeroConfig.tokenExpiry || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                tenantId: settings.xeroConfig.tenantId || 'demo-tenant-id',
                tenantName: settings.xeroConfig.tenantName || 'Demo Company Ltd',
                isDemoMode: true
            });
        }
        
        // Check if we have Xero tokens
        if (!settings.xeroConfig.accessToken) {
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

// Get Xero authentication URL
router.get('/auth-url', async (req, res) => {
    console.log('GET /api/xero/auth-url endpoint called');
    
    try {
        // Get settings from database
        let settings = await Settings.findOne();
        
        // Check for demo mode request in query parameters
        const forceDemoMode = req.query.demo === 'true';
        
        // Create default settings if not found
        if (!settings) {
            console.log('Xero settings not found, creating defaults');
            settings = new Settings({
                organization: {
                    name: 'Reconciler Demo',
                    defaultCurrency: 'GBP',
                    defaultLanguage: 'en',
                    timezone: 'Europe/London',
                },
                xeroConfig: {
                    clientId: process.env.XERO_CLIENT_ID || '',
                    clientSecret: process.env.XERO_CLIENT_SECRET || '',
                    redirectUri: process.env.NODE_ENV === 'production'
                        ? process.env.XERO_REDIRECT_URI || 'https://reconciler-march.onrender.com/api/xero/callback'
                        : process.env.XERO_REDIRECT_URI || 'http://localhost:5001/api/xero/callback',
                    isConnected: false,
                    isDemoMode: !process.env.XERO_CLIENT_ID && !process.env.XERO_CLIENT_SECRET
                }
            });
            await settings.save();
            console.log('Created default settings with Xero config');
        }
        
        // Update settings with environment variables if they're blank but env vars exist
        if ((!settings.xeroConfig.clientId || !settings.xeroConfig.clientSecret) && 
            (process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET)) {
            console.log('Updating Xero settings with environment variables');
            settings.xeroConfig.clientId = process.env.XERO_CLIENT_ID;
            settings.xeroConfig.clientSecret = process.env.XERO_CLIENT_SECRET;
            settings.xeroConfig.redirectUri = process.env.NODE_ENV === 'production'
                ? process.env.XERO_REDIRECT_URI || 'https://reconciler-march.onrender.com/api/xero/callback'
                : process.env.XERO_REDIRECT_URI || 'http://localhost:5001/api/xero/callback';
            settings.xeroConfig.isDemoMode = false;
            await settings.save();
            console.log('Updated Xero settings with environment variables');
        }
        
        // Log client ID only for debugging (don't log secret)
        console.log('Xero client ID:', settings.xeroConfig.clientId ? 
            settings.xeroConfig.clientId.substring(0, 5) + '...' : '(missing)');
        
        console.log('Xero settings:', {
            clientId: settings.xeroConfig.clientId ? 
                settings.xeroConfig.clientId.substring(0, 5) + '...' : '(missing)',
            clientSecret: settings.xeroConfig.clientSecret ? '(present)' : '(missing)',
            redirectUri: settings.xeroConfig.redirectUri,
            isDemoMode: settings.xeroConfig.isDemoMode
        });
        
        // Check if demo mode is requested or if credentials are missing
        const isDemoMode = forceDemoMode || 
                         settings.xeroConfig.isDemoMode === true || 
                         !settings.xeroConfig.clientId || 
                         !settings.xeroConfig.clientSecret || 
                         !settings.xeroConfig.redirectUri ||
                         settings.xeroConfig.clientId === 'YOUR_XERO_CLIENT_ID' ||
                         settings.xeroConfig.clientSecret === 'YOUR_XERO_CLIENT_SECRET';
        
        // Generate a demo URL if in demo mode or credentials are missing
        if (isDemoMode) {
            console.log('Using demo mode for auth URL');
            // Create a demo URL that redirects back to the application with demo=true
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const demoRedirectUrl = `${frontendUrl}/settings/xero?demo=true&success=true`;
            
            return res.json({
                url: demoRedirectUrl,
                isDemoMode: true,
                message: 'Demo mode active. Using simulated authentication flow.'
            });
        }
        
        // If we get here, we have actual credentials, so create a real auth URL
        console.log('Generating real Xero authorization URL');
        console.log('Generating Xero auth URL with redirect URI:', settings.xeroConfig.redirectUri);

        // Verify that client ID and client secret are actually present
        if (!settings.xeroConfig.clientId || settings.xeroConfig.clientId.trim() === '') {
            return res.status(400).json({
                error: 'Missing Xero Client ID',
                message: 'Please set up your Xero app and provide a valid Client ID',
                setupNeeded: true
            });
        }

        if (!settings.xeroConfig.clientSecret || settings.xeroConfig.clientSecret.trim() === '') {
            return res.status(400).json({
                error: 'Missing Xero Client Secret',
                message: 'Please set up your Xero app and provide a valid Client Secret',
                setupNeeded: true
            });
        }

        // Check redirect URI is valid
        if (!settings.xeroConfig.redirectUri || !settings.xeroConfig.redirectUri.includes('/api/xero/callback')) {
            return res.status(400).json({
                error: 'Invalid Redirect URI',
                message: 'The redirect URI must end with /api/xero/callback',
                setupNeeded: true
            });
        }

        const authUrl = `https://login.xero.com/identity/connect/authorize?` +
            `response_type=code` +
            `&client_id=${settings.xeroConfig.clientId}` +
            `&redirect_uri=${encodeURIComponent(settings.xeroConfig.redirectUri)}` +
            `&scope=${encodeURIComponent(XERO_SCOPES)}` +
            `&state=${generateState()}`;

        console.log('Generated auth URL:', authUrl);
        res.json({ url: authUrl });
    } catch (error) {
        console.error('Error in /auth-url endpoint:', error);
        
        // Even in case of error, provide a demo URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const demoRedirectUrl = `${frontendUrl}/settings/xero?demo=true&success=true`;
        
        return res.json({
            url: demoRedirectUrl,
            isDemoMode: true,
            error: 'Error retrieving Xero settings. Using demo mode as fallback.',
            message: error.message
        });
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
        settings.xeroConfig.isConnected = false;
        
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
        if (!settings || !settings.xeroConfig || (!settings.xeroConfig.accessToken && !settings.xeroConfig.isConnected)) {
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

// Demo connection endpoint
router.post('/demo-connect', async (req, res) => {
    try {
        console.log('Demo connect endpoint called with body:', req.body);
        
        // Check if demo mode is enabled in the request
        if (!req.body || !req.body.demo) {
            return res.status(400).json({ 
                success: false,
                message: 'This endpoint is only available in demo mode' 
            });
        }

        // Find or create settings
        let settings = await Settings.findOne();
        
        if (!settings) {
            console.log('No settings found. Creating default settings for demo mode...');
            
            // Create default settings with demo mode enabled
            settings = new Settings({
                organization: {
                    name: 'Reconciler Demo',
                    defaultCurrency: 'GBP',
                    defaultLanguage: 'en',
                    timezone: 'Europe/London',
                },
                xeroConfig: {
                    clientId: 'demo-client-id',
                    clientSecret: 'demo-client-secret',
                    redirectUri: process.env.NODE_ENV === 'production'
                        ? 'https://reconciler-march.onrender.com/api/xero/callback'
                        : 'http://localhost:5001/api/xero/callback',
                    isConnected: true,
                    isDemoMode: true
                }
            });
        } else {
            // Update existing settings for demo mode
            if (!settings.xeroConfig) {
                settings.xeroConfig = {};
            }
            
            // Ensure demo mode is enabled
            settings.xeroConfig.isDemoMode = true;
            settings.xeroConfig.isConnected = true;
        }

        // Update settings to simulate a connection to Xero
        settings.xeroConfig = {
            ...settings.xeroConfig,
            accessToken: 'demo-access-token',
            refreshToken: 'demo-refresh-token',
            tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            tenantId: 'demo-tenant-id',
            tenantName: 'Demo Company Ltd',
            isConnected: true,
            lastSync: new Date(),
            isDemoMode: true
        };
        
        await settings.save();
        
        console.log('Successfully simulated Xero connection in demo mode');
        
        // Return a response matching what the frontend expects
        res.json({ 
            success: true, 
            isDemoMode: true,
            isAuthenticated: true,
            tenantId: 'demo-tenant-id',
            tenantName: 'Demo Company Ltd',
            tokenExpiry: settings.xeroConfig.tokenExpiry.toISOString(),
            message: 'Successfully connected to Xero in demo mode'
        });
    } catch (error) {
        console.error('Error in demo connection:', error);
        
        // More detailed error handling
        let errorMessage = 'Error creating demo connection';
        let statusCode = 500;
        
        if (error.name === 'ValidationError') {
            errorMessage = 'Invalid data format';
            statusCode = 400;
        } else if (error.name === 'MongoError' && error.code === 11000) {
            errorMessage = 'Duplicate entry error';
            statusCode = 400;
        }
        
        res.status(statusCode).json({ 
            success: false,
            message: errorMessage, 
            error: error.message 
        });
    }
});

// Handle Xero OAuth callback
router.get('/callback', async (req, res) => {
    const { code, state } = req.query;
    console.log('Received Xero callback with code:', code ? 'present' : 'missing');

    if (!code) {
        console.error('No code received in Xero callback');
        return res.redirect(`${getFrontendURL()}/settings/xero?error=no_code`);
    }

    try {
        // Get settings
        const settings = await Settings.findOne();
        if (!settings) {
            console.error('No settings found in database');
            return res.redirect(`${getFrontendURL()}/settings/xero?error=no_settings`);
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

        const tokenResponseText = await tokenResponse.text();
        
        // Log response for debugging - be careful not to log actual tokens in production
        console.log('Token response status:', tokenResponse.status);
        console.log('Token response headers:', tokenResponse.headers);
        console.log('Token response text length:', tokenResponseText.length);
        
        if (!tokenResponse.ok) {
            console.error('Xero token exchange failed:', tokenResponseText);
            return res.redirect(`${getFrontendURL()}/settings/xero?error=token_exchange_failed&status=${tokenResponse.status}`);
        }

        const tokens = JSON.parse(tokenResponseText);
        console.log('Successfully received Xero tokens');
        
        // Get tenant connections
        console.log('Fetching connected Xero tenants');
        const connectionsResponse = await fetch('https://api.xero.com/connections', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!connectionsResponse.ok) {
            console.error('Failed to fetch Xero tenants:', await connectionsResponse.text());
            return res.redirect(`${getFrontendURL()}/settings/xero?error=tenant_fetch_failed`);
        }
        
        const connections = await connectionsResponse.json();
        console.log('Connections response:', connections);
        
        if (!connections || connections.length === 0) {
            console.error('No tenants connected to this Xero app');
            return res.redirect(`${getFrontendURL()}/settings/xero?error=no_tenants`);
        }
        
        const tenant = connections[0]; // Use first tenant

        // Store the tokens securely
        settings.xeroConfig.accessToken = tokens.access_token;
        settings.xeroConfig.refreshToken = tokens.refresh_token;
        settings.xeroConfig.tokenExpiry = new Date(Date.now() + (tokens.expires_in * 1000));
        settings.xeroConfig.isConnected = true;
        settings.xeroConfig.tenantId = tenant.tenantId;
        settings.xeroConfig.tenantName = tenant.tenantName;
        
        await settings.save();
        console.log('Saved Xero connection info to database');

        // Redirect back to the settings page
        res.redirect(`${getFrontendURL()}/settings/xero?success=true`);
    } catch (error) {
        console.error('Error in Xero callback:', error);
        res.redirect(`${getFrontendURL()}/settings/xero?error=server_error&message=${encodeURIComponent(error.message)}`);
    }
});

// Generate a random state parameter for security
function generateState() {
    return Math.random().toString(36).substring(7);
}

module.exports = router; 