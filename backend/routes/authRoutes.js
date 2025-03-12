const express = require('express');
const router = express.Router();

// TODO: Add auth controller imports and route handlers
router.get('/', (req, res) => {
    res.json({ message: 'Auth routes working' });
});

module.exports = router; 