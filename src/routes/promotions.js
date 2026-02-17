const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/promotions
router.get('/', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM promotions ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (e) { next(e); }
});

module.exports = router;