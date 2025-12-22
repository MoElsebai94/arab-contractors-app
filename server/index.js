const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    // Skip auth for login
    if (req.path === '/api/auth/login') return next();

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Login Route
app.post('/api/auth/login', (req, res) => {
    const { passcode } = req.body;
    if (passcode === process.env.ADMIN_PASSCODE) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, error: 'Invalid passcode' });
    }
});

// Protect all other API routes
app.use('/api', authenticateToken);

// --- API Routes ---

// Get all departments
app.get('/api/departments', (req, res) => {
    db.all('SELECT * FROM departments', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Create a department
app.post('/api/departments', (req, res) => {
    const { name, head_of_department, location } = req.body;
    const sql = 'INSERT INTO departments (name, head_of_department, location) VALUES (?,?,?)';
    const params = [name, head_of_department, location];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: req.body,
            id: this.lastID
        });
    });
});

// Get all employees
app.get('/api/employees', (req, res) => {
    db.all('SELECT * FROM employees ORDER BY display_order ASC', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Create an employee
app.post('/api/employees', (req, res) => {
    const { name, role, department_id, contact_info } = req.body;

    // Get max order to append to end
    db.get("SELECT MAX(display_order) as maxOrder FROM employees", (err, row) => {
        const nextOrder = (row && row.maxOrder !== null) ? row.maxOrder + 1 : 0;

        const sql = 'INSERT INTO employees (name, role, department_id, contact_info, display_order, is_active) VALUES (?,?,?,?,?,?)';
        const params = [name, role, department_id, contact_info, nextOrder, 1];
        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                message: 'success',
                data: req.body,
                id: this.lastID
            });
        });
    });
});

// Update an employee
app.put("/api/employees/reorder", (req, res) => {
    console.log("HIT /api/employees/reorder");
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        res.status(400).json({ "error": "Invalid input" });
        return;
    }

    const sql = "UPDATE employees SET display_order = ? WHERE id = ?";

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        items.forEach(item => {
            db.run(sql, [item.display_order, item.id], function (err) {
                if (err) {
                    console.error("Error updating employee:", item.id, err);
                }
            });
        });

        db.run("COMMIT", (err) => {
            if (err) {
                console.error("Error committing employee reorder:", err);
                res.status(400).json({ "error": err.message });
                return;
            }
            console.log("Employee reorder successful");
            res.json({ "message": "success" });
        });
    });
});

app.put('/api/employees/:id', (req, res) => {
    const { name, role, contact_info, is_active } = req.body;
    const sql = `UPDATE employees SET 
               name = COALESCE(?, name), 
               role = COALESCE(?, role), 
               contact_info = COALESCE(?, contact_info),
               is_active = COALESCE(?, is_active)
               WHERE id = ?`;
    const params = [name, role, contact_info, is_active, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', changes: this.changes });
    });
});

// Delete an employee
app.delete('/api/employees/:id', (req, res) => {
    const sql = 'DELETE FROM employees WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

// Reorder employees


// Get all projects
app.get('/api/projects', (req, res) => {
    db.all('SELECT * FROM projects', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

// Create a project
// Create a project
app.post('/api/projects', (req, res) => {
    const { name, description, status, start_date, end_date, department_id, priority, assignee } = req.body;
    const sql = 'INSERT INTO projects (name, description, status, start_date, end_date, department_id, priority, assignee) VALUES (?,?,?,?,?,?,?,?)';
    const params = [name, description, status, start_date, end_date, department_id, priority, assignee];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: req.body,
            id: this.lastID
        });
    });
});

// Update a project
app.put('/api/projects/:id', (req, res) => {
    const { name, description, status, start_date, end_date, priority, assignee } = req.body;
    const sql = `UPDATE projects SET 
               name = COALESCE(?, name), 
               description = COALESCE(?, description), 
               status = COALESCE(?, status), 
               start_date = COALESCE(?, start_date), 
               end_date = COALESCE(?, end_date),
               priority = COALESCE(?, priority),
               assignee = COALESCE(?, assignee)
               WHERE id = ?`;
    const params = [name, description, status, start_date, end_date, priority, assignee, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'success', changes: this.changes });
    });
});

// Delete a project
app.delete('/api/projects/:id', (req, res) => {
    const sql = 'DELETE FROM projects WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'deleted', changes: this.changes });
    });
});

// --- Smart Storage API ---

