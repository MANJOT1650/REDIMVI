const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { testConnection, syncDatabase } = require('./config/database');

dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PostgreSQL Connection
let isDbConnected = false;

const initializeDatabase = async () => {
  try {
    isDbConnected = await testConnection();
    if (isDbConnected) {
      await syncDatabase();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    isDbConnected = false;
  }
};

// Initialize database connection
initializeDatabase();

// Export connection state for routes
app.locals.isDbConnected = () => isDbConnected;

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/compress', require('./routes/compress'));
} catch (err) {
  console.error('Route loading error:', err.message);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Start the periodic cleanup job for the uploads folder
  const { startCleanupJob } = require('./utils/cleanup');
  startCleanupJob(uploadsDir);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
