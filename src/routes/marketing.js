const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/marketing/ad-inquiries
router.post('/ad-inquiries', async (req, res, next) => {
  try {
    const inquiry = req.body || {};
    const id = 'AD-' + Math.floor(1000 + Math.random() * 9000);
    const date = new Date().toISOString().split('T')[0];
    const values = [
      id,
      inquiry.companyName || 'Unknown Corp',
      inquiry.contactName || 'Guest',
      inquiry.email || '',
      inquiry.phone || '',
      inquiry.budget || '50k - 100k',
      inquiry.adType || 'Sponsored Search',
      inquiry.targetCategory || 'General',
      'New',
      date
    ];
    await db.query(
      `INSERT INTO ad_inquiries 
       (id, company_name, contact_name, email, phone, budget, ad_type, target_category, status, date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      values
    );
    res.status(201).json({ id, ...req.body, status: 'New', date });
  } catch (e) { next(e); }
});

// GET /api/marketing/ad-inquiries
router.get('/ad-inquiries', async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM ad_inquiries ORDER BY date DESC`);
    res.json(result.rows);
  } catch (e) { next(e); }
});

module.exports = router;