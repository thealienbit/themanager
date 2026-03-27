const express = require('express');
const router = express.Router();

const workspaceRoutes = require('./workspaceRoutes');
const itemRoutes = require('./itemRoutes');

// Workspace routes
router.use('/workspace', workspaceRoutes);

// Item routes - mount under /items/:type
router.use('/items/:type', itemRoutes);

module.exports = router;
