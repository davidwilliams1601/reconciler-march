const express = require('express');
const router = express.Router();

// TODO: Add auth controller imports and route handlers
router.get('/', (req, res) => {
    res.json({ message: 'Auth routes working' });
});

// Simple development credentials
const DEV_CREDENTIALS = {
    email: 'admin@example.com',
    password: 'admin123'
};

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password) {
        // In a real app, this would be a JWT token
        const token = 'dev-token-' + Date.now();
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

module.exports = router; 