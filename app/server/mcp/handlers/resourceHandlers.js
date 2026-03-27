const {
  readItemsForType,
  readItem,
  WORKSPACE_TYPES,
} = require('../services/itemService');

const handleListResources = async () => {
  const resources = [];
  
  for (const type of WORKSPACE_TYPES) {
    resources.push({
      uri: `${type}://list`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} List`,
      description: `List all ${type} items`,
      mimeType: 'application/json',
    });
    
    const items = await readItemsForType(type);
    for (const item of items) {
      resources.push({
        uri: `${type}://${item.id}`,
        name: item.title || item.id,
        description: `${type.slice(0, -1)} item: ${item.id}`,
        mimeType: 'text/markdown',
      });
    }
  }
  
  return { resources };
};

const handleReadResource = async (request) => {
  const { uri } = request.params;
  const match = uri.match(/^(feats|bugs):\/\/(.+)$/);
  
  if (!match) {
    throw new Error(`Invalid resource URI: ${uri}`);
  }
  
  const [, type, resource] = match;
  
  if (!WORKSPACE_TYPES.includes(type)) {
    throw new Error(`Invalid type: ${type}`);
  }
  
  if (resource === 'list') {
    const items = await readItemsForType(type);
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2),
      }],
    };
  }
  
  const item = await readItem(type, resource);
  if (!item) {
    throw new Error(`Item not found: ${resource}`);
  }
  
  return {
    contents: [{
      uri,
      mimeType: 'text/markdown',
      text: JSON.stringify(item, null, 2),
    }],
  };
};

module.exports = {
  handleListResources,
  handleReadResource,
};
