const fetch = require('node-fetch');
const Settings = require('../models/Settings');

class XeroService {
    constructor() {
        this.baseUrl = 'https://api.xero.com/api.xro/2.0';
    }

    async getAccessToken() {
        const settings = await Settings.findOne();
        if (!settings?.xeroConfig?.accessToken) {
            throw new Error('Xero access token not found');
        }
        return settings.xeroConfig.accessToken;
    }

    async getTenantId() {
        const settings = await Settings.findOne();
        if (!settings?.xeroConfig?.tenantId) {
            throw new Error('Xero tenant ID not found');
        }
        return settings.xeroConfig.tenantId;
    }

    async findMatchingTransaction(invoice) {
        try {
            const accessToken = await this.getAccessToken();
            const tenantId = await this.getTenantId();

            // Get transactions from Xero
            const response = await fetch(`${this.baseUrl}/Transactions`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Xero-Tenant-Id': tenantId,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Xero API error: ${response.statusText}`);
            }

            const transactions = await response.json();
            
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

    async updateTransaction(transactionId, costCentre) {
        try {
            const accessToken = await this.getAccessToken();
            const tenantId = await this.getTenantId();

            const response = await fetch(`${this.baseUrl}/Transactions/${transactionId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Xero-Tenant-Id': tenantId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    CostCentre: costCentre
                })
            });

            if (!response.ok) {
                throw new Error(`Xero API error: ${response.statusText}`);
            }

            return {
                success: true,
                transaction: await response.json()
            };
        } catch (error) {
            console.error('Error updating Xero transaction:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new XeroService(); 