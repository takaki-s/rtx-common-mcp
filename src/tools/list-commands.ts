import { McpTool } from './index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export const listCommandsByCategoryTool: McpTool = {
  name: 'list_commands_by_category',
  description: 'Get all commands within a specific functional group (recursively).',
  inputSchema: {
    type: 'object',
    properties: {
      category_name: { type: 'string' },
    },
    required: ['category_name'],
  },
  handler: async (client, args) => {
    const categoryName = args?.category_name;
    if (typeof categoryName !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'category_name must be a string.');
    }

    const commands = await client.listCommandsByCategory(categoryName);
    if (commands.length === 0) {
      throw new McpError(ErrorCode.InvalidParams, `Category "${categoryName}" not found.`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(commands, null, 2) }],
    };
  },
};
