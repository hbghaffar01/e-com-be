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

// GET /api/reviews/:productId
router.get('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await db.query(
      `SELECT r.id, r.product_id, r.user_id, r.rating, r.comment, r.created_at, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/reviews/:productId
router.post('/:productId', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const { productId } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const result = await db.query(
      `INSERT INTO reviews (product_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (product_id, user_id) 
       DO UPDATE SET rating = $3, comment = $4, created_at = NOW()
       RETURNING id, product_id, user_id, rating, comment, created_at`,
      [productId, uid, rating, comment]
    );

    // Get user name for the response
    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [uid]);
    const userName = userRes.rows[0]?.name || 'Anonymous';

    res.status(201).json({ ...result.rows[0], user_name: userName });
  } catch (e) { next(e); }
});

module.exports = router;
