const fetch = require('node-fetch');
const Settings = require('../models/Settings');

/**
 * XeroService - Handles all interactions with the Xero API
 * Implements proper error handling, retries, and token refresh
 */
class XeroService {
    constructor() {
        this.baseUrl = 'https://api.xero.com/api.xro/2.0';
        this.authUrl = 'https://identity.xero.com';
        this._settings = null;
        this._tokenExpiry = null;
        this.MAX_RETRIES = 3;
    }

    /**
     * Initialize service with settings
     * Should be called when app starts or when settings change
     */
    async initialize() {
        this._settings = await Settings.findOne();
        if (!this._settings?.api?.xero) {
            console.warn('Xero configuration not found');
            return false;
        }
        console.log('Xero service initialized with tenant ID:', this._settings.api.xero.tenantId);
        return true;
    }

    /**
     * Get current settings, refreshing from DB if necessary
     */
    async getSettings() {
        if (!this._settings) {
            await this.initialize();
        }
        return this._settings?.api?.xero;
    }

    /**
     * Generate URL for OAuth authorization
     * @param {string} redirectUri - Redirect URI after authorization
     * @returns {string} Authorization URL
     */
    async getAuthorizationUrl(redirectUri) {
        const settings = await this.getSettings();
        if (!settings?.clientId) {
            throw new Error('Xero client ID not found');
        }

        const scopes = 'offline_access accounting.transactions accounting.settings';
        const state = Math.random().toString(36).substring(7);
        
        return `${this.authUrl}/connect/authorize` +
            `?response_type=code` +
            `&client_id=${settings.clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${state}`;
    }

    /**
     * Exchange authorization code for tokens
     * @param {string} code - Authorization code from Xero
     * @param {string} redirectUri - Redirect URI used in authorization
     * @returns {Object} Token response
     */
    async exchangeCodeForToken(code, redirectUri) {
        const settings = await this.getSettings();
        if (!settings?.clientId || !settings?.clientSecret) {
            throw new Error('Xero credentials not found');
        }

        const response = await fetch(`${this.authUrl}/connect/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(
                    `${settings.clientId}:${settings.clientSecret}`
                ).toString('base64')
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Token exchange failed: ${errorData}`);
        }

        const tokens = await response.json();
        
        // Save tokens to settings
        this._settings.api.xero.accessToken = tokens.access_token;
        this._settings.api.xero.refreshToken = tokens.refresh_token;
        this._settings.api.xero.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
        await this._settings.save();
        
        this._tokenExpiry = new Date(this._settings.api.xero.tokenExpiry);
        
