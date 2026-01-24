/**
 * Input Validation Middleware
 * Provides server-side validation for all API endpoints
 */

// Validation helper functions
const validators = {
    isString: (val) => typeof val === 'string',
    isNumber: (val) => typeof val === 'number' && !isNaN(val),
    isPositiveNumber: (val) => typeof val === 'number' && !isNaN(val) && val > 0,
    isNonNegativeNumber: (val) => typeof val === 'number' && !isNaN(val) && val >= 0,
    isArray: (val) => Array.isArray(val),
    isBoolean: (val) => typeof val === 'boolean',
    isEmail: (val) => typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    isDate: (val) => typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val),
    isIn: (val, options) => options.includes(val),
    maxLength: (val, max) => typeof val === 'string' && val.length <= max,
    minLength: (val, min) => typeof val === 'string' && val.length >= min,
    isId: (val) => (typeof val === 'number' && val > 0) || (typeof val === 'string' && /^\d+$/.test(val))
};

// Sanitize string input to prevent XSS
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
};

// Deep sanitize object
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') return sanitizeString(obj);
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeObject);

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[sanitizeString(key)] = sanitizeObject(value);
    }
    return sanitized;
};

// Validation schemas for different endpoints
const schemas = {
    // Auth
    login: {
        passcode: { required: true, type: 'string', maxLength: 100 }
    },

    // Employees
    createEmployee: {
        name: { required: true, type: 'string', maxLength: 255 },
        role: { required: false, type: 'string', maxLength: 100 },
        department_id: { required: false, type: 'id' },
        contact_info: { required: false, type: 'string', maxLength: 500 }
    },
    updateEmployee: {
        name: { required: false, type: 'string', maxLength: 255 },
        role: { required: false, type: 'string', maxLength: 100 },
        contact_info: { required: false, type: 'string', maxLength: 500 },
        is_active: { required: false, type: 'number' }
    },

    // Departments
    createDepartment: {
        name: { required: true, type: 'string', maxLength: 255 },
        head_of_department: { required: false, type: 'string', maxLength: 255 },
        location: { required: false, type: 'string', maxLength: 255 }
    },

    // Projects
    createProject: {
        name: { required: true, type: 'string', maxLength: 255 },
        description: { required: false, type: 'string', maxLength: 2000 },
        status: { required: false, type: 'string', enum: ['Planned', 'In Progress', 'Completed', 'On Hold'] },
        start_date: { required: false, type: 'date' },
        end_date: { required: false, type: 'date' },
        department_id: { required: false, type: 'id' },
        priority: { required: false, type: 'string', enum: ['Low', 'Medium', 'High'] },
        assignee: { required: false, type: 'string', maxLength: 255 }
    },

    // Production
    createProduction: {
        name: { required: true, type: 'string', maxLength: 255 },
        category: { required: false, type: 'string', maxLength: 100 },
        target_quantity: { required: false, type: 'nonNegativeNumber' },
        current_quantity: { required: false, type: 'nonNegativeNumber' },
        daily_rate: { required: false, type: 'nonNegativeNumber' },
        mold_count: { required: false, type: 'nonNegativeNumber' }
    },

    // Iron
    createIron: {
        diameter: { required: true, type: 'string', maxLength: 50 },
        quantity: { required: false, type: 'nonNegativeNumber' }
    },

    // Transactions
    transaction: {
        type: { required: true, type: 'string', enum: ['IN', 'OUT'] },
        quantity: { required: true, type: 'positiveNumber' },
        description: { required: false, type: 'string', maxLength: 500 },
        date: { required: false, type: 'date' }
    },

    // Attendance
    attendance: {
        employee_id: { required: true, type: 'id' },
        date: { required: true, type: 'date' },
        status: { required: true, type: 'string', enum: ['present', 'absent', 'late', 'excused', 'holiday'] },
        start_time: { required: false, type: 'string', maxLength: 10 },
        end_time: { required: false, type: 'string', maxLength: 10 },
        notes: { required: false, type: 'string', maxLength: 500 }
    },
    bulkAttendance: {
        employeeIds: { required: true, type: 'array' },
        date: { required: true, type: 'date' },
        status: { required: true, type: 'string' }
    },

    // Dalots
    createDalot: {
        section_id: { required: true, type: 'id' },
        ouvrage_transmis: { required: true, type: 'string', maxLength: 100 },
        ouvrage_etude: { required: false, type: 'string', maxLength: 100 },
        ouvrage_definitif: { required: false, type: 'string', maxLength: 100 },
        pk_etude: { required: false, type: 'string', maxLength: 50 },
        pk_transmis: { required: false, type: 'string', maxLength: 50 },
        dimension: { required: false, type: 'string', maxLength: 50 },
        length: { required: false, type: 'nonNegativeNumber' },
        status: { required: false, type: 'string', enum: ['pending', 'in_progress', 'finished', 'cancelled'] },
        is_validated: { required: false, type: 'number' },
        notes: { required: false, type: 'string', maxLength: 1000 }
    },
    createSection: {
        name: { required: true, type: 'string', maxLength: 255 },
        route_name: { required: false, type: 'string', maxLength: 255 },
        start_pk: { required: false, type: 'nonNegativeNumber' },
        end_pk: { required: false, type: 'nonNegativeNumber' },
        type: { required: false, type: 'string', enum: ['main', 'continuous', 'branch'] }
    },

    // Reorder
    reorder: {
        items: { required: true, type: 'array' }
    }
};

