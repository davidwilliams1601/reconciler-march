const axios = require('axios');

async function testDextConnection(apiKey, clientId, clientSecret, environment = 'production') {
    try {
        const baseUrl = environment.toLowerCase() === 'production' 
            ? 'https://api.dext.com/v1'
            : 'https://api.sandbox.dext.com/v1';

        // First, get an access token using client credentials
        const tokenResponse = await axios.post('https://identity.dext.com/connect/token', 
            'grant_type=client_credentials&scope=openid profile email',
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Test the connection by getting company information
        const companyResponse = await axios.get(`${baseUrl}/companies`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'X-API-KEY': apiKey
            }
        });

        if (companyResponse.data && companyResponse.data.companies) {
            console.log('\nSuccessfully connected to Dext API!');
            console.log('\nAvailable Companies:');
            companyResponse.data.companies.forEach(company => {
                console.log(`Company ID: ${company.id}`);
                console.log(`Company Name: ${company.name}`);
                console.log('-------------------');
            });
        } else {
            console.log('No companies found');
        }

    } catch (error) {
        console.error('Error connecting to Dext:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error details:', error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

// Check if credentials are provided as command line arguments
const apiKey = process.argv[2];
const clientId = process.argv[3];
const clientSecret = process.argv[4];
const environment = process.argv[5] || 'production';

if (!apiKey || !clientId || !clientSecret) {
    console.log('Please provide your Dext credentials as arguments:');
    console.log('node testDextConnection.js <apiKey> <clientId> <clientSecret> [environment]');
    console.log('environment is optional and defaults to "production"');
    process.exit(1);
}

testDextConnection(apiKey, clientId, clientSecret, environment); 