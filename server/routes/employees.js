/**
 * Employees Routes
 * Handles all employee-related CRUD operations
 */

const express = require('express');
const db = require('../database');
const { validate, validateId } = require('../middleware');

const router = express.Router();

// Get all departments
router.get('/departments', (req, res) => {
    db.all('SELECT * FROM departments ORDER BY name', [], (err, rows) => {
        if (err) {
            console.error('Error fetching departments:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows || [] });
    });
});

// Create a department
router.post('/departments', validate('createDepartment'), (req, res) => {
    const { name, head_of_department, location } = req.body;
    db.run(
        'INSERT INTO departments (name, head_of_department, location) VALUES (?, ?, ?)',
        [name, head_of_department || null, location || null],
        function(err) {
            if (err) {
                console.error('Error creating department:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, head_of_department, location });
        }
    );
});

// Get all employees
router.get('/', (req, res) => {
    const { department_id, is_active, search, role } = req.query;
    let sql = `
        SELECT e.*, d.name as department_name
        FROM employees e
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (department_id) {
        sql += ' AND e.department_id = ?';
        params.push(department_id);
    }

    if (is_active !== undefined) {
        sql += ' AND e.is_active = ?';
        params.push(is_active === 'true' ? 1 : 0);
    }

    if (search) {
        sql += ' AND (e.name LIKE ? OR e.role LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
        sql += ' AND e.role = ?';
        params.push(role);
    }

    sql += ' ORDER BY e.display_order ASC, e.name ASC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows || [] });
    });
});

// Create an employee
router.post('/', validate('createEmployee'), (req, res) => {
    const { name, role, department_id, contact_info } = req.body;

    // Get max display_order
    db.get('SELECT MAX(display_order) as maxOrder FROM employees', [], (err, row) => {
        const newOrder = (row?.maxOrder ?? -1) + 1;

        db.run(
            'INSERT INTO employees (name, role, department_id, contact_info, is_active, display_order) VALUES (?, ?, ?, ?, 1, ?)',
            [name, role || null, department_id || null, contact_info || null, newOrder],
            function(err) {
                if (err) {
                    console.error('Error creating employee:', err);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ id: this.lastID, name, role, department_id, contact_info, is_active: 1, display_order: newOrder });
            }
        );
    });
});

// Update an employee
router.put('/:id', validateId, validate('updateEmployee'), (req, res) => {
    const { id } = req.params;
    const fields = [];
    const params = [];

    // Build dynamic update
    const allowedFields = ['name', 'role', 'department_id', 'contact_info', 'is_active'];
    for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
            fields.push(`${field} = ?`);
            params.push(req.body[field]);
        }
    }

    if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    const sql = `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`;

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error updating employee:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ updated: this.changes });
    });
});

// Delete an employee
router.delete('/:id', validateId, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting employee:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
});

// Reorder employees
router.put('/reorder/batch', (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    const stmt = db.prepare('UPDATE employees SET display_order = ? WHERE id = ?');
    let completed = 0;

    items.forEach(item => {
        stmt.run([item.display_order, item.id], (err) => {
            if (err) {
                console.error('Error reordering:', err);
            }
            completed++;
            if (completed === items.length) {
                stmt.finalize();
                res.json({ success: true });
            }
        });
    });
});

// Toggle employee active status
router.put('/:id/toggle-active', validateId, (req, res) => {
    const { id } = req.params;
    db.run(
        'UPDATE employees SET is_active = NOT is_active WHERE id = ?',
        [id],
        function(err) {
            if (err) {
                console.error('Error toggling status:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ updated: this.changes });
        }
    );
});

module.exports = router;
