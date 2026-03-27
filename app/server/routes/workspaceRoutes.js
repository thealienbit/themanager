const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');

// GET /api/workspace - Get current workspace
router.get('/', workspaceController.getWorkspace.bind(workspaceController));

// POST /api/workspace - Set workspace
router.post('/', workspaceController.setWorkspace.bind(workspaceController));

module.exports = router;
