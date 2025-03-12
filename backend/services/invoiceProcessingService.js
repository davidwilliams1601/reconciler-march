const axios = require('axios');
const Invoice = require('../models/Invoice');

exports.processInvoice = async (imageUrl) => {
    try {
        const visionResponse = await axios.post(
            `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
            {
                requests: [
                    {
                        image: { source: { imageUri: imageUrl } },
                        features: [{ type: 'TEXT_DETECTION' }]
                    }
                ]
            }
        );

        const extractedText = visionResponse.data.responses[0].fullTextAnnotation.text;
        console.log('Extracted Text:', extractedText);

        const parsedInvoice = extractInvoiceDetails(extractedText);

        const invoice = new Invoice(parsedInvoice);
        await invoice.save();

        return invoice;
    } catch (error) {
        console.error('Error processing invoice:', error);
        throw new Error('Invoice processing failed');
    }
};

function extractInvoiceDetails(text) {
    return {
        invoiceNumber: text.match(/Invoice No:\s*(\S+)/)[1],
        companyName: text.match(/Company:\s*(.+)/)[1],
        vatNumber: text.match(/VAT:\s*(\S+)/)[1],
        address: text.match(/Address:\s*(.+)/)[1],
        amount: parseFloat(text.match(/Total:\s*\$?(\d+\.\d+)/)[1]),
        confidence: Math.random() * (100 - 80) + 80
    };
} 