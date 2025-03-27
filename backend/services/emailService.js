const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');
const Invoice = require('../models/Invoice');
const path = require('path');
const fs = require('fs').promises;
const { processInvoiceFile } = require('./invoiceProcessingService');

class EmailService {
    constructor() {
        this.transporter = null;
        this.settings = null;
    }

    async initialize() {
        try {
            this.settings = await Settings.findOne();
            if (!this.settings?.emailProcessing?.enabled) {
                console.log('Email processing is not enabled');
                return;
            }

            const { smtpConfig } = this.settings.emailProcessing;
            this.transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.secure,
                auth: {
                    user: smtpConfig.username,
                    pass: smtpConfig.password
                }
            });

            // Start listening for emails
            this.startListening();
        } catch (error) {
            console.error('Error initializing email service:', error);
        }
    }

    async startListening() {
        if (!this.transporter) {
            console.error('Email transporter not initialized');
            return;
        }

        // Set up email listening
        this.transporter.on('mail', async (mail) => {
            try {
                await this.processEmail(mail);
            } catch (error) {
                console.error('Error processing email:', error);
            }
        });
    }

    async processEmail(mail) {
        const { from, subject, attachments } = mail;
        const { processingRules } = this.settings.emailProcessing;

        // Check if sender is allowed
        if (processingRules.allowedSenders.length > 0 && 
            !processingRules.allowedSenders.includes(from)) {
            console.log(`Rejected email from unauthorized sender: ${from}`);
            return;
        }

        // Process attachments
        for (const attachment of attachments) {
            try {
                const fileType = path.extname(attachment.filename).toLowerCase();
                
                // Check if file type is allowed
                if (processingRules.allowedFileTypes.length > 0 && 
                    !processingRules.allowedFileTypes.includes(fileType)) {
                    console.log(`Rejected file type: ${fileType}`);
                    continue;
                }

                // Save attachment
                const uploadDir = 'uploads/invoices';
                await fs.mkdir(uploadDir, { recursive: true });
                
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const fileName = uniqueSuffix + fileType;
                const filePath = path.join(uploadDir, fileName);
                
                await fs.writeFile(filePath, attachment.content);

                // Create invoice record
                const invoice = new Invoice({
                    file: {
                        originalName: attachment.filename,
                        path: filePath,
                        mimeType: attachment.contentType,
                        size: attachment.size
                    },
                    status: processingRules.autoProcess ? 'pending' : 'review',
                    costCenter: processingRules.defaultCostCenter ? {
                        code: processingRules.defaultCostCenter
                    } : undefined,
                    categorization: processingRules.defaultCategory ? {
                        category: processingRules.defaultCategory
                    } : undefined
                });

                await invoice.save();

                // Process the invoice if auto-processing is enabled
                if (processingRules.autoProcess) {
                    await processInvoiceFile(invoice);
                }

                console.log(`Successfully processed invoice from email: ${invoice._id}`);
            } catch (error) {
                console.error('Error processing attachment:', error);
            }
        }
    }

    async sendEmail(to, subject, text, html) {
        if (!this.transporter) {
            throw new Error('Email transporter not initialized');
        }

        const mailOptions = {
            from: this.settings.emailProcessing.emailAddress,
            to,
            subject,
            text,
            html
        };

        return this.transporter.sendMail(mailOptions);
    }
}

module.exports = new EmailService(); 