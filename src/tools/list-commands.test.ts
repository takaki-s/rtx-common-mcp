import { describe, it, expect } from 'vitest';
import { listCommandsByCategoryTool } from './list-commands.js';
import { YamahaDocClient, CommandInfo } from '../client.js';

describe('listCommandsByCategoryTool (Integration)', () => {
  const client = new YamahaDocClient();

  it('should return real commands for a valid live category', async () => {
    const result = await listCommandsByCategoryTool.handler(client, { category_name: '状態の表示' });
    const text = result.content[0].text;
    const commands = JSON.parse(text) as CommandInfo[];
    
    expect(Array.isArray(commands)).toBe(true);
    // Find the exact command using the new field name
    const ipRoute = commands.find((c) => c.command === 'show ip route');
    expect(ipRoute).toBeDefined();
    if (ipRoute) {
      expect(ipRoute.description).toContain('IP の経路情報');
    }
  });
});
