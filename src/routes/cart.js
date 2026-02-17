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

// GET /api/cart
router.get('/', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    const result = await db.query('SELECT product_id AS id, name, price, quantity, image FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC', [uid]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/cart/add
router.post('/add', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    const { id, name, price, image } = req.body || {};
    if (!id) return res.status(400).json({ error: 'product id required' });
    await db.query(
      `INSERT INTO cart_items (user_id, product_id, name, price, quantity, image)
       VALUES ($1,$2,$3,$4,1,$5)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + 1`,
      [uid, id, name || '', price || 0, image || null]
    );
    const result = await db.query('SELECT product_id AS id, name, price, quantity, image FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC', [uid]);
    res.status(201).json(result.rows);
  } catch (e) { next(e); }
});

// PATCH /api/cart/:productId
router.patch('/:productId', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    const productId = req.params.productId;
    const { quantity } = req.body || {};
    if (quantity == null) return res.status(400).json({ error: 'quantity required' });
    if (quantity <= 0) {
      await db.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [uid, productId]);
    } else {
      await db.query('UPDATE cart_items SET quantity = $1 WHERE user_id = $2 AND product_id = $3', [quantity, uid, productId]);
    }
    const result = await db.query('SELECT product_id AS id, name, price, quantity, image FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC', [uid]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

// DELETE /api/cart/:productId
router.delete('/:productId', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    await db.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [uid, req.params.productId]);
    const result = await db.query('SELECT product_id AS id, name, price, quantity, image FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC', [uid]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

// DELETE /api/cart (clear)
router.delete('/', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    await db.query('DELETE FROM cart_items WHERE user_id = $1', [uid]);
    res.json([]);
  } catch (e) { next(e); }
});

module.exports = router;