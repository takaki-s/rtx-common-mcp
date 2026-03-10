import { McpTool } from './index.js';

export const listCategoriesTool: McpTool = {
  name: 'list_categories',
  description: 'Get functional groups/chapters. Provide parent_category to drill down into sub-categories.',
  inputSchema: {
    type: 'object',
    properties: {
      parent_category: { 
        type: 'string', 
        description: 'Optional name or id of the parent category to list sub-categories for.' 
      },
    },
  },
  handler: async (client, args) => {
    const parent = args?.parent_category as string | undefined;
    const result = await client.listCategories(parent);
    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  },
};
