const vision = require('@google-cloud/vision');
const Settings = require('../models/Settings');

// Function to get client with current API key
async function getVisionClient() {
    try {
        const settings = await Settings.findOne();
        if (!settings || !settings.googleVisionApiKey) {
            throw new Error('Google Vision API key not found in settings');
        }
        
        return new vision.ImageAnnotatorClient({
            credentials: {
                client_email: 'invoice-processor@your-project.iam.gserviceaccount.com',
                private_key: settings.googleVisionApiKey
            }
        });
    } catch (error) {
        console.error('Error getting Vision API client:', error);
        throw error;
    }
}

async function extractInvoiceData(imageBuffer) {
    try {
        // Get client with current API key
        const client = await getVisionClient();
        
        // Perform text detection on the image
        const [result] = await client.textDetection(imageBuffer);
        const detections = result.textAnnotations;
        
        if (!detections || detections.length === 0) {
            throw new Error('No text detected in image');
        }

        // Get all the detected text
        const fullText = detections[0].description;
        console.log('Detected text:', fullText);

        // Extract invoice data using regex patterns
        const data = {
            invoiceNumber: extractInvoiceNumber(fullText),
            amount: extractAmount(fullText),
            date: extractDate(fullText),
            vendor: extractVendor(fullText)
        };

        return {
            success: true,
            data,
            rawText: fullText
        };
    } catch (error) {
        console.error('Error processing image with Vision API:', error);
        return {
            success: false,
            error: error.message,
            rawText: null
        };
    }
}

// Helper functions to extract specific data
function extractInvoiceNumber(text) {
    // Common invoice number patterns
    const patterns = [
        /Invoice\s*#?\s*([A-Z0-9-]+)/i,
        /Invoice\s*Number\s*:\s*([A-Z0-9-]+)/i,
        /INV\s*#?\s*([A-Z0-9-]+)/i
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
    // Match amounts in various formats (£1,234.56 or 1,234.56 or £1234.56)
    const patterns = [
        /Total\s*:?\s*£?\s*([\d,]+\.?\d*)/i,
        /Amount\s*:?\s*£?\s*([\d,]+\.?\d*)/i,
        /Sum\s*:?\s*£?\s*([\d,]+\.?\d*)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            // Remove commas and convert to number
            return parseFloat(match[1].replace(/,/g, ''));
        }
    }
    return null;
}

function extractDate(text) {
    // Match common date formats
    const datePattern = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/;
    const match = text.match(datePattern);
    if (match && match[1]) {
        return match[1];
    }
    return null;
}

function extractVendor(text) {
    // Look for common vendor indicators
    const patterns = [
        /From:\s*([^\n]+)/i,
        /Vendor:\s*([^\n]+)/i,
        /Supplier:\s*([^\n]+)/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    return null;
}

module.exports = {
    extractInvoiceData
}; 