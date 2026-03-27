const express = require('express');
const router = express.Router();

const workspaceRoutes = require('./workspaceRoutes');
const itemRoutes = require('./itemRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Workspace routes
router.use('/workspace', workspaceRoutes);

// Item routes - mount under /items/:type
router.use('/items/:type', itemRoutes);

module.exports = router;
