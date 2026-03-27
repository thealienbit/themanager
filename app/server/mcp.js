#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const { buildClient } = require('./mcp/services/buildService');
const { startExpressServer, cleanup, setupSignalHandlers } = require('./mcp/services/serverService');
const { handleListResources, handleReadResource } = require('./mcp/handlers/resourceHandlers');
const { handleListTools, handleCallTool } = require('./mcp/handlers/toolHandlers');

const WORKSPACE_PATH = process.env.WORKSPACE_PATH;
const PORT = process.env.PORT || 3001;

if (!WORKSPACE_PATH) {
  console.error('[MCP] Error: WORKSPACE_PATH environment variable not set');
  console.error('[MCP] Usage: WORKSPACE_PATH=/path/to/project node mcp.js');
  process.exit(1);
}

// Setup cleanup handlers
setupSignalHandlers();

// Create MCP server
const server = new Server(
  { name: 'themanager', version: '1.0.0' },
  { capabilities: { resources: {}, tools: {} } }
);

// Register handlers
server.setRequestHandler(ListResourcesRequestSchema, handleListResources);
server.setRequestHandler(ReadResourceRequestSchema, handleReadResource);
server.setRequestHandler(ListToolsRequestSchema, handleListTools);
server.setRequestHandler(CallToolRequestSchema, handleCallTool);

const main = async () => {
  console.error(`[MCP] TheManager MCP server starting...`);
  console.error(`[MCP] Workspace: ${WORKSPACE_PATH}`);
  
  try {
    // Build client if needed
    await buildClient();
    
    // Start Express server
    await startExpressServer(WORKSPACE_PATH, PORT);
    
    console.error('[MCP] MCP server ready');
    
    // Connect MCP server via stdio
    const transport = new StdioServerTransport();
    await server.connect(transport);
  } catch (error) {
    console.error('[MCP] Fatal error:', error);
    await cleanup();
    process.exit(1);
  }
};

main().catch(async (error) => {
  console.error('[MCP] Fatal error:', error);
  await cleanup();
  process.exit(1);
});
