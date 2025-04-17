# Xero Integration Setup Utility

This utility helps you easily connect your application to the Xero API without having to manually edit configuration files or database entries.

## Prerequisites

- A Xero Developer account (sign up at https://developer.xero.com/)
- A Xero App created in the Xero Developer Portal
- Node.js (v14 or higher)
- MongoDB instance running (local or remote)

## Setup Instructions

### 1. Create a Xero App (if you haven't already)

1. Go to https://developer.xero.com/app/manage
2. Click "New app"
3. Enter your app details:
   - App name: "Reconciler" (or your preferred name)
   - App URL: Your frontend URL (e.g., https://frontend-new-er0k.onrender.com)
   - Company/organization: Your company name
4. Under OAuth 2.0 redirect URLs, add:
   - For production: `https://reconciler-march.onrender.com/api/xero/callback`
   - For development: `http://localhost:5001/api/xero/callback`
5. Save your app
6. Note your **Client ID** and **Client Secret** - you'll need these in the next steps

### 2. Run the Setup Utility

1. Install the required dependencies:
   ```bash
   node install-xero-setup.js
   ```

2. Run the setup utility:
   ```bash
   node setup-xero.js
   ```

3. Follow the prompts to enter:
   - MongoDB connection URI
   - Xero Client ID
   - Xero Client Secret
   - Backend URL (default: http://localhost:5001)
   - Frontend URL (default: http://localhost:3000)
   - Redirect URI (default: [backend-url]/api/xero/callback)

4. A browser window will open automatically. Click the "Connect to Xero" button.

5. You'll be redirected to Xero to authorize the connection. Log in with your Xero credentials if necessary.

6. Grant permission to your app to access your Xero organization.

7. After successful authentication, you'll be redirected back to the setup utility with a success message.

### 3. Complete the Setup

1. Stop the setup utility (press Ctrl+C in your terminal).

2. Restart your application to apply the new settings:
   ```bash
   cd ..
   npm run dev
   ```

3. Visit your application's Xero settings page to verify the connection.

## Troubleshooting

### "Error Code: 500 - unauthorized_client : Unknown client or client not enabled"

This common error occurs when attempting to connect to Xero and indicates problems with your Xero app credentials:

1. **Verify your Client ID and Client Secret**:
   - Double-check that you've copied the Client ID and Client Secret correctly from the Xero Developer Portal
   - Ensure there are no extra spaces or characters
   - Make sure you're using the credentials from the correct app

2. **Check your app status in Xero Developer Portal**:
   - Log in to https://developer.xero.com/app/manage
   - Verify your app is in "Active" state, not "Created" or "Draft"
   - Ensure the app has been approved and is not pending review

3. **Verify the Redirect URI**:
   - Ensure the exact same Redirect URI is configured both in your app settings and in the Xero Developer Portal
   - The URI is case-sensitive and must match exactly

4. **Recreate your Xero app**:
   - Sometimes, creating a new app resolves permissions issues
   - Follow the setup instructions again with a new app

5. **Use Demo Mode temporarily**:
   - If you continue to have issues, use the "Demo Connection" button to test functionality
   - This simulates a successful connection for development purposes

### Font Loading & CSP Issues

If you experience font loading or Content Security Policy (CSP) issues, the application includes a diagnostic page:

1. Visit `/csp-test.html` in your browser (e.g., https://frontend-new-er0k.onrender.com/csp-test.html)
2. This page will run tests on your CSP configuration and font loading capabilities
3. Review the test results to identify any issues with your setup

Common issues and solutions:
- If fonts fail to load, ensure both your frontend and backend CSP configurations include proper font-src directives
- If API connectivity fails, check your CORS configuration
- If Google Fonts fail, make sure https://fonts.googleapis.com and https://fonts.gstatic.com are allowed in your CSP

### Connection Issues

- **Redirect URI mismatch**: Ensure the redirect URI in your Xero Developer Portal exactly matches the one used in the setup utility.
- **Authentication failure**: Check that your Client ID and Client Secret are correct.
- **No organizations**: Ensure you have at least one organization in your Xero account.

### Database Issues

- If you encounter MongoDB connection errors, verify your connection string and ensure your MongoDB instance is running.

### Application Not Recognizing the Connection

- Check that the `.env` file was created/updated with your Xero credentials.
- Verify that the application was restarted after completing the setup.
- Check the application logs for any error messages.

## Manual Configuration

If you prefer to configure Xero manually instead of using this utility:

1. Create a `.env` file in your project root with:
   ```
   XERO_CLIENT_ID=your_client_id
   XERO_CLIENT_SECRET=your_client_secret
   XERO_REDIRECT_URI=your_redirect_uri
   ```

2. Configure your Xero app in the Xero Developer Portal with the same redirect URI.

3. Start your application and use the Connect to Xero button in the settings page. 