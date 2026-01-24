/**
 * Attendance Routes
 * Handles employee attendance tracking
 */

const express = require('express');
const db = require('../database');
const { validate, validateId } = require('../middleware');

const router = express.Router();

// Get attendance records
router.get('/', (req, res) => {
    const { employee_id, date, start_date, end_date } = req.query;
    let sql = `
        SELECT a.*, e.name as employee_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.id
        WHERE 1=1
    `;
    const params = [];

    if (employee_id) {
        sql += ' AND a.employee_id = ?';
        params.push(employee_id);
    }

    if (date) {
        sql += ' AND a.date = ?';
        params.push(date);
    }

    if (start_date) {
        sql += ' AND a.date >= ?';
        params.push(start_date);
    }

    if (end_date) {
        sql += ' AND a.date <= ?';
        params.push(end_date);
    }

    sql += ' ORDER BY a.date DESC, e.name ASC';

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching attendance:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows || [] });
    });
});

// Record attendance
router.post('/', validate('attendance'), (req, res) => {
    const { employee_id, date, status, start_time, end_time, notes } = req.body;

    // Use upsert (INSERT OR REPLACE)
    db.run(
        `INSERT OR REPLACE INTO attendance (employee_id, date, status, start_time, end_time, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employee_id, date, status, start_time || null, end_time || null, notes || null],
        function(err) {
            if (err) {
                console.error('Error recording attendance:', err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, employee_id, date, status });
        }
    );
});

// Bulk attendance update
router.post('/bulk', validate('bulkAttendance'), (req, res) => {
    const { employeeIds, date, status, start_time, end_time } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: 'Employee IDs array is required' });
    }

    const stmt = db.prepare(
        `INSERT OR REPLACE INTO attendance (employee_id, date, status, start_time, end_time)
         VALUES (?, ?, ?, ?, ?)`
    );

    let completed = 0;
    let errors = 0;

    employeeIds.forEach(empId => {
        stmt.run([empId, date, status, start_time || null, end_time || null], (err) => {
            if (err) {
                console.error('Error in bulk attendance:', err);
                errors++;
            }
            completed++;
            if (completed === employeeIds.length) {
                stmt.finalize();
                res.json({ success: true, processed: completed, errors });
            }
        });
    });
});

// Get attendance summary for date range
router.get('/summary', (req, res) => {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
        return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const sql = `
        SELECT
            e.id as employee_id,
            e.name as employee_name,
            COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
            COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
            COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
            COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_days,
            COUNT(CASE WHEN a.status = 'holiday' THEN 1 END) as holiday_days,
            COUNT(a.id) as total_records
        FROM employees e
        LEFT JOIN attendance a ON e.id = a.employee_id
            AND a.date BETWEEN ? AND ?
        WHERE e.is_active = 1
        GROUP BY e.id, e.name
        ORDER BY e.name
    `;

    db.all(sql, [start_date, end_date], (err, rows) => {
        if (err) {
            console.error('Error fetching attendance summary:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ data: rows || [] });
    });
});

// Delete attendance record
router.delete('/:id', validateId, (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM attendance WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting attendance:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ deleted: this.changes });
    });
});

module.exports = router;
