#!/usr/bin/env node
// The root 404.html of the versioned docs site. GitHub Pages serves it for any
// missing path of the project site; its inline script reads versions.json and
// sends the reader to the same page in the newest release:
//
//   /cngx/<dropped label>/<page>  -> /cngx/<newest label>/<page>
//   /cngx/<unversioned page>      -> /cngx/<newest label>/<page>  (URLs printed by
//                                    packages from before the versioned site)
//   /cngx/examples/<dropped tag>  -> /cngx/examples/ (the examples of main)
//
// A page that is missing in the newest release too opens the site root, so the
// redirect never loops. Error-code pages have the same path in every release,
// so a runtime URL of a dropped release lands on the same page.
//
// Usage:
//   node scripts/docs-404.mjs <outDir> [--root=/cngx/]   # writes <outDir>/404.html

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const DOCS_ROOT = '/cngx/';

/**
 * Where a missing `pathname` of the site under `root` goes, given the label of
 * the newest release (the first `versions.json` entry). Self-contained: the
 * 404 page embeds its source, so it must not reference anything outside.
 */
export function fallbackPath(pathname, newestLabel, root) {
  if (!newestLabel || !pathname.startsWith(root)) {
    return root;
  }
  const rest = pathname.slice(root.length);
  const slash = rest.indexOf('/');
  const first = slash === -1 ? rest : rest.slice(0, slash);
  if (first === '' || first === newestLabel) {
    return root;
  }
  if (first === 'examples') {
    return `${root}examples/`;
  }
  const isLabel = first === 'main' || /^v\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(first);
  const page = isLabel ? (slash === -1 ? '' : rest.slice(slash + 1)) : rest;
  return `${root}${newestLabel}/${page}`;
}

/** The 404 page for a site served under `root`. */
export function render404Html(root = DOCS_ROOT) {
  const script = [
    fallbackPath.toString(),
    `const root = ${JSON.stringify(root)};`,
    `fetch(${JSON.stringify(`${root}versions.json`)}, { cache: 'no-store' })`,
    '  .then((response) => {',
    '    if (!response.ok) {',
    "      throw new Error('versions.json ' + response.status);",
    '    }',
    '    return response.json();',
    '  })',
    '  .then((manifest) => {',
    "    const label = manifest && manifest.versions && manifest.versions[0] ? manifest.versions[0].label : '';",
    '    location.replace(fallbackPath(location.pathname, label, root) + location.search + location.hash);',
    '  })',
    '  .catch(() => location.replace(root));',
  ].join('\n');
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="robots" content="noindex">',
    // Without an icon the browser asks for /favicon.ico at the host root,
    // outside the project site, and logs a second 404.
    '<link rel="icon" href="data:,">',
    '<title>Page not found - cngx</title>',
    `<script>${script}</script>`,
    '</head>',
    '<body>',
    `<p>This page moved. Opening the <a href="${root}">cngx docs</a>.</p>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const outDir = args.find((arg) => !arg.startsWith('--'));
  const rootArg = args.find((arg) => arg.startsWith('--root='));
  if (!outDir) {
    console.error('docs-404: usage: node scripts/docs-404.mjs <outDir> [--root=/cngx/]');
    process.exit(1);
  }
  const root = rootArg ? rootArg.slice('--root='.length) : DOCS_ROOT;
  if (!root.startsWith('/') || !root.endsWith('/')) {
    console.error(`docs-404: --root "${root}" must start and end with "/"`);
    process.exit(1);
  }
  writeFileSync(join(outDir, '404.html'), render404Html(root));
  console.log(`docs-404: wrote ${join(outDir, '404.html')} (root ${root})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
