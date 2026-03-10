import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { listCommandsByCategoryTool } from './list-commands.js';
import { YamahaDocClient, CommandInfo } from '../client.js';
import { mockYamahaFetch } from '../test-utils.js';

describe('listCommandsByCategoryTool (Integration)', () => {
  const client = new YamahaDocClient();

  beforeEach(() => {
    mockYamahaFetch();
  });

  afterEach(() => {
    (globalThis as unknown as { fetch?: typeof fetch }).fetch = undefined;
  });

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

  it('should collect commands from a large category', async () => {
    const result = await listCommandsByCategoryTool.handler(client, { category_name: '機器の設定' });
    const commands = JSON.parse(result.content[0].text) as CommandInfo[];
    const loginPassword = commands.find((c) => c.command === 'login password');
    expect(loginPassword).toBeDefined();
  });
});
