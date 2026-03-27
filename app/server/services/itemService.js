const fs = require('fs-extra');
const matter = require('gray-matter');
const path = require('path');
const { WORKSPACE_TYPES, STATUSES } = require('../config/constants');
const { getCurrentWorkspace } = require('../config/state');
const { 
  getItemPath, 
  findItemLocation, 
  generateId, 
  getCurrentDate,
  ensureWorkspaceFolders 
} = require('../utils/fileUtils');

class ItemService {
  /**
   * Validate workspace is selected
   */
  validateWorkspace() {
    const workspace = getCurrentWorkspace();
    if (!workspace) {
      throw new Error('No workspace selected');
    }
    return workspace;
  }

  /**
   * Validate item type
   */
  validateType(type) {
    if (!WORKSPACE_TYPES.includes(type)) {
      throw new Error('Invalid type. Must be feats or bugs');
    }
  }

  /**
   * Validate status
   */
  validateStatus(status) {
    if (!STATUSES.includes(status)) {
      throw new Error('Invalid status. Must be new, inprogress, or finished');
    }
  }

  /**
   * Get all items of a specific type
   */
  async getItems(type) {
    this.validateType(type);
    const workspacePath = this.validateWorkspace();

    const allItems = [];

    for (const status of STATUSES) {
      const dirPath = path.join(workspacePath, type, status);
      await fs.ensureDir(dirPath);
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const { data } = matter(content);
          const id = file.replace('.md', '');
          allItems.push({ id, ...data, _status: status });
        }
      }
    }

    // Sort by creation date (newest first)
    allItems.sort((a, b) => new Date(b.created) - new Date(a.created));

    return allItems;
  }

  /**
   * Get a single item by ID
   */
  async getItem(type, id) {
    this.validateType(type);
    const workspacePath = this.validateWorkspace();

    const currentStatus = await findItemLocation(workspacePath, type, id);
    if (!currentStatus) {
      throw new Error('Item not found');
    }

    const filePath = getItemPath(workspacePath, type, currentStatus, id);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    return { id, ...data, _status: currentStatus, body };
  }

  /**
   * Create a new item
   */
  async createItem(type, { title, body = '' }) {
    this.validateType(type);
    const workspacePath = this.validateWorkspace();

    const id = generateId(type);
    const now = getCurrentDate();
    const status = 'new';

    const frontmatter = {
      id,
      title: title || 'Untitled',
      status,
      created: now,
      updated: now
    };

    const fileContent = matter.stringify(body, frontmatter);
    const filePath = getItemPath(workspacePath, type, status, id);

    await fs.writeFile(filePath, fileContent, 'utf-8');

    return { id, ...frontmatter, _status: status };
  }

  /**
   * Update an existing item
   */
  async updateItem(type, id, { title, body }) {
    this.validateType(type);
    const workspacePath = this.validateWorkspace();

    const currentStatus = await findItemLocation(workspacePath, type, id);
    if (!currentStatus) {
      throw new Error('Item not found');
    }

    const filePath = getItemPath(workspacePath, type, currentStatus, id);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    const now = getCurrentDate();

    const frontmatter = {
      ...data,
      title: title !== undefined ? title : data.title,
      updated: now
    };

    const newBody = body !== undefined 
      ? body 
      : content.split('---')[2]?.trim() || '';
    
    const fileContent = matter.stringify(newBody, frontmatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    return { id, ...frontmatter, _status: currentStatus };
  }

  /**
   * Move an item to a different status
   */
  async moveItem(type, id, targetStatus) {
    this.validateType(type);
    this.validateStatus(targetStatus);
    const workspacePath = this.validateWorkspace();

    const currentStatus = await findItemLocation(workspacePath, type, id);
    if (!currentStatus) {
      throw new Error('Item not found');
    }

    if (currentStatus === targetStatus) {
      return { id, status: targetStatus, _status: currentStatus, message: 'Already in this status' };
    }

    const sourcePath = getItemPath(workspacePath, type, currentStatus, id);
    const targetPath = getItemPath(workspacePath, type, targetStatus, id);

    const content = await fs.readFile(sourcePath, 'utf-8');
    const { data } = matter(content);
    const now = getCurrentDate();

    const frontmatter = {
      ...data,
      status: targetStatus,
      updated: now
    };

    const body = content.split('---')[2]?.trim() || '';
    const fileContent = matter.stringify(body, frontmatter);
    
    await fs.writeFile(targetPath, fileContent, 'utf-8');
    await fs.remove(sourcePath);

    return { id, ...frontmatter, _status: targetStatus };
  }

  /**
   * Delete an item
   */
  async deleteItem(type, id) {
    this.validateType(type);
    const workspacePath = this.validateWorkspace();

    const currentStatus = await findItemLocation(workspacePath, type, id);
    if (!currentStatus) {
      throw new Error('Item not found');
    }

    const filePath = getItemPath(workspacePath, type, currentStatus, id);
    await fs.remove(filePath);

    return { success: true };
  }
}

module.exports = new ItemService();
