const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { createTimelineEntry } = require('../../utils/timelineUtils');

const WORKSPACE_PATH = process.env.WORKSPACE_PATH;
const WORKSPACE_TYPES = ['feats', 'bugs'];
const STATUSES = ['new', 'inprogress', 'finished'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const DEFAULT_PRIORITY = 'medium';

const getItemPath = (type, status, id) => {
  return path.join(WORKSPACE_PATH, type, status, `${id}.md`);
};

const findItemLocation = async (type, id) => {
  for (const status of STATUSES) {
    const filePath = getItemPath(type, status, id);
    const exists = await fs.pathExists(filePath);
    if (exists) {
      return status;
    }
  }
  return null;
};

const generateId = (type) => {
  const timestamp = Date.now().toString(36);
  const shortType = type === 'feats' ? 'feat' : 'bug';
  return `${shortType}-${timestamp}`;
};

const readItemsForType = async (type) => {
  const items = [];
  for (const status of STATUSES) {
    const dirPath = path.join(WORKSPACE_PATH, type, status);
    await fs.ensureDir(dirPath);
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(dirPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const { data } = matter(content);
        const id = file.replace('.md', '');
        items.push({
          id,
          ...data,
          priority: data.priority || DEFAULT_PRIORITY,
          labels: data.labels || [],
          _status: status
        });
      }
    }
  }
  items.sort((a, b) => new Date(b.created) - new Date(a.created));
  return items;
};

const readItem = async (type, id) => {
  const status = await findItemLocation(type, id);
  if (!status) {
    return null;
  }
  const filePath = getItemPath(type, status, id);
  const content = await fs.readFile(filePath, 'utf-8');
  const { data, content: body } = matter(content);
  return {
    id,
    ...data,
    priority: data.priority || DEFAULT_PRIORITY,
    labels: data.labels || [],
    timeline: data.timeline || [],
    _status: status,
    body
  };
};

const createItem = async (type, title, bodyContent = '', priority, labels) => {
  const id = generateId(type);
  const now = new Date().toISOString().split('T')[0];
  const status = 'new';

  const frontmatter = {
    id,
    title,
    status,
    priority: (priority && PRIORITIES.includes(priority)) ? priority : DEFAULT_PRIORITY,
    labels: Array.isArray(labels) ? labels : [],
    created: now,
    updated: now,
    timeline: [createTimelineEntry('created', 'Item created')],
  };
  
  const fileContent = matter.stringify(bodyContent, frontmatter);
  const filePath = getItemPath(type, status, id);
  await fs.writeFile(filePath, fileContent, 'utf-8');
  
  return { id, ...frontmatter, _status: status };
};

const updateItem = async (type, id, title, bodyContent, priority, labels) => {
  const currentStatus = await findItemLocation(type, id);
  if (!currentStatus) {
    return null;
  }

  const filePath = getItemPath(type, currentStatus, id);
  const content = await fs.readFile(filePath, 'utf-8');
  const { data } = matter(content);
  const now = new Date().toISOString().split('T')[0];

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
    timeline,
  };

  const newBody = bodyContent !== undefined ? bodyContent : content.split('---')[2]?.trim() || '';
  const fileContent = matter.stringify(newBody, frontmatter);
  await fs.writeFile(filePath, fileContent, 'utf-8');

  return { id, ...frontmatter, _status: currentStatus };
};

const moveItem = async (type, id, targetStatus) => {
  const currentStatus = await findItemLocation(type, id);
  if (!currentStatus) {
    return null;
  }
  
  if (currentStatus === targetStatus) {
    return { alreadyMoved: true };
  }
  
  const sourcePath = getItemPath(type, currentStatus, id);
  const targetPath = getItemPath(type, targetStatus, id);
  
  const content = await fs.readFile(sourcePath, 'utf-8');
  const { data } = matter(content);
  const now = new Date().toISOString().split('T')[0];

  const timeline = data.timeline || [];
  timeline.push(createTimelineEntry('status_changed', `Status changed from ${currentStatus} to ${targetStatus}`));

  const frontmatter = {
    ...data,
    status: targetStatus,
    updated: now,
    timeline,
  };

  const body = content.split('---')[2]?.trim() || '';
  const fileContent = matter.stringify(body, frontmatter);
  await fs.writeFile(targetPath, fileContent, 'utf-8');
  await fs.remove(sourcePath);
  
  return { id, ...frontmatter, _status: targetStatus };
};

const deleteItem = async (type, id) => {
  const currentStatus = await findItemLocation(type, id);
  if (!currentStatus) {
    return null;
  }
  
  const filePath = getItemPath(type, currentStatus, id);
  await fs.remove(filePath);
  
  return { success: true, id };
};

const searchItems = async (type, query) => {
  const items = await readItemsForType(type);
  const lowerQuery = query.toLowerCase();
  return items.filter(item => {
    const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
    const bodyMatch = item.body?.toLowerCase().includes(lowerQuery);
    const labelsMatch = (item.labels || []).some(l => l.toLowerCase().includes(lowerQuery));
    return titleMatch || bodyMatch || labelsMatch;
  });
};

const getProjectSummary = async () => {
  const summary = { types: {}, criticalAndHigh: [], recentlyUpdated: [] };
  const allItems = [];

  for (const type of WORKSPACE_TYPES) {
    const items = await readItemsForType(type);
    const byStatus = {};
    for (const s of STATUSES) {
      byStatus[s] = items.filter(i => i._status === s).length;
    }
    summary.types[type] = { total: items.length, byStatus };
    allItems.push(...items.map(i => ({ ...i, _type: type })));
  }

  summary.criticalAndHigh = allItems
    .filter(i => ['critical', 'high'].includes(i.priority) && i._status !== 'finished')
    .map(i => ({ id: i.id, type: i._type, title: i.title, priority: i.priority, status: i._status }));

  summary.recentlyUpdated = allItems
    .sort((a, b) => new Date(b.updated) - new Date(a.updated))
    .slice(0, 10)
    .map(i => ({ id: i.id, type: i._type, title: i.title, status: i._status, updated: i.updated }));

  return summary;
};

module.exports = {
  WORKSPACE_TYPES,
  STATUSES,
  readItemsForType,
  readItem,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
  searchItems,
  getProjectSummary,
};
