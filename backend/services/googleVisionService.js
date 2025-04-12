const { ImageAnnotatorClient } = require('@google-cloud/vision');
const Settings = require('../models/Settings');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * GoogleVisionService - Handles all interactions with Google Vision API
 * Provides document OCR and data extraction functionality
 */
class GoogleVisionService {
    constructor() {
        this._client = null;
        this._settings = null;
        this.MAX_RETRIES = 2;
    }

    /**
     * Initialize service with settings
     * Should be called when app starts or when settings change
     */
    async initialize() {
        try {
            this._settings = await Settings.findOne();
            if (!this._settings?.api?.googleVision) {
                console.warn('Google Vision configuration not found');
                return false;
            }

            // Set up the client based on available credentials
            if (this._settings.api.googleVision.keyFilePath) {
                // Using service account JSON file
                this._client = new ImageAnnotatorClient({
                    keyFilename: this._settings.api.googleVision.keyFilePath
                });
                console.log('Google Vision service initialized with key file');
            } else if (this._settings.api.googleVision.apiKey) {
                // Using API key
                this._client = new ImageAnnotatorClient({
                    credentials: {
                        client_email: undefined,
                        private_key: undefined
                    },
                    projectId: this._settings.api.googleVision.projectId,
                    apiEndpoint: 'vision.googleapis.com',
                });
                // Set the API key as an environment variable
                process.env.GOOGLE_API_KEY = this._settings.api.googleVision.apiKey;
                console.log('Google Vision service initialized with API key');
            } else {
                console.warn('No Google Vision credentials found');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error initializing Google Vision service:', error);
            return false;
        }
    }

    /**
     * Get current settings, refreshing from DB if necessary
     */
    async getSettings() {
        if (!this._settings) {
            await this.initialize();
        }
        return this._settings?.api?.googleVision;
    }

    /**
     * Ensure the client is initialized
     */
    async ensureClient() {
        if (!this._client) {
            const initialized = await this.initialize();
            if (!initialized) {
                throw new Error('Google Vision client could not be initialized');
            }
        }
        return this._client;
    }

    /**
     * Process a document image using OCR
     * @param {string|Buffer} imageSource - Path to image file or Buffer containing image data
     * @param {Object} options - Processing options
     * @returns {Object} Processed document data
     */
    async processDocument(imageSource, options = {}) {
        try {
            const client = await this.ensureClient();
            
            // Handle both paths and buffers
            let request;
            if (typeof imageSource === 'string') {
                // It's a file path
                request = {
                    image: { source: { filename: imageSource } },
                };
            } else if (Buffer.isBuffer(imageSource)) {
                // It's a buffer
                request = {
                    image: { content: imageSource.toString('base64') },
                };
            } else {
                throw new Error('Invalid image source: must be a file path or Buffer');
            }
            
            // Set up the features we want to detect
            request.features = [
                { type: 'DOCUMENT_TEXT_DETECTION' },
                { type: 'LOGO_DETECTION' }
            ];
            
            // Add context for better results
            request.imageContext = {
                languageHints: ['en-GB', 'en-US'],
            };
            
            // Make the request
            const [response] = await client.annotateImage(request);
            
            if (response.error) {
                throw new Error(`Vision API error: ${response.error.message}`);
            }
            
            // Extract and structure the data
            return this.extractDocumentData(response, options);
        } catch (error) {
            console.error('Error processing document with Google Vision:', error);
            throw error;
        }
    }

    /**
     * Extract structured data from Google Vision response
     */
    extractDocumentData(response, options = {}) {
        try {
            const result = {
                text: response.fullTextAnnotation ? response.fullTextAnnotation.text : '',
                confidence: response.fullTextAnnotation ? response.fullTextAnnotation.pages[0].confidence : 0,
                entities: {
                    vendor: null,
                    date: null,
                    dueDate: null,
                    total: null,
                    invoiceNumber: null,
                    items: []
                },
                logos: [],
                raw: options.includeRaw ? response : undefined
            };
            
            // Extract logos
            if (response.logoAnnotations && response.logoAnnotations.length > 0) {
                result.logos = response.logoAnnotations.map(logo => ({
                    description: logo.description,
                    confidence: logo.score
                }));
            }
            
            // Extract text-based entities
            if (response.fullTextAnnotation) {
                const text = response.fullTextAnnotation.text;
                
                // Extract invoice number - look for patterns like "Invoice #", "Invoice No:", etc.
                const invoiceNumberPatterns = [
                    /invoice\s*(?:#|no|number|num)[:\s]*([a-z0-9\-]+)/i,
                    /inv\s*(?:#|no|number|num)[:\s]*([a-z0-9\-]+)/i,
                    /reference\s*(?:number)?[:\s]*([a-z0-9\-]+)/i
                ];
                
                for (const pattern of invoiceNumberPatterns) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        result.entities.invoiceNumber = match[1].trim();
                        break;
                    }
                }
                
                // Extract date - look for dates in various formats
                const datePatterns = [
                    /invoice\s*date[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
                    /date[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
                    /dated[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
                    // Add more date patterns as needed
                ];
                
                for (const pattern of datePatterns) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        result.entities.date = match[1].trim();
                        break;
                    }
                }
                
                // Extract total amount - look for patterns like "Total:", "Amount Due:", etc.
                const totalPatterns = [
                    /total\s*(?:amount)?[:\s]*(?:[$£€])?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
                    /amount\s*due[:\s]*(?:[$£€])?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
                    /grand\s*total[:\s]*(?:[$£€])?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i,
                    // Add more total patterns as needed
                ];
                
                for (const pattern of totalPatterns) {
                    const match = text.match(pattern);
                    if (match && match[1]) {
                        result.entities.total = match[1].trim().replace(/,/g, '');
                        break;
                    }
                }
                
                // Extract vendor name
                // This is more complex - might be at the top of the document or with a "From:" prefix
                // For simplicity, we'll use the first few lines of text
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                if (lines.length > 0) {
                    result.entities.vendor = lines[0].trim();
                }
            }
            
            return result;
        } catch (error) {
            console.error('Error extracting document data:', error);
            return {
                text: response.fullTextAnnotation ? response.fullTextAnnotation.text : '',
                error: error.message
            };
        }
    }

    /**
     * Test the Google Vision connection with current settings
     */
    async testConnection() {
        try {
            await this.getSettings();
            
            // If no credentials, return false
            if ((!this._settings?.api?.googleVision?.apiKey && 
                !this._settings?.api?.googleVision?.keyFilePath) || 
                !this._settings?.api?.googleVision?.projectId) {
                return { 
                    success: false, 
                    message: 'Missing required Google Vision configuration' 
                };
            }
            
            // Try to initialize the client
            if (!this._client) {
                const initialized = await this.initialize();
                if (!initialized) {
                    return { 
                        success: false, 
                        message: 'Failed to initialize Google Vision client' 
                    };
                }
            }
            
            // Create a simple test image
            const tempDir = os.tmpdir();
            const testImagePath = path.join(tempDir, 'vision-test.png');
            
            // Create a simple 1x1 pixel PNG with minimal data
            const minimalPngBuffer = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 
                0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 
                0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00, 
                0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00, 
                0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
            ]);
            
            fs.writeFileSync(testImagePath, minimalPngBuffer);
            
            try {
                // Make a simple image detection request
                const [result] = await this._client.labelDetection(testImagePath);
                
                // Clean up the test file
                fs.unlinkSync(testImagePath);
                
                return { 
                    success: true, 
                    message: 'Successfully connected to Google Vision API'
                };
            } catch (error) {
                // Clean up the test file
                if (fs.existsSync(testImagePath)) {
                    fs.unlinkSync(testImagePath);
                }
                
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
module.exports = new GoogleVisionService(); 