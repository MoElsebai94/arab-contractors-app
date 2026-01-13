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

      // Production Categories Table
      db.run(`CREATE TABLE IF NOT EXISTS production_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )`, (err) => {
        if (err) {
          console.error("Error creating production_categories table:", err);
        } else {
          // Insert default categories if empty
          db.get("SELECT COUNT(*) as count FROM production_categories", (err, row) => {
            if (row && row.count === 0) {
              const defaults = ['Prefabrication', 'Steel', 'Concrete', 'General'];
              const stmt = db.prepare("INSERT INTO production_categories (name) VALUES (?)");
              defaults.forEach(cat => stmt.run(cat));
              stmt.finalize();
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

      // Create Iron Transactions Table
      db.run(`CREATE TABLE IF NOT EXISTS iron_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        iron_id INTEGER,
        type TEXT, -- 'IN' or 'OUT'
        quantity INTEGER,
        description TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        transaction_date TEXT, -- Format: YYYY-MM-DD
        FOREIGN KEY (iron_id) REFERENCES iron_inventory(id)
      )`, (err) => {
        if (!err) {
          console.log("Iron transactions table checked/created");
        } else {
          console.error("Error creating iron transactions table", err);
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
              const types = ["Fuel"];
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

      // Create Dalot Sections Table
      db.run(`CREATE TABLE IF NOT EXISTS dalot_sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        route_name TEXT,
        display_order INTEGER DEFAULT 0,
        start_pk INTEGER DEFAULT 0,
        end_pk INTEGER DEFAULT 0,
        type TEXT DEFAULT 'main', -- 'main', 'continuous', 'branch'
        parent_section_id INTEGER,
        branch_pk INTEGER DEFAULT 0,
        row_index INTEGER DEFAULT 0,
        FOREIGN KEY (parent_section_id) REFERENCES dalot_sections(id)
      )`, (err) => {
        if (!err) {
          // Migration: Check for new columns
          db.all("PRAGMA table_info(dalot_sections)", (err, rows) => {
            if (!err) {
              const columns = ['start_pk', 'end_pk', 'type', 'parent_section_id', 'branch_pk', 'row_index'];
              const colTypes = {
                'start_pk': 'INTEGER DEFAULT 0',
                'end_pk': 'INTEGER DEFAULT 0',
                'type': "TEXT DEFAULT 'main'",
                'parent_section_id': 'INTEGER',
                'branch_pk': 'INTEGER DEFAULT 0',
                'row_index': 'INTEGER DEFAULT 0'
              };

              columns.forEach(col => {
                if (!rows.some(r => r.name === col)) {
                  db.run(`ALTER TABLE dalot_sections ADD COLUMN ${col} ${colTypes[col]}`, (err) => {
                    if (!err) console.log(`Added ${col} column to dalot_sections`);
                  });
                }
              });
            }
          });

          // Initialize default sections if empty
          db.get("SELECT count(*) as count FROM dalot_sections", (err, row) => {
            if (!err && row.count === 0) {
              const sections = [
                { name: "Section 1", route: "ZAMENGOUE – EKEKAM – EVODOULA", order: 0, start: 0, end: 48000, type: 'main', row: 0 },
                { name: "Section 2", route: "ZAMENGOUE – EKEKAM – EVODOULA", order: 1, start: 48000, end: 80000, type: 'continuous', row: 0 },
                { name: "Section 3", route: "ZAMENGOUE – EKEKAM – EVODOULA", order: 2, start: 0, end: 20000, type: 'branch', row: 1 }
              ];
              // Note: Only basic insert here, user will configure details via UI
              const insert = 'INSERT INTO dalot_sections (name, route_name, display_order, start_pk, end_pk, type, row_index) VALUES (?, ?, ?, ?, ?, ?, ?)';
              sections.forEach(s => db.run(insert, [s.name, s.route, s.order, s.start, s.end, s.type, s.row]));
              console.log("Initialized Default Dalot Sections");
            }
          });
        }
      });

      // Create Dalots Table
      db.run(`CREATE TABLE IF NOT EXISTS dalots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_id INTEGER,
        ouvrage_transmis TEXT NOT NULL,
        ouvrage_etude TEXT,
        ouvrage_definitif TEXT,
        pk_etude TEXT,
        pk_transmis TEXT,
        dimension TEXT,
        length REAL DEFAULT 0,
        status TEXT DEFAULT 'pending',
        is_validated INTEGER DEFAULT 0,
        notes TEXT,
        display_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (section_id) REFERENCES dalot_sections(id)
      )`, (err) => {
        if (!err) {
          console.log("Dalots table checked/created");
        } else {
          console.error("Error creating dalots table", err);
        }
      });
    });
  }
});

module.exports = db;
