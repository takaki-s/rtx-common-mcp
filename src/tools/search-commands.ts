import { McpTool } from './index.js';
import { CommandInfo, Category } from '../client.js';
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
    const categories = await client.listAllCategoriesAndCommands();
    const flatten = (nodes: Category[]) => {
      const out: CommandInfo[] = [];
      const walk = (n: Category[]) => {
        for (const node of n) {
          out.push(...node.commands);
          if (node.subCategories.length > 0) walk(node.subCategories);
        }
      };
      walk(nodes);
      return out;
    };
    const results = flatten(categories)
      .filter(cmd => {
        const normalizedCommand = cmd.command.toLowerCase();
        return (
          normalizedCommand.includes(normalizedQuery) ||
          normalizedQuery === normalizedCommand ||
          normalizedQuery.startsWith(`${normalizedCommand} `) ||
          cmd.description.toLowerCase().includes(normalizedQuery)
        );
      });

    return {
      content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
    };
  },
};
