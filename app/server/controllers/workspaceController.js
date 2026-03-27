const workspaceService = require('../services/workspaceService');

class WorkspaceController {
  /**
   * GET /api/workspace
   * Get current workspace
   */
  getWorkspace(req, res) {
    try {
      const workspace = workspaceService.getWorkspace();
      res.json(workspace);
    } catch (error) {
      console.error('[ERROR] Get workspace:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/workspace
   * Set a new workspace
   */
  async setWorkspace(req, res) {
    try {
      console.log('[DEBUG] POST /api/workspace called');
      console.log('[DEBUG] Body:', req.body);

      const { path: workspacePath } = req.body;

      if (!workspacePath) {
        console.log('[DEBUG] No path provided');
        return res.status(400).json({ error: 'Path is required' });
      }

      console.log('[DEBUG] Setting workspace:', workspacePath);
      const workspace = await workspaceService.setWorkspace(workspacePath);
      console.log('[DEBUG] Workspace set successfully');

      res.json(workspace);
    } catch (error) {
      console.error('[DEBUG] Error:', error);
      
      if (error.message === 'Directory does not exist' || 
          error.message === 'Path is not a directory') {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new WorkspaceController();
