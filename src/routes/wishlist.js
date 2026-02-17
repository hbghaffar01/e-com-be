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

// GET /api/wishlist
router.get('/', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const result = await db.query(
      `SELECT p.*, w.added_at 
       FROM wishlist_items w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [uid]
    );
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/wishlist/:productId
router.post('/:productId', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const { productId } = req.params;
    
    await db.query(
      `INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [uid, productId]
    );
    
    res.status(201).json({ success: true });
  } catch (e) { next(e); }
});

// DELETE /api/wishlist/:productId
router.delete('/:productId', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const { productId } = req.params;
    
    await db.query(
      `DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2`,
      [uid, productId]
    );
    
    res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
