import { vi } from 'vitest';

const baseUrl = 'https://www.rtpro.yamaha.co.jp/RT/manual/rt-common/';

const tocHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ja-jp" lang="ja-jp">
<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<base target="contentwin" />
<title>コマンドリファレンス</title></head>
<body>
  <ul class="map bookmap">
    <li class="topicref chapter">
      <a href="setup/setup_chapter.html">4 機器の設定</a>
    </li>
    <li class="topicref chapter">
      <a href="showstatus/showstatus_chapter.html">58 状態の表示</a>
      <ul>
        <li class="topicref">
          <a href="showstatus/show_ip_route.html">58.4 IP の経路情報テーブルの表示</a>
        </li>
      </ul>
    </li>
  </ul>
</body>
</html>`;

const cmdIndexHtml = `<html><head><base target="contentwin"/></head><body>
<ul><li>s<ul><li><a href="showstatus/show_ip_route.html">show ip route</a></li></ul></li></ul>
</body></html>`;

const showIpRouteHtml = `<html><body>
<h1 class="title">show ip route</h1>
<div class="section">
  <h2 class="sectiontitle">書式</h2>
  <li class="sli">show ip route [destination]</li>
</div>
</body></html>`;

export function mockYamahaFetch(): void {
  vi.stubGlobal('fetch', async (url: string) => {
    const target = typeof url === 'string' ? url : String(url);
    const path = target.startsWith(baseUrl) ? target.slice(baseUrl.length) : target;
    let body = '';
    if (path === 'toc.html') body = tocHtml;
    else if (path === 'cmdref_index.html') body = cmdIndexHtml;
    else if (path === 'showstatus/show_ip_route.html') body = showIpRouteHtml;

    if (!body) {
      return {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => '',
      } as Response;
    }

    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => body,
    } as Response;
  });
}
