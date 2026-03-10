import { McpTool } from './index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export const searchCommandsTool: McpTool = {
  name: 'search_commands',
  description: 'Search for commands by keyword in their name or path.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' },
    },
    required: ['query'],
  },
  handler: async (client, args) => {
    const query = args?.query;
    if (typeof query !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'query must be a string.');
    }

    const normalizedQuery = query.toLowerCase();
    const categories = await client.listCategoriesAndCommands();
    const results = categories.flatMap(c => c.commands)
      .filter(cmd => 
        cmd.command.toLowerCase().includes(normalizedQuery) || 
        cmd.description.toLowerCase().includes(normalizedQuery)
      );

    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
  },
};