// Production Items
app.get("/api/storage/production", (req, res) => {
    const sql = "SELECT * FROM production_items ORDER BY display_order ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/production", (req, res) => {
    const { name, category, target_quantity, current_quantity, daily_rate, mold_count } = req.body;

    // Get max order to append to end
    db.get("SELECT MAX(display_order) as maxOrder FROM production_items", (err, row) => {
        const nextOrder = (row && row.maxOrder !== null) ? row.maxOrder + 1 : 0;

        const sql = 'INSERT INTO production_items (name, category, target_quantity, current_quantity, daily_rate, mold_count, display_order) VALUES (?,?,?,?,?,?,?)';
        const params = [name, category, target_quantity, current_quantity, daily_rate, mold_count, nextOrder];
        db.run(sql, params, function (err, result) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ "message": "success", "data": req.body, "id": this.lastID });
        });
    });
});



app.delete("/api/storage/production/:id", (req, res) => {
    const sql = 'DELETE FROM production_items WHERE id = ?';
    db.run(sql, req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});



// Iron Inventory
app.get("/api/storage/iron", (req, res) => {
    const sql = `
        SELECT 
            i.id, 
            i.diameter, 
            i.display_order,
            COALESCE(
                (SELECT SUM(CASE WHEN t.type = 'IN' THEN t.quantity ELSE -t.quantity END)
                 FROM iron_transactions t
                 WHERE t.iron_id = i.id), 
                0
            ) as quantity
        FROM iron_inventory i 
        ORDER BY i.display_order ASC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/iron", (req, res) => {
    const { diameter, quantity } = req.body;
    // Get max order to append to end
    db.get("SELECT MAX(display_order) as maxOrder FROM iron_inventory", (err, row) => {
        const nextOrder = (row && row.maxOrder !== null) ? row.maxOrder + 1 : 0;

        const sql = 'INSERT INTO iron_inventory (diameter, quantity, display_order) VALUES (?, ?, ?)';
        const params = [diameter, quantity || 0, nextOrder];
        db.run(sql, params, function (err, result) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            const newItemId = this.lastID;

            // If initial quantity > 0, create an IN transaction
            if (quantity && quantity > 0) {
                const transSql = `INSERT INTO iron_transactions (iron_id, type, quantity, description, transaction_date) VALUES (?, 'IN', ?, 'Initial Inventory', ?)`;
                const date = new Date().toISOString().split('T')[0];
                db.run(transSql, [newItemId, quantity, date], (err) => {
                    if (err) console.error("Error creating initial transaction:", err);
                });
            }

            res.json({ "message": "success", "data": req.body, "id": newItemId });
        });
    });
});

app.put("/api/storage/iron/reorder", (req, res) => {
    console.log("HIT /api/storage/iron/reorder");
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
        res.status(400).json({ "error": "Invalid input" });
        return;
    }

    const sql = "UPDATE iron_inventory SET display_order = ? WHERE id = ?";

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        items.forEach(item => {
            db.run(sql, [item.display_order, item.id], function (err) {
                if (err) {
                    console.error("Error updating iron item:", item.id, err);
                }
            });
        });

        db.run("COMMIT", (err) => {
            if (err) {
                console.error("Error committing iron reorder:", err);
                res.status(400).json({ "error": err.message });
                return;
            }
            console.log("Iron reorder successful");
            res.json({ "message": "success" });
        });
    });
});

app.put("/api/storage/iron/:id", (req, res) => {
    const { quantity } = req.body;
    const sql = `UPDATE iron_inventory SET quantity = ? WHERE id = ?`;
    const params = [quantity, req.params.id];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
    });
});

app.delete("/api/storage/iron/:id", (req, res) => {
    const sql = 'DELETE FROM iron_inventory WHERE id = ?';
    db.run(sql, req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});

// Iron Transactions
app.get("/api/storage/iron/:id/transactions", (req, res) => {
    const sql = "SELECT * FROM iron_transactions WHERE iron_id = ? ORDER BY transaction_date DESC, timestamp DESC";
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/iron/transaction", (req, res) => {
    console.log("Received Iron Transaction Request:", req.body);
    const { iron_id, type, quantity, description, date } = req.body;

    if (!iron_id) {
        console.error("Missing iron_id in request");
        res.status(400).json({ "error": "Missing item ID" });
        return;
    }

    let transaction_date = date || new Date().toISOString().split('T')[0];

    if (quantity <= 0) {
        res.status(400).json({ "error": "Quantity must be greater than 0" });
        return;
    }

    // Check stock for OUT transaction
    if (type === 'OUT') {
        const stockSql = `
            SELECT COALESCE(SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END), 0) as current_stock 
            FROM iron_transactions WHERE iron_id = ?
        `;
        db.get(stockSql, [iron_id], (err, row) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            if (row.current_stock < quantity) {
                res.status(400).json({ "error": "Insufficient stock" });
                return;
            }
            insertTransaction();
        });
    } else {
        insertTransaction();
    }

    function insertTransaction() {
        const sql = `INSERT INTO iron_transactions (iron_id, type, quantity, description, transaction_date) VALUES (?, ?, ?, ?, ?)`;
        db.run(sql, [iron_id, type, quantity, description, transaction_date], function (err) {
            if (err) {
                console.error("SQL Error in Iron Transaction:", err);
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({ "message": "success", "id": this.lastID });
        });
    }
});

app.delete("/api/storage/iron/transaction/:id", (req, res) => {
    // For now, simpler delete without re-validating stock history
    const sql = 'DELETE FROM iron_transactions WHERE id = ?';
    db.run(sql, req.params.id, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", "changes": this.changes });
    });
});



// Cement Inventory
app.get("/api/storage/cement", (req, res) => {
    const sql = `
        SELECT 
            i.id, 
            i.type,
            COALESCE(
                (SELECT SUM(CASE WHEN t.type = 'IN' THEN t.quantity ELSE -t.quantity END)
                 FROM cement_transactions t
                 WHERE t.cement_id = i.id), 
                0
            ) as quantity
        FROM cement_inventory i
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/cement", (req, res) => {
    const { type, quantity } = req.body;
    const sql = 'INSERT INTO cement_inventory (type, quantity) VALUES (?, ?)';
    const params = [type, quantity || 0];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": req.body, "id": this.lastID });
    });
});

