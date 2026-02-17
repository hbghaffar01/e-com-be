const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Helper to get user ID from token
function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try { const p = jwt.verify(token, JWT_SECRET); return p.sub; } catch { return null; }
}

// POST /api/orders
router.post('/', async (req, res, next) => {
  try {
    const { items = [], total = 0, address = '', payment, paymentMethod } = req.body || {};
    const id = 'BZ-' + Math.floor(100000 + Math.random() * 900000);
    const status = 'Processing';

    // Extract user from token, if provided
    const userId = getUserId(req);

    await db.query(
      `INSERT INTO orders (id, date, total, status, address, payment_method, user_id) VALUES ($1, NOW(), $2, $3, $4, $5, $6)`,
      [id, total, status, address, paymentMethod || payment || '', userId]
    );

    for (const i of items) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, name, price, quantity, image)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [id, i.id || null, i.name, i.price, i.quantity, i.image || null]
      );
    }
    
    // Initialize tracking
    await db.query(
      `INSERT INTO order_tracking (order_id, status, description, location)
       VALUES ($1, 'Processing', 'Order has been placed and is being processed.', 'Warehouse')`,
      [id]
    );

    const ord = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    const itemsRes = await db.query('SELECT product_id AS id, name, price, quantity, image FROM order_items WHERE order_id = $1', [id]);

    // Format date to match frontend style
    const dateStr = new Date(ord.rows[0].date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });

    const response = {
      id,
      date: dateStr,
      items: itemsRes.rows,
      total,
      status,
      address,
      paymentMethod: paymentMethod || payment || ''
    };
    res.status(201).json(response);
  } catch (e) { next(e); }
});

// GET /api/orders
router.get('/', async (req, res, next) => {
  try {
    // If token present, fetch only that user's orders
    const userId = getUserId(req);

    // If no user ID, technically we should block or return empty, unless admin.
    // For now, if no user ID, we return empty array to secure it, unless it's intended for admin (not implemented yet).
    if (!userId) {
       // Check if there is a query param for admin or just return empty
       // For this MVP, let's just return empty to be safe
       return res.json([]);
    }

    const ordersRes = await db.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY date DESC', [userId]);

    const orders = [];
    for (const o of ordersRes.rows) {
      const itemsRes = await db.query('SELECT product_id AS id, name, price, quantity, image FROM order_items WHERE order_id = $1', [o.id]);
      const trackingRes = await db.query('SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY timestamp DESC', [o.id]);
      
      orders.push({
        id: o.id,
        date: new Date(o.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
        items: itemsRes.rows,
        total: Number(o.total),
        status: o.status,
        address: o.address,
        paymentMethod: o.payment_method,
        tracking: trackingRes.rows
      });
    }
    res.json(orders);
  } catch (e) { next(e); }
});

// GET /api/orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const orderRes = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = orderRes.rows[0];
    
    // Security check: only allow owner to see order
    if (order.user_id && order.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const itemsRes = await db.query('SELECT product_id AS id, name, price, quantity, image FROM order_items WHERE order_id = $1', [id]);
    const trackingRes = await db.query('SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY timestamp DESC', [id]);

    res.json({
      id: order.id,
      date: new Date(order.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: itemsRes.rows,
      total: Number(order.total),
      status: order.status,
      address: order.address,
      paymentMethod: order.payment_method,
      tracking: trackingRes.rows,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery,
      notes: order.notes
    });
  } catch (e) { next(e); }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Check if order belongs to user and can be cancelled
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Only allow cancellation if order is not shipped yet
    if (['Shipped', 'Delivered'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order that has been shipped' });
    }
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = $1, notes = $2 WHERE id = $3',
      ['Cancelled', reason || 'Cancelled by customer', id]
    );
    
    // Add tracking entry
    await db.query(
      `INSERT INTO order_tracking (order_id, status, description, location)
       VALUES ($1, 'Cancelled', $2, 'Customer Request')`,
      [id, reason || 'Order cancelled by customer']
    );
    
    // Create notification
    const { createNotification } = require('./notifications');
    await createNotification(
      userId,
      'Order Cancelled',
      `Your order #${id} has been cancelled successfully.`,
      'order',
      { orderId: id, reason }
    );
    
    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (e) { next(e); }
});

// POST /api/orders/:id/return
router.post('/:id/return', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    const { reason, items = [] } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Return reason is required' });
    }
    
    // Check if order belongs to user and is delivered
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    if (order.status !== 'Delivered') {
      return res.status(400).json({ error: 'Can only return delivered orders' });
    }
    
    // Check if return window is still open (e.g., 15 days)
    const deliveryDate = new Date(order.date);
    const returnDeadline = new Date(deliveryDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    
    if (new Date() > returnDeadline) {
      return res.status(400).json({ error: 'Return window has expired' });
    }
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = $1, notes = $2 WHERE id = $3',
      ['Return Requested', `Return requested: ${reason}`, id]
    );
    
    // Add tracking entry
    await db.query(
      `INSERT INTO order_tracking (order_id, status, description, location)
       VALUES ($1, 'Return Requested', $2, 'Customer Request')`,
      [id, `Return requested: ${reason}`]
    );
    
    // Create notification
    const { createNotification } = require('./notifications');
    await createNotification(
      userId,
      'Return Request Submitted',
      `Your return request for order #${id} has been submitted and is being reviewed.`,
      'order',
      { orderId: id, reason, items }
    );
    
    res.json({ 
      success: true, 
      message: 'Return request submitted successfully',
      returnId: `RET-${id}-${Date.now()}`
    });
  } catch (e) { next(e); }
});

// GET /api/orders/:id/tracking
router.get('/:id/tracking', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    
    // Check if order belongs to user (or allow public tracking with tracking number)
    const orderResult = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orderResult.rows[0];
    
    // Security check: only allow owner to see detailed tracking
    if (order.user_id && order.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const trackingResult = await db.query(
      'SELECT * FROM order_tracking WHERE order_id = $1 ORDER BY timestamp ASC',
      [id]
    );
    
    res.json({
      orderId: id,
      status: order.status,
      trackingNumber: order.tracking_number,
      estimatedDelivery: order.estimated_delivery,
      tracking: trackingResult.rows
    });
  } catch (e) { next(e); }
});

// POST /api/orders/:id/feedback
router.post('/:id/feedback', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    const { rating, comment, deliveryRating, packagingRating } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }
    
    // Check if order belongs to user and is delivered
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2 AND status = $3',
      [id, userId, 'Delivered']
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or not delivered' });
    }
    
    // Store feedback (you might want to create a separate feedback table)
    await db.query(
      'UPDATE orders SET notes = COALESCE(notes, \'\') || $1 WHERE id = $2',
      [`\nCustomer Feedback: Rating ${rating}/5. ${comment || ''}`, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Thank you for your feedback!' 
    });
  } catch (e) { next(e); }
});

module.exports = router;
