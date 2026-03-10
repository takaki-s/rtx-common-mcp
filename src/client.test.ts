import { describe, it, expect, beforeEach } from 'vitest';
import { YamahaDocClient } from './client.js';

describe('YamahaDocClient Scraper', () => {
  let client: YamahaDocClient;

  beforeEach(() => {
    client = new YamahaDocClient();
  });

  it('should list categories with valid names', async () => {
    const categories = await client.listCategoriesAndCommands();
    expect(categories.length).toBeGreaterThan(0);
    
    categories.forEach(cat => {
      expect(cat.name).toBeDefined();
      expect(cat.name).not.toMatch(/^\d+\.\s/);
    });

    const names = categories.map(c => c.name);
    expect(names).toContain('機器の設定');
    expect(names).toContain('状態の表示');
  });

  it('should provide exact command names in the list', async () => {
    const categories = await client.listCategoriesAndCommands();
    const statusChapter = categories.find(c => c.name === '状態の表示');
    expect(statusChapter).toBeDefined();
    
    const ipRoute = statusChapter?.commands.find(c => c.command === 'show ip route');
    expect(ipRoute).toBeDefined();
    expect(ipRoute?.description).toContain('IP の経路情報');
  });

  it('should resolve command name to path', async () => {
    const path = await client.resolveCommandPath('show ip route');
    expect(path).toContain('show_ip_route.html');
  });

  it('should fetch and parse "show ip route" detail by name', async () => {
    const path = await client.resolveCommandPath('show ip route');
    if (path) {
      const detail = await client.getCommandDetail(path);
      expect(detail?.command).toBe('show ip route');
      expect(detail?.syntax).toContain('show ip route [destination]');
    }
  });

  it('should handle non-existent commands', async () => {
    const path = await client.resolveCommandPath('nonexistent-cmd-999');
    expect(path).toBeNull();
  });
});
