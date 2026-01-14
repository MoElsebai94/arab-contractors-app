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
    // Normalized comparison
    const normalizedInput = passcode ? passcode.toString().trim() : '';
    const normalizedTarget = process.env.ADMIN_PASSCODE ? process.env.ADMIN_PASSCODE.toString().trim() : '';

    if (normalizedInput === normalizedTarget) {
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


app.put("/api/storage/production/:id", (req, res) => {
    const { name, category, target_quantity, current_quantity, daily_rate, mold_count } = req.body;
    const sql = `UPDATE production_items SET 
               name = COALESCE(?, name), 
               category = COALESCE(?, category), 
               target_quantity = COALESCE(?, target_quantity), 
               current_quantity = COALESCE(?, current_quantity), 
               daily_rate = COALESCE(?, daily_rate),
               mold_count = COALESCE(?, mold_count)
               WHERE id = ?`;
    const params = [name, category, target_quantity, current_quantity, daily_rate, mold_count, req.params.id];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "changes": this.changes });
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

// Production Categories API
app.get("/api/storage/production-categories", (req, res) => {
    const sql = "SELECT * FROM production_categories ORDER BY name ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post("/api/storage/production-categories", (req, res) => {
    const { name } = req.body;
    const sql = 'INSERT INTO production_categories (name) VALUES (?)';
    db.run(sql, [name], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": { id: this.lastID, name } });
    });
});

