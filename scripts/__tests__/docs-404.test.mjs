import { describe, expect, it } from 'vitest';

import {
  DOCS_ORIGIN,
  DOCS_ROOT,
  fallbackPath,
  movedPageHtml,
  movedPages,
  render404Html,
} from '../docs-404.mjs';

describe('fallbackPath', () => {
  it('sends a page of a dropped release to the same page of the newest one', () => {
    expect(fallbackPath('/cngx/v0.3.0/core/index.html', 'v0.5.0', '/cngx/')).toBe(
      '/cngx/v0.5.0/core/index.html',
    );
    expect(fallbackPath('/cngx/v0.3.0/', 'v0.5.0', '/cngx/')).toBe('/cngx/v0.5.0/');
    expect(fallbackPath('/cngx/v0.4.0-rc.1/core/index.html', 'v0.5.0', '/cngx/')).toBe(
      '/cngx/v0.5.0/core/index.html',
    );
  });

  it('sends an unversioned page to the same page of the newest release', () => {
    expect(
      fallbackPath('/cngx/additional-documentation/error-codes/cngx0001.html', 'v0.5.0', '/cngx/'),
    ).toBe('/cngx/v0.5.0/additional-documentation/error-codes/cngx0001.html');
  });

  it('sends a missing page under main to the newest release', () => {
    expect(fallbackPath('/cngx/main/old/page.html', 'v0.5.0', '/cngx/')).toBe(
      '/cngx/v0.5.0/old/page.html',
    );
  });

  it('opens the site root for a page missing in the newest release (no loop)', () => {
    expect(fallbackPath('/cngx/v0.5.0/gone.html', 'v0.5.0', '/cngx/')).toBe('/cngx/');
    expect(fallbackPath('/cngx/main/gone.html', 'main', '/cngx/')).toBe('/cngx/');
  });

  it('sends a dropped examples build to the examples of main', () => {
    expect(fallbackPath('/cngx/examples/v0.3.0/index.html', 'v0.5.0', '/cngx/')).toBe(
      '/cngx/examples/',
    );
  });

  it('opens the site root without a newest label or outside the site', () => {
    expect(fallbackPath('/cngx/v0.3.0/core/index.html', '', '/cngx/')).toBe('/cngx/');
    expect(fallbackPath('/other/page.html', 'v0.5.0', '/cngx/')).toBe('/cngx/');
    expect(fallbackPath('/cngx/', 'v0.5.0', '/cngx/')).toBe('/cngx/');
  });

  it('works for a site served from the host root', () => {
    expect(fallbackPath('/v0.3.0/core/index.html', 'main', '/')).toBe('/main/core/index.html');
  });
});

describe('render404Html', () => {
  it('reads the newest label from versions.json and redirects through fallbackPath', () => {
    const html = render404Html('/cngx/');
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain(fallbackPath.toString());
    expect(html).toContain('"/cngx/versions.json"');
    expect(html).toContain('location.replace(');
    expect(html).toContain('<meta name="robots" content="noindex">');
  });

  it('asks for no favicon outside the site', () => {
    expect(render404Html('/cngx/')).toContain('<link rel="icon" href="data:,">');
  });

  it('defaults to the GitHub Pages root of cngx', () => {
    expect(DOCS_ROOT).toBe('/cngx/');
    expect(render404Html()).toContain('"/cngx/versions.json"');
  });

  it('runs the embedded script to the expected redirect', async () => {
    const html = render404Html('/cngx/');
    const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
    const replaced = [];
    const location = {
      pathname: '/cngx/v0.3.0/core/index.html',
      search: '?q=1',
      hash: '#inputs',
      replace: (url) => replaced.push(url),
    };
    const fetch = async () => ({
      ok: true,
      json: async () => ({ versions: [{ label: 'v0.5.0' }] }),
    });
    await new Function('location', 'fetch', `return (async () => { ${script} })();`)(
      location,
      fetch,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(replaced).toEqual(['/cngx/v0.5.0/core/index.html?q=1#inputs']);
  });

  it('opens the site root when versions.json cannot be read', async () => {
    const html = render404Html('/cngx/');
    const script = html.match(/<script>([\s\S]*)<\/script>/)[1];
    const replaced = [];
    const location = {
      pathname: '/cngx/x.html',
      search: '',
      hash: '',
      replace: (url) => replaced.push(url),
    };
    const fetch = async () => {
      throw new Error('offline');
    };
    await new Function('location', 'fetch', `return (async () => { ${script} })();`)(
      location,
      fetch,
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(replaced).toEqual(['/cngx/']);
  });
});

describe('movedPages', () => {
  const dir = 'additional-documentation/error-codes';

  it('moves each unversioned page to the same page of the newest release', () => {
    expect(movedPages(['cngx0001.html', 'index.html'], 'main', [], '/cngx/')).toEqual([
      { path: `${dir}/cngx0001.html`, target: `/cngx/main/${dir}/cngx0001.html` },
      { path: `${dir}/index.html`, target: `/cngx/main/${dir}/index.html` },
    ]);
  });

  it('moves each page of a dropped release too', () => {
    expect(movedPages(['cngx0001.html'], 'v0.7.0', ['v0.4.0', 'v0.3.0'], '/cngx/')).toEqual([
      { path: `${dir}/cngx0001.html`, target: `/cngx/v0.7.0/${dir}/cngx0001.html` },
      { path: `v0.4.0/${dir}/cngx0001.html`, target: `/cngx/v0.7.0/${dir}/cngx0001.html` },
      { path: `v0.3.0/${dir}/cngx0001.html`, target: `/cngx/v0.7.0/${dir}/cngx0001.html` },
    ]);
  });

  it('writes only the pages of the newest release', () => {
    const paths = movedPages(['cngx1071.html'], 'v0.7.0', ['v0.3.0'], '/cngx/').map(
      (page) => page.path,
    );
    expect(paths).toEqual([`${dir}/cngx1071.html`, `v0.3.0/${dir}/cngx1071.html`]);
  });

  it('writes no page under the newest label', () => {
    const paths = movedPages(['cngx0001.html'], 'v0.7.0', ['v0.7.0'], '/cngx/').map(
      (page) => page.path,
    );
    expect(paths).toEqual([`${dir}/cngx0001.html`]);
  });

  it('writes nothing without a newest label', () => {
    expect(movedPages(['cngx0001.html'], '', ['v0.3.0'], '/cngx/')).toEqual([]);
  });
});

describe('movedPageHtml', () => {
  const target = '/cngx/main/additional-documentation/error-codes/cngx0001.html';
  const url = `https://cngxjs.github.io${target}`;

  it('points canonical and refresh at the absolute target', () => {
    const html = movedPageHtml(target, DOCS_ORIGIN);
    expect(DOCS_ORIGIN).toBe('https://cngxjs.github.io');
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain(`<link rel="canonical" href="${url}">`);
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=${url}">`);
  });

  it('shows the target as a visible link', () => {
    expect(movedPageHtml(target, DOCS_ORIGIN)).toContain(
      `This page moved to <a href="${url}">${url}</a>`,
    );
  });

  it('is not indexed, asks for no favicon outside the site and runs no script', () => {
    const html = movedPageHtml(target, DOCS_ORIGIN);
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).toContain('<link rel="icon" href="data:,">');
    expect(html).not.toContain('<script');
  });
});
