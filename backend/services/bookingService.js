/**
 * bookingService.js
 * Handles mock booking creation, retrieval, and conditional cancellation.
 *
 * Cancellation Policy:
 *   - Free cancellation (100% refund): within 1 hour of booking
 *   - 50% refund: cancelled between 1–24 hours after booking
 *   - No refund: cancelled after 24 hours
 *   - Cannot cancel: if travel date has already passed
 */

const { getDb } = require('../db');

/**
 * Generate a unique PNR: "PNR" + 9 random uppercase alphanumeric chars.
 */
function generatePnr() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = 'PNR';
  for (let i = 0; i < 9; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

/**
 * Get the next booking ID (format: TN1001, TN1002, ...).
 */
function getNextBookingId() {
  const db = getDb();
  const row = db.prepare(
    "SELECT booking_id FROM bookings ORDER BY id DESC LIMIT 1"
  ).get();

  if (row && row.booking_id) {
    const num = parseInt(row.booking_id.replace('TN', ''), 10);
    return `TN${num + 1}`;
  }
  return 'TN1001';
}

/**
 * Validate phone number: must be exactly 10 digits.
 */
function validatePhone(phone) {
  return /^\d{10}$/.test(phone);
}

/**
 * Create a new booking.
 * @param {object} params
 * @param {object} params.travelOption - { type, name, price, duration }
 * @param {number} params.passengers - Number of passengers (1–6)
 * @param {string} params.contactPhone - 10-digit phone number
 * @param {string} [params.source] - Source city
 * @param {string} [params.destination] - Destination city
 * @param {string} [params.travelDate] - Travel date string
 * @returns {object} booking record
 */
function createBooking({ travelOption, passengers, contactPhone, source, destination, travelDate }) {
  // Validate inputs
  if (!travelOption || !travelOption.name || !travelOption.price) {
    throw new Error('சரியான பயண விருப்பத்தை தேர்வு செய்யவும்');
  }
  if (!passengers || passengers < 1 || passengers > 6) {
    throw new Error('பயணிகள் எண்ணிக்கை 1 முதல் 6 வரை இருக்க வேண்டும்');
  }
  if (!validatePhone(contactPhone)) {
    throw new Error('சரியான தொலைபேசி எண்ணை உள்ளிடவும் (10 இலக்கங்கள்)');
  }

  const db = getDb();
  const bookingId = getNextBookingId();
  const pnr = generatePnr();
  const pricePerPerson = travelOption.price;
  const totalPrice = pricePerPerson * passengers;
  const travelType = (travelOption.type || 'unknown').replace(/[^\w\s]/g, '').trim().toLowerCase();
  const travelName = travelOption.name;

  const stmt = db.prepare(`
    INSERT INTO bookings
      (booking_id, user_id, travel_type, travel_name, source, destination,
       travel_date, passengers, price_per_person, total_price, contact_phone, pnr, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
  `);

  stmt.run(
    bookingId,
    'guest',
    travelType,
    travelName,
    source || 'Unknown',
    destination || 'Unknown',
    travelDate || '',
    passengers,
    pricePerPerson,
    totalPrice,
    contactPhone,
    pnr
  );

  console.log(`[bookingService] Created booking ${bookingId} (PNR: ${pnr})`);

  return {
    bookingId,
    pnr,
    travelType,
    travelName,
    source: source || 'Unknown',
    destination: destination || 'Unknown',
    travelDate: travelDate || '',
    passengers,
    pricePerPerson,
    totalPrice,
    contactPhone,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Get a booking by its booking ID.
 * @param {string} bookingId - e.g. "TN1001"
 * @returns {object|null}
 */
function getBooking(bookingId) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM bookings WHERE booking_id = ?").get(bookingId);
  if (!row) return null;

  return {
    bookingId: row.booking_id,
    pnr: row.pnr,
    travelType: row.travel_type,
    travelName: row.travel_name,
    source: row.source,
    destination: row.destination,
    travelDate: row.travel_date,
    passengers: row.passengers,
    pricePerPerson: row.price_per_person,
    totalPrice: row.total_price,
    contactPhone: row.contact_phone,
    status: row.status,
    refundAmount: row.refund_amount || 0,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  };
}

/**
 * Cancel a booking with conditional refund policy.
 *
 * Policy:
 *   - Within 1 hour of booking  → 100% refund
 *   - Between 1–24 hours        → 50% refund
 *   - After 24 hours            → No refund
 *   - Travel date passed        → Cannot cancel
 *
 * @param {string} bookingId
 * @returns {object} { success, message, refundAmount, refundPercent }
 */
function cancelBooking(bookingId) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM bookings WHERE booking_id = ?").get(bookingId);

  if (!row) {
    return { success: false, message: 'பதிவு கிடைக்கவில்லை' };
  }

  if (row.status === 'cancelled') {
    return { success: false, message: 'இந்த பதிவு ஏற்கனவே ரத்து செய்யப்பட்டது' };
  }

  // Check if travel date has passed
  if (row.travel_date) {
    const travelDate = new Date(row.travel_date);
    if (!isNaN(travelDate.getTime()) && travelDate < new Date()) {
      return {
        success: false,
        message: 'பயண தேதி கடந்துவிட்டதால் ரத்து செய்ய இயலாது',
      };
    }
  }

  // Calculate time since booking
  const bookingTime = new Date(row.created_at);
  const now = new Date();
  const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);

  let refundPercent = 0;
  let refundAmount = 0;
  let message = '';

  if (hoursSinceBooking <= 1) {
    // Free cancellation — within 1 hour
    refundPercent = 100;
    refundAmount = row.total_price;
    message = `ரத்து செய்யப்பட்டது. முழு பணம் திருப்பி அளிக்கப்படும் (₹${refundAmount})`;
  } else if (hoursSinceBooking <= 24) {
    // 50% refund — 1 to 24 hours
    refundPercent = 50;
    refundAmount = Math.floor(row.total_price * 0.5);
    message = `ரத்து செய்யப்பட்டது. 50% பணம் திருப்பி அளிக்கப்படும் (₹${refundAmount})`;
  } else {
    // No refund — after 24 hours
    refundPercent = 0;
    refundAmount = 0;
    message = 'ரத்து செய்யப்பட்டது. 24 மணி நேரத்திற்கு மேல் ஆனதால் பணம் திருப்பி அளிக்கப்படாது';
  }

  // Update database
  db.prepare(`
    UPDATE bookings
    SET status = 'cancelled', refund_amount = ?, cancelled_at = CURRENT_TIMESTAMP
    WHERE booking_id = ?
  `).run(refundAmount, bookingId);

  console.log(`[bookingService] Cancelled ${bookingId} — refund: ${refundPercent}% (₹${refundAmount})`);

  return {
    success: true,
    message,
    refundAmount,
    refundPercent,
    bookingId,
  };
}

/**
 * Get all bookings, newest first.
 * @returns {Array<object>}
 */
function getAllBookings() {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM bookings ORDER BY created_at DESC").all();

  return rows.map(row => ({
    bookingId: row.booking_id,
    pnr: row.pnr,
    travelType: row.travel_type,
    travelName: row.travel_name,
    source: row.source,
    destination: row.destination,
    travelDate: row.travel_date,
    passengers: row.passengers,
    pricePerPerson: row.price_per_person,
    totalPrice: row.total_price,
    contactPhone: row.contact_phone,
    status: row.status,
    refundAmount: row.refund_amount || 0,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
  }));
}

module.exports = {
  createBooking,
  getBooking,
  cancelBooking,
  getAllBookings,
};
