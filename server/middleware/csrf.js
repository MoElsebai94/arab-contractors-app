/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const crypto = require('crypto');

// Store for CSRF tokens (in production, use Redis or database)
const tokenStore = new Map();

// Clean up expired tokens every 30 minutes
setInterval(() => {
    const now = Date.now();
    for (const [token, data] of tokenStore.entries()) {
        if (now > data.expiresAt) {
            tokenStore.delete(token);
        }
    }
}, 30 * 60 * 1000);

// Token configuration
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a secure CSRF token
 */
const generateToken = () => {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
};

/**
 * Create and store a new CSRF token
 */
const createToken = (sessionId) => {
    const token = generateToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY;

    tokenStore.set(token, {
        sessionId,
        expiresAt,
        createdAt: Date.now()
    });

    return token;
};

/**
 * Validate a CSRF token
 */
const validateToken = (token, sessionId) => {
    if (!token) return false;

    const tokenData = tokenStore.get(token);
    if (!tokenData) return false;

    // Check expiry
    if (Date.now() > tokenData.expiresAt) {
        tokenStore.delete(token);
        return false;
    }

    // Check session match (if session tracking is enabled)
    if (sessionId && tokenData.sessionId !== sessionId) {
        return false;
    }

    return true;
};

/**
 * Middleware to generate CSRF token
 * Adds token to response headers and makes it available to the client
 */
const csrfTokenMiddleware = (req, res, next) => {
    // Get or create session ID from JWT or generate one
    const sessionId = req.user?.sessionId || req.headers['x-session-id'] || 'anonymous';

    // Generate new token
    const token = createToken(sessionId);

    // Set token in response header
    res.setHeader('X-CSRF-Token', token);

    // Also set as cookie for convenience
    res.setHeader('Set-Cookie', `XSRF-TOKEN=${token}; Path=/; SameSite=Strict; Max-Age=${TOKEN_EXPIRY / 1000}`);

    next();
};

/**
 * Middleware to verify CSRF token
 * Checks token from header or cookie
 */
const csrfProtection = (options = {}) => {
    const {
        ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
        getToken = (req) => {
            // Check header first, then cookie, then body
            return req.headers['x-csrf-token'] ||
                   req.headers['x-xsrf-token'] ||
                   req.cookies?.['XSRF-TOKEN'] ||
                   req.body?._csrf;
        },
        onError = null
    } = options;

    return (req, res, next) => {
        // Skip safe methods
        if (ignoreMethods.includes(req.method)) {
            return next();
        }

        // Get session ID
        const sessionId = req.user?.sessionId || req.headers['x-session-id'] || 'anonymous';

        // Get token from request
        const token = getToken(req);

        // Validate token
        if (!validateToken(token, sessionId)) {
            console.warn(`CSRF validation failed for ${req.method} ${req.path}`);

            if (onError) {
                return onError(req, res, next);
            }

            return res.status(403).json({
                error: 'CSRF token validation failed',
                code: 'INVALID_CSRF_TOKEN'
            });
        }

        // Token is valid, delete it (one-time use)
        tokenStore.delete(token);

        next();
    };
};

/**
 * Simple cookie parser (if not using cookie-parser package)
 */
const parseCookies = (req, res, next) => {
    const cookieHeader = req.headers.cookie;
    req.cookies = {};

    if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
            const [name, value] = cookie.split('=').map(c => c.trim());
            if (name && value) {
                req.cookies[name] = decodeURIComponent(value);
            }
        });
    }

    next();
};

/**
 * Double-submit cookie pattern (simpler alternative)
 * Compares header token with cookie token
 */
const doubleSubmitCookie = (options = {}) => {
    const {
        ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
        cookieName = 'XSRF-TOKEN',
        headerName = 'x-xsrf-token'
    } = options;

    return (req, res, next) => {
        // Skip safe methods
        if (ignoreMethods.includes(req.method)) {
            return next();
        }

        const cookieToken = req.cookies?.[cookieName];
        const headerToken = req.headers[headerName.toLowerCase()];

        // Both must exist and match
        if (!cookieToken || !headerToken || cookieToken !== headerToken) {
            console.warn(`CSRF double-submit validation failed for ${req.method} ${req.path}`);
            return res.status(403).json({
                error: 'CSRF token validation failed',
                code: 'INVALID_CSRF_TOKEN'
            });
        }

        next();
    };
};

// Endpoint to get a new CSRF token
const csrfTokenEndpoint = (req, res) => {
    const sessionId = req.user?.sessionId || req.headers['x-session-id'] || 'anonymous';
    const token = createToken(sessionId);

    res.setHeader('Set-Cookie', `XSRF-TOKEN=${token}; Path=/; SameSite=Strict; Max-Age=${TOKEN_EXPIRY / 1000}`);

    res.json({ csrfToken: token });
};

module.exports = {
    csrfTokenMiddleware,
    csrfProtection,
    csrfTokenEndpoint,
    parseCookies,
    doubleSubmitCookie,
    createToken,
    validateToken
};
