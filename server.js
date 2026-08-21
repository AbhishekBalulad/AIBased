const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

// Database connection
const connectDB = require('./config/db.js');
const errorHandler = require('./middleware/errorHandler.js');
const ApiResponse = require('./utils/apiResponse.js');

// Initialize Express app
const app = express();

// Connect to Database
connectDB();

// Core Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());

const InputValidator = require('./validators/inputValidator');
app.use(InputValidator.sanitizeRequestBody);


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount Routers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const schemeRoutes = require('./routes/schemeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const videoRoutes = require('./routes/videoRoutes');
const jobRoutes = require('./routes/jobRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

// Health Check API Endpoint
app.get('/api/v1/health', (req, res) => {
  return ApiResponse.success(res, 'AI Government Policy & Job Assistance API is online', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/schemes', schemeRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/ocr', ocrRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/feedback', feedbackRoutes);









// 404 Route Handler
app.use((req, res, next) => {
  return ApiResponse.error(res, `Route not found - ${req.originalUrl}`, 404);
});

// Centralized Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/api/v1/health`);
  console.log(`=======================================================`);
});

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
