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

// GET /api/payments/methods
router.get('/methods', async (req, res, next) => {
  try {
    // Return available payment methods for Pakistan
    const paymentMethods = [
      {
        id: 'cod',
        name: 'Cash on Delivery',
        type: 'cash',
        description: 'Pay when your order is delivered',
        fee: 0,
        available: true,
        icon: '💵'
      },
      {
        id: 'jazzcash',
        name: 'JazzCash',
        type: 'mobile_wallet',
        description: 'Pay using JazzCash mobile wallet',
        fee: 0,
        available: true,
        icon: '📱'
      },
      {
        id: 'easypaisa',
        name: 'Easypaisa',
        type: 'mobile_wallet', 
        description: 'Pay using Easypaisa mobile wallet',
        fee: 0,
        available: true,
        icon: '📱'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank',
        description: 'Direct bank transfer',
        fee: 0,
        available: true,
        icon: '🏦'
      },
      {
        id: 'credit_card',
        name: 'Credit/Debit Card',
        type: 'card',
        description: 'Pay using Visa, MasterCard, or local cards',
        fee: 2.5, // 2.5% processing fee
        available: true,
        icon: '💳'
      }
    ];
    
    res.json(paymentMethods);
  } catch (e) { next(e); }
});

// POST /api/payments/create-intent
router.post('/create-intent', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { orderId, amount, paymentMethod, currency = 'PKR' } = req.body;
    
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Order ID, amount, and payment method are required' });
    }
    
    // Verify order belongs to user
    const orderResult = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const transactionId = 'TXN-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    
    // Create payment transaction record
    await db.query(
      `INSERT INTO payment_transactions 
       (id, order_id, user_id, amount, currency, payment_method, transaction_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [transactionId, orderId, userId, amount, currency, paymentMethod, transactionId]
    );
    
    // For demo purposes, simulate different payment gateway responses
    let paymentIntent = {};
    
    switch (paymentMethod) {
      case 'cod':
        paymentIntent = {
          transactionId,
          status: 'pending',
          message: 'Cash on Delivery order created. Pay when delivered.',
          requiresAction: false
        };
        break;
        
      case 'jazzcash':
      case 'easypaisa':
        paymentIntent = {
          transactionId,
          status: 'pending',
          message: `Please complete payment using ${paymentMethod}`,
          requiresAction: true,
          actionUrl: `https://demo-${paymentMethod}.com/pay/${transactionId}`,
          qrCode: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=`
        };
        break;
        
      case 'bank_transfer':
        paymentIntent = {
          transactionId,
          status: 'pending',
          message: 'Please transfer amount to the provided bank account',
          requiresAction: true,
          bankDetails: {
            accountName: 'Bazaarly Pakistan',
            accountNumber: '1234567890123456',
            bankName: 'HBL Bank',
            iban: 'PK36HABB0012345678901234',
            reference: transactionId
          }
        };
        break;
        
      case 'credit_card':
        paymentIntent = {
          transactionId,
          status: 'pending',
          message: 'Redirecting to secure payment gateway',
          requiresAction: true,
          actionUrl: `https://demo-gateway.com/pay/${transactionId}`,
          clientSecret: `pi_${transactionId}_secret`
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Unsupported payment method' });
    }
    
    res.json(paymentIntent);
  } catch (e) { next(e); }
});

