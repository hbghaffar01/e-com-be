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
  
  // Check if user is admin
  const result = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
  return result.rows.length > 0 && (result.rows[0].role === 'admin' || userId.startsWith('ADMIN-'));
}

// GET /api/games - Get all games
router.get('/', async (req, res, next) => {
  try {
    const { category, provider, status, is_hot, limit = 50, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM games WHERE 1=1';
    const params = [];
    
    // Default: only show active games if status not specified
    if (!status) {
      query += ' AND status = $1';
      params.push('active');
    } else {
      query += ' AND status = $1';
      params.push(status);
    }
    
    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }
    
    if (provider) {
      query += ` AND provider = $${params.length + 1}`;
      params.push(provider);
    }
    
    if (is_hot === 'true') {
      query += ` AND is_hot = $${params.length + 1}`;
      params.push(true);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await db.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as count FROM games WHERE 1=1';
    const countParams = [];
    
    if (!status) {
      countQuery += ' AND status = $1';
      countParams.push('active');
    } else {
      countQuery += ' AND status = $1';
      countParams.push(status);
    }
    
    if (category) {
      countQuery += ` AND category = $${countParams.length + 1}`;
      countParams.push(category);
    }
    
    if (provider) {
      countQuery += ` AND provider = $${countParams.length + 1}`;
      countParams.push(provider);
    }
    
    if (is_hot === 'true') {
      countQuery += ` AND is_hot = $${countParams.length + 1}`;
      countParams.push(true);
    }
    
    const countResult = await db.query(countQuery, countParams);
    
    res.json({
      games: result.rows.map(game => ({
        id: game.id,
        name: game.name,
        category: game.category,
        provider: game.provider,
        image: game.image,
        description: game.description,
        gameUrl: game.game_url,
        status: game.status,
        minBet: parseFloat(game.min_bet),
        maxBet: parseFloat(game.max_bet),
        rating: parseFloat(game.rating),
        isHot: game.is_hot,
        bonusMultiplier: game.bonus_multiplier ? parseFloat(game.bonus_multiplier) : null,
        metadata: game.metadata,
        createdAt: game.created_at,
        updatedAt: game.updated_at
      })),
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (e) { next(e); }
});

// GET /api/games/search?q=query - Search games (MUST be before /:id route)
router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString();
    
    if (!q || q.trim().length === 0) {
      return res.json({ games: [], total: 0 });
    }
    
    const result = await db.query(
      `SELECT * FROM games 
       WHERE LOWER(name) LIKE LOWER('%' || $1 || '%') 
       AND status = 'active'
       ORDER BY name`,
      [q]
    );
    
    res.json({
      games: result.rows.map(game => ({
        id: game.id,
        name: game.name,
        category: game.category,
        provider: game.provider,
        image: game.image,
        description: game.description,
        gameUrl: game.game_url,
        status: game.status,
        minBet: parseFloat(game.min_bet),
        maxBet: parseFloat(game.max_bet),
        rating: parseFloat(game.rating),
        isHot: game.is_hot,
        bonusMultiplier: game.bonus_multiplier ? parseFloat(game.bonus_multiplier) : null,
        metadata: game.metadata,
        createdAt: game.created_at,
        updatedAt: game.updated_at
      })),
      total: result.rows.length
    });
  } catch (e) { next(e); }
});

// GET /api/games/categories - Get all categories
router.get('/categories', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT category, COUNT(*) as count 
       FROM games 
       WHERE status = 'active'
       GROUP BY category 
       ORDER BY category`
    );
    
    res.json(result.rows.map(row => ({
      category: row.category,
      count: parseInt(row.count)
    })));
  } catch (e) { next(e); }
});

// GET /api/games/providers - Get all providers
router.get('/providers', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT provider, COUNT(*) as count 
       FROM games 
       WHERE status = 'active'
       GROUP BY provider 
       ORDER BY provider`
    );
    
    res.json(result.rows.map(row => ({
      provider: row.provider,
      count: parseInt(row.count)
    })));
  } catch (e) { next(e); }
});

