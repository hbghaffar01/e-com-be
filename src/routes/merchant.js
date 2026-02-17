const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/merchant/:merchantId/stats
router.get('/:merchantId/stats', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const totalSalesResult = await db.query(
      `SELECT COALESCE(SUM(oi.price * oi.quantity),0) AS total
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.merchant_id = $1`,
      [merchantId]
    );
    const ordersCountResult = await db.query(
      `SELECT COUNT(DISTINCT oi.order_id) AS count
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE p.merchant_id = $1`,
      [merchantId]
    );
    const activeProductsResult = await db.query(
      `SELECT COUNT(*) AS count FROM products WHERE merchant_id = $1`,
      [merchantId]
    );

    res.json({
      totalSales: Number(totalSalesResult.rows[0].total),
      ordersCount: Number(ordersCountResult.rows[0].count),
      activeProducts: Number(activeProductsResult.rows[0].count),
      visitorCount: 1250,
      rating: 4.8
    });
  } catch (e) { next(e); }
});

// GET /api/merchant/:merchantId/profile
router.get('/:merchantId/profile', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const result = await db.query(`SELECT * FROM merchants WHERE id = $1`, [merchantId]);
    res.json(result.rows[0] || null);
  } catch (e) { next(e); }
});

// PUT /api/merchant/:merchantId/profile
router.put('/:merchantId/profile', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const m = req.body || {};
    await db.query(
      `INSERT INTO merchants (id, company_name, owner_name, email, phone, tax_id, store_status, joined_date, banners, description, store_policy, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (id) DO UPDATE SET 
         company_name = EXCLUDED.company_name,
         owner_name = EXCLUDED.owner_name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         tax_id = EXCLUDED.tax_id,
         store_status = EXCLUDED.store_status,
         joined_date = EXCLUDED.joined_date,
         banners = EXCLUDED.banners,
         description = EXCLUDED.description,
         store_policy = EXCLUDED.store_policy,
         location = EXCLUDED.location`,
      [
        merchantId,
        m.companyName || null,
        m.ownerName || null,
        m.email || null,
        m.phone || null,
        m.taxId || null,
        m.storeStatus || 'Pending',
        m.joinedDate || new Date().toISOString(),
        JSON.stringify(m.banners || []),
        m.description || null,
        m.storePolicy || null,
        m.location || null
      ]
    );
    res.json({ success: true });
  } catch (e) { next(e); }
});

// GET /api/merchant/:merchantId/products
router.get('/:merchantId/products', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const result = await db.query(`SELECT * FROM products WHERE merchant_id = $1 ORDER BY id DESC`, [merchantId]);
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/merchant/:merchantId/products
router.post('/:merchantId/products', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const p = req.body || {};
    const primaryImage = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (
      p.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'
    );
    const id = 'MP-' + Math.random().toString(36).substr(2, 9);
    const badge = (p.oldPrice && p.price && p.oldPrice > p.price) ? 'Big Discount' : 'New Arrival';

    await db.query(
      `INSERT INTO products (
        id, name, brand, price, old_price, rating, reviews, image, images, is_express, category, sub_category, badge, specs, merchant_id, made_in, warranty_detail, delivery_time, delivery_area, bulk_min_qty, bulk_price
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
      )`,
      [
        id,
        p.name || 'New Product',
        p.brand || 'Merchant Brand',
        p.price || 0,
        p.oldPrice || null,
        4.5,
        1,
        primaryImage,
        JSON.stringify(p.images || [primaryImage]),
        p.isExpress ?? true,
        p.category || 'Electronics',
        p.subCategory || null,
        badge,
        JSON.stringify(p.specs || {}),
        merchantId,
        p.madeIn || 'Pakistan',
        p.warrantyDetail || 'No Warranty',
        p.deliveryTime || '2-4 Days',
        p.deliveryArea || 'Nationwide',
        p.bulkMinQty || null,
        p.bulkPrice || null
      ]
    );

    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (e) { next(e); }
});

// GET /api/merchant/:merchantId/promotions
router.get('/:merchantId/promotions', async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM promotions ORDER BY start_date DESC');
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/merchant/:merchantId/promotions
router.post('/:merchantId/promotions', async (req, res, next) => {
  try {
    const { merchantId } = req.params;
    const promo = req.body || {};
    const id = 'PR-' + Math.random().toString(36).substr(2, 9);
    await db.query(
      `INSERT INTO promotions (id, name, discount_percentage, start_date, end_date, status, type, min_purchase, merchant_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        id,
        promo.name || 'Campaign',
        promo.discountPercentage || 10,
        promo.startDate || new Date().toISOString(),
        promo.endDate || new Date().toISOString(),
        promo.status || 'Active',
        promo.type || 'Flash Sale',
        promo.minPurchase || 0,
        merchantId
      ]
    );
    const result = await db.query('SELECT * FROM promotions WHERE id = $1', [id]);
    res.status(201).json(result.rows[0]);
  } catch (e) { next(e); }
});

module.exports = router;