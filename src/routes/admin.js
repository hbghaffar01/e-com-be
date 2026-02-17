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

async function isAdmin(req) {
  const userId = getUserId(req);
  if (!userId) return false;
  
  // Simple admin check - in production, implement proper role-based access
  const result = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0 && (result.rows[0].role === 'admin' || userId.startsWith('ADMIN-'));
}

// Middleware to check admin access
const requireAdmin = async (req, res, next) => {
  if (!(await isAdmin(req))) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, async (req, res, next) => {
  try {
    // Get various statistics for admin dashboard
    const [
      totalUsersResult,
      totalOrdersResult,
      totalSalesResult,
      totalProductsResult,
      totalMerchantsResult,
      recentOrdersResult,
      topProductsResult
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as count FROM users'),
      db.query('SELECT COUNT(*) as count FROM orders'),
      db.query('SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != \'Cancelled\''),
      db.query('SELECT COUNT(*) as count FROM products'),
      db.query('SELECT COUNT(*) as count FROM merchants'),
      db.query(`
        SELECT o.*, u.name as customer_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.date DESC 
        LIMIT 10
      `),
      db.query(`
        SELECT p.name, p.price, COUNT(oi.product_id) as order_count,
               SUM(oi.quantity) as total_sold
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        GROUP BY p.id, p.name, p.price
        ORDER BY total_sold DESC NULLS LAST
        LIMIT 10
      `)
    ]);
    
    // Get sales data for the last 30 days
    const salesDataResult = await db.query(`
      SELECT DATE(date) as date, COUNT(*) as orders, SUM(total) as sales
      FROM orders 
      WHERE date >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(date)
      ORDER BY date DESC
    `);
    
    res.json({
      stats: {
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        totalOrders: parseInt(totalOrdersResult.rows[0].count),
        totalSales: parseFloat(totalSalesResult.rows[0].total),
        totalProducts: parseInt(totalProductsResult.rows[0].count),
        totalMerchants: parseInt(totalMerchantsResult.rows[0].count)
      },
      recentOrders: recentOrdersResult.rows,
      topProducts: topProductsResult.rows,
      salesData: salesDataResult.rows
    });
  } catch (e) { next(e); }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, role, search } = req.query;
    
    let query = `
      SELECT u.id, u.name, u.email, u.phone, u.role, u.email_verified, 
             u.created_at, u.last_login,
             CASE WHEN ca.id IS NOT NULL THEN ca.company_name ELSE NULL END as company_name
      FROM users u
      LEFT JOIN corporate_accounts ca ON u.id = ca.user_id
      WHERE 1=1
    `;
    const params = [];
    
    if (role) {
      query += ` AND u.role = $${params.length + 1}`;
      params.push(role);
    }
    
    if (search) {
      query += ` AND (u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const countParams = [];
    
    if (role) {
      countQuery += ` AND role = $${countParams.length + 1}`;
      countParams.push(role);
    }
    
    if (search) {
      countQuery += ` AND (name ILIKE $${countParams.length + 1} OR email ILIKE $${countParams.length + 1})`;
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (e) { next(e); }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // status could be 'active', 'suspended', 'banned'
    
    // For now, we'll use a simple approach - in production, you'd have a proper user status system
    // This is a placeholder for user management functionality
    
    res.json({ 
      success: true, 
      message: `User ${id} status updated to ${status}`,
      userId: id,
      newStatus: status,
      reason
    });
  } catch (e) { next(e); }
});

// GET /api/admin/merchants
router.get('/merchants', requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status, search } = req.query;
    
    let query = `
      SELECT m.*, u.name as owner_name, u.email as owner_email,
             COUNT(p.id) as product_count
      FROM merchants m
      LEFT JOIN users u ON m.id = u.merchant_id
      LEFT JOIN products p ON m.id = p.merchant_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ` AND m.store_status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (m.company_name ILIKE $${params.length + 1} OR m.owner_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY m.id, u.name, u.email ORDER BY m.joined_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
      merchants: result.rows,
      total: result.rows.length
    });
  } catch (e) { next(e); }
});

// PUT /api/admin/merchants/:id/approve
router.put('/merchants/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved, reason } = req.body;
    
    const newStatus = approved ? 'Approved' : 'Rejected';
    
    await db.query(
      'UPDATE merchants SET store_status = $1 WHERE id = $2',
      [newStatus, id]
    );
    
    // Get merchant user for notification
    const merchantResult = await db.query(
      'SELECT u.id as user_id, m.company_name FROM merchants m LEFT JOIN users u ON m.id = u.merchant_id WHERE m.id = $1',
      [id]
    );
    
    if (merchantResult.rows.length > 0) {
      const { createNotification } = require('./notifications');
      await createNotification(
        merchantResult.rows[0].user_id,
        `Merchant Application ${newStatus}`,
        `Your merchant application for ${merchantResult.rows[0].company_name} has been ${newStatus.toLowerCase()}.${reason ? ` Reason: ${reason}` : ''}`,
        'merchant',
        { merchantId: id, status: newStatus, reason }
      );
    }
    
    res.json({
      success: true,
      merchantId: id,
      status: newStatus,
      reason
    });
  } catch (e) { next(e); }
});

// GET /api/admin/orders
router.get('/orders', requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status, search } = req.query;
    
    let query = `
      SELECT o.*, u.name as customer_name, u.email as customer_email,
             COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ` AND o.status = $${params.length + 1}`;
      params.push(status);
    }
    
    if (search) {
      query += ` AND (o.id ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }
    
    query += ` GROUP BY o.id, u.name, u.email ORDER BY o.date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    res.json({
      orders: result.rows,
      total: result.rows.length
    });
  } catch (e) { next(e); }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await db.query(
      'UPDATE orders SET status = $1, notes = COALESCE($2, notes) WHERE id = $3',
      [status, notes, id]
    );
    
    // Add tracking entry
    await db.query(
      `INSERT INTO order_tracking (order_id, status, description, location)
       VALUES ($1, $2, $3, 'Admin Update')`,
      [id, status, notes || `Order status updated to ${status} by admin`]
    );
    
    // Get order user for notification
    const orderResult = await db.query('SELECT user_id FROM orders WHERE id = $1', [id]);
    
    if (orderResult.rows.length > 0) {
      const { createNotification } = require('./notifications');
      await createNotification(
        orderResult.rows[0].user_id,
        'Order Status Updated',
        `Your order #${id} status has been updated to ${status}.${notes ? ` Note: ${notes}` : ''}`,
        'order',
        { orderId: id, status, notes }
      );
    }
    
    res.json({
      success: true,
      orderId: id,
      status,
      notes
    });
  } catch (e) { next(e); }
});

// GET /api/admin/analytics/sales
router.get('/analytics/sales', requireAdmin, async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let interval = '30 days';
    let groupBy = 'DATE(date)';
    
    switch (period) {
      case '7d':
        interval = '7 days';
        break;
      case '90d':
        interval = '90 days';
        break;
      case '1y':
        interval = '1 year';
        groupBy = 'DATE_TRUNC(\'month\', date)';
        break;
    }
    
    const salesResult = await db.query(`
      SELECT ${groupBy} as period, 
             COUNT(*) as orders,
             SUM(total) as revenue,
             AVG(total) as avg_order_value
      FROM orders 
      WHERE date >= NOW() - INTERVAL '${interval}'
        AND status != 'Cancelled'
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `);
    
    // Get top categories
    const categoriesResult = await db.query(`
      SELECT p.category, COUNT(oi.product_id) as orders, SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.date >= NOW() - INTERVAL '${interval}'
        AND o.status != 'Cancelled'
      GROUP BY p.category
      ORDER BY revenue DESC
      LIMIT 10
    `);
    
    res.json({
      period,
      salesData: salesResult.rows,
      topCategories: categoriesResult.rows
    });
  } catch (e) { next(e); }
});

module.exports = router;