// GET /api/games/hot - Get hot games
router.get('/hot', async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM games 
       WHERE is_hot = true AND status = 'active'
       ORDER BY rating DESC, created_at DESC`
    );
    
    res.json({
      games: result.rows.map(game => ({
        id: game.id,
        name: game.name,
        category: game.category,
        provider: game.provider,
        image: game.image,
        description: game.description,
        gameUrl: game.game_url,
        status: game.status,
        minBet: parseFloat(game.min_bet),
        maxBet: parseFloat(game.max_bet),
        rating: parseFloat(game.rating),
        isHot: game.is_hot,
        bonusMultiplier: game.bonus_multiplier ? parseFloat(game.bonus_multiplier) : null,
        metadata: game.metadata,
        createdAt: game.created_at,
        updatedAt: game.updated_at
      })),
      total: result.rows.length
    });
  } catch (e) { next(e); }
});

// GET /api/games/:id - Get single game (MUST be after all specific routes like /search, /categories, /providers, /hot)
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM games WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const game = result.rows[0];
    res.json({
      id: game.id,
      name: game.name,
      category: game.category,
      provider: game.provider,
      image: game.image,
      description: game.description,
      gameUrl: game.game_url,
      status: game.status,
      minBet: parseFloat(game.min_bet),
      maxBet: parseFloat(game.max_bet),
      rating: parseFloat(game.rating),
      isHot: game.is_hot,
      bonusMultiplier: game.bonus_multiplier ? parseFloat(game.bonus_multiplier) : null,
      metadata: game.metadata,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    });
  } catch (e) { next(e); }
});

// POST /api/games - Create game (Admin only)
router.post('/', async (req, res, next) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { 
      name, 
      provider, 
      category, 
      image, 
      game_url, 
      description, 
      min_bet, 
      max_bet, 
      rating, 
      is_hot, 
      bonus_multiplier, 
      metadata 
    } = req.body;
    
    // Validate required fields
    if (!name || !name.trim() || !provider || !provider.trim() || !category || !category.trim() || !image || !image.trim() || !game_url || !game_url.trim()) {
      return res.status(400).json({ error: 'Name, provider, category, image, and game_url are required and cannot be empty' });
    }
    
    // Category validation removed - any category string is allowed
    
    // Validate bet limits
    const minBet = min_bet ? parseFloat(min_bet) : 10.00;
    const maxBet = max_bet ? parseFloat(max_bet) : 10000.00;
    
    if (minBet <= 0) {
      return res.status(400).json({ error: 'Min bet must be positive' });
    }
    
    if (maxBet <= minBet) {
      return res.status(400).json({ error: 'Max bet must be greater than min bet' });
    }
    
    // Validate rating
    const gameRating = rating ? parseFloat(rating) : 0.00;
    if (gameRating < 0 || gameRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }
    
    // Generate game ID
    const gameId = 'GAME-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Insert game
    await db.query(
      `INSERT INTO games 
       (id, name, category, provider, image, description, game_url, min_bet, max_bet, rating, is_hot, bonus_multiplier, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        gameId,
        name,
        category,
        provider,
        image,
        description || null,
        game_url,
        minBet,
        maxBet,
        gameRating,
        is_hot || false,
        bonus_multiplier ? parseFloat(bonus_multiplier) : null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    
    // Get created game
    const result = await db.query('SELECT * FROM games WHERE id = $1', [gameId]);
    const game = result.rows[0];
    
    res.status(201).json({
      id: game.id,
      name: game.name,
      category: game.category,
      provider: game.provider,
      image: game.image,
      description: game.description,
      gameUrl: game.game_url,
      status: game.status,
      minBet: parseFloat(game.min_bet),
      maxBet: parseFloat(game.max_bet),
      rating: parseFloat(game.rating),
      isHot: game.is_hot,
      bonusMultiplier: game.bonus_multiplier ? parseFloat(game.bonus_multiplier) : null,
      metadata: game.metadata,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    });
  } catch (e) { next(e); }
});

