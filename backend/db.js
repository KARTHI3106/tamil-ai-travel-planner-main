const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/travelplanner',
});

async function getDb() {
  return pool;
}

async function initializeSchema() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        password_hash TEXT NOT NULL,
        preferred_language TEXT DEFAULT 'ta',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Planner: Queries
    await client.query(`
      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        transcript TEXT NOT NULL,
        intent TEXT,
        entities TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Planner: Itineraries
    await client.query(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        query_id INTEGER NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
        itinerary_text TEXT NOT NULL,
        travel_options TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Bookings base schema part
    const bookingSchemaPart = `
      id SERIAL PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
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
      cancelled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;

    // 4 Mode-specific booking tables
    await client.query(`CREATE TABLE IF NOT EXISTS bus_bookings (${bookingSchemaPart});`);
    await client.query(`CREATE TABLE IF NOT EXISTS train_bookings (${bookingSchemaPart});`);
    await client.query(`CREATE TABLE IF NOT EXISTS flight_bookings (${bookingSchemaPart});`);
    await client.query(`CREATE TABLE IF NOT EXISTS hotel_bookings (${bookingSchemaPart});`);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Schema Initialization Error', e);
  } finally {
    client.release();
  }
}

// Automatically create tables on import (can optionally be extracted)
initializeSchema().catch(console.error);

module.exports = { getDb, pool };
