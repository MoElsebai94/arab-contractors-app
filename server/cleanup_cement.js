const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'arab_contractors.db');
const db = new sqlite3.Database(dbPath);

const itemsToDelete = ['T2', 'A2', 'CS2', 'TestCement'];
const placeholders = itemsToDelete.map(() => '?').join(',');

db.run(`DELETE FROM cement_inventory WHERE type IN (${placeholders})`, itemsToDelete, function (err) {
    if (err) {
        console.error('Error deleting items:', err.message);
    } else {
        console.log(`Successfully deleted ${this.changes} items from cement_inventory.`);
    }
    db.close();
});