app.put("/api/storage/cement/:id", (req, res) => {
    console.log(`HIT /api/storage/cement/${req.params.id}`, req.body);
    const { quantity } = req.body;

    if (quantity < 0) {
        res.status(400).json({ "error": "Quantity cannot be negative" });
        return;
    }

    const sql = `UPDATE cement_inventory SET quantity = ? WHERE id = ?`;
    const params = [quantity, req.params.id];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
    });
});

app.get("/api/storage/cement/:id/transactions", (req, res) => {
    const sql = "SELECT * FROM cement_transactions WHERE cement_id = ? ORDER BY transaction_date DESC, timestamp DESC";
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/cement/transaction", (req, res) => {
    const { cement_id, type, quantity, description, date } = req.body;
    const timestamp = new Date().toISOString();
    const transaction_date = date || timestamp.split('T')[0];

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ "error": "Quantity must be greater than 0" });
    }

    if (type === 'OUT') {
        // Calculate current stock from transactions
        const sumSql = "SELECT SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as total FROM cement_transactions WHERE cement_id = ?";
        db.get(sumSql, [cement_id], (err, row) => {
            if (err) return res.status(400).json({ "error": err.message });
            const currentTotal = row.total || 0;
            if (currentTotal < quantity) {
                return res.status(400).json({ "error": "Insufficient stock" });
            }
            performTransaction();
        });
    } else {
        performTransaction();
    }

    function performTransaction() {
        const sql = `INSERT INTO cement_transactions (cement_id, type, quantity, description, timestamp, transaction_date) VALUES (?,?,?,?,?,?)`;
        const params = [cement_id, type, quantity, description, timestamp, transaction_date];
        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({
                "message": "success",
                "data": { id: this.lastID, cement_id, type, quantity, description, timestamp, transaction_date }
            });
        });
    }
});

app.delete("/api/storage/cement/transaction/:id", (req, res) => {
    const transId = req.params.id;

    // 1. Get transaction details first
    db.get("SELECT * FROM cement_transactions WHERE id = ?", [transId], (err, transaction) => {
        if (err || !transaction) {
            return res.status(400).json({ "error": err ? err.message : "Transaction not found" });
        }

        const cementId = transaction.cement_id;
        const transQty = transaction.quantity;
        const transType = transaction.type;

        // 2. Validation for IN transaction cancellation
        if (transType === 'IN') {
            const sumSql = "SELECT SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as total FROM cement_transactions WHERE cement_id = ?";
            db.get(sumSql, [cementId], (err, row) => {
                if (err) return res.status(400).json({ "error": err.message });
                const currentTotal = row.total || 0;
                if (currentTotal < transQty) {
                    return res.status(400).json({ "error": "Cannot cancel this 'IN' transaction: Insufficient stock would result in negative total." });
                }
                performDelete();
            });
        } else {
            performDelete();
        }

        function performDelete() {
            db.run("DELETE FROM cement_transactions WHERE id = ?", [transId], function (err) {
                if (err) return res.status(400).json({ "error": err.message });
                res.json({ "message": "deleted", "changes": this.changes });
            });
        }
    });
});

// --- Gasoline API ---