// POST /api/payments/confirm
router.post('/confirm', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { transactionId, paymentData = {} } = req.body;
    
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    
    // Get transaction
    const txnResult = await db.query(
      'SELECT * FROM payment_transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );
    
    if (txnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const transaction = txnResult.rows[0];
    
    // For demo purposes, simulate payment confirmation
    // In production, you would verify with actual payment gateway
    let paymentStatus = 'completed';
    let gatewayResponse = {
      success: true,
      gatewayTransactionId: 'GTW-' + Math.random().toString(36).substr(2, 10),
      timestamp: new Date().toISOString(),
      ...paymentData
    };
    
    // Simulate some failures for testing
    if (Math.random() < 0.1) { // 10% failure rate for demo
      paymentStatus = 'failed';
      gatewayResponse.success = false;
      gatewayResponse.error = 'Payment declined by bank';
    }
    
    // Update transaction
    await db.query(
      `UPDATE payment_transactions SET
       payment_status = $1,
       gateway_response = $2,
       updated_at = NOW()
       WHERE id = $3`,
      [paymentStatus, JSON.stringify(gatewayResponse), transactionId]
    );
    
    // Update order status if payment successful
    if (paymentStatus === 'completed') {
      await db.query(
        'UPDATE orders SET status = $1 WHERE id = $2',
        ['Processing', transaction.order_id]
      );
      
      // Create notification
      const { createNotification } = require('./notifications');
      await createNotification(
        userId,
        'Payment Confirmed',
        `Your payment of PKR ${transaction.amount} has been confirmed. Order #${transaction.order_id} is now being processed.`,
        'order',
        { orderId: transaction.order_id, transactionId, amount: transaction.amount }
      );
    }
    
    res.json({
      transactionId,
      status: paymentStatus,
      message: paymentStatus === 'completed' ? 'Payment confirmed successfully' : 'Payment failed',
      gatewayResponse
    });
  } catch (e) { next(e); }
});

// GET /api/payments/transactions
router.get('/transactions', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { limit = 20, offset = 0 } = req.query;
    
    const result = await db.query(
      `SELECT pt.*, o.id as order_number
       FROM payment_transactions pt
       LEFT JOIN orders o ON pt.order_id = o.id
       WHERE pt.user_id = $1
       ORDER BY pt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), parseInt(offset)]
    );
    
    res.json(result.rows);
  } catch (e) { next(e); }
});

// POST /api/payments/refund (Admin/Merchant only)
router.post('/refund', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    // Check if user is admin or merchant (simplified check)
    const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0 || !['merchant', 'admin'].includes(userResult.rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { transactionId, refundAmount, reason } = req.body;
    
    if (!transactionId || !refundAmount || !reason) {
      return res.status(400).json({ error: 'Transaction ID, refund amount, and reason are required' });
    }
    
    // Get original transaction
    const txnResult = await db.query(
      'SELECT * FROM payment_transactions WHERE id = $1',
      [transactionId]
    );
    
    if (txnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const originalTxn = txnResult.rows[0];
    
    if (originalTxn.payment_status !== 'completed') {
      return res.status(400).json({ error: 'Can only refund completed transactions' });
    }
    
    if (refundAmount > originalTxn.amount) {
      return res.status(400).json({ error: 'Refund amount cannot exceed original amount' });
    }
    
    const refundId = 'RFD-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    
    // Create refund transaction
    await db.query(
      `INSERT INTO payment_transactions 
       (id, order_id, user_id, amount, currency, payment_method, payment_status, transaction_id, gateway_response)
       VALUES ($1, $2, $3, $4, $5, $6, 'refunded', $7, $8)`,
      [
        refundId,
        originalTxn.order_id,
        originalTxn.user_id,
        -refundAmount, // Negative amount for refund
        originalTxn.currency,
        originalTxn.payment_method,
        refundId,
        JSON.stringify({
          type: 'refund',
          originalTransactionId: transactionId,
          reason,
          processedBy: userId,
          timestamp: new Date().toISOString()
        })
      ]
    );
    
    // Create notification for customer
    const { createNotification } = require('./notifications');
    await createNotification(
      originalTxn.user_id,
      'Refund Processed',
      `A refund of PKR ${refundAmount} has been processed for your order. Reason: ${reason}`,
      'order',
      { orderId: originalTxn.order_id, refundId, amount: refundAmount }
    );
    
    res.json({
      refundId,
      status: 'processed',
      amount: refundAmount,
      message: 'Refund processed successfully'
    });
  } catch (e) { next(e); }
});

module.exports = router;