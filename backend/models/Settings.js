const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Organization Settings
    organization: {
        name: String,
        address: String,
        phone: String,
        email: String,
        website: String,
        taxNumber: String,
        defaultCurrency: {
            type: String,
            default: 'GBP'
        },
        defaultLanguage: {
            type: String,
            default: 'en'
        },
        timezone: {
            type: String,
            default: 'Europe/London'
        },
        notifications: {
            emailNotifications: {
                type: Boolean,
                default: true
            },
            dueDateReminders: {
                type: Boolean,
                default: true
            },
            statusChangeAlerts: {
                type: Boolean,
                default: true
            }
        }
    },
    // Email Processing Settings
    emailProcessing: {
        enabled: {
            type: Boolean,
            default: false
        },
        emailAddress: String,
        emailProvider: {
            type: String,
            enum: ['gmail', 'outlook', 'custom'],
            default: 'gmail'
        },
        smtpConfig: {
            host: String,
            port: Number,
            secure: Boolean,
            username: String,
            password: String
        },
        processingRules: {
            allowedSenders: [String],
            allowedFileTypes: [String],
            autoProcess: {
                type: Boolean,
                default: false
            },
            defaultCostCenter: String,
            defaultCategory: String
        }
    },
    // API Settings
    api: {
        xero: {
            clientId: String,
            clientSecret: String,
            tenantId: String,
            redirectUri: String
        },
        dext: {
            apiKey: String,
            clientId: String,
            clientSecret: String,
            environment: String,
            webhookUrl: String,
            webhookSecret: String
        },
        googleVision: {
            apiKey: String,
            projectId: String,
            keyFilePath: String,
            confidenceThreshold: {
                type: Number,
                default: 0.95
            }
        }
    },
    // Reconciliation Settings
    reconciliation: {
        autoReconcileEnabled: {
            type: Boolean,
            default: true
        },
        confidenceThreshold: {
            type: Number,
            default: 0.95
        },
        dateRange: {
            type: Number,
            default: 30
        },
        accountCodes: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema); 