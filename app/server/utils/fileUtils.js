const fs = require('fs-extra');
const path = require('path');
const { WORKSPACE_TYPES, STATUSES } = require('../config/constants');

/**
 * Ensure all workspace folders exist (feats/bugs × new/inprogress/finished)
 */
const ensureWorkspaceFolders = async (workspacePath) => {
  for (const type of WORKSPACE_TYPES) {
    for (const status of STATUSES) {
      const dirPath = path.join(workspacePath, type, status);
      await fs.ensureDir(dirPath);
    }
  }
};

/**
 * Get the full path to an item file
 */
const getItemPath = (workspacePath, type, status, id) => {
  return path.join(workspacePath, type, status, `${id}.md`);
};

/**
 * Find which status folder contains an item
 */
const findItemLocation = async (workspacePath, type, id) => {
  for (const status of STATUSES) {
    const filePath = getItemPath(workspacePath, type, status, id);
    const exists = await fs.pathExists(filePath);
    if (exists) {
      return status;
    }
  }
  return null;
};

/**
 * Generate a unique ID for an item
 */
const generateId = (type) => {
  const timestamp = Date.now().toString(36);
  const shortType = type === 'feats' ? 'feat' : 'bug';
  return `${shortType}-${timestamp}`;
};

/**
 * Get current date in YYYY-MM-DD format
 */
const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

module.exports = {
  ensureWorkspaceFolders,
  getItemPath,
  findItemLocation,
  generateId,
  getCurrentDate
};
