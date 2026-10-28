/**
 * Database Connection and Initialization Script
 * SpendGuard AI - NEAR Hackathon 2026
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolve SQLite database file path
const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Successfully connected to SQLite database at:', dbPath);
    initTables();
  }
});

/**
 * Initialize database tables according to DATABASE.md schema
 */
function initTables() {
  db.serialize(() => {
    // 1. Safety rules table
    db.run(`CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pattern TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('ALLOW', 'BLOCK')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Spending limits table
    db.run(`CREATE TABLE IF NOT EXISTS limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('DAILY', 'PER_TX')),
      max_amount REAL NOT NULL,
      current_spent REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 3. AI agent action proposals table
    db.run(`CREATE TABLE IF NOT EXISTS proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL,
      amount REAL NOT NULL,
      recipient TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'BLOCKED')),
      tx_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 4. Activity and evaluation logs table
    db.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      proposal_id INTEGER,
      message TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(proposal_id) REFERENCES proposals(id)
    )`, (err) => {
      if (err) {
        console.error('Error creating database tables:', err.message);
      } else {
        console.log('Database schema tables initialized successfully.');
        // Migrate: add tx_hash column if not exists
        db.run(`ALTER TABLE proposals ADD COLUMN tx_hash TEXT`, (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('Migration warning:', alterErr.message);
          }
        });
        seedDefaultData();
      }
    });
  });
}

/**
 * Insert default seed data if tables are empty, and update legacy Vietnamese text to English
 */
function seedDefaultData() {
  db.get(`SELECT COUNT(*) as count FROM limits`, (err, row) => {
    if (!err && row.count === 0) {
      db.run(`INSERT INTO limits (type, max_amount, current_spent) VALUES ('DAILY', 10.0, 0.0)`);
      db.run(`INSERT INTO limits (type, max_amount, current_spent) VALUES ('PER_TX', 3.0, 0.0)`);
      db.run(`INSERT INTO rules (name, pattern, action) VALUES ('Block malicious scam addresses', 'scam.testnet', 'BLOCK')`);
      console.log('Default seed data inserted successfully.');
    } else {
      // Update any legacy Vietnamese rule names to English for consistency
      db.run(`UPDATE rules SET name = 'Block malicious scam addresses' WHERE name = 'Chặn địa chỉ độc hại giả mạo'`, (updateErr) => {
        if (!updateErr) {
          console.log('Legacy rule names updated to English successfully.');
        }
      });
    }
  });
}

module.exports = db;
