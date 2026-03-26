import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { YamahaDocClient } from './client.js';
import { mockYamahaFetch } from './test-utils.js';

describe('YamahaDocClient Scraper', () => {
  let client: YamahaDocClient;

  beforeEach(() => {
    mockYamahaFetch();
    client = new YamahaDocClient();
  });

  afterEach(() => {
    // Ensure no cross-test pollution for global fetch
    (globalThis as unknown as { fetch?: typeof fetch }).fetch = undefined;
  });

  it('should list categories with valid names', async () => {
    const categories = await client.listAllCategoriesAndCommands();
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
    const categories = await client.listAllCategoriesAndCommands();
    const statusChapter = categories.find(c => c.name === '状態の表示');
    expect(statusChapter).toBeDefined();
    
    const ipRoute = statusChapter?.commands.find(c => c.command === 'show ip route');
    expect(ipRoute).toBeDefined();
    expect(ipRoute?.description).toContain('IP の経路情報');
  });

  it('should expose nested sub-categories from the TOC', async () => {
    const children = await client.listCategories('機器の設定');
    expect(children.length).toBeGreaterThan(0);
    const names = children.map(c => c.name);
    expect(names).toContain('拡張ライセンスの操作');

    const nestedCommands = await client.listCommandsByCategory('拡張ライセンスの操作');
    const commandNames = nestedCommands.map(c => c.command);
    expect(commandNames).toContain('ex-license password');
  });

  it('should resolve command name to path', async () => {
    const path = await client.resolveCommandPath('show ip route');
    expect(path).toContain('show_ip_route.html');
  });

  it('should resolve aliased commands to the same path', async () => {
    const interfacePath = await client.resolveCommandPath('ipv6 interface rtadv send');
    const ppPath = await client.resolveCommandPath('ipv6 pp rtadv send');

    expect(interfacePath).toBe('ipv6/ipv6_interface_rtadv_send.html');
    expect(ppPath).toBe(interfacePath);
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

  it('should keep command aliases searchable in category listings', async () => {
    const categories = await client.listAllCategoriesAndCommands();
    const commands: string[] = [];
    const walk = (nodes: Awaited<ReturnType<typeof client.listAllCategoriesAndCommands>>) => {
      for (const node of nodes) {
        commands.push(...node.commands.map(command => command.command));
        walk(node.subCategories);
      }
    };
    walk(categories);

    expect(commands).toContain('ipv6 interface rtadv send');
    expect(commands).toContain('ipv6 pp rtadv send');
  });

  it('should prefer the requested alias in command details', async () => {
    const path = await client.resolveCommandPath('ipv6 interface rtadv send');
    expect(path).toBe('ipv6/ipv6_interface_rtadv_send.html');

    if (path) {
      const detail = await client.getCommandDetail(path, 'ipv6 interface rtadv send');
      expect(detail?.command).toBe('ipv6 interface rtadv send');
      expect(detail?.aliases).toContain('ipv6 interface rtadv send');
      expect(detail?.aliases).toContain('ipv6 pp rtadv send');
    }
  });
});
