const vision = require('@google-cloud/vision');
const Settings = require('../models/Settings');
const fs = require('fs');
const path = require('path');

// Function to get client with current API key
async function getVisionClient() {
    try {
        const keyFilePath = path.resolve(__dirname, '../config/google-vision-key.json');
        console.log('Using service account key file from:', keyFilePath);
        
        if (!fs.existsSync(keyFilePath)) {
            console.error('Service account key file not found at:', keyFilePath);
            throw new Error('Service account key file not found');
        }
        
        const client = new vision.ImageAnnotatorClient({
            keyFilename: keyFilePath
        });
        
        // Test the client with a simple request
        console.log('Testing Vision API client...');
        await client.getProjectId();
        console.log('Vision API client test successful');
        
        return client;
    } catch (error) {
        console.error('Error getting Vision API client:', error);
        console.error('Error stack:', error.stack);
        throw error;
    }
}

async function extractInvoiceData(imageBuffer) {
    try {
        console.log('Getting Vision API client...');
        const client = await getVisionClient();
        console.log('Client created successfully');
        
        console.log('Starting text detection...');
        
        // Ensure we have valid image data
        if (!Buffer.isBuffer(imageBuffer)) {
            console.log('Converting base64 to buffer...');
            imageBuffer = Buffer.from(imageBuffer, 'base64');
        }

        // Create the request
        const request = {
            image: {
                content: imageBuffer
            },
            features: [
                {
                    type: 'DOCUMENT_TEXT_DETECTION'
                }
            ]
        };
        
        console.log('Sending request to Vision API...');
        const [result] = await client.annotateImage(request);
        console.log('Raw Vision API result:', JSON.stringify(result, null, 2));
        
        if (result.error) {
            console.error('Vision API error:', result.error);
            return {
                success: false,
                error: `Vision API error: ${result.error.message}`,
                rawText: null
            };
        }

        if (!result.fullTextAnnotation) {
            console.error('No text detected in document');
            return {
                success: false,
                error: 'No text could be detected in the document. Please ensure the image or PDF is clear and contains readable text.',
                rawText: null
            };
        }

        // Get all the detected text
        const fullText = result.fullTextAnnotation.text;
        console.log('Detected text:', fullText);

        console.log('Extracting invoice data...');
        // Extract invoice data using regex patterns
        const data = {
            invoiceNumber: extractInvoiceNumber(fullText) || 'UNKNOWN',
            amount: extractAmount(fullText) || 0,
            date: extractDate(fullText) || new Date().toISOString().split('T')[0],
            vendor: extractVendor(fullText) || 'Unknown Vendor'
        };
        console.log('Extracted data:', data);

        // Check confidence in extracted data
        const confidence = {
            invoiceNumber: data.invoiceNumber !== 'UNKNOWN',
            amount: data.amount !== 0,
            date: data.date !== new Date().toISOString().split('T')[0],
            vendor: data.vendor !== 'Unknown Vendor'
        };

        // Log extraction confidence
        console.log('Extraction confidence:', confidence);

        // Return success even with partial data, but include confidence indicators
        return {
            success: true,
            data,
            confidence,
            rawText: fullText,
            warning: !Object.values(confidence).every(Boolean) ? 
                'Some invoice data could not be automatically extracted and may require manual review.' : null
        };

    } catch (error) {
        console.error('Error processing image with Vision API:', error);
        console.error('Error stack:', error.stack);
        return {
            success: false,
            error: 'Failed to process the image. Please try again or contact support if the issue persists.',
            rawText: null
        };
    }
}

// Helper functions to extract specific data
function extractInvoiceNumber(text) {
    const patterns = [
        /Invoice\s*#\s*:\s*(INV[-\s]?\d{4}[-\s]?\d{3})/i,
        /Invoice\s*Number\s*:\s*(INV[-\s]?\d{4}[-\s]?\d{3})/i,
        /(INV[-\s]?\d{4}[-\s]?\d{3})/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return null;
}

function extractAmount(text) {
    const patterns = [
        /Total\s*:\s*£([\d,]+\.?\d*)/i,
        /Total Amount\s*:\s*£([\d,]+\.?\d*)/i,
        /Amount Due\s*:\s*£([\d,]+\.?\d*)/i,
        /£([\d,]+\.?\d*)/g
    ];
    
    let highestAmount = 0;
    for (const pattern of patterns) {
        if (pattern.global) {
            const matches = Array.from(text.matchAll(pattern));
            for (const match of matches) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(amount) && amount > highestAmount) {
                    highestAmount = amount;
                }
            }
        } else {
            const match = text.match(pattern);
            if (match && match[1]) {
                const amount = parseFloat(match[1].replace(/,/g, ''));
                if (!isNaN(amount) && amount > highestAmount) {
                    highestAmount = amount;
                }
            }
        }
    }
    return highestAmount || null;
}

function extractDate(text) {
    const patterns = [
        /Date\s*:\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
        /Date\s*:\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})/i
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const date = new Date(match[1]);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
    }
    return null;
}

function extractVendor(text) {
    const lines = text.split('\n');
    const excludeWords = ['INVOICE', 'Bill To:', 'Invoice', 'Date:', 'Payment Details:', 'Client'];
    
    for (const line of lines) {
        if (line.includes('Ltd') || line.includes('Limited') || line.includes('LLC') || line.includes('Inc')) {
            if (!excludeWords.some(word => line.includes(word))) {
                return line.trim();
            }
        }
    }
    return null;
}

module.exports = {
    extractInvoiceData
}; 