app.delete("/api/storage/production-categories/:id", (req, res) => {
    const sql = 'DELETE FROM production_categories WHERE id = ?';
    db.run(sql, req.params.id, function (err) {
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

app.get("/api/storage/iron/transactions/all", (req, res) => {
    const sql = "SELECT * FROM iron_transactions ORDER BY transaction_date DESC, timestamp DESC";
    db.all(sql, [], (err, rows) => {
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

app.get("/api/storage/cement/transactions/all", (req, res) => {
    const sql = "SELECT * FROM cement_transactions ORDER BY transaction_date DESC, timestamp DESC";
    db.all(sql, [], (err, rows) => {
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

app.get("/api/storage/gasoline/transactions/all", (req, res) => {
    const sql = "SELECT * FROM gasoline_transactions ORDER BY transaction_date DESC, timestamp DESC";
    db.all(sql, [], (err, rows) => {
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

// Bulk attendance update for multiple employees
app.post('/api/attendance/bulk', (req, res) => {
    const { employeeIds, date, status, start_time, end_time, notes } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({ error: 'employeeIds array is required' });
    }

    if (!date || !status) {
        return res.status(400).json({ error: 'date and status are required' });
    }

    const sql = `INSERT INTO attendance (employee_id, date, status, start_time, end_time, notes) 
                 VALUES (?, ?, ?, ?, ?, ?) 
                 ON CONFLICT(employee_id, date) 
                 DO UPDATE SET status=excluded.status, start_time=excluded.start_time, end_time=excluded.end_time, notes=excluded.notes`;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let completed = 0;
        let hasError = false;

        employeeIds.forEach((employeeId, index) => {
            if (hasError) return;

            const params = [employeeId, date, status, start_time || null, end_time || null, notes || ''];

            db.run(sql, params, function (err) {
                if (err && !hasError) {
                    hasError = true;
                    db.run('ROLLBACK');
                    return res.status(400).json({ error: err.message });
                }

                completed++;

                if (completed === employeeIds.length && !hasError) {
                    db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                            return res.status(400).json({ error: commitErr.message });
                        }
                        res.json({
                            message: 'success',
                            count: employeeIds.length,
                            data: { date, status, start_time, end_time, notes }
                        });
                    });
                }
            });
        });
    });
});

// --- Dalots API ---

// Get all dalot sections with statistics
app.get("/api/dalots/sections", (req, res) => {
    const sql = `
        SELECT 
            s.id, s.name, s.route_name, s.display_order,
            s.start_pk, s.end_pk, s.type, s.parent_section_id, s.branch_pk, s.row_index,
            COUNT(CASE WHEN d.status != 'cancelled' THEN d.id END) as total_dalots,
            SUM(CASE WHEN d.status = 'finished' THEN 1 ELSE 0 END) as finished_count,
            SUM(CASE WHEN d.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
            SUM(CASE WHEN d.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
            SUM(CASE WHEN d.is_validated = 1 AND d.status != 'cancelled' THEN 1 ELSE 0 END) as validated_count
        FROM dalot_sections s
        LEFT JOIN dalots d ON s.id = d.section_id
        GROUP BY s.id
        ORDER BY s.display_order ASC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// Create a dalot section
app.post("/api/dalots/sections", (req, res) => {
    const { name, route_name, start_pk, end_pk, type, parent_section_id, branch_pk, row_index } = req.body;
    db.get("SELECT MAX(display_order) as maxOrder FROM dalot_sections", (err, row) => {
        const newOrder = (row?.maxOrder ?? -1) + 1;
        const sql = 'INSERT INTO dalot_sections (name, route_name, display_order, start_pk, end_pk, type, parent_section_id, branch_pk, row_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        const params = [
            name, route_name, newOrder,
            start_pk || 0, end_pk || 0, type || 'main',
            parent_section_id || null, branch_pk || 0, row_index || 0
        ];
        db.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: "success", id: this.lastID });
        });
    });
});

// Update a dalot section
app.put("/api/dalots/sections/:id", (req, res) => {
    const { name, route_name, start_pk, end_pk, type, parent_section_id, branch_pk, row_index } = req.body;
    const sql = `UPDATE dalot_sections SET 
        name = COALESCE(?, name),
        route_name = COALESCE(?, route_name),
        start_pk = COALESCE(?, start_pk),
        end_pk = COALESCE(?, end_pk),
        type = COALESCE(?, type),
        parent_section_id = COALESCE(?, parent_section_id),
        branch_pk = COALESCE(?, branch_pk),
        row_index = COALESCE(?, row_index)
        WHERE id = ?`;
    const params = [
        name, route_name, start_pk, end_pk, type,
        parent_section_id, branch_pk, row_index,
        req.params.id
    ];
    db.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// Delete a dalot section
app.delete("/api/dalots/sections/:id", (req, res) => {
    // First delete all dalots in this section
    db.run("DELETE FROM dalots WHERE section_id = ?", [req.params.id], (err) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        db.run("DELETE FROM dalot_sections WHERE id = ?", [req.params.id], function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: "deleted", changes: this.changes });
        });
    });
});

// Get overall dalots statistics
app.get("/api/dalots/stats", (req, res) => {
    const sql = `
        SELECT 
            COUNT(CASE WHEN status != 'cancelled' THEN 1 END) as total,
            SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished,
            SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN is_validated = 1 AND status != 'cancelled' THEN 1 ELSE 0 END) as validated,
            SUM(CASE WHEN status != 'cancelled' THEN length ELSE 0 END) as total_length
        FROM dalots
    `;
    db.get(sql, [], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: row });
    });
});

// Get all dalots (with optional section filter)
app.get("/api/dalots", (req, res) => {
    const { section_id, status, search } = req.query;
    let sql = `
        SELECT d.*, s.name as section_name 
        FROM dalots d
        LEFT JOIN dalot_sections s ON d.section_id = s.id
        WHERE 1=1
    `;
    const params = [];

    if (section_id) {
        sql += " AND d.section_id = ?";
        params.push(section_id);
    }
    if (status) {
        sql += " AND d.status = ?";
        params.push(status);
    }
    if (search) {
        sql += " AND (d.ouvrage_transmis LIKE ? OR d.ouvrage_etude LIKE ? OR d.notes LIKE ?)";
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY d.section_id ASC, d.display_order ASC";

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// Get dalots for a specific section
app.get("/api/dalots/section/:sectionId", (req, res) => {
    const sql = `
        SELECT * FROM dalots 
        WHERE section_id = ? 
        ORDER BY display_order ASC
    `;
    db.all(sql, [req.params.sectionId], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

// Create a dalot
app.post("/api/dalots", (req, res) => {
    const {
        section_id, ouvrage_transmis, ouvrage_etude, ouvrage_definitif,
        pk_etude, pk_transmis, dimension, length, status, is_validated, notes
    } = req.body;

    db.get("SELECT MAX(display_order) as maxOrder FROM dalots WHERE section_id = ?", [section_id], (err, row) => {
        const newOrder = (row?.maxOrder ?? -1) + 1;
        const sql = `INSERT INTO dalots 
            (section_id, ouvrage_transmis, ouvrage_etude, ouvrage_definitif, pk_etude, pk_transmis, dimension, length, status, is_validated, notes, display_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, [
            section_id, ouvrage_transmis, ouvrage_etude, ouvrage_definitif,
            pk_etude, pk_transmis, dimension, length || 0, status || 'pending', is_validated || 0, notes, newOrder
        ], function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: "success", id: this.lastID });
        });
    });
});

// Update a dalot
app.put("/api/dalots/:id", (req, res) => {
    const {
        section_id, ouvrage_transmis, ouvrage_etude, ouvrage_definitif,
        pk_etude, pk_transmis, dimension, length, status, is_validated, notes
    } = req.body;

    const sql = `UPDATE dalots SET 
        section_id = COALESCE(?, section_id),
        ouvrage_transmis = COALESCE(?, ouvrage_transmis),
        ouvrage_etude = COALESCE(?, ouvrage_etude),
        ouvrage_definitif = COALESCE(?, ouvrage_definitif),
        pk_etude = COALESCE(?, pk_etude),
        pk_transmis = COALESCE(?, pk_transmis),
        dimension = COALESCE(?, dimension),
        length = COALESCE(?, length),
        status = COALESCE(?, status),
        is_validated = COALESCE(?, is_validated),
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`;

    db.run(sql, [
        section_id, ouvrage_transmis, ouvrage_etude, ouvrage_definitif,
        pk_etude, pk_transmis, dimension, length, status, is_validated, notes, req.params.id
    ], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// Quick status update
app.put("/api/dalots/:id/status", (req, res) => {
    const { status } = req.body;
    const sql = "UPDATE dalots SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(sql, [status, req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// Toggle validation status
app.put("/api/dalots/:id/validate", (req, res) => {
    const sql = "UPDATE dalots SET is_validated = CASE WHEN is_validated = 1 THEN 0 ELSE 1 END, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(sql, [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "success", changes: this.changes });
    });
});

// Delete a dalot
app.delete("/api/dalots/:id", (req, res) => {
    db.run("DELETE FROM dalots WHERE id = ?", [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: "deleted", changes: this.changes });
    });
});

// Reorder dalots within a section
app.put("/api/dalots/reorder", (req, res) => {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
        res.status(400).json({ error: "Invalid input" });
        return;
    }

    db.serialize(() => {
        const stmt = db.prepare("UPDATE dalots SET display_order = ? WHERE id = ?");
        items.forEach((item, index) => {
            stmt.run(index, item.id);
        });
        stmt.finalize((err) => {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({ message: "success" });
        });
    });
});

// Bulk import dalots from CSV data
app.post("/api/dalots/import", (req, res) => {
    const { dalots, section_id } = req.body;

    if (!dalots || !Array.isArray(dalots) || dalots.length === 0) {
        res.status(400).json({ error: "No dalots data provided" });
        return;
    }

    if (!section_id) {
        res.status(400).json({ error: "Section ID is required" });
        return;
    }

    // Get current max display_order for this section
    db.get("SELECT MAX(display_order) as maxOrder FROM dalots WHERE section_id = ?", [section_id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }

        let currentOrder = (row?.maxOrder ?? -1) + 1;
        let imported = 0;
        let errors = [];

        db.serialize(() => {
            const stmt = db.prepare(`INSERT INTO dalots 
                (section_id, ouvrage_transmis, ouvrage_etude, ouvrage_definitif, pk_etude, pk_transmis, dimension, length, status, is_validated, notes, display_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            dalots.forEach((dalot, index) => {
                // Map common column name variations
                const ouvrageTransmis = dalot.ouvrage_transmis || dalot['N° Ouvrage Transmis'] || dalot['N_Ouvrage_Transmis'] || dalot['N° ouvrages trasmis'] || dalot.transmis || '';
                const ouvrageEtude = dalot.ouvrage_etude || dalot["N° d'Etude"] || dalot["N_Etude"] || dalot["N° ouvrages d'etude"] || dalot.etude || '';
                const ouvrageDefinitif = dalot.ouvrage_definitif || dalot['N° Définitif'] || dalot['N_Definitif'] || dalot['N° ouvrages revis'] || dalot.definitif || '';
                const pkEtude = dalot.pk_etude || dalot["PK d'Étude"] || dalot["PK_Etude"] || dalot["PK D'ETUDE"] || dalot.pk || '';
                const pkTransmis = dalot.pk_transmis || dalot['PK Transmis'] || dalot['PK_Transmis'] || dalot['PK TRANSMIS'] || '';
                const dimension = dalot.dimension || dalot.Dimension || dalot['Section du dalot'] || '';
                const length = parseFloat(dalot.length || dalot.Length || dalot.longueur || dalot.Longueur || 0) || 0;

                // Normalize status value
                let rawStatus = dalot.status || dalot.Status || dalot.statut || dalot.Statut || '';
                let status = 'pending';
                if (rawStatus) {
                    const statusLower = rawStatus.toLowerCase().trim();
                    if (statusLower === 'finished' || statusLower === 'terminé' || statusLower === 'fini' || statusLower === 'complete' || statusLower === 'completed') {
                        status = 'finished';
                    } else if (statusLower === 'in progress' || statusLower === 'in_progress' || statusLower === 'en cours' || statusLower === 'inprogress') {
                        status = 'in_progress';
                    } else if (statusLower === 'cancelled' || statusLower === 'canceled' || statusLower === 'annulé' || statusLower === 'annule') {
                        status = 'cancelled';
                    } else if (statusLower === 'pending' || statusLower === 'en attente') {
                        status = 'pending';
                    }
                }

                const isValidated = dalot.is_validated || dalot.validated || dalot.Validated ? 1 : 0;
                const notes = dalot.notes || dalot.Notes || dalot.observation || dalot.Observation || '';

                if (ouvrageTransmis) {
                    stmt.run([
                        section_id,
                        ouvrageTransmis,
                        ouvrageEtude,
                        ouvrageDefinitif,
                        pkEtude,
                        pkTransmis,
                        dimension,
                        length,
                        status,
                        isValidated,
                        notes,
                        currentOrder + index
                    ], function (err) {
                        if (err) {
                            errors.push({ row: index + 1, error: err.message });
                        } else {
                            imported++;
                        }
                    });
                } else {
                    errors.push({ row: index + 1, error: "Missing ouvrage_transmis (required)" });
                }
            });

            stmt.finalize((err) => {
                if (err) {
                    res.status(400).json({ error: err.message });
                    return;
                }
                res.json({
                    message: "Import completed",
                    imported: imported,
                    total: dalots.length,
                    errors: errors.length > 0 ? errors : undefined
                });
            });
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
