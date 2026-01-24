/**
 * Audit Logging Middleware
 * Tracks all changes made to the system for compliance and security
 */

const fs = require('fs');
const path = require('path');

// Audit log configuration
const config = {
    enabled: true,
    logToFile: true,
    logToConsole: process.env.NODE_ENV !== 'production',
    logDir: path.join(__dirname, '../logs'),
    maxFileSize: 10 * 1024 * 1024, // 10MB
    retentionDays: 90
};

// Ensure log directory exists
if (config.logToFile && !fs.existsSync(config.logDir)) {
    fs.mkdirSync(config.logDir, { recursive: true });
}

// Get current log file path
const getLogFilePath = () => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(config.logDir, `audit-${date}.log`);
};

// Sensitive fields to mask in logs
const sensitiveFields = ['password', 'passcode', 'token', 'secret', 'key', 'authorization'];

// Mask sensitive data in objects
const maskSensitiveData = (obj, depth = 0) => {
    if (depth > 5) return '[MAX_DEPTH]';
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => maskSensitiveData(item, depth + 1));
    }

    const masked = {};
    for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
            masked[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
            masked[key] = maskSensitiveData(value, depth + 1);
        } else {
            masked[key] = value;
        }
    }
    return masked;
};

// Truncate large objects for logging
const truncateForLog = (obj, maxLength = 1000) => {
    const str = JSON.stringify(obj);
    if (str.length > maxLength) {
        return str.substring(0, maxLength) + '...[truncated]';
    }
    return str;
};

/**
 * Create an audit log entry
 */
const createAuditEntry = (req, res, options = {}) => {
    const {
        action,
        resource,
        resourceId,
        details,
        status = 'success',
        errorMessage
    } = options;

    const entry = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId || generateRequestId(),
        action: action || `${req.method} ${req.path}`,
        resource: resource || extractResource(req.path),
        resourceId: resourceId || req.params?.id,
        user: {
            role: req.user?.role || 'anonymous',
            ip: req.ip || req.connection?.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent']?.substring(0, 200)
        },
        request: {
            method: req.method,
            path: req.path,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            body: req.method !== 'GET' ? maskSensitiveData(req.body) : undefined
        },
        response: {
            statusCode: res.statusCode,
            status
        },
        details: details ? maskSensitiveData(details) : undefined,
        error: errorMessage,
        duration: req.startTime ? Date.now() - req.startTime : undefined
    };

    return entry;
};

// Generate a unique request ID
const generateRequestId = () => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Extract resource type from path
const extractResource = (path) => {
    const parts = path.split('/').filter(Boolean);
    // Remove 'api' prefix and IDs
    const relevantParts = parts.filter(p => p !== 'api' && !/^\d+$/.test(p));
    return relevantParts.join('/') || 'root';
};

/**
 * Write audit log entry
 */
const writeAuditLog = (entry) => {
    if (!config.enabled) return;

    const logLine = JSON.stringify(entry);

    // Log to console in development
    if (config.logToConsole) {
        const statusIcon = entry.response.status === 'success' ? '\x1b[32m\u2713\x1b[0m' : '\x1b[31m\u2717\x1b[0m';
        console.log(`[AUDIT] ${statusIcon} ${entry.action} | User: ${entry.user.role} | IP: ${entry.user.ip}`);
    }

    // Log to file
    if (config.logToFile) {
        const logFile = getLogFilePath();
        fs.appendFile(logFile, logLine + '\n', (err) => {
            if (err) {
                console.error('Failed to write audit log:', err);
            }
        });
    }
};

/**
 * Main audit logging middleware
 * Captures request/response and logs the activity
 */
const auditMiddleware = (options = {}) => {
    const {
        excludePaths = ['/api/health', '/api/csrf-token'],
        excludeMethods = [],
        includeRequestBody = true,
        includeResponseBody = false
    } = options;

    return (req, res, next) => {
        // Add request ID and start time
        req.requestId = generateRequestId();
        req.startTime = Date.now();

        // Skip excluded paths
        if (excludePaths.some(p => req.path.startsWith(p))) {
            return next();
        }

        // Skip excluded methods
        if (excludeMethods.includes(req.method)) {
            return next();
        }

        // Capture response data
        const originalSend = res.send;
        let responseBody;

        res.send = function(body) {
            responseBody = body;
            return originalSend.call(this, body);
        };

        // Log after response is sent
        res.on('finish', () => {
            const status = res.statusCode < 400 ? 'success' : 'failure';

            const entry = createAuditEntry(req, res, {
                status,
                errorMessage: status === 'failure' && responseBody ?
                    (typeof responseBody === 'string' ?
                        JSON.parse(responseBody)?.error :
                        responseBody?.error) :
                    undefined
            });

            if (includeResponseBody && responseBody) {
                try {
                    const parsed = typeof responseBody === 'string' ?
                        JSON.parse(responseBody) : responseBody;
                    entry.response.body = truncateForLog(maskSensitiveData(parsed));
                } catch {
                    // Ignore parse errors
                }
            }

            writeAuditLog(entry);
        });

        next();
    };
};

/**
 * Log a specific action (can be called manually from route handlers)
 */
const logAction = (req, action, details = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        action,
        user: {
            role: req.user?.role || 'anonymous',
            ip: req.ip || req.connection?.remoteAddress
        },
        details: maskSensitiveData(details)
    };

    writeAuditLog(entry);
};

/**
 * Log authentication events
 */
const logAuth = (req, event, success, details = {}) => {
    const entry = {
        timestamp: new Date().toISOString(),
        type: 'AUTH',
        event,
        success,
        user: {
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers['user-agent']?.substring(0, 200)
        },
        details: maskSensitiveData(details)
    };

    writeAuditLog(entry);
};

/**
 * Query audit logs (for admin interface)
 */
const queryAuditLogs = (options = {}) => {
    const {
        startDate,
        endDate,
        action,
        user,
        resource,
        status,
        limit = 100
    } = options;

    // This is a simple file-based implementation
    // In production, use a database or log aggregation service
    const logs = [];

    try {
        const logFile = getLogFilePath();
        if (fs.existsSync(logFile)) {
            const content = fs.readFileSync(logFile, 'utf-8');
            const lines = content.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const entry = JSON.parse(line);

                    // Apply filters
                    if (startDate && new Date(entry.timestamp) < new Date(startDate)) continue;
                    if (endDate && new Date(entry.timestamp) > new Date(endDate)) continue;
                    if (action && !entry.action.includes(action)) continue;
                    if (user && entry.user.role !== user) continue;
                    if (resource && entry.resource !== resource) continue;
                    if (status && entry.response?.status !== status) continue;

                    logs.push(entry);

                    if (logs.length >= limit) break;
                } catch {
                    // Skip malformed entries
                }
            }
        }
    } catch (err) {
        console.error('Error reading audit logs:', err);
    }

    return logs;
};

module.exports = {
    auditMiddleware,
    logAction,
    logAuth,
    queryAuditLogs,
    createAuditEntry,
    writeAuditLog,
    config
};
