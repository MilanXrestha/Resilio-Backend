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
const tipsRoutes = require('./routes/tips-routes');
const imagesRoutes = require('./routes/images-routes');
const audioRoutes = require('./routes/audio-routes');
const videoRoutes = require('./routes/video-routes');
const passwordlessRoutes = require('./routes/passwordless-routes');
const favoriteRoutes = require('./routes/favorite-routes');
const subscriptionRoutes = require('./routes/subscription-routes');
const gamesRoutes = require('./routes/games-routes');
const notificationRoutes = require('./routes/notification-routes');
const adminRoutes = require('./routes/admin-routes');
const therapistPortalRoutes = require('./routes/therapist-portal-routes');
const paymentRoutes = require('./routes/payment-routes');

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
app.use('/api/v1/tips', tipsRoutes);
app.use('/api/v1/images', imagesRoutes);
app.use('/api/v1/audio', audioRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/passwordless', passwordlessRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/games', gamesRoutes);
app.use('/api/v1/therapists', require('./routes/therapist-routes'));
app.use('/api/v1/appointments', require('./routes/appointment-routes'));
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/therapist-portal', therapistPortalRoutes);
app.use('/api/v1/payments', paymentRoutes);

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

// Start server (for local development only)
// Vercel runs as serverless — do NOT create http server or socket.io in production
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  const http = require('http');
  const { initWebRTCSocket } = require('./services/webrtc-socket');

  const server = http.createServer(app);
  initWebRTCSocket(server);

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`SuperTokens auth: http://localhost:${PORT}/api/v1/auth/**`);
    console.log(`WebRTC Signaling Socket attached.`);
  });
}

// Export for Vercel serverless (REST only)
module.exports = app;