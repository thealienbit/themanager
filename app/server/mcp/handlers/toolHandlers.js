const {
  readItemsForType,
  readItem,
  createItem,
  updateItem,
  moveItem,
  deleteItem,
  searchItems,
  getProjectSummary,
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
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Filter by priority (optional)',
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
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'Priority level (optional, defaults to medium)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of label tags (optional)',
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
        priority: {
          type: 'string',
          enum: ['critical', 'high', 'medium', 'low'],
          description: 'New priority level (optional)',
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'New array of label tags (optional)',
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
  {
    name: 'get_project_summary',
    description: 'Get a high-level project summary: counts by type/status, critical and high priority items, and recently updated items. Use this to quickly orient yourself on the project state.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
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
        const { type, status, priority } = args;
        let items = await readItemsForType(type);
        if (status) {
          items = items.filter(item => item._status === status);
        }
        if (priority) {
          items = items.filter(item => item.priority === priority);
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
        const { type, title, body: bodyContent = '', priority, labels } = args;
        const item = await createItem(type, title, bodyContent, priority, labels);
        return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
      }
      
      case 'update_item': {
        const { type, id, title, body: bodyContent, priority, labels } = args;
        const item = await updateItem(type, id, title, bodyContent, priority, labels);
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

      case 'get_project_summary': {
        const summary = await getProjectSummary();
        return { content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }] };
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
