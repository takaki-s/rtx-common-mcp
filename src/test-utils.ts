import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const baseUrl = 'https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/';
const fixturesDir = resolve(process.cwd(), 'src', '__fixtures__');
const tocHtml = readFileSync(resolve(fixturesDir, 'toc.html'), 'utf8');
const cmdIndexHtml = readFileSync(resolve(fixturesDir, 'cmdref_index.html'), 'utf8');
const showIpRouteHtml = readFileSync(resolve(fixturesDir, 'show_ip_route.html'), 'utf8');

export function mockYamahaFetch(): void {
  vi.stubGlobal('fetch', (url: string) => {
    const target = typeof url === 'string' ? url : String(url);
    const path = target.startsWith(baseUrl) ? target.slice(baseUrl.length) : target;
    let body = '';
    if (path === 'toc.html') body = tocHtml;
    else if (path === 'cmdref_index.html') body = cmdIndexHtml;
    else if (path === 'showstatus/show_ip_route.html') body = showIpRouteHtml;

    if (!body) {
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve(''),
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: () => Promise.resolve(body),
    } as Response);
  });
}
