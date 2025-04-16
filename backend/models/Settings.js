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
    // Xero Configuration
    xeroConfig: {
        clientId: String,
        clientSecret: String,
        tenantId: String,
        tenantName: String,
        redirectUri: {
            type: String,
            default: process.env.NODE_ENV === 'production'
                ? 'https://reconciler-march.onrender.com/api/xero/callback'
                : 'http://localhost:5001/api/xero/callback'
        },
        accessToken: String,
        refreshToken: String,
        tokenExpiry: Date,
        lastSync: Date,
        isConnected: {
            type: Boolean,
            default: false
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