const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let currentWorkspace = null;

const WORKSPACE_TYPES = ['feats', 'bugs'];
const STATUSES = ['new', 'inprogress', 'finished'];

const ensureWorkspaceFolders = async (workspacePath) => {
  for (const type of WORKSPACE_TYPES) {
    for (const status of STATUSES) {
      const dirPath = path.join(workspacePath, type, status);
      await fs.ensureDir(dirPath);
    }
  }
};

const getItemPath = (workspacePath, type, status, id) => {
  return path.join(workspacePath, type, status, `${id}.md`);
};

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

const generateId = (type) => {
  const timestamp = Date.now().toString(36);
  const shortType = type === 'feats' ? 'feat' : 'bug';
  return `${shortType}-${timestamp}`;
};

app.get('/api/workspace', (req, res) => {
  res.json({ path: currentWorkspace });
});

app.post('/api/workspace', async (req, res) => {
  try {
    console.log('[DEBUG] POST /api/workspace called');
    console.log('[DEBUG] Body:', req.body);
    
    const { path: workspacePath } = req.body;
    
    if (!workspacePath) {
      console.log('[DEBUG] No path provided');
      return res.status(400).json({ error: 'Path is required' });
    }

    console.log('[DEBUG] Checking path:', workspacePath);
    const exists = await fs.pathExists(workspacePath);
    console.log('[DEBUG] Path exists:', exists);
    
    if (!exists) {
      return res.status(400).json({ error: 'Directory does not exist' });
    }

    const stats = await fs.stat(workspacePath);
    console.log('[DEBUG] Is directory:', stats.isDirectory());
    
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }

    currentWorkspace = workspacePath;
    console.log('[DEBUG] Calling ensureWorkspaceFolders');
    await ensureWorkspaceFolders(workspacePath);
    console.log('[DEBUG] Workspace set successfully');

    res.json({ path: currentWorkspace });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items/:type', async (req, res) => {
  try {
    console.log('[DEBUG] currentWorkspace:', currentWorkspace);
    
    if (!currentWorkspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { type } = req.params;
    console.log('[DEBUG] type:', type);
    
    if (!WORKSPACE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be feats or bugs' });
    }

    const allItems = [];

    for (const status of STATUSES) {
      const dirPath = path.join(currentWorkspace, type, status);
      console.log('[DEBUG] Checking dir:', dirPath);
      await fs.ensureDir(dirPath);
      const files = await fs.readdir(dirPath);
      console.log('[DEBUG] Files in', status, ':', files);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(dirPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const { data } = matter(content);
          const id = file.replace('.md', '');
          console.log('[DEBUG] Found item:', id, data);
          allItems.push({ id, ...data, _status: status });
        }
      }
    }

    allItems.sort((a, b) => new Date(b.created) - new Date(a.created));
    console.log('[DEBUG] Returning items:', allItems.length);

    res.json(allItems);
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/items/:type/:id', async (req, res) => {
  try {
    if (!currentWorkspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { type, id } = req.params;
    if (!WORKSPACE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const currentStatus = await findItemLocation(currentWorkspace, type, id);
    if (!currentStatus) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const filePath = getItemPath(currentWorkspace, type, currentStatus, id);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data, content: body } = matter(content);

    res.json({ id, ...data, _status: currentStatus, body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/items/:type', async (req, res) => {
  try {
    if (!currentWorkspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { type } = req.params;
    if (!WORKSPACE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const id = generateId(type);
    const now = new Date().toISOString().split('T')[0];
    const status = 'new';
    
    const { title, body = '' } = req.body;

    const frontmatter = {
      id,
      title: title || 'Untitled',
      status,
      created: now,
      updated: now
    };

    const fileContent = matter.stringify(body, frontmatter);
    const filePath = getItemPath(currentWorkspace, type, status, id);

    await fs.writeFile(filePath, fileContent, 'utf-8');

    res.json({ id, ...frontmatter, _status: status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/items/:type/:id', async (req, res) => {
  try {
    if (!currentWorkspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { type, id } = req.params;
    if (!WORKSPACE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const currentStatus = await findItemLocation(currentWorkspace, type, id);
    if (!currentStatus) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const filePath = getItemPath(currentWorkspace, type, currentStatus, id);
    const content = await fs.readFile(filePath, 'utf-8');
    const { data } = matter(content);
    const now = new Date().toISOString().split('T')[0];

    const { title, body } = req.body;

    const frontmatter = {
      ...data,
      title: title !== undefined ? title : data.title,
      updated: now
    };

    const newBody = body !== undefined ? body : content.split('---')[2]?.trim() || '';
    const fileContent = matter.stringify(newBody, frontmatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');

    res.json({ id, ...frontmatter, _status: currentStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/items/:type/:id/move', async (req, res) => {
  try {
    if (!currentWorkspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { type, id } = req.params;
    if (!WORKSPACE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const { status: targetStatus } = req.body;
    if (!STATUSES.includes(targetStatus)) {
      return res.status(400).json({ error: 'Invalid status. Must be new, inprogress, or finished' });
    }

    const currentStatus = await findItemLocation(currentWorkspace, type, id);
    if (!currentStatus) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (currentStatus === targetStatus) {
      return res.json({ id, status: targetStatus, _status: currentStatus, message: 'Already in this status' });
    }

    const sourcePath = getItemPath(currentWorkspace, type, currentStatus, id);
    const targetPath = getItemPath(currentWorkspace, type, targetStatus, id);

    const content = await fs.readFile(sourcePath, 'utf-8');
    const { data } = matter(content);
    const now = new Date().toISOString().split('T')[0];

    const frontmatter = {
      ...data,
      status: targetStatus,
      updated: now
    };

    const fileContent = matter.stringify(content.split('---')[2]?.trim() || '', frontmatter);
    await fs.writeFile(targetPath, fileContent, 'utf-8');
    await fs.remove(sourcePath);

    res.json({ id, ...frontmatter, _status: targetStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/items/:type/:id', async (req, res) => {
  try {
    if (!currentWorkspace) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { type, id } = req.params;
    if (!WORKSPACE_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const currentStatus = await findItemLocation(currentWorkspace, type, id);
    if (!currentStatus) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const filePath = getItemPath(currentWorkspace, type, currentStatus, id);
    await fs.remove(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
