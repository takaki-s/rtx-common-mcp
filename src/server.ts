import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { YamahaDocClient } from './client.js';
import { McpTool } from './tools/index.js';
import { listCategoriesTool } from './tools/list-categories.js';
import { listCommandsByCategoryTool } from './tools/list-commands.js';
import { searchCommandsTool } from './tools/search-commands.js';
import { getCommandDetailsTool } from './tools/get-command-details.js';

export class YamahaReferenceServer {
  private server: Server;
  private client: YamahaDocClient;
  private tools = new Map<string, McpTool>();

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
    this.registerTools();
    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
  }

  private registerTools() {
    const toolList = [
      listCategoriesTool,
      listCommandsByCategoryTool,
      searchCommandsTool,
      getCommandDetailsTool,
    ];

    for (const tool of toolList) {
      this.tools.set(tool.name, tool);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, (request) => 
      this.handleToolCall(request.params.name, request.params.arguments)
    );
  }

  /**
   * Internal tool handler logic, exposed for unit testing.
   */
  async handleToolCall(name: string, args: Record<string, unknown> | undefined) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }

    return tool.handler(this.client, args);
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
