const natural = require('natural');
const Invoice = require('../models/Invoice');

class CostCenterService {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
        this.costCenters = [
            { code: 'IT', name: 'Information Technology', keywords: ['software', 'hardware', 'cloud', 'infrastructure', 'development', 'support'] },
            { code: 'MKT', name: 'Marketing', keywords: ['advertising', 'promotion', 'branding', 'social media', 'campaign'] },
            { code: 'HR', name: 'Human Resources', keywords: ['recruitment', 'training', 'benefits', 'payroll', 'staff'] },
            { code: 'OPS', name: 'Operations', keywords: ['facilities', 'maintenance', 'utilities', 'office supplies'] },
            { code: 'SALES', name: 'Sales', keywords: ['sales', 'commission', 'client entertainment', 'business development'] },
            { code: 'LEGAL', name: 'Legal', keywords: ['legal', 'lawyer', 'compliance', 'contract'] },
            { code: 'FIN', name: 'Finance', keywords: ['accounting', 'audit', 'tax', 'banking'] }
        ];
    }

    async predictCostCenter(invoice) {
        try {
            // Get text content for analysis
            const textContent = this.getTextContent(invoice);
            
            // Extract keywords from the text
            const keywords = this.extractKeywords(textContent);
            
            // Find matching cost center
            const match = this.findBestMatch(keywords);
            
            // Calculate confidence based on historical data
            const confidence = await this.calculateConfidence(match, invoice);
            
            return {
                success: true,
                costCenter: {
                    code: match.code,
                    name: match.name,
                    confidence: confidence,
                    predictedAt: new Date(),
                    manuallySet: false
                },
                categorization: {
                    category: match.name,
                    subcategory: this.determineSubcategory(match, keywords),
                    confidence: confidence,
                    predictedAt: new Date(),
                    manuallySet: false,
                    keywords: keywords
                }
            };
        } catch (error) {
            console.error('Error predicting cost center:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getTextContent(invoice) {
        let content = '';
        
        // Add vendor name
        content += invoice.vendor + ' ';
        
        // Add description if available
        if (invoice.description) {
            content += invoice.description + ' ';
        }
        
        // Add OCR text if available
        if (invoice.ocrResults?.rawText) {
            content += invoice.ocrResults.rawText + ' ';
        }
        
        return content.toLowerCase();
    }

    extractKeywords(text) {
        const tokens = this.tokenizer.tokenize(text);
        const keywords = new Set();
        
        // Add tokens that match cost center keywords
        tokens.forEach(token => {
            this.costCenters.forEach(center => {
                if (center.keywords.includes(token)) {
                    keywords.add(token);
                }
            });
        });
        
        return Array.from(keywords);
    }

    findBestMatch(keywords) {
        let bestMatch = this.costCenters[0];
        let maxMatches = 0;
        
        this.costCenters.forEach(center => {
            const matches = keywords.filter(keyword => 
                center.keywords.includes(keyword)
            ).length;
            
            if (matches > maxMatches) {
                maxMatches = matches;
                bestMatch = center;
            }
        });
        
        return bestMatch;
    }

    determineSubcategory(costCenter, keywords) {
        // This is a simple implementation - you might want to enhance this
        // based on your specific needs and subcategories
        return keywords.join(', ');
    }

    async calculateConfidence(match, invoice) {
        try {
            // Get historical invoices for the same vendor
            const historicalInvoices = await Invoice.find({
                vendor: invoice.vendor,
                'costCenter.code': match.code
            });

            if (historicalInvoices.length === 0) {
                // If no historical data, base confidence on keyword matches
                return Math.min(0.8, match.keywords.length * 0.2);
            }

            // Calculate confidence based on historical accuracy
            const totalHistorical = historicalInvoices.length;
            const manuallySet = historicalInvoices.filter(inv => inv.costCenter.manuallySet).length;
            
            // If we have manually set cost centers, use their ratio
            if (manuallySet > 0) {
                return Math.min(0.95, 0.5 + (manuallySet / totalHistorical) * 0.45);
            }
            
            // Otherwise, use a base confidence with a small boost for historical presence
            return Math.min(0.85, 0.6 + (totalHistorical * 0.05));
        } catch (error) {
            console.error('Error calculating confidence:', error);
            return 0.6; // Default confidence
        }
    }

    async trainModel(invoiceId, correctCostCenter) {
        try {
            const invoice = await Invoice.findById(invoiceId);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // Update the invoice with the correct cost center
            invoice.costCenter = {
                code: correctCostCenter.code,
                name: correctCostCenter.name,
                confidence: 1,
                predictedAt: new Date(),
                manuallySet: true
            };

            await invoice.save();

            return {
                success: true,
                message: 'Model trained with new data'
            };
        } catch (error) {
            console.error('Error training model:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new CostCenterService(); 