import { McpTool } from './index.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export const getCommandDetailsTool: McpTool = {
  name: 'get_command_details',
  description: 'Get detailed documentation for a specific command.',
  inputSchema: {
    type: 'object',
    properties: {
      command_name: { 
        type: 'string', 
        description: 'The name of the command (e.g., "ip route", "ping", "nat descriptor")' 
      },
    },
    required: ['command_name'],
  },
  handler: async (client, args) => {
    const cmdName = args?.command_name;
    if (typeof cmdName !== 'string') {
      throw new McpError(ErrorCode.InvalidParams, 'command_name must be a string.');
    }

    const path = await client.resolveCommandPath(cmdName);

    if (!path) {
      throw new McpError(ErrorCode.InvalidParams, `Could not find command: "${cmdName}"`);
    }

    const detail = await client.getCommandDetail(path, cmdName);
    if (!detail) {
      throw new McpError(ErrorCode.InvalidParams, `Command details for "${cmdName}" (path: ${path}) not found.`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
    };
  },
};
