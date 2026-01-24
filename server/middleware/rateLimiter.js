/**
 * Rate Limiting Middleware
 * Protects against brute force attacks and abuse
 */

// In-memory store for rate limiting (for production, use Redis)
const requestCounts = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
        if (now - data.windowStart > data.windowMs * 2) {
            requestCounts.delete(key);
        }
    }
}, 5 * 60 * 1000);

/**
 * Create a rate limiter middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.message - Error message when limit exceeded
 * @param {Function} options.keyGenerator - Function to generate unique key for each client
 * @param {boolean} options.skipSuccessfulRequests - Don't count successful requests
 * @param {boolean} options.skipFailedRequests - Don't count failed requests
 */
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60 * 1000, // 1 minute default
        max = 100, // 100 requests per window default
        message = 'Too many requests, please try again later',
        keyGenerator = (req) => req.ip || req.connection.remoteAddress || 'unknown',
        skipSuccessfulRequests = false,
        skipFailedRequests = false,
        onLimitReached = null
    } = options;

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        let clientData = requestCounts.get(key);

        // Initialize or reset window
        if (!clientData || now - clientData.windowStart > windowMs) {
            clientData = {
                count: 0,
                windowStart: now,
                windowMs
            };
            requestCounts.set(key, clientData);
        }

        // Check if limit exceeded
        if (clientData.count >= max) {
            const retryAfter = Math.ceil((clientData.windowStart + windowMs - now) / 1000);

            // Call custom handler if provided
            if (onLimitReached) {
                onLimitReached(req, res);
            }

            res.setHeader('Retry-After', retryAfter);
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', 0);
            res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + windowMs).toISOString());

            return res.status(429).json({
                error: message,
                retryAfter
            });
        }

        // Increment count (handle skip logic after response)
        if (!skipSuccessfulRequests && !skipFailedRequests) {
            clientData.count++;
        } else {
            // Track response status and increment accordingly
            const originalEnd = res.end;
            res.end = function(...args) {
                const shouldCount =
                    (!skipSuccessfulRequests || res.statusCode >= 400) &&
                    (!skipFailedRequests || res.statusCode < 400);

                if (shouldCount) {
                    clientData.count++;
                }

                originalEnd.apply(res, args);
            };
        }

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - clientData.count - 1));
        res.setHeader('X-RateLimit-Reset', new Date(clientData.windowStart + windowMs).toISOString());

        next();
    };
};

// Pre-configured rate limiters for common use cases

// Strict limiter for login attempts (5 attempts per 15 minutes)
const loginLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many login attempts, please try again after 15 minutes',
    skipSuccessfulRequests: true, // Only count failed attempts
    onLimitReached: (req) => {
        console.warn(`Rate limit exceeded for login from IP: ${req.ip}`);
    }
});

// General API limiter (100 requests per minute)
const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: 'Too many requests, please slow down'
});

// Strict limiter for write operations (30 per minute)
const writeLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Too many write operations, please slow down'
});

// Import operations (5 per minute)
const importLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many import operations, please wait'
});

module.exports = {
    createRateLimiter,
    loginLimiter,
    apiLimiter,
    writeLimiter,
    importLimiter
};
