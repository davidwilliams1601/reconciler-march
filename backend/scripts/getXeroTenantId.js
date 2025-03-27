const axios = require('axios');
const express = require('express');

const app = express();
const port = 3333;

async function getXeroTenantId(clientId, clientSecret) {
    const redirectUri = `http://localhost:${port}/callback`;
    
    app.get('/callback', async (req, res) => {
        try {
            const { code } = req.query;
            
            // Exchange the code for an access token
            const tokenResponse = await axios.post('https://identity.xero.com/connect/token', 
                `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                    }
                }
            );

            // Get the connections/tenants
            const tenantResponse = await axios.get('https://api.xero.com/connections', {
                headers: {
                    'Authorization': `Bearer ${tokenResponse.data.access_token}`
                }
            });

            if (tenantResponse.data && tenantResponse.data.length > 0) {
                console.log('\nAvailable Tenants:');
                tenantResponse.data.forEach(tenant => {
                    console.log(`Tenant ID: ${tenant.tenantId}`);
                    console.log(`Tenant Name: ${tenant.tenantName}`);
                    console.log(`Tenant Type: ${tenant.tenantType}`);
                    console.log('-------------------');
                });
            } else {
                console.log('No tenants found');
            }

            res.send('You can close this window now and check your terminal for the Tenant ID.');
            server.close();
            process.exit(0);
        } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            res.status(500).send('Error fetching tenant information');
            server.close();
            process.exit(1);
        }
    });

    const server = app.listen(port, () => {
        console.log(`\nStarting authentication process...\n`);
        console.log(`1. Copy and paste the following URL into your browser:`);
        
        // Construct the authorization URL
        const scope = encodeURIComponent('openid profile email accounting.transactions accounting.contacts accounting.settings offline_access');
        const authUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=123`;
        
        console.log(`\n${authUrl}\n`);
        console.log(`2. After logging in, authorize the application.`);
        console.log(`3. The Tenant ID will be displayed here in the terminal.\n`);
        
        // Try to open the browser automatically, but don't wait for it
        import('open').then(open => {
            open.default(authUrl).catch(() => {
                // Ignore errors from open, since we're showing the URL
            });
        });
    });
}

// Check if credentials are provided as command line arguments
const clientId = process.argv[2];
const clientSecret = process.argv[3];

if (!clientId || !clientSecret) {
    console.log('Please provide your Xero Client ID and Client Secret as arguments:');
    console.log('node getXeroTenantId.js <clientId> <clientSecret>');
    process.exit(1);
}

getXeroTenantId(clientId, clientSecret); 