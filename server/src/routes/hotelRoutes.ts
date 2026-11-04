import { Router } from 'express';
import { queryAll, queryOne } from '../db/index.js';
import { authenticate } from '../middleware/auth.js';

export const hotelRouter = Router();

// List Hotel Rooms (for Room Charge dropdown)
hotelRouter.get('/rooms', (req, res) => {
  const rooms = queryAll(`
    SELECT * FROM hotel_rooms 
    ORDER BY floor ASC, room_number ASC
  `);
  res.json(rooms);
});

// Verify Guest Room for charging
hotelRouter.post('/rooms/verify', (req, res) => {
  const { roomNumber, guestName, pin } = req.body;
  const room = queryOne(`
    SELECT * FROM hotel_rooms 
    WHERE room_number = ? AND is_occupied = 1
  `, [roomNumber]);

  if (!room) {
    return res.status(404).json({ error: `Room ${roomNumber} is currently not occupied.` });
  }

  if (!room.billing_authorized) {
    return res.status(403).json({ error: `Room ${roomNumber} does not have restaurant billing privileges authorized.` });
  }

  if (pin && room.verification_pin && room.verification_pin !== pin) {
    return res.status(401).json({ error: 'Invalid room guest PIN.' });
  }

  res.json({
    valid: true,
    room: {
      id: room.id,
      room_number: room.room_number,
      guest_name: room.guest_name,
      check_out_date: room.check_out_date,
    }
  });
});

// Room Charges History
hotelRouter.get('/charges', authenticate, (req, res) => {
  const charges = queryAll(`
    SELECT rc.*, hr.room_number, ts.session_code
    FROM room_charges rc
    JOIN hotel_rooms hr ON rc.room_id = hr.id
    JOIN table_sessions ts ON rc.table_session_id = ts.id
    ORDER BY rc.created_at DESC
  `);
  res.json(charges);
});

