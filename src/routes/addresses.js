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

// GET /api/addresses
router.get('/', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const result = await db.query(
      `SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, id`,
      [uid]
    );
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/addresses
router.post('/', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const { label, street, village, city, lat, lng, isDefault } = req.body;
    const id = 'ADDR-' + Math.random().toString(36).substr(2, 9);
    
    if (isDefault) {
      await db.query(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`, [uid]);
    }
    
    await db.query(
      `INSERT INTO user_addresses (id, user_id, label, street, village, city, lat, lng, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, uid, label, street, village, city, lat, lng, isDefault || false]
    );
    
    const result = await db.query(`SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC`, [uid]);
    res.status(201).json(result.rows);
  } catch (e) { next(e); }
});

// PUT /api/addresses/:id
router.put('/:id', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    const { label, street, village, city, lat, lng, isDefault } = req.body;
    
    if (isDefault) {
      await db.query(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1`, [uid]);
    }
    
    await db.query(
      `UPDATE user_addresses 
       SET label = COALESCE($1, label), 
           street = COALESCE($2, street), 
           village = COALESCE($3, village), 
           city = COALESCE($4, city), 
           lat = COALESCE($5, lat), 
           lng = COALESCE($6, lng), 
           is_default = COALESCE($7, is_default)
       WHERE id = $8 AND user_id = $9`,
      [label, street, village, city, lat, lng, isDefault, id, uid]
    );
    
    const result = await db.query(`SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC`, [uid]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

// DELETE /api/addresses/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const uid = getUserId(req);
    if (!uid) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    await db.query(`DELETE FROM user_addresses WHERE id = $1 AND user_id = $2`, [id, uid]);
    
    const result = await db.query(`SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC`, [uid]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

module.exports = router;
