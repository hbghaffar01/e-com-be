const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
require('dotenv').config();

const app = express();

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Bazaarly API Documentation'
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Existing routes
app.use('/api/products', require('./routes/products'));
app.use('/api/marketing', require('./routes/marketing'));
app.use('/api/merchant', require('./routes/merchant'));
app.use('/api/promotions', require('./routes/promotions'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/reviews', require('./routes/reviews'));

// New routes
app.use('/api/categories', require('./routes/categories'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/corporate', require('./routes/corporate'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/wallet', require('./routes/wallet').router);
app.use('/api/games', require('./routes/games'));
app.use('/api/admin', require('./routes/admin'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
  }
  
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Bazaarly backend running on http://localhost:${PORT}`);
  console.log(`File uploads will be served from http://localhost:${PORT}/uploads`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});