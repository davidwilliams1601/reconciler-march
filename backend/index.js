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
            'https://frontend-new-er0k.onrender.com',
            'https://frontend-new-er0k.onrender.com/',
            'https://frontend-new-er0k.onrender.com:443',
            'https://reconciler-march.onrender.com',
            'https://reconciler-march.onrender.com/',
            'https://reconciler-march.onrender.com:443',
            'https://*.onrender.com',  // Allow all subdomains on onrender.com
            'https://*.netlify.app',   // Include netlify domains (commonly used for frontend)
            'http://localhost:3000',   // Allow localhost development
            'http://localhost:4001'    // Allow localhost development
          ]
        : ['*'], // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600, // 10 minutes
    optionsSuccessStatus: 204
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Add preflight handling for all routes
app.options('*', (req, res) => {
    const origin = req.headers.origin;
    
    // In development, allow all origins
    if (process.env.NODE_ENV !== 'production' || 
        // In production, check if origin is in allowed list or matches wildcards
        corsOptions.origin.includes(origin) || 
        // Check for wildcard domains
        (origin && (
            corsOptions.origin.some(allowedOrigin => 
                allowedOrigin.includes('*') && 
                origin.endsWith(allowedOrigin.replace('*', ''))
            )
        ))) {
        
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
        res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Max-Age', corsOptions.maxAge.toString());
    }
    res.status(204).end();
});

// Add security headers middleware
app.use((req, res, next) => {
    // Debug request details
    console.log('\nRequest Details:');
    console.log('- Method:', req.method);
    console.log('- URL:', req.url);
    console.log('- Origin:', req.headers.origin);
    console.log('- User Agent:', req.headers['user-agent']);
    
    // Content Security Policy
    const csp = "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline' data:; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' data: blob: https: https://fonts.gstatic.com https://fonts.googleapis.com; " +
        "connect-src 'self' http://localhost:5001 https://frontend-new-er0k.onrender.com https://*.onrender.com https://*.netlify.app;";
    
    console.log('\nCSP Header:');
    console.log(csp);
    
    res.setHeader('Content-Security-Policy', csp);
    
    // Other security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Debug response headers
    console.log('\nResponse Headers:');
    console.log('- Content-Security-Policy:', res.getHeader('Content-Security-Policy'));
    console.log('- Access-Control-Allow-Origin:', res.getHeader('Access-Control-Allow-Origin'));
    console.log('- Access-Control-Allow-Methods:', res.getHeader('Access-Control-Allow-Methods'));
    console.log('- Access-Control-Allow-Headers:', res.getHeader('Access-Control-Allow-Headers'));
    
    next();
});

// Add CORS debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    console.log('Environment:', process.env.NODE_ENV);
    next();
});

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