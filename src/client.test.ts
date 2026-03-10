import { describe, it, expect, beforeEach } from 'vitest';
import { YamahaDocClient } from './client.js';

describe('YamahaDocClient Scraper', () => {
  let client: YamahaDocClient;

  beforeEach(() => {
    client = new YamahaDocClient();
  });

  it('should list categories correctly from the live TOC', async () => {
    const categories = await client.listCategoriesAndCommands();
    expect(categories.length).toBeGreaterThan(0);
    const statusChapter = categories.find(c => c.name.includes('状態の表示'));
    expect(statusChapter).toBeDefined();
    expect(statusChapter?.commands.length).toBeGreaterThan(10);
  });

  it('should resolve command name to path', async () => {
    const path = await client.resolveCommandPath('show ip route');
    expect(path).toContain('show_ip_route.html');
  });

  it('should fetch and parse "show ip route" detail by name', async () => {
    const path = await client.resolveCommandPath('show ip route');
    expect(path).not.toBeNull();
    if (path) {
      const detail = await client.getCommandDetail(path);
      expect(detail).not.toBeNull();
      if (detail) {
        expect(detail.name).toContain('IP の経路情報テーブルの表示');
        expect(detail.syntax).toContain('show ip route [destination]');
      }
    }
  });

  it('should handle non-existent commands gracefully', async () => {
    const path = await client.resolveCommandPath('nonexistent-command-12345');
    expect(path).toBeNull();
  });

  it('should resolve and parse "ping" correctly', async () => {
    const path = await client.resolveCommandPath('ping');
    expect(path).not.toBeNull();
    if (path) {
      const detail = await client.getCommandDetail(path);
      expect(detail?.syntax).toContain('ping [-s datalen] [-c count] [-sa ip_address] [-w wait] host');
    }
  });

  it('should resolve and parse "nat descriptor" correctly', async () => {
    const path = await client.resolveCommandPath('nat descriptor');
    expect(path).not.toBeNull();
    if (path) {
      const detail = await client.getCommandDetail(path);
      expect(detail?.syntax.length).toBeGreaterThan(0);
    }
  });

  it('should parse notes and applicable models if present', async () => {
    // Administrator password usually has notes and models
    const path = await client.resolveCommandPath('administrator password');
    expect(path).not.toBeNull();
    if (path) {
      const detail = await client.getCommandDetail(path);
      expect(detail).not.toBeNull();
      // Most commands have applicable models
      expect(detail?.applicableModels.length).toBeGreaterThan(0);
    }
  });
});
