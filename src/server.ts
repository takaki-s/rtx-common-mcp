import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { YamahaDocClient } from './client.js';

export class YamahaReferenceServer {
  private server: Server;
  private client: YamahaDocClient;

  constructor() {
    this.server = new Server(
      {
        name: 'yamaha-rtx-ref',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.client = new YamahaDocClient();
    this.setupTools();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: [
        {
          name: 'list_categories',
          description: 'Get all functional groups/chapters in the Yamaha RTX manual.',
        },
        {
          name: 'list_commands_by_category',
          description: 'Get all commands within a specific functional group.',
          inputSchema: {
            type: 'object',
            properties: {
              category_name: { type: 'string' },
            },
            required: ['category_name'],
          },
        },
        {
          name: 'search_commands',
          description: 'Search for commands by keyword in their name or path.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
            required: ['query'],
          },
        },
        {
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
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, (request) => 
      this.handleToolCall(request.params.name, request.params.arguments)
    );
  }

  /**
   * Internal tool handler logic, exposed for unit testing.
   */
  async handleToolCall(name: string, args: any) {
    switch (name) {
      case 'list_categories': {
        const categories = await this.client.listCategoriesAndCommands();
        return {
          content: [{ type: 'text', text: JSON.stringify(categories.map(c => c.name), null, 2) }],
        };
      }

      case 'list_commands_by_category': {
        const categoryName = args?.category_name as string;
        const categories = await this.client.listCategoriesAndCommands();
        const category = categories.find(c => c.name.includes(categoryName));
        
        if (!category) {
          throw new McpError(ErrorCode.InvalidParams, `Category "${categoryName}" not found.`);
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(category.commands, null, 2) }],
        };
      }

      case 'search_commands': {
        const query = (args?.query as string).toLowerCase();
        const categories = await this.client.listCategoriesAndCommands();
        const results = categories.flatMap(c => c.commands)
          .filter(cmd => cmd.name.toLowerCase().includes(query) || cmd.path.toLowerCase().includes(query));

        return {
          content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
        };
      }

      case 'get_command_details': {
        const cmdName = args?.command_name as string;
        const path = await this.client.resolveCommandPath(cmdName);

        if (!path) {
          throw new McpError(ErrorCode.InvalidParams, `Could not find command: "${cmdName}"`);
        }

        const detail = await this.client.getCommandDetail(path);
        if (!detail) {
          throw new McpError(ErrorCode.InvalidParams, `Command details for "${cmdName}" (path: ${path}) not found.`);
        }

        return {
          content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Yamaha RTX Reference MCP server running on stdio');
  }

  async stop() {
    await this.server.close();
  }
}
