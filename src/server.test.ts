import { describe, it, expect, vi, beforeEach } from 'vitest';
import { YamahaReferenceServer } from './server.js';

// Correct mock for a class
vi.mock('./client.js', () => {
  return {
    YamahaDocClient: vi.fn().mockImplementation(function() {
      return {
        listAllCategoriesAndCommands: vi.fn().mockResolvedValue([
          { id: 'cat-1', name: 'Category 1', subCategories: [], commands: [{ command: 'cmd1', description: 'desc1' }] }
        ]),
        listCategories: vi.fn().mockResolvedValue([
          { id: 'cat-1', name: 'Category 1', subCategories: [], commands: [] }
        ]),
        listCommandsByCategory: vi.fn().mockImplementation((name: string) => {
          if (name === 'Category 1') {
            return Promise.resolve([{ command: 'cmd1', description: 'desc1' }]);
          }
          return Promise.resolve([]);
        }),
        resolveCommandPath: vi.fn().mockImplementation((q: string) => {
          if (q === 'cmd1') return Promise.resolve('p1.html');
          return Promise.resolve(null);
        }),
        getCommandDetail: vi.fn().mockImplementation((p: string) => {
          if (p === 'p1.html') {
            return Promise.resolve({
              command: 'cmd1',
              syntax: ['syntax1'],
              description: 'desc1',
              parameters: [],
              notes: [],
              examples: [],
              applicableModels: []
            });
          }
          return Promise.resolve(null);
        }),
      };
    })
  };
});

describe('YamahaReferenceServer', () => {
  let server: YamahaReferenceServer;

  beforeEach(() => {
    server = new YamahaReferenceServer();
  });

  it('should list categories', async () => {
    const result = await server.handleToolCall('list_categories', {});
    expect(result.content[0].text).toContain('Category 1');
  });

  it('should list commands in category', async () => {
    const result = await server.handleToolCall('list_commands_by_category', { category_name: 'Category 1' });
    expect(result.content[0].text).toContain('cmd1');
  });

  it('should throw error for invalid category', async () => {
    await expect(server.handleToolCall('list_commands_by_category', { category_name: 'Invalid' }))
      .rejects.toThrow('Category "Invalid" not found.');
  });

  it('should search commands', async () => {
    const result = await server.handleToolCall('search_commands', { query: 'cmd' });
    expect(result.content[0].text).toContain('cmd1');
  });

  it('should get command details', async () => {
    const result = await server.handleToolCall('get_command_details', { command_name: 'cmd1' });
    expect(result.content[0].text).toContain('syntax1');
  });

  it('should throw error for unknown command', async () => {
    await expect(server.handleToolCall('get_command_details', { command_name: 'unknown' }))
      .rejects.toThrow('Could not find command: "unknown"');
  });

  it('should throw error for unknown tool', async () => {
    await expect(server.handleToolCall('invalid_tool', {}))
      .rejects.toThrow('Unknown tool: invalid_tool');
  });
});
