/**
 * Authentication Routes
 * Handles login and authentication-related endpoints
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { validate, loginLimiter, logAuth } = require('../middleware');

const router = express.Router();

// Login Route - with rate limiting and validation
router.post('/login', loginLimiter, validate('login'), (req, res) => {
    const { passcode } = req.body;
    // Normalized comparison
    const normalizedInput = passcode ? passcode.toString().trim() : '';
    const normalizedTarget = process.env.ADMIN_PASSCODE ? process.env.ADMIN_PASSCODE.toString().trim() : '';

    if (normalizedInput === normalizedTarget) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        logAuth(req, 'LOGIN', true, { role: 'admin' });
        res.json({ success: true, token });
    } else {
        logAuth(req, 'LOGIN', false, { reason: 'Invalid passcode' });
        res.status(401).json({ success: false, error: 'Invalid passcode' });
    }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false });
    }

    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.json({ valid: true });
    } catch (err) {
        res.status(401).json({ valid: false });
    }
});

module.exports = router;
