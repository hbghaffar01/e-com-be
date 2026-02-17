const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products?category=Electronics
router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query;
    let result;
    if (category) {
      result = await db.query(
        `SELECT * FROM products WHERE UPPER(category) = UPPER($1) ORDER BY id`,
        [category]
      );
    } else {
      result = await db.query(`SELECT * FROM products ORDER BY id`);
    }
    res.json(result.rows);
  } catch (e) { next(e); }
});

// GET /api/products/search?q=iphone
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString();
    const result = await db.query(
      `SELECT * FROM products WHERE 
       LOWER(name) LIKE LOWER('%' || $1 || '%') OR 
       LOWER(brand) LIKE LOWER('%' || $1 || '%') OR 
       LOWER(category) LIKE LOWER('%' || $1 || '%')
       ORDER BY id`,
      [q]
    );
    res.json(result.rows);
  } catch (e) { next(e); }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query(`SELECT * FROM products WHERE id = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

// POST /api/products/:id/view
router.post('/:id/view', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    // Check if product exists
    const productResult = await db.query('SELECT id FROM products WHERE id = $1', [id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Record the view
    await db.query(
      'INSERT INTO product_views (product_id, user_id, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
      [id, userId, ipAddress, userAgent]
    );
    
    res.json({ success: true });
  } catch (e) { next(e); }
});

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    // Get products with high ratings and recent views
    const result = await db.query(`
      SELECT p.*, COALESCE(view_count, 0) as views
      FROM products p
      LEFT JOIN (
        SELECT product_id, COUNT(*) as view_count
        FROM product_views
        WHERE viewed_at >= NOW() - INTERVAL '7 days'
        GROUP BY product_id
      ) pv ON p.id = pv.product_id
      WHERE p.rating >= 4.0
      ORDER BY p.rating DESC, views DESC, p.reviews DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (e) { next(e); }
});

// GET /api/products/trending
router.get('/trending', async (req, res, next) => {
  try {
    // Get products with most views in last 7 days
    const result = await db.query(`
      SELECT p.*, COUNT(pv.id) as recent_views
      FROM products p
      LEFT JOIN product_views pv ON p.id = pv.product_id AND pv.viewed_at >= NOW() - INTERVAL '7 days'
      GROUP BY p.id
      ORDER BY recent_views DESC, p.rating DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (e) { next(e); }
});

// GET /api/products/recommendations/:userId
router.get('/recommendations/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    // Simple recommendation based on user's order history and views
    const result = await db.query(`
      WITH user_categories AS (
        SELECT DISTINCT p.category
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.user_id = $1
        UNION
        SELECT DISTINCT p.category
        FROM product_views pv
        JOIN products p ON pv.product_id = p.id
        WHERE pv.user_id = $1
      ),
      user_purchased AS (
        SELECT DISTINCT oi.product_id
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = $1
      )
      SELECT p.*
      FROM products p
      WHERE p.category IN (SELECT category FROM user_categories)
        AND p.id NOT IN (SELECT product_id FROM user_purchased)
        AND p.rating >= 4.0
      ORDER BY p.rating DESC, p.reviews DESC
      LIMIT 15
    `, [userId]);
    
    res.json(result.rows);
  } catch (e) { next(e); }
});

function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try { 
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
    const p = jwt.verify(token, JWT_SECRET); 
    return p.sub; 
  } catch { return null; }
}

module.exports = router;