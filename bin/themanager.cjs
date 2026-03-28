#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const mcpScript = path.join(__dirname, '..', 'app', 'server', 'mcp.js');

const workspacePath = process.env.WORKSPACE_PATH || process.argv[2];

if (!workspacePath) {
  console.error('Error: WORKSPACE_PATH environment variable or CLI argument required');
  console.error('');
  console.error('Usage:');
  console.error('  themanager /path/to/project');
  console.error('  WORKSPACE_PATH=/path/to/project themanager');
  console.error('');
  console.error('Examples:');
  console.error('  themanager ~/Projects/myapp');
  console.error('  themanager /Users/me/Dev/workspace');
  process.exit(1);
}

if (!fs.existsSync(workspacePath)) {
  console.error(`Error: Workspace path does not exist: ${workspacePath}`);
  process.exit(1);
}

const serverPath = path.resolve(__dirname, '..', 'app', 'server');
const mcpEnv = { ...process.env, WORKSPACE_PATH: workspacePath };

const child = spawn('node', [mcpScript], {
  cwd: serverPath,
  env: mcpEnv,
  stdio: 'inherit'
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

child.on('error', (err) => {
  console.error('Failed to start MCP server:', err);
  process.exit(1);
});
