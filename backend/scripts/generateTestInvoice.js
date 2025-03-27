const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function generateInvoiceImage() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set viewport to a reasonable size
    await page.setViewport({
        width: 800,
        height: 1200,
        deviceScaleFactor: 2 // Higher resolution
    });

    // Read the HTML file
    const htmlPath = path.resolve(__dirname, '../../test_invoice.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    
    // Set the content
    await page.setContent(html, {
        waitUntil: 'networkidle0'
    });

    // Generate the screenshot
    const outputPath = path.resolve(__dirname, '../test_invoice.png');
    await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: 'png'
    });

    await browser.close();
    console.log('Invoice image generated:', outputPath);
}

generateInvoiceImage().catch(console.error); 