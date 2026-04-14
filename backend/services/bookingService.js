/**
 * bookingService.js
 * Handles mock booking creation, retrieval, and conditional cancellation with PG.
 */

const { getDb } = require('../db');

function generatePnr() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = 'PNR';
  for (let i = 0; i < 9; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

function getTableName(travelType) {
  const t = (travelType || 'unknown').replace(/[^\w\s]/g, '').trim().toLowerCase();
  if (t.includes('bus')) return 'bus_bookings';
  if (t.includes('train')) return 'train_bookings';
  if (t.includes('flight')) return 'flight_bookings';
  if (t.includes('hotel')) return 'hotel_bookings';
  return 'bus_bookings'; // fallback
}

async function getNextBookingId() {
  const db = await getDb();
  // Fetch from all tables to find max booking_id
  const tables = ['bus_bookings', 'train_bookings', 'flight_bookings', 'hotel_bookings'];
  let maxNum = 1000;
  for (const table of tables) {
    const res = await db.query(`SELECT booking_id FROM ${table} ORDER BY id DESC LIMIT 1`);
    if (res.rows.length > 0) {
      const num = parseInt(res.rows[0].booking_id.replace('TN', ''), 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `TN${maxNum + 1}`;
}

function validatePhone(phone) {
  return /^\d{10}$/.test(phone);
}

async function createBooking({ travelOption, passengers, contactPhone, source, destination, travelDate }) {
  if (!travelOption || !travelOption.name || !travelOption.price) {
    throw new Error('சரியான பயண விருப்பத்தை தேர்வு செய்யவும்');
  }
  if (!passengers || passengers < 1 || passengers > 6) {
    throw new Error('பயணிகள் எண்ணிக்கை 1 முதல் 6 வரை இருக்க வேண்டும்');
  }
  if (!validatePhone(contactPhone)) {
    throw new Error('சரியான தொலைபேசி எண்ணை உள்ளிடவும் (10 இலக்கங்கள்)');
  }

  const db = await getDb();
  const bookingId = await getNextBookingId();
  const pnr = generatePnr();
  const pricePerPerson = travelOption.price;
  const totalPrice = pricePerPerson * passengers;
  const travelType = (travelOption.type || 'unknown').replace(/[^\w\s]/g, '').trim().toLowerCase();
  const travelName = travelOption.name;
  const tableName = getTableName(travelType);

  await db.query(`
    INSERT INTO ${tableName}
      (booking_id, user_id, travel_name, source, destination,
       travel_date, passengers, price_per_person, total_price, contact_phone, pnr, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'confirmed')
  `, [
    bookingId, 'guest', travelName, source || 'Unknown', destination || 'Unknown',
    travelDate || '', passengers, pricePerPerson, totalPrice, contactPhone, pnr
  ]);

  console.log(`[bookingService] Created booking ${bookingId} in ${tableName} (PNR: ${pnr})`);

  return {
    bookingId, pnr, travelType, travelName,
    source: source || 'Unknown',
    destination: destination || 'Unknown',
    travelDate: travelDate || '',
    passengers, pricePerPerson, totalPrice, contactPhone,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
}

async function getBooking(bookingId) {
  const db = await getDb();
  const tables = ['bus_bookings', 'train_bookings', 'flight_bookings', 'hotel_bookings'];
  for (const table of tables) {
    const res = await db.query(`SELECT *, '${table}' as _table FROM ${table} WHERE booking_id = $1`, [bookingId]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        bookingId: row.booking_id, pnr: row.pnr, travelType: row._table.replace('_bookings', ''),
        travelName: row.travel_name, source: row.source, destination: row.destination,
        travelDate: row.travel_date, passengers: row.passengers,
        pricePerPerson: row.price_per_person, totalPrice: row.total_price,
        contactPhone: row.contact_phone, status: row.status,
        refundAmount: row.refund_amount || 0, cancelledAt: row.cancelled_at, createdAt: row.created_at,
      };
    }
  }
  return null;
}

async function cancelBooking(bookingId) {
  const db = await getDb();
  
  // Find which table has it
  const tables = ['bus_bookings', 'train_bookings', 'flight_bookings', 'hotel_bookings'];
  let row = null;
  let tableName = '';
  for (const tbl of tables) {
    const res = await db.query(`SELECT * FROM ${tbl} WHERE booking_id = $1`, [bookingId]);
    if (res.rows.length > 0) {
      row = res.rows[0];
      tableName = tbl;
      break;
    }
  }

  if (!row) return { success: false, message: 'பதிவு கிடைக்கவில்லை' };
  if (row.status === 'cancelled') return { success: false, message: 'இந்த பதிவு ஏற்கனவே ரத்து செய்யப்பட்டது' };

  if (row.travel_date) {
    const travelDate = new Date(row.travel_date);
    if (!isNaN(travelDate.getTime()) && travelDate < new Date()) {
      return { success: false, message: 'பயண தேதி கடந்துவிட்டதால் ரத்து செய்ய இயலாது' };
    }
  }

  const bookingTime = new Date(row.created_at);
  const now = new Date();
  const hoursSinceBooking = (now - bookingTime) / (1000 * 60 * 60);

  let refundPercent = 0, refundAmount = 0, message = '';
  if (hoursSinceBooking <= 1) {
    refundPercent = 100;
    refundAmount = row.total_price;
    message = `ரத்து செய்யப்பட்டது. முழு பணம் திருப்பி அளிக்கப்படும் (₹${refundAmount})`;
  } else if (hoursSinceBooking <= 24) {
    refundPercent = 50;
    refundAmount = Math.floor(row.total_price * 0.5);
    message = `ரத்து செய்யப்பட்டது. 50% பணம் திருப்பி அளிக்கப்படும் (₹${refundAmount})`;
  } else {
    message = 'ரத்து செய்யப்பட்டது. 24 மணி நேரத்திற்கு மேல் ஆனதால் பணம் திருப்பி அளிக்கப்படாது';
  }

  await db.query(`
    UPDATE ${tableName}
    SET status = 'cancelled', refund_amount = $1, cancelled_at = CURRENT_TIMESTAMP
    WHERE booking_id = $2
  `, [refundAmount, bookingId]);

  return { success: true, message, refundAmount, refundPercent, bookingId };
}

async function getAllBookings() {
  const db = await getDb();
  const queries = [
    `SELECT *, 'bus' as travel_type FROM bus_bookings`,
    `SELECT *, 'train' as travel_type FROM train_bookings`,
    `SELECT *, 'flight' as travel_type FROM flight_bookings`,
    `SELECT *, 'hotel' as travel_type FROM hotel_bookings`
  ];
  
  const res = await db.query(queries.join(' UNION ALL ') + ' ORDER BY created_at DESC');
  
  return res.rows.map(row => ({
    bookingId: row.booking_id, pnr: row.pnr, travelType: row.travel_type,
    travelName: row.travel_name, source: row.source, destination: row.destination,
    travelDate: row.travel_date, passengers: row.passengers,
    pricePerPerson: row.price_per_person, totalPrice: row.total_price,
    contactPhone: row.contact_phone, status: row.status,
    refundAmount: row.refund_amount || 0, cancelledAt: row.cancelled_at, createdAt: row.created_at,
  }));
}

module.exports = { createBooking, getBooking, cancelBooking, getAllBookings };
