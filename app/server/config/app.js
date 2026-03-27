// Express app configuration
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const configureApp = () => {
  const app = express();
  
  app.use(cors());
  app.use(express.json());
  
  return app;
};

const setupStaticFiles = (app) => {
  const distPath = path.join(__dirname, '..', '..', 'client', 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  // Check if dist folder exists
  if (fs.existsSync(distPath)) {
    // Serve static files
    app.use(express.static(distPath));
    
    // SPA fallback - serve index.html for all non-API routes
    app.use((req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(indexPath);
    });
    
    return true;
  }
  
  return false;
};

module.exports = {
  configureApp,
  setupStaticFiles
};
