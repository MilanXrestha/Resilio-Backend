// Main entry point - Express server setup
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const supertokens = require('supertokens-node');
const { middleware: stMiddleware, errorHandler: stErrorHandler } = require('supertokens-node/framework/express');
require('dotenv').config();

console.log('=== Starting Resilio Backend ===');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('SUPABASE_URL configured:', !!process.env.SUPABASE_URL);
console.log('SUPERTOKENS_CONNECTION_URI configured:', !!process.env.SUPERTOKENS_CONNECTION_URI);

// Initialize SuperTokens
try {
  const { initSuperTokens } = require('./config/supertokens');
  initSuperTokens();
  console.log('✓ SuperTokens initialized');
} catch (error) {
  console.error('✗ SuperTokens initialization failed:', error.message);
}

// Import routes
const userRoutes = require('./routes/user-routes');
const preferenceRoutes = require('./routes/preference-routes');
const categoryRoutes = require('./routes/category-routes');
const quoteRoutes = require('./routes/quote-routes');
const passwordlessRoutes = require('./routes/passwordless-routes');

// Import middleware
const { protoMiddleware } = require('./middlewares/proto-middleware');

// Create Express app
const app = express();

// CORS — must include SuperTokens headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()],
  credentials: true,
}));

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: 'application/x-protobuf', limit: '1mb' }));
app.use(protoMiddleware);

// SuperTokens middleware — handles /api/v1/auth/* routes automatically
app.use(stMiddleware());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/preferences', preferenceRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/passwordless', passwordlessRoutes);

// SuperTokens error handler
app.use(stErrorHandler());

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (for local development)
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`SuperTokens auth: http://localhost:${PORT}/api/v1/auth/**`);
  });
}

// Export for Vercel serverless
module.exports = app;