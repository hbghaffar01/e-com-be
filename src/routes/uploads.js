const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function getUserId(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try { const p = jwt.verify(token, JWT_SECRET); return p.sub; } catch { return null; }
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || 'general';
    const typeDir = path.join(uploadsDir, uploadType);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
    cb(null, typeDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/uploads/single
router.post('/single', upload.single('file'), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { uploadType = 'general', entityId } = req.body;
    const fileId = 'FILE-' + Math.random().toString(36).substr(2, 9);
    
    const relativePath = path.relative(uploadsDir, req.file.path);
    
    await db.query(
      `INSERT INTO file_uploads (id, user_id, filename, original_name, mime_type, file_size, file_path, upload_type, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        fileId,
        userId,
        req.file.filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        relativePath,
        uploadType,
        entityId || null
      ]
    );
    
    const fileUrl = `/uploads/${uploadType}/${req.file.filename}`;
    
    res.status(201).json({
      id: fileId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      uploadType,
      entityId
    });
  } catch (e) { 
    // Clean up file if database insert fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(e); 
  }
});

// POST /api/uploads/multiple
router.post('/multiple', upload.array('files', 10), async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const { uploadType = 'general', entityId } = req.body;
    const uploadedFiles = [];
    
    for (const file of req.files) {
      const fileId = 'FILE-' + Math.random().toString(36).substr(2, 9);
      const relativePath = path.relative(uploadsDir, file.path);
      
      await db.query(
        `INSERT INTO file_uploads (id, user_id, filename, original_name, mime_type, file_size, file_path, upload_type, entity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          fileId,
          userId,
          file.filename,
          file.originalname,
          file.mimetype,
          file.size,
          relativePath,
          uploadType,
          entityId || null
        ]
      );
      
      const fileUrl = `/uploads/${uploadType}/${file.filename}`;
      
      uploadedFiles.push({
        id: fileId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: fileUrl,
        uploadType,
        entityId
      });
    }
    
    res.status(201).json({ files: uploadedFiles });
  } catch (e) { 
    // Clean up files if database insert fails
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(e); 
  }
});

// GET /api/uploads/user
router.get('/user', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { uploadType, entityId } = req.query;
    
    let query = 'SELECT * FROM file_uploads WHERE user_id = $1';
    const params = [userId];
    
    if (uploadType) {
      query += ' AND upload_type = $2';
      params.push(uploadType);
    }
    
    if (entityId) {
      query += ` AND entity_id = $${params.length + 1}`;
      params.push(entityId);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    
    const files = result.rows.map(file => ({
      id: file.id,
      filename: file.filename,
      originalName: file.original_name,
      mimeType: file.mime_type,
      size: file.file_size,
      url: `/uploads/${file.upload_type}/${file.filename}`,
      uploadType: file.upload_type,
      entityId: file.entity_id,
      createdAt: file.created_at
    }));
    
    res.json(files);
  } catch (e) { next(e); }
});

// DELETE /api/uploads/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'unauthorized' });
    
    const { id } = req.params;
    
    const fileResult = await db.query(
      'SELECT * FROM file_uploads WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = fileResult.rows[0];
    const fullPath = path.join(uploadsDir, file.file_path);
    
    // Delete from database
    await db.query('DELETE FROM file_uploads WHERE id = $1', [id]);
    
    // Delete physical file
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (e) { next(e); }
});

module.exports = router;