import { YamahaDocClient } from '../client.js';

export interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (client: YamahaDocClient, args: Record<string, unknown> | undefined) => Promise<{
    content: { type: 'text'; text: string }[];
  }>;
}
