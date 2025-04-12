const xeroService = require('./xeroService');
const googleVisionService = require('./googleVisionService');
const Invoice = require('../models/Invoice');
const Settings = require('../models/Settings');
const CostCenter = require('../models/CostCenter');

/**
 * ReconciliationService
 * Coordinates between different services for invoice processing and reconciliation
 */
class ReconciliationService {
    constructor() {
        this._settings = null;
    }

    /**
     * Initialize the service with required dependencies
     */
    async initialize() {
        try {
            this._settings = await Settings.findOne();
            if (!this._settings) {
                console.warn('No settings found, creating default settings');
                this._settings = await Settings.create({});
            }

            // Initialize dependent services
            await Promise.all([
                xeroService.initialize(),
                googleVisionService.initialize()
            ]);

            return true;
        } catch (error) {
            console.error('Error initializing reconciliation service:', error);
            return false;
        }
    }

    /**
     * Get settings with lazy loading
     */
    async getSettings() {
        if (!this._settings) {
            await this.initialize();
        }
        return this._settings;
    }

    /**
     * Process an invoice image using Google Vision and reconcile with Xero
     * @param {string|Buffer} imageSource - Path to image file or Buffer with image data
     * @param {Object} options - Processing options
     * @returns {Object} Processing results
     */
    async processInvoice(imageSource, options = {}) {
        try {
            const settings = await this.getSettings();
            
            // Step 1: Process the document with Google Vision
            console.log('Processing document with Google Vision');
            const visionResults = await googleVisionService.processDocument(imageSource, {
                includeRaw: options.includeRawVisionData || false
            });
            
            if (!visionResults || !visionResults.entities) {
                throw new Error('Failed to extract data from document');
            }
            
            // Step 2: Create an invoice record
            const invoice = new Invoice({
                vendor: visionResults.entities.vendor || 'Unknown Vendor',
                invoiceNumber: visionResults.entities.invoiceNumber || 'Unknown',
                amount: parseFloat(visionResults.entities.total) || 0,
                status: 'pending',
                description: `OCR Processed Invoice - ${visionResults.entities.invoiceNumber || 'Unknown'}`,
                issueDate: visionResults.entities.date ? new Date(visionResults.entities.date) : new Date(),
                dueDate: visionResults.entities.dueDate ? new Date(visionResults.entities.dueDate) : null,
                ocrText: visionResults.text,
                ocrConfidence: visionResults.confidence,
                currency: options.currency || 'GBP',
                processingNotes: JSON.stringify(visionResults.entities),
                attachments: options.attachmentPaths || []
            });
            
            // Determine the cost center if possible
            await this.assignCostCenter(invoice);
            
            // Step 3: Save the invoice
            await invoice.save();
            console.log(`Invoice saved with ID: ${invoice._id}`);
            
            // Step 4: Try to match with Xero transactions if Xero is configured
            let xeroResult = { success: false, message: 'Xero matching not attempted' };
            if (settings.api?.xero?.accessToken && settings.api?.xero?.tenantId) {
                console.log('Attempting to match with Xero transactions');
                try {
                    xeroResult = await xeroService.findMatchingTransaction(invoice);
                    
                    // Update the invoice with the match results
                    if (xeroResult.success && xeroResult.matches && xeroResult.matches.length > 0) {
                        invoice.matchedTransactions = xeroResult.matches.map(tx => ({
                            id: tx.TransactionID,
                            reference: tx.Reference,
                            amount: tx.Total,
                            date: new Date(tx.Date),
                            confidence: xeroResult.confidence
                        }));
                        
                        // If high confidence match, mark as reconciled
                        if (xeroResult.confidence >= 0.95 && !xeroResult.requiresReview) {
                            invoice.status = 'reconciled';
                            invoice.reconciliationDate = new Date();
                            invoice.processingNotes += ' | Auto-reconciled with high confidence';
                        } else if (xeroResult.confidence > 0.7) {
                            invoice.status = 'review';
                            invoice.processingNotes += ' | Possible match found, requires review';
                        }
                        
                        await invoice.save();
                        console.log(`Invoice updated with match results. Status: ${invoice.status}`);
                    }
                } catch (error) {
                    console.error('Error matching with Xero:', error);
                    xeroResult = { 
                        success: false, 
                        error: error.message,
                        message: 'Error matching with Xero' 
                    };
                }
            }
            
            return {
                success: true,
                invoice: invoice.toObject(),
                ocrResults: visionResults,
                xeroResults: xeroResult
            };
        } catch (error) {
            console.error('Error processing invoice:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Assign a cost center to an invoice based on vendor and text content
     */
    async assignCostCenter(invoice) {
        try {
            // Get all cost centers
            const costCenters = await CostCenter.find();
            if (!costCenters || costCenters.length === 0) {
                return;
            }
            
            // Try to match by vendor name first
            const vendorMatch = costCenters.find(cc => 
                cc.keywords.some(keyword => 
                    invoice.vendor.toLowerCase().includes(keyword.toLowerCase())
                )
            );
            
            if (vendorMatch) {
                invoice.costCenter = vendorMatch.code;
                return;
            }
            
            // Try to match by OCR text content
            if (invoice.ocrText) {
                for (const costCenter of costCenters) {
                    for (const keyword of costCenter.keywords) {
                        if (invoice.ocrText.toLowerCase().includes(keyword.toLowerCase())) {
                            invoice.costCenter = costCenter.code;
                            return;
                        }
                    }
                }
            }
            
            // No match found, use default if available
            const settings = await this.getSettings();
            if (settings.reconciliation?.defaultCostCenter) {
                invoice.costCenter = settings.reconciliation.defaultCostCenter;
            }
        } catch (error) {
            console.error('Error assigning cost center:', error);
        }
    }

    /**
     * Manually reconcile an invoice with a Xero transaction
     */
    async reconcileInvoice(invoiceId, transactionId, options = {}) {
        try {
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            
            // Update the transaction in Xero with cost center if specified
            if (invoice.costCenter && options.updateCostCenter) {
                await xeroService.updateTransaction(transactionId, invoice.costCenter);
            }
            
            // Update the invoice
            invoice.status = 'reconciled';
            invoice.reconciliationDate = new Date();
            invoice.matchedTransactions = [{
                id: transactionId,
                reference: options.reference || 'Manual Reconciliation',
                amount: invoice.amount,
                date: new Date(),
                confidence: 1.0  // Manual reconciliation has perfect confidence
            }];
            invoice.processingNotes += ' | Manually reconciled';
            
            await invoice.save();
            
            return {
                success: true,
                invoice: invoice.toObject()
            };
        } catch (error) {
            console.error('Error reconciling invoice:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats() {
        try {
            const totalInvoices = await Invoice.countDocuments();
            const pendingReview = await Invoice.countDocuments({ status: 'review' });
            const reconciledInvoices = await Invoice.countDocuments({ status: 'reconciled' });
            
            // Get total value processed
            const totalValueAgg = await Invoice.aggregate([
                { 
                    $match: { status: 'reconciled' } 
                },
                { 
                    $group: { 
                        _id: null, 
                        total: { $sum: '$amount' } 
                    } 
                }
            ]);
            
            const totalValue = totalValueAgg.length > 0 ? totalValueAgg[0].total : 0;
            
            // Calculate time saved - assume 3 minutes saved per reconciled invoice
            const minutesSaved = reconciledInvoices * 3;
            const hoursSaved = Math.floor(minutesSaved / 60);
            const remainingMinutes = minutesSaved % 60;
            
            // Calculate money saved - £1 per minute
            const moneySaved = minutesSaved;
            
            return {
                totalInvoices,
                pendingReview,
                reconciledInvoices,
                totalValue,
                minutesSaved,
                hoursSaved,
                remainingMinutes,
                moneySaved,
                timeSavedFormatted: `${hoursSaved}h ${remainingMinutes}m`,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('Error getting dashboard stats:', error);
            return {
                error: error.message
            };
        }
    }
}

// Export as singleton
module.exports = new ReconciliationService(); 