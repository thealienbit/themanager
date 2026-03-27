const http = require('http');
const { startServer, stopServer } = require('../../index.js');

let expressServer = null;

const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      // If we get a response, server is running
      resolve(true);
    });
    
    req.on('error', () => {
      // Connection refused means server is not running
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
};

const startExpressServer = async (workspacePath, port) => {
  // Check if server is already running
  const alreadyRunning = await isPortInUse(port);
  
  if (alreadyRunning) {
    console.error(`[MCP] Server already running on port ${port}, skipping startup`);
    console.error(`[MCP] Web UI available at http://localhost:${port}`);
    return null;
  }
  
  console.error('[MCP] Starting Express server...');
  const { server: httpServer } = await startServer(workspacePath, port);
  expressServer = httpServer;
  console.error(`[MCP] Express server running on http://localhost:${port}`);
  console.error(`[MCP] Web UI available at http://localhost:${port}`);
  return httpServer;
};

const cleanup = async () => {
  console.error('[MCP] Cleaning up...');
  
  try {
    if (expressServer) {
      await stopServer();
      expressServer = null;
    }
  } catch (error) {
    console.error('[MCP] Error stopping server:', error.message);
  }
  
  console.error('[MCP] Cleanup complete');
};

const setupSignalHandlers = () => {
  process.on('SIGINT', async () => {
    console.error('[MCP] Received SIGINT');
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[MCP] Received SIGTERM');
    await cleanup();
    process.exit(0);
  });

  process.on('exit', () => {
    console.error('[MCP] Process exiting');
  });
};

module.exports = {
  startExpressServer,
  cleanup,
  setupSignalHandlers,
};