// Validate a single field
const validateField = (value, rules, fieldName) => {
    const errors = [];

    // Handle undefined/null
    if (value === undefined || value === null || value === '') {
        if (rules.required) {
            errors.push(`${fieldName} is required`);
        }
        return errors;
    }

    // Type validation
    switch (rules.type) {
        case 'string':
            if (!validators.isString(value)) {
                errors.push(`${fieldName} must be a string`);
            } else {
                if (rules.maxLength && !validators.maxLength(value, rules.maxLength)) {
                    errors.push(`${fieldName} must be at most ${rules.maxLength} characters`);
                }
                if (rules.minLength && !validators.minLength(value, rules.minLength)) {
                    errors.push(`${fieldName} must be at least ${rules.minLength} characters`);
                }
            }
            break;
        case 'number':
            if (!validators.isNumber(Number(value))) {
                errors.push(`${fieldName} must be a number`);
            }
            break;
        case 'positiveNumber':
            if (!validators.isPositiveNumber(Number(value))) {
                errors.push(`${fieldName} must be a positive number`);
            }
            break;
        case 'nonNegativeNumber':
            if (!validators.isNonNegativeNumber(Number(value))) {
                errors.push(`${fieldName} must be a non-negative number`);
            }
            break;
        case 'id':
            if (!validators.isId(value)) {
                errors.push(`${fieldName} must be a valid ID`);
            }
            break;
        case 'date':
            if (!validators.isDate(value)) {
                errors.push(`${fieldName} must be a valid date (YYYY-MM-DD)`);
            }
            break;
        case 'array':
            if (!validators.isArray(value)) {
                errors.push(`${fieldName} must be an array`);
            }
            break;
        case 'email':
            if (!validators.isEmail(value)) {
                errors.push(`${fieldName} must be a valid email`);
            }
            break;
    }

    // Enum validation
    if (rules.enum && value && !validators.isIn(value, rules.enum)) {
        errors.push(`${fieldName} must be one of: ${rules.enum.join(', ')}`);
    }

    return errors;
};

// Validate request body against schema
const validateBody = (body, schema) => {
    const errors = [];

    for (const [fieldName, rules] of Object.entries(schema)) {
        const fieldErrors = validateField(body[fieldName], rules, fieldName);
        errors.push(...fieldErrors);
    }

    return errors;
};

// Middleware factory
const validate = (schemaName) => {
    return (req, res, next) => {
        const schema = schemas[schemaName];
        if (!schema) {
            console.warn(`Validation schema '${schemaName}' not found`);
            return next();
        }

        // Sanitize request body
        req.body = sanitizeObject(req.body);

        // Validate
        const errors = validateBody(req.body, schema);

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    };
};

// Middleware to sanitize all request bodies
const sanitizeMiddleware = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    next();
};

// Validate route params (id)
const validateId = (req, res, next) => {
    const id = req.params.id;
    if (id && !validators.isId(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    next();
};

module.exports = {
    validate,
    validateId,
    sanitizeMiddleware,
    validators,
    schemas
};
