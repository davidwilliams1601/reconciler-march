const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const dotenv = require('dotenv');
const open = require('open');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Constants
const PORT = 3333;
const SCOPES = 'offline_access accounting.transactions accounting.settings';
const state = Math.random().toString(36).substring(7); // For CSRF protection

let Settings; // Will store the Settings model
let xeroClientId = '';
let xeroClientSecret = '';
let redirectUri = '';
let baseBackendUrl = '';
let baseFrontendUrl = '';

// Function to prompt user for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => {
    resolve(answer);
  });
});

// Initialize Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup MongoDB connection
const connectToMongoDB = async (uri) => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB successfully.');
    
    // Define Settings schema dynamically
    const settingsSchema = new mongoose.Schema({
      organization: {
        name: String,
        defaultCurrency: String,
        defaultLanguage: String,
        timezone: String,
      },
      xeroConfig: {
        clientId: String,
        clientSecret: String,
        redirectUri: String,
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        tenantId: String,
        tenantName: String,
        isConnected: Boolean,
        lastSync: Date
      }
    }, { 
      timestamps: true,
      strict: false // Allow flexibility with fields
    });
    
    // Create or get the model
    Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

// Route to start auth flow
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Xero Integration Setup</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2e3d49; }
          .container { background-color: #f5f7f9; padding: 20px; border-radius: 5px; }
          button { background-color: #0a85eb; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
          button:hover { background-color: #0769c2; }
          .info { background-color: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .warning { background-color: #fff3e0; padding: 15px; border-radius: 4px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Xero Integration Setup</h1>
          <p>This utility will help you connect your application to Xero API.</p>
          
          <div class="info">
            <p><strong>Current Configuration:</strong></p>
            <ul>
              <li>Client ID: ${xeroClientId || 'Not set'}</li>
              <li>Client Secret: ${xeroClientSecret ? '********' : 'Not set'}</li>
              <li>Redirect URI: ${redirectUri || 'Not set'}</li>
              <li>Backend URL: ${baseBackendUrl || 'Not set'}</li>
              <li>Frontend URL: ${baseFrontendUrl || 'Not set'}</li>
            </ul>
          </div>
          
          <div class="warning">
            <p><strong>Important:</strong> Make sure you've created a Xero app with these settings:</p>
            <ol>
              <li>Go to <a href="https://developer.xero.com/app/manage" target="_blank">Xero Developer Portal</a></li>
              <li>Create a new app or edit your existing app</li>
              <li>Under "Redirect URIs" add: <code>${redirectUri}</code></li>
              <li>Copy your Client ID and Client Secret to use in this setup</li>
            </ol>
          </div>
          
          <p>
            <a href="/authorize"><button>Connect to Xero</button></a>
          </p>
        </div>
      </body>
    </html>
  `);
});

// Auth initiation route
app.get('/authorize', (req, res) => {
  const authUrl = `https://login.xero.com/identity/connect/authorize?` +
    `response_type=code` +
    `&client_id=${xeroClientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
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
  
  if (!code) {
    return res.status(400).send('No code provided in the callback.');
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await axios.post('https://identity.xero.com/connect/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${xeroClientId}:${xeroClientSecret}`).toString('base64')}`
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
    
    // Get the first tenant
    const tenantId = tenants[0].tenantId;
    const tenantName = tenants[0].tenantName;
    
    // Find existing settings or create new ones
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    // Update Xero settings
    settings.xeroConfig = {
      ...settings.xeroConfig,
      clientId: xeroClientId,
      clientSecret: xeroClientSecret,
      redirectUri: redirectUri,
      accessToken: access_token,
      refreshToken: refresh_token,
      tokenExpiry: new Date(Date.now() + (expires_in * 1000)),
      tenantId,
      tenantName,
      isConnected: true,
      lastSync: new Date()
    };
    
    await settings.save();
    
    // Create a .env file with the new credentials
    updateEnvFile({
      XERO_CLIENT_ID: xeroClientId,
      XERO_CLIENT_SECRET: xeroClientSecret,
      XERO_REDIRECT_URI: redirectUri,
      FRONTEND_URL: baseFrontendUrl,
      BACKEND_URL: baseBackendUrl
    });
    
    res.send(`
      <html>
        <head>
          <title>Xero Integration - Success</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2e3d49; }
            .container { background-color: #f5f7f9; padding: 20px; border-radius: 5px; }
            .success { background-color: #e8f5e9; padding: 15px; border-radius: 4px; margin: 15px 0; }
            button { background-color: #0a85eb; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            pre { background-color: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Xero Integration - Success! 🎉</h1>
            
            <div class="success">
              <h2>Successfully connected to Xero!</h2>
              <p>Your application is now authorized to access ${tenantName}.</p>
              <p>Credentials have been saved to your database and a .env file has been created with your settings.</p>
            </div>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>Stop this setup script (Ctrl+C in terminal)</li>
              <li>Restart your application to apply the new settings</li>
              <li>Visit your application's Xero settings page to verify connection</li>
            </ol>
            
            <p>
              <a href="/" onclick="window.close(); return false;"><button>Close This Window</button></a>
            </p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error in Xero callback:', error.response?.data || error.message);
    
    let errorMessage = 'Unknown error occurred during Xero authentication.';
    if (error.response?.data) {
      errorMessage = JSON.stringify(error.response.data, null, 2);
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).send(`
      <html>
        <head>
          <title>Xero Integration - Error</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2e3d49; }
            .container { background-color: #f5f7f9; padding: 20px; border-radius: 5px; }
            .error { background-color: #ffebee; padding: 15px; border-radius: 4px; margin: 15px 0; }
            button { background-color: #0a85eb; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            pre { background-color: #f1f1f1; padding: 10px; border-radius: 4px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Xero Integration - Error</h1>
            
            <div class="error">
              <h2>Failed to connect to Xero</h2>
              <p>An error occurred during the authentication process:</p>
              <pre>${errorMessage}</pre>
            </div>
            
            <h3>Possible solutions:</h3>
            <ol>
              <li>Check that your Client ID and Client Secret are correct</li>
              <li>Verify that your Redirect URI is correctly configured in the Xero Developer Portal</li>
              <li>Make sure you've granted sufficient permissions when authorizing the app</li>
              <li>Try the connection process again</li>
            </ol>
            
            <p>
              <a href="/"><button>Try Again</button></a>
            </p>
          </div>
        </body>
      </html>
    `);
  }
});

// Function to update .env file
function updateEnvFile(newVars) {
  try {
    const envPath = path.join(process.cwd(), '..', '.env');
    let envContent = '';
    
    // Read existing .env if it exists
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add each variable
    Object.keys(newVars).forEach(key => {
      const value = newVars[key];
      const regex = new RegExp(`^${key}=.*`, 'm');
      
      if (envContent.match(regex)) {
        // Update existing variable
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add new variable
        envContent += `\n${key}=${value}`;
      }
    });
    
    // Write back to file
    fs.writeFileSync(envPath, envContent.trim());
    console.log('.env file updated successfully');
  } catch (error) {
    console.error('Error updating .env file:', error);
  }
}

// Main function
async function main() {
  console.log('\n=== Xero Integration Setup ===\n');
  
  // Get MongoDB URI
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    mongoUri = await prompt('Enter MongoDB connection URI: ');
  }
  
  // Connect to MongoDB
  const connected = await connectToMongoDB(mongoUri);
  if (!connected) {
    console.log('Failed to connect to MongoDB. Please check your connection URI and try again.');
    rl.close();
    process.exit(1);
  }
  
  // Get Xero credentials
  console.log('\nYou need to enter your Xero API credentials.\n');
  console.log('If you don\'t have them yet, please create an app at https://developer.xero.com/app/manage\n');
  
  xeroClientId = process.env.XERO_CLIENT_ID || await prompt('Enter your Xero Client ID: ');
  xeroClientSecret = process.env.XERO_CLIENT_SECRET || await prompt('Enter your Xero Client Secret: ');
  
  // Set URLs
  baseBackendUrl = process.env.BACKEND_URL || await prompt('Enter your backend URL (default: http://localhost:5001): ') || 'http://localhost:5001';
  baseFrontendUrl = process.env.FRONTEND_URL || await prompt('Enter your frontend URL (default: http://localhost:3000): ') || 'http://localhost:3000';
  
  // Set redirect URI
  const defaultRedirectUri = `${baseBackendUrl}/api/xero/callback`;
  redirectUri = process.env.XERO_REDIRECT_URI || await prompt(`Enter your Xero redirect URI (default: ${defaultRedirectUri}): `) || defaultRedirectUri;
  
  console.log('\nStarting local server for Xero authentication...');
  app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log('\nPlease make sure your Xero app has the following redirect URI configured:');
    console.log(`\n  ${redirectUri}\n`);
    console.log('Opening browser to start the authentication process...');
    
    // Open browser
    open(`http://localhost:${PORT}`);
  });
}

// Start the script
main().catch(error => {
  console.error('Error running setup script:', error);
  rl.close();
  process.exit(1);
});

// Handle exit
process.on('SIGINT', () => {
  console.log('\nExiting setup script...');
  rl.close();
  process.exit(0);
}); 