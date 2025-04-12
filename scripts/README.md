# Reconciler Scripts

This directory contains utility scripts for the Reconciler application.

## Xero Authentication Script

This script allows you to authenticate with Xero and save the credentials directly to your database, bypassing the need to use the settings page in the application.

### Prerequisites

- Node.js 14 or higher
- MongoDB connection details
- Xero Developer account with an application set up

### Setup

1. Create a `.env` file in this directory with the following content:

```
XERO_CLIENT_ID=your-client-id
XERO_CLIENT_SECRET=your-client-secret
MONGODB_URI=your-mongodb-uri
```

Replace `your-client-id` and `your-client-secret` with your Xero OAuth 2.0 application credentials. Replace `your-mongodb-uri` with your MongoDB connection string.

2. Install the dependencies:

```bash
npm install
```

### Running the Script

1. Run the script:

```bash
npm run xero-auth
```

2. The script will open a browser window and guide you through the authentication process.

3. After successful authentication, the script will:
   - Save the credentials to your database
   - Create a backup file `xero-credentials.env` with the credentials

### Troubleshooting

If you encounter any issues:

1. Make sure your Xero application has the correct redirect URI configured (`http://localhost:3333/callback` by default)
2. Check your MongoDB connection string is correct
3. Ensure you have the proper scopes configured in your Xero application (openid, offline_access, accounting.transactions, accounting.settings)

### Security Notes

- The script creates a backup file with sensitive credentials. Make sure to secure this file or delete it after use.
- Never commit the `.env` file or the generated `xero-credentials.env` file to version control.

## Other Scripts

Additional utility scripts will be added to this directory as needed. 