const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const trackRoutes = require('./routes/trackRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const statusRoutes = require('./routes/statusRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Logging Middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Performance Middleware
app.use(compression());

// Security Middleware
// Use Helmet for secure HTTP headers, strictly protecting against XSS, clickjacking, MIME type sniffing, etc.
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS strictly limited to production domain and local dev
const allowedOrigins = ['https://nextgenztech.com', 'http://localhost:3000'];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// Rate Limiting Config
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' }
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { success: false, message: 'Too many payment requests, please try again after 15 minutes' }
});

// Apply global rate limiter
app.use('/api/', apiLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/create-razorpay-order', paymentLimiter);
app.use('/api/verify-payment', paymentLimiter);

// Static Files - Serve client/website, client/admin, and client/assets
// Using 1-day caching in production
const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
};
app.use(express.static(path.join(__dirname, '../client/website'), staticOptions));
app.use('/admin', express.static(path.join(__dirname, '../client/admin'), staticOptions));
app.use('/assets', express.static(path.join(__dirname, '../client/assets'), staticOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/export', exportRoutes); // More specific route first
app.use('/api/admin', adminRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin', statusRoutes);
app.use('/api/track', trackRoutes);
app.use('/api', uploadRoutes); // Contains /api/upload-resume
app.use('/api', applicationRoutes); // For public application routes
app.use('/api', reviewRoutes); // Public and Admin Review routes

// Health Check Endpoint for Monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// SPA Fallback for client/website/index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/website/index.html'));
});

// Centralized Error Handling Middleware (must be added after all routes)
app.use(errorHandler);

module.exports = app;
