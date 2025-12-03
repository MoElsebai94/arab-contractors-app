const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arab_contractors.db');

db.serialize(() => {
    db.all("PRAGMA table_info(production_items)", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Columns in production_items:");
        rows.forEach(row => {
            console.log(row.name);
        });
    });
});

db.close();