        return tokens;
    }

    /**
     * Refresh access token if expired
     * @returns {string} Valid access token
     */
    async ensureValidToken() {
        const settings = await this.getSettings();
        
        // If token doesn't exist or is expired (with 5 min buffer)
        const now = new Date();
        this._tokenExpiry = settings.tokenExpiry ? new Date(settings.tokenExpiry) : null;
        
        if (!settings.accessToken || !this._tokenExpiry || 
            this._tokenExpiry <= new Date(now.getTime() + 5 * 60 * 1000)) {
            
            if (!settings.refreshToken) {
                throw new Error('No refresh token available, reauthorization required');
            }
            
            const response = await fetch(`${this.authUrl}/connect/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + Buffer.from(
                        `${settings.clientId}:${settings.clientSecret}`
                    ).toString('base64')
                },
                body: new URLSearchParams({
                    grant_type: 'refresh_token',
                    refresh_token: settings.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed: ${await response.text()}`);
            }

            const tokens = await response.json();
            
            // Update tokens in settings
            this._settings.api.xero.accessToken = tokens.access_token;
            this._settings.api.xero.refreshToken = tokens.refresh_token;
            this._settings.api.xero.tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
            await this._settings.save();
            
            this._tokenExpiry = new Date(this._settings.api.xero.tokenExpiry);
            return tokens.access_token;
        }
        
        return settings.accessToken;
    }

    /**
     * Get tenant connections (organizations)
     * @returns {Array} List of tenants
     */
    async getTenants() {
        const accessToken = await this.ensureValidToken();
        
        const response = await fetch('https://api.xero.com/connections', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get tenants: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Get tenant ID from settings
     */
    async getTenantId() {
        const settings = await this.getSettings();
        if (!settings?.tenantId) {
            throw new Error('Xero tenant ID not found');
        }
        return settings.tenantId;
    }

    /**
     * Make an authenticated API request to Xero
     * Handles retries and token refresh
     */
    async apiRequest(endpoint, options = {}, retryCount = 0) {
        try {
            const accessToken = await this.ensureValidToken();
            const tenantId = await this.getTenantId();
            
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}/${endpoint}`;
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Xero-Tenant-Id': tenantId,
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (response.status === 401 && retryCount < this.MAX_RETRIES) {
                // Token might be expired, force refresh and retry
                this._tokenExpiry = new Date(0); // Force token refresh
                return this.apiRequest(endpoint, options, retryCount + 1);
            }
            
            if (!response.ok) {
                throw new Error(`Xero API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            if (retryCount < this.MAX_RETRIES) {
                console.warn(`Retrying Xero API request (${retryCount + 1}/${this.MAX_RETRIES})`, error.message);
                return this.apiRequest(endpoint, options, retryCount + 1);
            }
            throw error;
        }
    }

    /**
     * Find transactions matching an invoice
     */
    async findMatchingTransaction(invoice) {
        try {
            const transactions = await this.apiRequest('Transactions');
            
            // Find matching transaction
            const matches = transactions.Transactions.filter(transaction => {
                // Check amount match (within 1% tolerance)
                const amountMatch = Math.abs(transaction.Total - invoice.amount) / invoice.amount < 0.01;
                
                // Check date match (within 7 days)
                const transactionDate = new Date(transaction.Date);
                const invoiceDate = new Date(invoice.issueDate);
                const dateMatch = Math.abs(transactionDate - invoiceDate) / (1000 * 60 * 60 * 24) < 7;
                
                // Check vendor match (if available)
                const vendorMatch = transaction.Contact?.Name?.toLowerCase().includes(invoice.vendor.toLowerCase());
                
                return amountMatch && dateMatch && vendorMatch;
            });

            // Calculate confidence score
            const confidence = this.calculateConfidence(matches[0], invoice);

            return {
                success: true,
                matches,
                confidence,
                requiresReview: confidence < 0.95
            };
        } catch (error) {
            console.error('Error matching Xero transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    calculateConfidence(transaction, invoice) {
        if (!transaction) return 0;

        let confidence = 0;
        let factors = 0;

        // Amount match (40% weight)
        const amountDiff = Math.abs(transaction.Total - invoice.amount);
        const amountConfidence = 1 - (amountDiff / invoice.amount);
        confidence += amountConfidence * 0.4;
        factors++;

        // Date match (30% weight)
        const transactionDate = new Date(transaction.Date);
        const invoiceDate = new Date(invoice.issueDate);
        const daysDiff = Math.abs(transactionDate - invoiceDate) / (1000 * 60 * 60 * 24);
        const dateConfidence = Math.max(0, 1 - (daysDiff / 7));
        confidence += dateConfidence * 0.3;
        factors++;

        // Vendor match (30% weight)
        if (transaction.Contact?.Name) {
            const vendorConfidence = this.calculateStringSimilarity(
                transaction.Contact.Name.toLowerCase(),
                invoice.vendor.toLowerCase()
            );
            confidence += vendorConfidence * 0.3;
            factors++;
        }

        return confidence / factors;
    }

    calculateStringSimilarity(str1, str2) {
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    /**
     * Update transaction with cost center information
     */
    async updateTransaction(transactionId, costCentre) {
        try {
            const result = await this.apiRequest(`Transactions/${transactionId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    CostCentre: costCentre
                })
            });

            return {
                success: true,
                transaction: result
            };
        } catch (error) {
            console.error('Error updating Xero transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Test the Xero connection with current settings
     */
    async testConnection() {
        try {
            await this.getSettings();
            
            // If no tenant ID or credentials, return false
            if (!this._settings?.api?.xero?.tenantId || 
                !this._settings?.api?.xero?.clientId || 
                !this._settings?.api?.xero?.clientSecret) {
                return { 
                    success: false, 
                    message: 'Missing required Xero configuration' 
                };
            }
            
            // Check if we have valid tokens, if not just validate credentials
            if (!this._settings.api.xero.accessToken) {
                return { 
                    success: true,
                    authenticated: false,
                    message: 'Credentials valid but not authenticated'
                };
            }
            
            // Try to make a simple API call to validate tokens
            try {
                await this.apiRequest('Organisations');
                return { 
                    success: true,
                    authenticated: true, 
                    message: 'Successfully connected to Xero API'
                };
            } catch (error) {
                // If we can't refresh the token, credentials may be invalid
                if (error.message.includes('refresh')) {
                    return { 
                        success: false, 
                        message: 'Authentication failed: ' + error.message
                    };
                }
                
                // Otherwise just report the specific error
                return { 
                    success: false, 
                    message: 'API call failed: ' + error.message
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: 'Connection test failed: ' + error.message 
            };
        }
    }
}

// Export as singleton
module.exports = new XeroService(); 