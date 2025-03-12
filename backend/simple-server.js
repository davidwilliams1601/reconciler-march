const express = require('express');
const app = express();

// Basic test route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint working!' });
});

// Start server
const PORT = 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Test server running at http://localhost:${PORT}`);
}); 