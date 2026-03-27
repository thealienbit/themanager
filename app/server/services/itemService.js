const fs = require('fs-extra');
const matter = require('gray-matter');
const path = require('path');
const { WORKSPACE_TYPES, STATUSES, PRIORITIES, DEFAULT_PRIORITY } = require('../config/constants');
const { getCurrentWorkspace } = require('../config/state');
const {
  getItemPath,
  findItemLocation,
  generateId,
  getCurrentDate,
  ensureWorkspaceFolders
} = require('../utils/fileUtils');
const { createTimelineEntry } = require('../utils/timelineUtils');

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
          allItems.push({
            id,
            ...data,
            priority: data.priority || DEFAULT_PRIORITY,
            labels: data.labels || [],
            timelineCount: (data.timeline || []).length,
            _status: status
          });
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

    return {
      id,
      ...data,
      priority: data.priority || DEFAULT_PRIORITY,
      labels: data.labels || [],
      timeline: data.timeline || [],
      _status: currentStatus,
      body
    };
  }

  /**
   * Create a new item
   */
  async createItem(type, { title, body = '', priority, labels }) {
    this.validateType(type);
    if (priority && !PRIORITIES.includes(priority)) {
      throw new Error('Invalid priority. Must be critical, high, medium, or low');
    }
    const workspacePath = this.validateWorkspace();

    const id = generateId(type);
    const now = getCurrentDate();
    const status = 'new';

    const frontmatter = {
      id,
      title: title || 'Untitled',
      status,
      priority: priority || DEFAULT_PRIORITY,
      labels: Array.isArray(labels) ? labels : [],
      created: now,
      updated: now,
      timeline: [createTimelineEntry('created', 'Item created')]
    };

    const fileContent = matter.stringify(body, frontmatter);
    const filePath = getItemPath(workspacePath, type, status, id);

    await fs.writeFile(filePath, fileContent, 'utf-8');

    return { id, ...frontmatter, _status: status };
  }

  /**
   * Update an existing item
   */
  async updateItem(type, id, { title, body, priority, labels }) {
    this.validateType(type);
    if (priority && !PRIORITIES.includes(priority)) {
      throw new Error('Invalid priority. Must be critical, high, medium, or low');
    }
    const workspacePath = this.validateWorkspace();

    const currentStatus = await findItemLocation(workspacePath, type, id);
    if (!currentStatus) {
      throw new Error('Item not found');
    }

    const filePath = getItemPath(workspacePath, type, currentStatus, id);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    const now = getCurrentDate();

    const timeline = data.timeline || [];

    if (title !== undefined && title !== data.title) {
      timeline.push(createTimelineEntry('title_changed', `Title changed from "${data.title}" to "${title}"`));
    }
    if (priority !== undefined && priority !== (data.priority || DEFAULT_PRIORITY)) {
      timeline.push(createTimelineEntry('priority_changed', `Priority changed from ${data.priority || DEFAULT_PRIORITY} to ${priority}`));
    }
    if (labels !== undefined && JSON.stringify(labels) !== JSON.stringify(data.labels || [])) {
      timeline.push(createTimelineEntry('labels_changed', `Labels updated`));
    }

    const frontmatter = {
      ...data,
      title: title !== undefined ? title : data.title,
      priority: priority !== undefined ? priority : (data.priority || DEFAULT_PRIORITY),
      labels: labels !== undefined ? labels : (data.labels || []),
      updated: now,
      timeline
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

    const timeline = data.timeline || [];
    timeline.push(createTimelineEntry('status_changed', `Status changed from ${currentStatus} to ${targetStatus}`));

    const frontmatter = {
      ...data,
      status: targetStatus,
      updated: now,
      timeline
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
