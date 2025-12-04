const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const fs = require('fs');

const dataDir = path.resolve(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.resolve(dataDir, 'arab_contractors.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database ' + dbPath + ': ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');

    db.serialize(() => {
      // Create Departments Table
      db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        head_of_department TEXT,
        location TEXT
      )`, (err) => {
        if (!err) {
          // Check if departments table is empty and insert default
          db.get("SELECT count(*) as count FROM departments", (err, row) => {
            if (!err && row.count === 0) {
              const insert = 'INSERT INTO departments (name, head_of_department, location) VALUES (?,?,?)';
              db.run(insert, ["Genie Civil", "Head of Dept", "Main Office"]);
              console.log("Inserted default department: Genie Civil");
            }
          });
        }
      });

      // Create Employees Table
      db.run(`CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        department_id INTEGER,
        contact_info TEXT,
        display_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (department_id) REFERENCES departments (id)
      )`, (err) => {
        if (!err) {
          // Check for missing columns (migration for existing db)
          db.all("PRAGMA table_info(employees)", (err, rows) => {
            if (!err) {
              const hasOrderCol = rows.some(r => r.name === 'display_order');
              if (!hasOrderCol) {
                db.run("ALTER TABLE employees ADD COLUMN display_order INTEGER DEFAULT 0", (err) => {
                  if (!err) console.log("Added display_order column to employees");
                });
              }

              const hasActiveCol = rows.some(r => r.name === 'is_active');
              if (!hasActiveCol) {
                db.run("ALTER TABLE employees ADD COLUMN is_active INTEGER DEFAULT 1", (err) => {
                  if (!err) console.log("Added is_active column to employees");
                });
              }
            }
          });
        }
      });

      // Create Projects Table
      db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT,
        start_date TEXT,
        end_date TEXT,
        department_id INTEGER,
        priority TEXT,
        assignee TEXT,
        FOREIGN KEY (department_id) REFERENCES departments (id)
      )`, (err) => {
        if (!err) {
          // Check for missing columns (migration)
          db.all("PRAGMA table_info(projects)", (err, rows) => {
            if (!err) {
              const hasPriority = rows.some(r => r.name === 'priority');
              if (!hasPriority) {
                db.run("ALTER TABLE projects ADD COLUMN priority TEXT", (err) => {
                  if (!err) console.log("Added priority column to projects");
                });
              }
              const hasAssignee = rows.some(r => r.name === 'assignee');
              if (!hasAssignee) {
                db.run("ALTER TABLE projects ADD COLUMN assignee TEXT", (err) => {
                  if (!err) console.log("Added assignee column to projects");
                });
              }
            }
          });
        }
      });

      // Create Production Items Table (Smart Storage)
      db.run(`CREATE TABLE IF NOT EXISTS production_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        target_quantity INTEGER DEFAULT 0,
        current_quantity INTEGER DEFAULT 0,
        daily_rate INTEGER DEFAULT 0,
        mold_count INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0
      )`, (err) => {
        if (!err) {
          // Check if display_order column exists (migration for existing db)
          db.all("PRAGMA table_info(production_items)", (err, rows) => {
            if (!err) {
              const hasOrderCol = rows.some(r => r.name === 'display_order');
              if (!hasOrderCol) {
                db.run("ALTER TABLE production_items ADD COLUMN display_order INTEGER DEFAULT 0", (err) => {
                  if (!err) console.log("Added display_order column to production_items");
                });
              }
            }
          });
        }
      });

      // Create Iron Inventory Table (Smart Storage)
      db.run(`CREATE TABLE IF NOT EXISTS iron_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        diameter TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        display_order INTEGER DEFAULT 0
      )`, (err) => {
        if (!err) {
          // Check if display_order column exists (migration for existing db)
          db.all("PRAGMA table_info(iron_inventory)", (err, rows) => {
            if (!err) {
              const hasOrderCol = rows.some(r => r.name === 'display_order');
              if (!hasOrderCol) {
                db.run("ALTER TABLE iron_inventory ADD COLUMN display_order INTEGER DEFAULT 0", (err) => {
                  if (!err) console.log("Added display_order column to iron_inventory");
                });
              }
            }
          });

          // Initialize default iron diameters if empty
          db.get("SELECT count(*) as count FROM iron_inventory", (err, row) => {
            if (!err && row.count === 0) {
              const diameters = ["Φ6", "Φ8", "Φ10", "Φ12", "Φ14", "Φ16", "Φ20", "Φ25"];
              const insert = 'INSERT INTO iron_inventory (diameter, quantity, display_order) VALUES (?, 0, ?)';
              diameters.forEach((d, index) => db.run(insert, [d, index]));
              console.log("Initialized Iron Inventory");
            }
          });
        }
      });

      // Create Cement Inventory Table (Smart Storage)
      db.run(`CREATE TABLE IF NOT EXISTS cement_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        quantity INTEGER DEFAULT 0
      )`, (err) => {
        if (!err) {
          // Initialize default cement types if empty
          db.get("SELECT count(*) as count FROM cement_inventory", (err, row) => {
            if (!err && row.count === 0) {
              const types = ["Cement In Warehouse"];
              const insert = 'INSERT INTO cement_inventory (type, quantity) VALUES (?, 0)';
              types.forEach(t => db.run(insert, [t]));
              console.log("Initialized Cement Inventory");
            }
          });
        }
      });

      // Create Cement Transactions Table
      db.run(`CREATE TABLE IF NOT EXISTS cement_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cement_id INTEGER,
        type TEXT, -- 'IN' or 'OUT'
        quantity INTEGER,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        transaction_date TEXT, -- Format: YYYY-MM-DD
        FOREIGN KEY (cement_id) REFERENCES cement_inventory(id)
      )`, (err) => {
        if (!err) {
          db.all("PRAGMA table_info(cement_transactions)", (err, rows) => {
            if (!err) {
              const hasDateCol = rows.some(r => r.name === 'transaction_date');
              if (!hasDateCol) {
                db.run("ALTER TABLE cement_transactions ADD COLUMN transaction_date TEXT", (err) => {
                  if (!err) {
                    console.log("Added transaction_date column to cement_transactions");
                    // Initialize with date part of timestamp
                    db.run("UPDATE cement_transactions SET transaction_date = DATE(timestamp) WHERE transaction_date IS NULL");
                  }
                });
              }
            }
          });
        }
      });

      // Create Gasoline Inventory Table (Smart Storage)
      db.run(`CREATE TABLE IF NOT EXISTS gasoline_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        quantity INTEGER DEFAULT 0
      )`, (err) => {
        if (!err) {
          // Initialize default gasoline types if empty
          db.get("SELECT count(*) as count FROM gasoline_inventory", (err, row) => {
            if (!err && row.count === 0) {
              const types = ["Gasoil"];
              const insert = 'INSERT INTO gasoline_inventory (type, quantity) VALUES (?, 0)';
              types.forEach(t => db.run(insert, [t]));
              console.log("Initialized Gasoline Inventory");
            }
          });
        }
      });

      // Create Gasoline Transactions Table
      db.run(`CREATE TABLE IF NOT EXISTS gasoline_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        gasoline_id INTEGER,
        type TEXT, -- 'IN' or 'OUT'
        quantity INTEGER,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        transaction_date TEXT, -- Format: YYYY-MM-DD
        FOREIGN KEY (gasoline_id) REFERENCES gasoline_inventory(id)
      )`, (err) => {
        if (!err) {
          db.all("PRAGMA table_info(gasoline_transactions)", (err, rows) => {
            if (!err) {
              const hasDateCol = rows.some(r => r.name === 'transaction_date');
              if (!hasDateCol) {
                db.run("ALTER TABLE gasoline_transactions ADD COLUMN transaction_date TEXT", (err) => {
                  if (!err) {
                    console.log("Added transaction_date column to gasoline_transactions");
                    // Initialize with date part of timestamp
                    db.run("UPDATE gasoline_transactions SET transaction_date = DATE(timestamp) WHERE transaction_date IS NULL");
                  }
                });
              }
            }
          });
        }
      });

      // Create Resources Table
      db.run(`CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT,
        quantity INTEGER,
        assigned_to_project_id INTEGER,
        FOREIGN KEY (assigned_to_project_id) REFERENCES projects (id)
      )`);

      // Create Attendance Table
      db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        date TEXT, -- Format: YYYY-MM-DD
        status TEXT, -- 'present', 'absent', 'sick', 'vacation', 'late'
        start_time TEXT, -- HH:MM
        end_time TEXT, -- HH:MM
        notes TEXT,
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        UNIQUE(employee_id, date)
      )`, (err) => {
        if (!err) {
          // Check for missing columns (migration)
          db.all("PRAGMA table_info(attendance)", (err, rows) => {
            if (!err) {
              const hasStartTime = rows.some(r => r.name === 'start_time');
              if (!hasStartTime) {
                db.run("ALTER TABLE attendance ADD COLUMN start_time TEXT", (err) => {
                  if (!err) console.log("Added start_time column to attendance");
                });
              }
              const hasEndTime = rows.some(r => r.name === 'end_time');
              if (!hasEndTime) {
                db.run("ALTER TABLE attendance ADD COLUMN end_time TEXT", (err) => {
                  if (!err) console.log("Added end_time column to attendance");
                });
              }
            }
          });
        }
      });
    });
  }
});

module.exports = db;
