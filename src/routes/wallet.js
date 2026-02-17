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

// Helper: Get or create wallet for user
async function getOrCreateWallet(userId) {
  // Check if wallet exists
  const walletResult = await db.query(
    'SELECT * FROM wallets WHERE user_id = $1',
    [userId]
  );
  
  if (walletResult.rows.length > 0) {
    return walletResult.rows[0];
  }
  
  // Create new wallet
  const walletId = 'W-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  await db.query(
    `INSERT INTO wallets (id, user_id, balance, currency)
     VALUES ($1, $2, 0.00, 'PKR')`,
    [walletId, userId]
  );
  
  const newWallet = await db.query(
    'SELECT * FROM wallets WHERE id = $1',
    [walletId]
  );
  
  return newWallet.rows[0];
}

// Helper: Credit wallet (add money)
async function creditWallet(walletId, userId, amount, type, description, referenceId = null) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  // Get current balance
  const walletResult = await db.query(
    'SELECT balance FROM wallets WHERE id = $1 AND user_id = $2',
    [walletId, userId]
  );
  
  if (walletResult.rows.length === 0) {
    throw new Error('Wallet not found');
  }
  
  const balanceBefore = parseFloat(walletResult.rows[0].balance);
  const balanceAfter = balanceBefore + amount;
  
  // Start transaction
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update wallet balance
    await client.query(
      `UPDATE wallets 
       SET balance = $1, updated_at = NOW() 
       WHERE id = $2`,
      [balanceAfter, walletId]
    );
    
    // Create transaction record
    const transactionId = 'WT-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    await client.query(
      `INSERT INTO wallet_transactions 
       (id, wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [transactionId, walletId, userId, type, amount, balanceBefore, balanceAfter, description, referenceId]
    );
    
    await client.query('COMMIT');
    
    return {
      transactionId,
      balanceBefore,
      balanceAfter,
      amount
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Helper: Debit wallet (subtract money)
async function debitWallet(walletId, userId, amount, type, description, referenceId = null) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  // Get current balance
  const walletResult = await db.query(
    'SELECT balance FROM wallets WHERE id = $1 AND user_id = $2',
    [walletId, userId]
  );
  
  if (walletResult.rows.length === 0) {
    throw new Error('Wallet not found');
  }
  
  const balanceBefore = parseFloat(walletResult.rows[0].balance);
  
  // Check sufficient funds
  if (balanceBefore < amount) {
    throw new Error('Insufficient funds');
  }
  
  const balanceAfter = balanceBefore - amount;
  
  // Start transaction
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update wallet balance
    await client.query(
      `UPDATE wallets 
       SET balance = $1, updated_at = NOW() 
       WHERE id = $2`,
      [balanceAfter, walletId]
    );
    
    // Create transaction record
    const transactionId = 'WT-' + Math.random().toString(36).substr(2, 12).toUpperCase();
    await client.query(
      `INSERT INTO wallet_transactions 
       (id, wallet_id, user_id, type, amount, balance_before, balance_after, description, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [transactionId, walletId, userId, type, amount, balanceBefore, balanceAfter, description, referenceId]
    );
    
    await client.query('COMMIT');
    
    return {
      transactionId,
      balanceBefore,
      balanceAfter,
      amount
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// GET /api/wallet - Get wallet balance
router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const wallet = await getOrCreateWallet(userId);
    
    res.json({
      walletId: wallet.id,
      balance: parseFloat(wallet.balance),
      currency: wallet.currency,
      createdAt: wallet.created_at,
      updatedAt: wallet.updated_at
    });
  } catch (e) { next(e); }
});

// GET /api/wallet/transactions - Get transaction history
router.get('/transactions', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { limit = 20, offset = 0, type } = req.query;
    
    // Get wallet first
    const wallet = await getOrCreateWallet(userId);
    
    let query = `
      SELECT id, type, amount, balance_before, balance_after, 
             description, reference_id, created_at
      FROM wallet_transactions 
      WHERE wallet_id = $1
    `;
    const params = [wallet.id];
    
    if (type) {
      query += ' AND type = $2';
      params.push(type);
      query += ' ORDER BY created_at DESC LIMIT $3 OFFSET $4';
      params.push(parseInt(limit), parseInt(offset));
    } else {
      query += ' ORDER BY created_at DESC LIMIT $2 OFFSET $3';
      params.push(parseInt(limit), parseInt(offset));
    }
    
    const result = await db.query(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM wallet_transactions WHERE wallet_id = $1';
    const countParams = [wallet.id];
    if (type) {
      countQuery += ' AND type = $2';
      countParams.push(type);
    }
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      transactions: result.rows.map(t => ({
        id: t.id,
        type: t.type,
        amount: parseFloat(t.amount),
        balanceBefore: t.balance_before ? parseFloat(t.balance_before) : null,
        balanceAfter: t.balance_after ? parseFloat(t.balance_after) : null,
        description: t.description,
        referenceId: t.reference_id,
        createdAt: t.created_at
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (e) { next(e); }
});

// POST /api/wallet/deposit - Deposit funds
router.post('/deposit', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { amount, description, referenceId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }
    
    const wallet = await getOrCreateWallet(userId);
    
    const result = await creditWallet(
      wallet.id,
      userId,
      parseFloat(amount),
      'deposit',
      description || 'Wallet deposit',
      referenceId || null
    );
    
    // Get updated wallet
    const updatedWallet = await db.query(
      'SELECT * FROM wallets WHERE id = $1',
      [wallet.id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Funds deposited successfully',
      transactionId: result.transactionId,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      amount: result.amount,
      currentBalance: parseFloat(updatedWallet.rows[0].balance)
    });
  } catch (e) {
    if (e.message === 'Amount must be positive') {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

// POST /api/wallet/withdraw - Withdraw funds
router.post('/withdraw', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount is required' });
    }
    
    const wallet = await getOrCreateWallet(userId);
    
    const result = await debitWallet(
      wallet.id,
      userId,
      parseFloat(amount),
      'withdrawal',
      description || 'Wallet withdrawal',
      null
    );
    
    // Get updated wallet
    const updatedWallet = await db.query(
      'SELECT * FROM wallets WHERE id = $1',
      [wallet.id]
    );
    
    res.status(201).json({
      success: true,
      message: 'Funds withdrawn successfully',
      transactionId: result.transactionId,
      balanceBefore: result.balanceBefore,
      balanceAfter: result.balanceAfter,
      amount: result.amount,
      currentBalance: parseFloat(updatedWallet.rows[0].balance)
    });
  } catch (e) {
    if (e.message === 'Amount must be positive') {
      return res.status(400).json({ error: e.message });
    }
    if (e.message === 'Insufficient funds') {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

// Export helper functions for use by other services
module.exports = {
  router,
  getOrCreateWallet,
  creditWallet,
  debitWallet
};
