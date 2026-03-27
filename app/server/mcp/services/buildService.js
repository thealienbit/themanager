const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

const buildClient = async () => {
  const clientPath = path.join(__dirname, '..', '..', '..', 'client');
  const distPath = path.join(clientPath, 'dist');
  
  // Check if dist folder exists and is recent
  if (fs.existsSync(distPath)) {
    const distStats = fs.statSync(distPath);
    const srcPath = path.join(clientPath, 'src');
    
    // Check if src is newer than dist
    if (fs.existsSync(srcPath)) {
      const srcStats = fs.statSync(srcPath);
      if (distStats.mtime > srcStats.mtime) {
        console.error('[MCP] Using existing React build');
        return;
      }
    }
  }
  
  console.error('[MCP] Building React client...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = spawn('npm', ['run', 'build'], {
      cwd: clientPath,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    let errors = '';
    
    buildProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    buildProcess.stderr.on('data', (data) => {
      errors += data.toString();
    });
    
    buildProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[MCP] Build stdout:', output);
        console.error('[MCP] Build stderr:', errors);
        reject(new Error(`Build failed with exit code ${code}`));
      } else {
        console.error('[MCP] React client built successfully');
        resolve();
      }
    });
  });
};

module.exports = {
  buildClient,
};
