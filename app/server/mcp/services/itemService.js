const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');

const WORKSPACE_PATH = process.env.WORKSPACE_PATH;
const WORKSPACE_TYPES = ['feats', 'bugs'];
const STATUSES = ['new', 'inprogress', 'finished'];

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
        items.push({ id, ...data, _status: status });
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
  return { id, ...data, _status: status, body };
};

const createItem = async (type, title, bodyContent = '') => {
  const id = generateId(type);
  const now = new Date().toISOString().split('T')[0];
  const status = 'new';
  
  const frontmatter = {
    id,
    title,
    status,
    created: now,
    updated: now,
  };
  
  const fileContent = matter.stringify(bodyContent, frontmatter);
  const filePath = getItemPath(type, status, id);
  await fs.writeFile(filePath, fileContent, 'utf-8');
  
  return { id, ...frontmatter, _status: status };
};

const updateItem = async (type, id, title, bodyContent) => {
  const currentStatus = await findItemLocation(type, id);
  if (!currentStatus) {
    return null;
  }
  
  const filePath = getItemPath(type, currentStatus, id);
  const content = await fs.readFile(filePath, 'utf-8');
  const { data } = matter(content);
  const now = new Date().toISOString().split('T')[0];
  
  const frontmatter = {
    ...data,
    title: title !== undefined ? title : data.title,
    updated: now,
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
  
  const frontmatter = {
    ...data,
    status: targetStatus,
    updated: now,
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
    return titleMatch || bodyMatch;
  });
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
};
