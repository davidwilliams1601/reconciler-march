const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const xeroRoutes = require('./routes/xeroRoutes');

// Load environment variables based on environment
if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
} else {
    dotenv.config();
}

// Debug environment variables
console.log('Environment Variables:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'exists' : 'missing');
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

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

// Add security headers middleware
app.use((req, res, next) => {
    // Content Security Policy
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' data:; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' data:; " +
        "connect-src 'self' http://localhost:5001 https://reconciler-backend.onrender.com;"
    );
    
    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Add CORS debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Environment:', process.env.NODE_ENV);
    next();
});

app.use(cors(corsOptions));

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

// Root route for health check
app.get('/', (req, res) => {
    res.json({ 
        status: 'healthy',
        message: 'Reconciler API is running',
        version: '1.0.0'
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

// Handle all other routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: 'Not Found',
        note: 'This is an API server. For the frontend application, please visit https://reconciler-frontend.onrender.com'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!', error: err.message });
});

// Connect to MongoDB and start server
const PORT = 5001; // Force port 5001

// Enhanced error handling for MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4 // Use IPv4, skip trying IPv6
})
.then(() => {
    console.log('MongoDB Connected Successfully');
    console.log('Connection Details:');
    console.log('- Database:', mongoose.connection.name);
    console.log('- Host:', mongoose.connection.host);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV}`);
        console.log(`CORS origins:`, corsOptions.origin);
    });

    server.on('error', (error) => {
        console.error('Server error:', error);
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

    // Handle process termination
    process.on('SIGTERM', async () => {
        console.log('SIGTERM received. Shutting down gracefully...');
        server.close(async () => {
            console.log('Server closed');
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
            process.exit(0);
        });
    });
})
.catch(err => {
    console.error('MongoDB connection error details:');
    console.error('- Message:', err.message);
    console.error('- Code:', err.code);
    console.error('- Stack:', err.stack);
    if (process.env.MONGODB_URI) {
        // Log a sanitized version of the connection string (hiding credentials)
        const sanitizedUri = process.env.MONGODB_URI.replace(
            /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/,
            '$1[USERNAME]:[PASSWORD]@'
        );
        console.error('- Connection String (sanitized):', sanitizedUri);
    }
    console.error('- Full Error Object:', JSON.stringify(err, null, 2));
    process.exit(1);
}); 