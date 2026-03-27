// Application state management
let currentWorkspace = null;

const getCurrentWorkspace = () => currentWorkspace;

const setCurrentWorkspace = (workspace) => {
  currentWorkspace = workspace;
};

const initializeWorkspace = async (workspacePath) => {
  const fs = require('fs-extra');
  const path = require('path');
  const { WORKSPACE_TYPES, STATUSES } = require('./constants');
  
  // Validate workspace exists
  const exists = await fs.pathExists(workspacePath);
  if (!exists) {
    throw new Error(`Workspace path does not exist: ${workspacePath}`);
  }
  
  const stats = await fs.stat(workspacePath);
  if (!stats.isDirectory()) {
    throw new Error(`Workspace path is not a directory: ${workspacePath}`);
  }
  
  // Ensure workspace folder structure
  for (const type of WORKSPACE_TYPES) {
    for (const status of STATUSES) {
      const dirPath = path.join(workspacePath, type, status);
      await fs.ensureDir(dirPath);
    }
  }
  
  // Set as current workspace
  setCurrentWorkspace(workspacePath);
  
  return workspacePath;
};

module.exports = {
  getCurrentWorkspace,
  setCurrentWorkspace,
  initializeWorkspace
};
