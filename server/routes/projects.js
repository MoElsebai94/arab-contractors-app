/**
 * Projects Routes
 * Handles all project/task-related CRUD operations
 */

const express = require('express');
const db = require('../database');
const { validate, validateId } = require('../middleware');

const router = express.Router();

// Get all projects
router.get('/', (req, res) => {
    const { status, department_id, search, priority } = req.query;
    let sql = `
        SELECT p.*, d.name as department_name
        FROM projects p
        LEFT JOIN departments d ON p.department_id = d.id
        WHERE 1=1
    `;
    const params = [];

    if (status) {
        sql += ' AND p.status = ?';
        params.push(status);
    }

    if (department_id) {
        sql += ' AND p.department_id = ?';
        params.push(department_id);
    }

    if (search) {
        sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    if (priority) {
        sql += ' AND p.priority = ?';
        params.push(priority);
    }

    sql += ' ORDER BY p.created_at DESC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching projects:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows || [] });
    });
});

// Create a project
router.post('/', validate('createProject'), (req, res) => {
    const { name, description, status, start_date, end_date, department_id, priority, assignee } = req.body;

    db.run(
        `INSERT INTO projects (name, description, status, start_date, end_date, department_id, priority, assignee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name,
            description || null,
            status || 'Planned',
            start_date || null,
            end_date || null,
            department_id || null,
            priority || 'Medium',
            assignee || null
        ],
        function(err) {
            if (err) {
                console.error('Error creating project:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({
                id: this.lastID,
                name,
                description,
                status: status || 'Planned',
                start_date,
                end_date,
                department_id,
                priority: priority || 'Medium',
                assignee
            });
        }
    );
});

// Update a project
router.put('/:id', validateId, validate('createProject'), (req, res) => {
    const { id } = req.params;
    const fields = [];
    const params = [];

    const allowedFields = ['name', 'description', 'status', 'start_date', 'end_date', 'department_id', 'priority', 'assignee'];
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
    const sql = `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`;

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Error updating project:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ updated: this.changes });
    });
});

// Delete a project
router.delete('/:id', validateId, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting project:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
});

// Get project statistics
router.get('/stats', (req, res) => {
    const sql = `
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'Planned' THEN 1 ELSE 0 END) as planned,
            SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold
        FROM projects
    `;

    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('Error fetching project stats:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: row });
    });
});

module.exports = router;
