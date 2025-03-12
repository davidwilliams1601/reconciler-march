const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const Settings = require('../models/Settings');

// The scopes we need for the application
const XERO_SCOPES = 'offline_access accounting.transactions accounting.settings';

// Get the frontend URL based on environment
const getFrontendURL = () => {
    return process.env.NODE_ENV === 'production'
        ? 'https://reconciler-frontend.onrender.com'
        : 'http://localhost:3000';
};

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

        res.json({ authUrl });
    } catch (error) {
        console.error('Error generating auth URL:', error);
        res.status(500).json({ message: 'Error generating authorization URL', error: error.message });
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

        // Here you would typically store the tokens securely
        // For now, we'll just return success
        res.redirect(`${getFrontendURL()}/settings?xero=success`);
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