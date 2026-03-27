const itemService = require('../services/itemService');

class ItemController {
  /**
   * GET /api/items/:type
   * Get all items of a specific type
   */
  async getItems(req, res) {
    try {
      const { type } = req.params;
      console.log('[DEBUG] Get items - type:', type);
      
      const items = await itemService.getItems(type);
      console.log('[DEBUG] Returning items:', items.length);
      
      res.json(items);
    } catch (error) {
      console.error('[DEBUG] Error:', error);
      
      if (error.message === 'No workspace selected') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid type')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/items/:type/:id
   * Get a single item by ID
   */
  async getItem(req, res) {
    try {
      const { type, id } = req.params;
      
      const item = await itemService.getItem(type, id);
      res.json(item);
    } catch (error) {
      console.error('[ERROR] Get item:', error);
      
      if (error.message === 'No workspace selected') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid type')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Item not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/items/:type
   * Create a new item
   */
  async createItem(req, res) {
    try {
      const { type } = req.params;
      const { title, body } = req.body;
      
      const item = await itemService.createItem(type, { title, body });
      res.json(item);
    } catch (error) {
      console.error('[ERROR] Create item:', error);
      
      if (error.message === 'No workspace selected') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid type')) {
        return res.status(400).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/items/:type/:id
   * Update an existing item
   */
  async updateItem(req, res) {
    try {
      const { type, id } = req.params;
      const { title, body } = req.body;
      
      const item = await itemService.updateItem(type, id, { title, body });
      res.json(item);
    } catch (error) {
      console.error('[ERROR] Update item:', error);
      
      if (error.message === 'No workspace selected') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid type')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Item not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/items/:type/:id/move
   * Move an item to a different status
   */
  async moveItem(req, res) {
    try {
      const { type, id } = req.params;
      const { status: targetStatus } = req.body;
      
      const result = await itemService.moveItem(type, id, targetStatus);
      res.json(result);
    } catch (error) {
      console.error('[ERROR] Move item:', error);
      
      if (error.message === 'No workspace selected') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid type') || 
          error.message.includes('Invalid status')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Item not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/items/:type/:id
   * Delete an item
   */
  async deleteItem(req, res) {
    try {
      const { type, id } = req.params;
      
      const result = await itemService.deleteItem(type, id);
      res.json(result);
    } catch (error) {
      console.error('[ERROR] Delete item:', error);
      
      if (error.message === 'No workspace selected') {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid type')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message === 'Item not found') {
        return res.status(404).json({ error: error.message });
      }
      
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ItemController();
