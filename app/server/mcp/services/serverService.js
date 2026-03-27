const { startServer, stopServer } = require('../../index.js');

let expressServer = null;

const startExpressServer = async (workspacePath, port) => {
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
