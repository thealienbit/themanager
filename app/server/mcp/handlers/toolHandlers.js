const {
  readItemsForType,
  readItem,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
  searchItems,
} = require('../services/itemService');

const TOOLS = [
  {
    name: 'list_items',
    description: 'List all feats or bugs, optionally filtered by status',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of items to list',
        },
        status: {
          type: 'string',
          enum: ['new', 'inprogress', 'finished'],
          description: 'Filter by status (optional)',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'get_item',
    description: 'Get a single feat or bug by ID with full content',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of item',
        },
        id: {
          type: 'string',
          description: 'Item ID (e.g., feat-abc123)',
        },
      },
      required: ['type', 'id'],
    },
  },
  {
    name: 'create_item',
    description: 'Create a new feat or bug',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of item to create',
        },
        title: {
          type: 'string',
          description: 'Title of the item',
        },
        body: {
          type: 'string',
          description: 'Markdown content body (optional)',
        },
      },
      required: ['type', 'title'],
    },
  },
  {
    name: 'update_item',
    description: 'Update an existing feat or bug',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of item',
        },
        id: {
          type: 'string',
          description: 'Item ID',
        },
        title: {
          type: 'string',
          description: 'New title (optional)',
        },
        body: {
          type: 'string',
          description: 'New markdown body content (optional)',
        },
      },
      required: ['type', 'id'],
    },
  },
  {
    name: 'move_item',
    description: 'Move a feat or bug to a different status',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of item',
        },
        id: {
          type: 'string',
          description: 'Item ID',
        },
        status: {
          type: 'string',
          enum: ['new', 'inprogress', 'finished'],
          description: 'Target status',
        },
      },
      required: ['type', 'id', 'status'],
    },
  },
  {
    name: 'delete_item',
    description: 'Delete a feat or bug',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of item',
        },
        id: {
          type: 'string',
          description: 'Item ID',
        },
      },
      required: ['type', 'id'],
    },
  },
  {
    name: 'search_items',
    description: 'Search feats or bugs by title or content',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['feats', 'bugs'],
          description: 'Type of items to search',
        },
        query: {
          type: 'string',
          description: 'Search query string',
        },
      },
      required: ['type', 'query'],
    },
  },
];

const handleListTools = async () => {
  return { tools: TOOLS };
};

const handleCallTool = async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'list_items': {
        const { type, status } = args;
        let items = await readItemsForType(type);
        if (status) {
          items = items.filter(item => item._status === status);
        }
        return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
      }
      
      case 'get_item': {
        const { type, id } = args;
        const item = await readItem(type, id);
        if (!item) {
          return { content: [{ type: 'text', text: `Item not found: ${id}` }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }
      
      case 'create_item': {
        const { type, title, body: bodyContent = '' } = args;
        const item = await createItem(type, title, bodyContent);
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }
      
      case 'update_item': {
        const { type, id, title, body: bodyContent } = args;
        const item = await updateItem(type, id, title, bodyContent);
        if (!item) {
          return { content: [{ type: 'text', text: `Item not found: ${id}` }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }
      
      case 'move_item': {
        const { type, id, status: targetStatus } = args;
        const result = await moveItem(type, id, targetStatus);
        if (!result) {
          return { content: [{ type: 'text', text: `Item not found: ${id}` }], isError: true };
        }
        if (result.alreadyMoved) {
          return { content: [{ type: 'text', text: `Item already in ${targetStatus} status` }] };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      }
      
      case 'delete_item': {
        const { type, id } = args;
        const result = await deleteItem(type, id);
        if (!result) {
          return { content: [{ type: 'text', text: `Item not found: ${id}` }], isError: true };
        }
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      
      case 'search_items': {
        const { type, query } = args;
        const results = await searchItems(type, query);
        return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
      }
      
      default:
        return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    console.error(`[MCP] Error in ${name}:`, error.message);
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
};

module.exports = {
  handleListTools,
  handleCallTool,
};
