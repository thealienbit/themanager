const fs = require('fs-extra');
const { ensureWorkspaceFolders } = require('../utils/fileUtils');
const { getCurrentWorkspace, setCurrentWorkspace } = require('../config/state');

class WorkspaceService {
  /**
   * Get the currently selected workspace
   */
  getWorkspace() {
    return {
      path: getCurrentWorkspace()
    };
  }

  /**
   * Set a new workspace
   */
  async setWorkspace(workspacePath) {
    // Validate path exists
    const exists = await fs.pathExists(workspacePath);
    if (!exists) {
      throw new Error('Directory does not exist');
    }

    // Validate it's a directory
    const stats = await fs.stat(workspacePath);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    // Set workspace and create folder structure
    setCurrentWorkspace(workspacePath);
    await ensureWorkspaceFolders(workspacePath);

    return {
      path: workspacePath
    };
  }
}

module.exports = new WorkspaceService();
