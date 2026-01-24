/**
 * Middleware Index
 * Central export for all middleware modules
 */

const { validate, validateId, sanitizeMiddleware, validators, schemas } = require('./validation');
const { createRateLimiter, loginLimiter, apiLimiter, writeLimiter, importLimiter } = require('./rateLimiter');
const { csrfTokenMiddleware, csrfProtection, csrfTokenEndpoint, parseCookies, doubleSubmitCookie } = require('./csrf');
const { auditMiddleware, logAction, logAuth, queryAuditLogs } = require('./auditLog');

module.exports = {
    // Validation
    validate,
    validateId,
    sanitizeMiddleware,
    validators,
    schemas,

    // Rate Limiting
    createRateLimiter,
    loginLimiter,
    apiLimiter,
    writeLimiter,
    importLimiter,

    // CSRF Protection
    csrfTokenMiddleware,
    csrfProtection,
    csrfTokenEndpoint,
    parseCookies,
    doubleSubmitCookie,

    // Audit Logging
    auditMiddleware,
    logAction,
    logAuth,
    queryAuditLogs
};
