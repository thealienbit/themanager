const express = require('express');
const router = express.Router({ mergeParams: true });
const itemController = require('../controllers/itemController');

// GET /api/items/:type - Get all items of a type
router.get('/', itemController.getItems.bind(itemController));

// POST /api/items/:type - Create a new item
router.post('/', itemController.createItem.bind(itemController));

// GET /api/items/:type/:id - Get a single item
router.get('/:id', itemController.getItem.bind(itemController));

// PUT /api/items/:type/:id - Update an item
router.put('/:id', itemController.updateItem.bind(itemController));

// PATCH /api/items/:type/:id/move - Move item to different status
router.patch('/:id/move', itemController.moveItem.bind(itemController));

// DELETE /api/items/:type/:id - Delete an item
router.delete('/:id', itemController.deleteItem.bind(itemController));

module.exports = router;
