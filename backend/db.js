const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH
  ? path.resolve(__dirname, process.env.DB_PATH)
  : path.join(__dirname, '..', 'database', 'travel.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    initializeSchema();
  }
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS queries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transcript TEXT NOT NULL,
      intent TEXT,
      entities TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_id INTEGER NOT NULL,
      itinerary_text TEXT NOT NULL,
      travel_options TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      travel_type TEXT NOT NULL,
      travel_name TEXT NOT NULL,
      source TEXT NOT NULL,
      destination TEXT NOT NULL,
      travel_date TEXT,
      passengers INTEGER NOT NULL,
      price_per_person INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      contact_phone TEXT NOT NULL,
      pnr TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      refund_amount INTEGER DEFAULT 0,
      cancelled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = { getDb };
