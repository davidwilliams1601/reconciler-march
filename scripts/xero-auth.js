#!/usr/bin/env node

/**
 * Xero Authentication Script
 * 
 * This script handles OAuth 2.0 authentication with Xero and saves the credentials
 * to your database, bypassing the need to use the settings page.
 * 
 * Usage:
 * 1. Add your Xero OAuth credentials (Client ID and Client Secret) below
 * 2. Run the script: node xero-auth.js
 * 3. Follow the authentication process in your browser
 * 4. The script will save the credentials to your database
 */

const express = require('express');
const axios = require('axios');
const open = require('open');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// --------------------------------------
// CONFIG - EDIT THESE VALUES
// --------------------------------------
const XERO_CLIENT_ID = process.env.XERO_CLIENT_ID || '';
const XERO_CLIENT_SECRET = process.env.XERO_CLIENT_SECRET || '';
const PORT = process.env.PORT || 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const SCOPES = 'openid offline_access accounting.transactions accounting.settings';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/reconciler';
// --------------------------------------

// Create a Settings model
const settingsSchema = new mongoose.Schema({
    api: {
        xero: {
            clientId: String,
            clientSecret: String,
            accessToken: String,
            refreshToken: String,
            tokenExpiry: Date,
            tenantId: String,
            redirectUri: String
        }
    }
}, { timestamps: true });

// Generate state parameter to prevent CSRF
const state = crypto.randomBytes(16).toString('hex');

// Initialize express app
const app = express();

console.log('╔═════════════════════════════════════════════════════╗');
console.log('║               XERO AUTHENTICATION TOOL              ║');
console.log('╚═════════════════════════════════════════════════════╝');

if (!XERO_CLIENT_ID || !XERO_CLIENT_SECRET) {
    console.error('ERROR: Xero Client ID and Client Secret must be provided.');
    console.log('Please edit this script or set XERO_CLIENT_ID and XERO_CLIENT_SECRET environment variables.');
    process.exit(1);
}

// Initial route
app.get('/', (req, res) => {
    res.send(`
        <h1>Xero Authentication Tool</h1>
        <p>Click the button below to start the authentication process with Xero.</p>
        <button onclick="window.location.href='/auth'">Authenticate with Xero</button>
    `);
});

// Auth initiation route
app.get('/auth', (req, res) => {
    const authUrl = `https://login.xero.com/identity/connect/authorize?` +
        `response_type=code` +
        `&client_id=${XERO_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(SCOPES)}` +
        `&state=${state}`;
    
    res.redirect(authUrl);
});

// Callback route
app.get('/callback', async (req, res) => {
    const { code, state: returnedState } = req.query;
    
    // Verify state parameter
    if (state !== returnedState) {
        return res.status(400).send('State parameter mismatch. Possible CSRF attack.');
    }
    
    try {
        // Exchange code for tokens
        const tokenResponse = await axios.post('https://identity.xero.com/connect/token', 
            new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI
            }).toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${XERO_CLIENT_ID}:${XERO_CLIENT_SECRET}`).toString('base64')}`
                }
            }
        );
        
        const { access_token, refresh_token, expires_in } = tokenResponse.data;
        
        // Get connected tenants
        const tenantsResponse = await axios.get('https://api.xero.com/connections', {
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const tenants = tenantsResponse.data;
        
        if (tenants.length === 0) {
            return res.status(400).send('No Xero organizations connected. Please connect at least one organization in Xero.');
        }
        
        // Get the first tenant (you can modify to select a specific one if needed)
        const tenantId = tenants[0].tenantId;
        const tenantName = tenants[0].tenantName;
        
        // Save to database
        const Settings = mongoose.model('Settings', settingsSchema);
        
        // Find existing settings or create new ones
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings();
        }
        
        // Ensure the structure exists
        if (!settings.api) {
            settings.api = {};
        }
        if (!settings.api.xero) {
            settings.api.xero = {};
        }
        
        // Update the settings
        settings.api.xero.clientId = XERO_CLIENT_ID;
        settings.api.xero.clientSecret = XERO_CLIENT_SECRET;
        settings.api.xero.accessToken = access_token;
        settings.api.xero.refreshToken = refresh_token;
        settings.api.xero.tokenExpiry = new Date(Date.now() + (expires_in * 1000));
        settings.api.xero.tenantId = tenantId;
        settings.api.xero.redirectUri = REDIRECT_URI;
        
        await settings.save();
        
        // Save to env file for backup
        const envContent = `XERO_CLIENT_ID=${XERO_CLIENT_ID}
XERO_CLIENT_SECRET=${XERO_CLIENT_SECRET}
XERO_ACCESS_TOKEN=${access_token}
XERO_REFRESH_TOKEN=${refresh_token}
XERO_TOKEN_EXPIRY=${new Date(Date.now() + (expires_in * 1000)).toISOString()}
XERO_TENANT_ID=${tenantId}
`;
        
        fs.writeFileSync(path.join(__dirname, 'xero-credentials.env'), envContent);
        
        // Return success
        res.send(`
            <h1>Xero Authentication Successful!</h1>
            <h2>Connected Organization: ${tenantName}</h2>
            <p>The credentials have been saved to the database and a backup has been created in xero-credentials.env</p>
            <p><strong>Access Token:</strong> ${access_token.substring(0, 10)}...</p>
            <p><strong>Refresh Token:</strong> ${refresh_token.substring(0, 10)}...</p>
            <p><strong>Tenant ID:</strong> ${tenantId}</p>
            <p><strong>Expiry:</strong> ${new Date(Date.now() + (expires_in * 1000)).toLocaleString()}</p>
            <p>You can now close this window and the script.</p>
        `);
        
        console.log('╔═════════════════════════════════════════════════════╗');
        console.log('║           AUTHENTICATION SUCCESSFUL!                ║');
        console.log('╚═════════════════════════════════════════════════════╝');
        console.log(`Connected Organization: ${tenantName}`);
        console.log(`Tenant ID: ${tenantId}`);
        console.log(`Access Token: ${access_token.substring(0, 10)}...`);
        console.log(`Refresh Token: ${refresh_token.substring(0, 10)}...`);
        console.log(`Token Expiry: ${new Date(Date.now() + (expires_in * 1000)).toLocaleString()}`);
        console.log('\nCredentials have been saved to the database and a backup file.');
        console.log('You can now stop the script (Ctrl+C)');
        
    } catch (error) {
        console.error('Error during token exchange:', error.response?.data || error.message);
        res.status(500).send(`
            <h1>Authentication Error</h1>
            <p>An error occurred during the authentication process:</p>
            <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
        `);
    }
});

// Start the server and open the browser
async function start() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');
        
        // Start Express server
        const server = app.listen(PORT, () => {
            console.log(`Server started on http://localhost:${PORT}`);
            console.log('Opening browser for authentication...');
            
            // Open the browser
            open(`http://localhost:${PORT}`);
        });
        
    } catch (error) {
        console.error('Error starting the server:', error);
        process.exit(1);
    }
}

start(); 