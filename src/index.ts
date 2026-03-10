#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { YamahaDocClient } from './client.js';

class YamahaReferenceServer {
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
    process.on('SIGINT', () => {
      void this.server.close();
      process.exit(0);
    });
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
              command_path: { 
                type: 'string', 
                description: 'The filename or relative path of the command documentation (e.g., ip_route.html)' 
              },
            },
            required: ['command_path'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'list_categories': {
          const categories = await this.client.listCategoriesAndCommands();
          return {
            content: [{ type: 'text', text: JSON.stringify(categories.map(c => c.name), null, 2) }],
          };
        }

        case 'list_commands_by_category': {
          const categoryName = request.params.arguments?.category_name as string;
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
          const query = (request.params.arguments?.query as string).toLowerCase();
          const categories = await this.client.listCategoriesAndCommands();
          const results = categories.flatMap(c => c.commands)
            .filter(cmd => cmd.name.toLowerCase().includes(query) || cmd.path.toLowerCase().includes(query));

          return {
            content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
          };
        }

        case 'get_command_details': {
          const path = request.params.arguments?.command_path as string;
          const detail = await this.client.getCommandDetail(path);
          
          if (!detail) {
            throw new McpError(ErrorCode.InvalidParams, `Command details for "${path}" not found.`);
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Yamaha RTX Reference MCP server running on stdio');
  }
}

const server = new YamahaReferenceServer();
void server.run().catch(console.error);