app.get("/api/storage/gasoline", (req, res) => {
    const sql = `
        SELECT 
            i.id, 
            i.type,
            COALESCE(
                (SELECT SUM(CASE WHEN t.type = 'IN' THEN t.quantity ELSE -t.quantity END)
                 FROM gasoline_transactions t
                 WHERE t.gasoline_id = i.id), 
                0
            ) as quantity
        FROM gasoline_inventory i
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/gasoline", (req, res) => {
    const { type, quantity } = req.body;
    const sql = 'INSERT INTO gasoline_inventory (type, quantity) VALUES (?, ?)';
    const params = [type, quantity || 0];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": req.body, "id": this.lastID });
    });
});

app.put("/api/storage/gasoline/:id", (req, res) => {
    const { quantity } = req.body;
    if (quantity < 0) {
        res.status(400).json({ "error": "Quantity cannot be negative" });
        return;
    }
    const sql = `UPDATE gasoline_inventory SET quantity = ? WHERE id = ?`;
    const params = [quantity, req.params.id];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
    });
});

app.get("/api/storage/gasoline/:id/transactions", (req, res) => {
    const sql = "SELECT * FROM gasoline_transactions WHERE gasoline_id = ? ORDER BY transaction_date DESC, timestamp DESC";
    db.all(sql, [req.params.id], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/gasoline/transaction", (req, res) => {
    const { gasoline_id, type, quantity, description, date } = req.body;
    const timestamp = new Date().toISOString();
    const transaction_date = date || timestamp.split('T')[0];

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ "error": "Quantity must be greater than 0" });
    }

    if (type === 'OUT') {
        // Calculate current stock from transactions
        const sumSql = "SELECT SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as total FROM gasoline_transactions WHERE gasoline_id = ?";
        db.get(sumSql, [gasoline_id], (err, row) => {
            if (err) return res.status(400).json({ "error": err.message });
            const currentTotal = row.total || 0;
            if (currentTotal < quantity) {
                return res.status(400).json({ "error": "Insufficient stock" });
            }
            performTransaction();
        });
    } else {
        performTransaction();
    }

    function performTransaction() {
        const sql = `INSERT INTO gasoline_transactions (gasoline_id, type, quantity, description, timestamp, transaction_date) VALUES (?,?,?,?,?,?)`;
        const params = [gasoline_id, type, quantity, description, timestamp, transaction_date];
        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({
                "message": "success",
                "data": { id: this.lastID, gasoline_id, type, quantity, description, timestamp, transaction_date }
            });
        });
    }
});

app.delete("/api/storage/gasoline/transaction/:id", (req, res) => {
    const transId = req.params.id;

    // 1. Get transaction details first
    db.get("SELECT * FROM gasoline_transactions WHERE id = ?", [transId], (err, transaction) => {
        if (err || !transaction) {
            return res.status(400).json({ "error": err ? err.message : "Transaction not found" });
        }

        const gasolineId = transaction.gasoline_id;
        const transQty = transaction.quantity;
        const transType = transaction.type;

        // 2. Validation for IN transaction cancellation
        if (transType === 'IN') {
            const sumSql = "SELECT SUM(CASE WHEN type = 'IN' THEN quantity ELSE -quantity END) as total FROM gasoline_transactions WHERE gasoline_id = ?";
            db.get(sumSql, [gasolineId], (err, row) => {
                if (err) return res.status(400).json({ "error": err.message });
                const currentTotal = row.total || 0;
                if (currentTotal < transQty) {
                    return res.status(400).json({ "error": "Cannot cancel this 'IN' transaction: Insufficient stock would result in negative total." });
                }
                performDelete();
            });
        } else {
            performDelete();
        }

        function performDelete() {
            db.run("DELETE FROM gasoline_transactions WHERE id = ?", [transId], function (err) {
                if (err) return res.status(400).json({ "error": err.message });
                res.json({ "message": "deleted", "changes": this.changes });
            });
        }
    });
});

// --- Attendance API ---

app.get('/api/attendance/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    let sql = "SELECT * FROM attendance WHERE employee_id = ?";
    let params = [employeeId];

    if (startDate && endDate) {
        sql += " AND date BETWEEN ? AND ?";
        params.push(startDate, endDate);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});

app.post('/api/attendance', (req, res) => {
    const { employee_id, date, status, start_time, end_time, notes } = req.body;

    // Upsert logic: Insert or Replace
    const sql = `INSERT INTO attendance (employee_id, date, status, start_time, end_time, notes) 
                 VALUES (?, ?, ?, ?, ?, ?) 
                 ON CONFLICT(employee_id, date) 
                 DO UPDATE SET status=excluded.status, start_time=excluded.start_time, end_time=excluded.end_time, notes=excluded.notes`;

    const params = [employee_id, date, status, start_time, end_time, notes];

    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({
            message: 'success',
            data: req.body,
            id: this.lastID
        });
    });
});

// --- Deployment Configuration ---
const path = require('path');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
