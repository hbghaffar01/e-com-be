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

function isAdmin(req) {
  const userId = getUserId(req);
  // For now, simple admin check - in production, you'd have proper role management
  return userId && userId.startsWith('ADMIN-');
}

// GET /api/categories
router.get('/', async (req, res, next) => {
  try {
    const categoriesResult = await db.query(`
      SELECT c.*, 
             COALESCE(
               json_agg(
                 json_build_object('id', sc.id, 'name', sc.name)
                 ORDER BY sc.name
               ) FILTER (WHERE sc.id IS NOT NULL), 
               '[]'
             ) as sub_categories
      FROM categories c
      LEFT JOIN sub_categories sc ON c.id = sc.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);
    
    res.json(categoriesResult.rows);
  } catch (e) { next(e); }
});

// GET /api/categories/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryResult = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const subCategoriesResult = await db.query(
      'SELECT * FROM sub_categories WHERE category_id = $1 ORDER BY name',
      [id]
    );
    
    const category = categoryResult.rows[0];
    category.sub_categories = subCategoriesResult.rows;
    
    res.json(category);
  } catch (e) { next(e); }
});

// POST /api/categories (Admin only)
router.post('/', async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id, name, sub_categories = [] } = req.body;
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' });
    }
    
    // Insert category
    await db.query(
      'INSERT INTO categories (id, name) VALUES ($1, $2)',
      [id, name]
    );
    
    // Insert sub-categories
    for (const subCat of sub_categories) {
      if (subCat.id && subCat.name) {
        await db.query(
          'INSERT INTO sub_categories (id, category_id, name) VALUES ($1, $2, $3)',
          [subCat.id, id, subCat.name]
        );
      }
    }
    
    // Return the created category with sub-categories
    const result = await db.query(`
      SELECT c.*, 
             COALESCE(
               json_agg(
                 json_build_object('id', sc.id, 'name', sc.name)
                 ORDER BY sc.name
               ) FILTER (WHERE sc.id IS NOT NULL), 
               '[]'
             ) as sub_categories
      FROM categories c
      LEFT JOIN sub_categories sc ON c.id = sc.category_id
      WHERE c.id = $1
      GROUP BY c.id, c.name
    `, [id]);
    
    res.status(201).json(result.rows[0]);
  } catch (e) { next(e); }
});

// PUT /api/categories/:id (Admin only)
router.put('/:id', async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    await db.query('UPDATE categories SET name = $1 WHERE id = $2', [name, id]);
    
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (e) { next(e); }
});

// DELETE /api/categories/:id (Admin only)
router.delete('/:id', async (req, res, next) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    
    // Delete sub-categories first (cascade should handle this, but being explicit)
    await db.query('DELETE FROM sub_categories WHERE category_id = $1', [id]);
    
    // Delete category
    const result = await db.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ success: true, deleted: result.rows[0] });
  } catch (e) { next(e); }
});

module.exports = router;