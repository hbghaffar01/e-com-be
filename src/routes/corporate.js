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

async function isCorporateUser(userId) {
  const result = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0 && result.rows[0].role === 'corporate';
}

// GET /api/corporate/profile
router.get('/profile', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!(await isCorporateUser(userId))) {
      return res.status(403).json({ error: 'Corporate access required' });
    }
    
    const result = await db.query(
      'SELECT * FROM corporate_accounts WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Corporate profile not found' });
    }
    
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

// PUT /api/corporate/profile
router.put('/profile', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!(await isCorporateUser(userId))) {
      return res.status(403).json({ error: 'Corporate access required' });
    }
    
    const {
      companyName,
      ntn,
      strn,
      businessType,
      representativeName,
      verificationDocuments
    } = req.body;
    
    const corporateId = 'CORP-' + Math.random().toString(36).substr(2, 9);
    
    await db.query(
      `INSERT INTO corporate_accounts 
       (id, user_id, company_name, ntn, strn, business_type, representative_name, verification_documents)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         company_name = EXCLUDED.company_name,
         ntn = EXCLUDED.ntn,
         strn = EXCLUDED.strn,
         business_type = EXCLUDED.business_type,
         representative_name = EXCLUDED.representative_name,
         verification_documents = EXCLUDED.verification_documents`,
      [
        corporateId,
        userId,
        companyName,
        ntn,
        strn,
        businessType,
        representativeName,
        JSON.stringify(verificationDocuments || {})
      ]
    );
    
    const result = await db.query(
      'SELECT * FROM corporate_accounts WHERE user_id = $1',
      [userId]
    );
    
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

// GET /api/corporate/credit-info
router.get('/credit-info', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!(await isCorporateUser(userId))) {
      return res.status(403).json({ error: 'Corporate access required' });
    }
    
    const result = await db.query(
      'SELECT credit_limit, used_credit, is_verified FROM corporate_accounts WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Corporate account not found' });
    }
    
    const account = result.rows[0];
    const availableCredit = account.credit_limit - account.used_credit;
    
    res.json({
      creditLimit: account.credit_limit,
      usedCredit: account.used_credit,
      availableCredit,
      isVerified: account.is_verified
    });
  } catch (e) { next(e); }
});

// GET /api/corporate/quotes
router.get('/quotes', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!(await isCorporateUser(userId))) {
      return res.status(403).json({ error: 'Corporate access required' });
    }
    
    const result = await db.query(
      `SELECT bq.*, p.name as product_name, p.image as product_image, m.company_name as merchant_name
       FROM bulk_quotes bq
       LEFT JOIN products p ON bq.product_id = p.id
       LEFT JOIN merchants m ON bq.merchant_id = m.id
       WHERE bq.user_id = $1
       ORDER BY bq.created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/corporate/quotes
router.post('/quotes', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!(await isCorporateUser(userId))) {
      return res.status(403).json({ error: 'Corporate access required' });
    }
    
    const { productId, quantity, requestedPrice, notes } = req.body;
    
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Product ID and valid quantity are required' });
    }
    
    // Get product info
    const productResult = await db.query('SELECT * FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productResult.rows[0];
    const quoteId = 'BQ-' + Math.random().toString(36).substr(2, 9);
    const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    
    await db.query(
      `INSERT INTO bulk_quotes 
       (id, user_id, product_id, product_name, quantity, requested_price, merchant_id, notes, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        quoteId,
        userId,
        productId,
        product.name,
        quantity,
        requestedPrice || null,
        product.merchant_id,
        notes || null,
        validUntil
      ]
    );
    
    // Create notification for merchant if exists
    if (product.merchant_id) {
      const merchantResult = await db.query('SELECT user_id FROM merchants WHERE id = $1', [product.merchant_id]);
      if (merchantResult.rows.length > 0) {
        const { createNotification } = require('./notifications');
        await createNotification(
          merchantResult.rows[0].user_id,
          'New Bulk Quote Request',
          `You have received a bulk quote request for ${quantity} units of ${product.name}`,
          'merchant',
          { quoteId, productId, quantity }
        );
      }
    }
    
    const result = await db.query(
      `SELECT bq.*, p.name as product_name, p.image as product_image
       FROM bulk_quotes bq
       LEFT JOIN products p ON bq.product_id = p.id
       WHERE bq.id = $1`,
      [quoteId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (e) { next(e); }
});

// PUT /api/corporate/quotes/:id
router.put('/quotes/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    const { quantity, requestedPrice, notes } = req.body;
    
    // Check if quote belongs to user
    const quoteResult = await db.query(
      'SELECT * FROM bulk_quotes WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (quoteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Quote not found' });
    }
    
    const quote = quoteResult.rows[0];
    
    // Only allow updates if quote is still pending
    if (quote.status !== 'Pending') {
      return res.status(400).json({ error: 'Cannot update quote that is not pending' });
    }
    
    await db.query(
      `UPDATE bulk_quotes SET
       quantity = COALESCE($1, quantity),
       requested_price = COALESCE($2, requested_price),
       notes = COALESCE($3, notes),
       updated_at = NOW()
       WHERE id = $4`,
      [quantity, requestedPrice, notes, id]
    );
    
    const result = await db.query(
      `SELECT bq.*, p.name as product_name, p.image as product_image
       FROM bulk_quotes bq
       LEFT JOIN products p ON bq.product_id = p.id
       WHERE bq.id = $1`,
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;