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
    // Find the status chapter (chapter 58 in TOC)
    const statusChapter = categories.find(c => c.name.includes('状態の表示'));
    expect(statusChapter).toBeDefined();
    expect(statusChapter?.commands.length).toBeGreaterThan(10);
  });

  it('should find specific commands within their chapters', async () => {
    const categories = await client.listCategoriesAndCommands();
    const statusChapter = categories.find(c => c.name.includes('状態の表示'));
    const ipRoute = statusChapter?.commands.find(cmd => cmd.name.includes('IP の経路情報テーブルの表示'));
    expect(ipRoute).toBeDefined();
    expect(ipRoute?.path).toBe('showstatus/show_ip_route.html');
  });

  it('should fetch and parse "show ip route" detail correctly', async () => {
    const detail = await client.getCommandDetail('showstatus/show_ip_route.html');
    expect(detail).not.toBeNull();
    if (detail) {
      expect(detail.name).toContain('IP の経路情報テーブルの表示');
      expect(detail.syntax).toContain('show ip route [destination]');
      expect(detail.description).toContain('ゲートウェイを表示する');
    }
  });

  it('should handle non-existent commands gracefully', async () => {
    await expect(client.getCommandDetail('invalid/path.html')).rejects.toThrow();
  });

  it('should parse "ping" details accurately', async () => {
    const detail = await client.getCommandDetail('operation/ping.html');
    expect(detail).not.toBeNull();
    if (detail) {
      // The actual extracted syntax from debug script:
      expect(detail.syntax).toContain('ping [-s datalen] [-c count] [-sa ip_address] [-w wait] host');
      expect(detail.parameters.length).toBeGreaterThan(0);
    }
  });

  it('should extract details for "nat descriptor" if found', async () => {
    const categories = await client.listCategoriesAndCommands();
    // Search for NAT descriptor in all commands
    const natCmd = categories.flatMap(c => c.commands).find(cmd => cmd.name.includes('nat descriptor'));
    if (natCmd) {
      const detail = await client.getCommandDetail(natCmd.path);
      expect(detail).not.toBeNull();
      if (detail) {
        expect(detail.syntax.length).toBeGreaterThan(0);
        expect(detail.description.length).toBeGreaterThan(0);
      }
    }
  });
});
