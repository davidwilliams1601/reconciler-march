const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const xeroRoutes = require('./routes/xeroRoutes');

// Load environment variables
dotenv.config();

// Debug environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

const app = express();

// Basic middleware
app.use(express.json());

// Configure CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [
            'https://reconciler-frontend.onrender.com',
            'https://reconciler-backend.onrender.com',
            'https://reconciler-frontend.onrender.com/',
            'https://reconciler-backend.onrender.com/'
          ]
        : ['http://localhost:3000', 'http://localhost:4001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    optionsSuccessStatus: 200
};

// Add CORS debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Environment:', process.env.NODE_ENV);
    next();
});

app.use(cors(corsOptions));

// Serve static files first (before API routes)
if (process.env.NODE_ENV === 'production') {
    // Serve static files from the React app
    app.use(express.static(path.join(__dirname, '../frontend/build'), {
        maxAge: '1y',
        etag: true
    }));
}

// API Routes
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/xero', xeroRoutes);

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Handle all other routes
if (process.env.NODE_ENV === 'production') {
    app.get('*', function(req, res) {
        // Don't handle API routes here
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        
        console.log('Serving index.html for path:', req.path);
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
} else {
    app.use(express.static(path.join(__dirname, '../frontend/public')));
    app.get('*', function(req, res) {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4001;

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB Connected Successfully');
    
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    server.on('error', (error) => {
        if (error.syscall !== 'listen') {
            throw error;
        }

        switch (error.code) {
            case 'EACCES':
                console.error(`Port ${PORT} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(`Port ${PORT} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    });
})
.catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
}); 