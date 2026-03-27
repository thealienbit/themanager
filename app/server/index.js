const { configureApp, setupStaticFiles } = require('./config/app');
const { PORT } = require('./config/constants');
const { initializeWorkspace } = require('./config/state');
const routes = require('./routes');
const path = require('path');

let server = null;

/**
 * Start the Express server
 * @param {string} workspacePath - Path to the workspace directory
 * @param {number} port - Port to run the server on (defaults to PORT constant)
 * @returns {Promise<{app: Express, server: http.Server}>}
 */
const startServer = async (workspacePath, port = PORT) => {
  // Validate and initialize workspace
  if (!workspacePath) {
    throw new Error('Workspace path is required');
  }
  
  console.log(`[Server] Initializing workspace: ${workspacePath}`);
  await initializeWorkspace(workspacePath);
  console.log(`[Server] Workspace initialized successfully`);
  
  // Create and configure Express app
  const app = configureApp();
  
  // Mount API routes
  app.use('/api', routes);
  
  // Setup static file serving for React app
  const hasStaticFiles = setupStaticFiles(app);
  if (!hasStaticFiles) {
    console.warn(`[Server] Warning: React build not found. Run 'npm run build' in client folder.`);
  }
  
  // Start server
  return new Promise((resolve, reject) => {
    server = app.listen(port, () => {
      console.log(`[Server] Running on http://localhost:${port}`);
      if (hasStaticFiles) {
        console.log(`[Server] Web UI available at http://localhost:${port}`);
      }
      resolve({ app, server });
    });
    
    server.on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Stop the Express server
 * @returns {Promise<void>}
 */
const stopServer = () => {
  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }
    
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      console.log('[Server] Server stopped');
      server = null;
      resolve();
    });
  });
};

// If run directly (not imported), start with environment variable or CLI argument
if (require.main === module) {
  const workspacePath = process.env.WORKSPACE_PATH || process.argv[2];
  
  if (!workspacePath) {
    console.error('Error: WORKSPACE_PATH environment variable or CLI argument required');
    console.error('Usage: WORKSPACE_PATH=/path/to/project node index.js');
    console.error('   or: node index.js /path/to/project');
    process.exit(1);
  }
  
  startServer(workspacePath).catch((error) => {
    console.error('[Server] Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { startServer, stopServer };