// PUT /api/games/:id - Update game (Admin only)
router.put('/:id', async (req, res, next) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { 
      name, 
      provider, 
      category, 
      image, 
      game_url, 
      description, 
      min_bet, 
      max_bet, 
      rating, 
      is_hot, 
      bonus_multiplier, 
      metadata,
      status
    } = req.body;
    
    // Check if game exists
    const gameResult = await db.query('SELECT * FROM games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Category validation removed - any category string is allowed
    
    // Validate status if provided
    if (status) {
      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
    }
    
    // Validate bet limits if provided
    if (min_bet !== undefined || max_bet !== undefined) {
      const currentGame = gameResult.rows[0];
      const newMinBet = min_bet !== undefined ? parseFloat(min_bet) : parseFloat(currentGame.min_bet);
      const newMaxBet = max_bet !== undefined ? parseFloat(max_bet) : parseFloat(currentGame.max_bet);
      
      if (newMinBet <= 0) {
        return res.status(400).json({ error: 'Min bet must be positive' });
      }
      
      if (newMaxBet <= newMinBet) {
        return res.status(400).json({ error: 'Max bet must be greater than min bet' });
      }
    }
    
    // Validate rating if provided
    if (rating !== undefined) {
      const gameRating = parseFloat(rating);
      if (gameRating < 0 || gameRating > 5) {
        return res.status(400).json({ error: 'Rating must be between 0 and 5' });
      }
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name);
    }
    if (provider !== undefined) {
      updates.push(`provider = $${paramIndex++}`);
      params.push(provider);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(category);
    }
    if (image !== undefined) {
      updates.push(`image = $${paramIndex++}`);
      params.push(image);
    }
    if (game_url !== undefined) {
      updates.push(`game_url = $${paramIndex++}`);
      params.push(game_url);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(description);
    }
    if (min_bet !== undefined) {
      updates.push(`min_bet = $${paramIndex++}`);
      params.push(parseFloat(min_bet));
    }
    if (max_bet !== undefined) {
      updates.push(`max_bet = $${paramIndex++}`);
      params.push(parseFloat(max_bet));
    }
    if (rating !== undefined) {
      updates.push(`rating = $${paramIndex++}`);
      params.push(parseFloat(rating));
    }
    if (is_hot !== undefined) {
      updates.push(`is_hot = $${paramIndex++}`);
      params.push(is_hot);
    }
    if (bonus_multiplier !== undefined) {
      updates.push(`bonus_multiplier = $${paramIndex++}`);
      params.push(bonus_multiplier ? parseFloat(bonus_multiplier) : null);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(metadata ? JSON.stringify(metadata) : null);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Always update updated_at
    updates.push(`updated_at = NOW()`);
    
    params.push(id);
    const updateQuery = `UPDATE games SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    
    await db.query(updateQuery, params);
    
    // Get updated game
    const result = await db.query('SELECT * FROM games WHERE id = $1', [id]);
    const game = result.rows[0];
    
    res.json({
      id: game.id,
      name: game.name,
      category: game.category,
      provider: game.provider,
      image: game.image,
      description: game.description,
      gameUrl: game.game_url,
      status: game.status,
      minBet: parseFloat(game.min_bet),
      maxBet: parseFloat(game.max_bet),
      rating: parseFloat(game.rating),
      isHot: game.is_hot,
      bonusMultiplier: game.bonus_multiplier ? parseFloat(game.bonus_multiplier) : null,
      metadata: game.metadata,
      createdAt: game.created_at,
      updatedAt: game.updated_at
    });
  } catch (e) { next(e); }
});

// DELETE /api/games/:id - Delete game (Admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    if (!(await isAdmin(req))) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    // Check if game exists
    const gameResult = await db.query('SELECT * FROM games WHERE id = $1', [id]);
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    // Soft delete: set status to inactive instead of hard delete
    // This preserves data and allows reactivation if needed
    await db.query(
      'UPDATE games SET status = $1, updated_at = NOW() WHERE id = $2',
      ['inactive', id]
    );
    
    res.json({ 
      success: true, 
      message: 'Game deleted successfully (set to inactive)',
      gameId: id
    });
  } catch (e) { next(e); }
});

module.exports = router;
