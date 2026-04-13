const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tamil-travel-planner-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Initialize users table in the database.
 */
function initUsersTable() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      preferred_language TEXT DEFAULT 'ta',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Register a new user.
 */
function registerUser({ name, email, phone, password }) {
  const db = getDb();
  initUsersTable();

  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    throw new Error('இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது');
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Insert user
  const stmt = db.prepare(
    'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name, email, phone || null, passwordHash);

  // Generate JWT
  const token = jwt.sign(
    { userId: result.lastInsertRowid, email, name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    userId: result.lastInsertRowid,
    name,
    email,
    phone,
    token,
  };
}

/**
 * Login an existing user.
 */
function loginUser({ email, password }) {
  const db = getDb();
  initUsersTable();

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    throw new Error('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது');
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    throw new Error('மின்னஞ்சல் அல்லது கடவுச்சொல் தவறானது');
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    token,
  };
}

/**
 * Verify a JWT token and return user info.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Get user profile by ID.
 */
function getUserById(userId) {
  const db = getDb();
  initUsersTable();
  const user = db.prepare('SELECT id, name, email, phone, created_at FROM users WHERE id = ?').get(userId);
  return user || null;
}

module.exports = { registerUser, loginUser, verifyToken, getUserById, initUsersTable };
