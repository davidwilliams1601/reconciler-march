const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    googleVisionApiKey: {
        type: String,
        default: ''
    },
    dextApiKey: {
        type: String,
        default: ''
    },
    xeroConfig: {
        clientId: {
            type: String,
            default: ''
        },
        clientSecret: {
            type: String,
            default: ''
        },
        redirectUri: {
            type: String,
            default: ''
        },
        scope: {
            type: String,
            default: 'offline_access accounting.transactions accounting.settings'
        }
    }
}, { 
    timestamps: true,
    minimize: false 
});

// Update the updatedAt timestamp before saving
settingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Settings', settingsSchema); 