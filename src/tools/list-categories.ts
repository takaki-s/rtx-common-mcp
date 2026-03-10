import { McpTool } from './index.js';

export const listCategoriesTool: McpTool = {
  name: 'list_categories',
  description: 'Get all functional groups/chapters in the Yamaha RTX manual.',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async (client) => {
    const categories = await client.listCategoriesAndCommands();
    return {
      content: [{ type: 'text', text: JSON.stringify(categories.map(c => c.name), null, 2) }],
    };
  },
};
