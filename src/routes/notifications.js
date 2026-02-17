const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try { const p = jwt.verify(token, JWT_SECRET); return p.sub; } catch { return null; }
}

// GET /api/notifications
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    
    let query = `
      SELECT id, title, message, type, is_read, data, created_at
      FROM notifications 
      WHERE user_id = $1
    `;
    const params = [userId];
    
    if (unreadOnly === 'true') {
      query += ' AND is_read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get unread count
    const unreadResult = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    
    res.json({
      notifications: result.rows,
      unreadCount: parseInt(unreadResult.rows[0].count),
      total: result.rows.length
    });
  } catch (e) { next(e); }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, notification: result.rows[0] });
  } catch (e) { next(e); }
});

// PUT /api/notifications/mark-all-read
router.put('/mark-all-read', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (e) { next(e); }
});

// POST /api/notifications (Internal use - for creating notifications)
router.post('/', async (req, res, next) => {
  try {
    const { userId, title, message, type = 'system', data = {} } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'userId, title, and message are required' });
    }
    
    const result = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, title, message, type, JSON.stringify(data)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (e) { next(e); }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted' });
  } catch (e) { next(e); }
});

// Helper function to create notifications (can be used by other modules)
async function createNotification(userId, title, message, type = 'system', data = {}) {
  try {
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, data)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, message, type, JSON.stringify(data)]
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

module.exports = { router, createNotification };