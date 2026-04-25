import { describe, it, expect } from 'vitest';
import { searchCommandsTool } from './search-commands.js';
import { Category, YamahaDocClient } from '../client.js';

describe('searchCommandsTool', () => {
  const makeClient = (categories: Category[]) =>
    ({
      listAllCategoriesAndCommands: () => Promise.resolve(categories),
    }) as YamahaDocClient;

  it('should match a base command when the query includes parameter values', async () => {
    const client = makeClient([
      {
        id: 'root',
        name: 'Root',
        subCategories: [],
        commands: [
          { command: 'ipv6 routing', description: 'IPv6 routing toggle' },
          { command: 'dns service', description: 'DNS service toggle' },
        ],
      },
    ]);

    const ipv6Result = await searchCommandsTool.handler(client, { query: 'ipv6 routing on' });
    expect(ipv6Result.content[0].text).toContain('"command": "ipv6 routing"');

    const dnsResult = await searchCommandsTool.handler(client, { query: 'dns service recursive' });
    expect(dnsResult.content[0].text).toContain('"command": "dns service"');
  });

  it('should still support substring matches on command names', async () => {
    const client = makeClient([
      {
        id: 'root',
        name: 'Root',
        subCategories: [],
        commands: [{ command: 'ipv6 routing process', description: 'IPv6 fast path' }],
      },
    ]);

    const result = await searchCommandsTool.handler(client, { query: 'routing' });
    expect(result.content[0].text).toContain('"command": "ipv6 routing process"');
  });
});
