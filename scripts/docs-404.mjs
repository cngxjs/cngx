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
// The script only helps a browser: an agent or curl gets a bare 404. So the
// error-code pages, the URLs diagnostics print, also get static moved pages
// that answer 200 and name the target without a script, for the unversioned
// path and for every dropped release. The 404 page stays the net for the rest.
//
// Usage:
//   node scripts/docs-404.mjs <outDir> [--root=/cngx/]
//     writes <outDir>/404.html and the moved pages; reads <outDir>/versions.json,
//     the error-code pages of the newest release and the dropped tags (git)

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseReleaseTagOptions, selectDroppedTags } from './docs-release-tags.mjs';

export const DOCS_ROOT = '/cngx/';
export const DOCS_ORIGIN = 'https://cngxjs.github.io';
export const ERROR_CODES_DIR = 'additional-documentation/error-codes';

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

/**
 * The moved pages for the error-code `pages` (file names) of the newest
 * release: one at the unversioned path, one per dropped label, each pointing at
 * the same page under `newestLabel`. `path` is relative to the site folder.
 * Nothing is written under the newest label itself.
 */
export function movedPages(pages, newestLabel, droppedLabels, root) {
  if (!newestLabel) {
    return [];
  }
  const prefixes = [
    '',
    ...droppedLabels.filter((label) => label !== newestLabel).map((label) => `${label}/`),
  ];
  return prefixes.flatMap((prefix) =>
    pages.map((page) => ({
      path: `${prefix}${ERROR_CODES_DIR}/${page}`,
      target: `${root}${newestLabel}/${ERROR_CODES_DIR}/${page}`,
    })),
  );
}

/** A moved page: answers 200 and names `origin` + `target` without a script. */
export function movedPageHtml(target, origin) {
  const url = `${origin}${target}`;
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="robots" content="noindex">',
    '<link rel="icon" href="data:,">',
    `<link rel="canonical" href="${url}">`,
    `<meta http-equiv="refresh" content="0; url=${url}">`,
    '<title>Page moved - cngx</title>',
    '</head>',
    '<body>',
    `<p>This page moved to <a href="${url}">${url}</a>.</p>`,
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

function writeMovedPages(outDir, root) {
  const manifestPath = join(outDir, 'versions.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`${manifestPath} missing; build the docs first`);
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const newestLabel = manifest?.versions?.[0]?.label;
  if (!newestLabel) {
    throw new Error(`${manifestPath} lists no version`);
  }
  const pagesDir = join(outDir, newestLabel, ERROR_CODES_DIR);
  if (!existsSync(pagesDir)) {
    throw new Error(`${pagesDir} missing`);
  }
  const pages = readdirSync(pagesDir)
    .filter((name) => name.endsWith('.html'))
    .sort();
  const tags = execFileSync('git', ['tag', '--list', 'v*'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  const dropped = selectDroppedTags(tags, parseReleaseTagOptions(process.env));
  const moved = movedPages(pages, newestLabel, dropped, root);
  for (const { path, target } of moved) {
    const file = join(outDir, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, movedPageHtml(target, DOCS_ORIGIN));
  }
  console.log(
    `docs-404: wrote ${moved.length} moved pages (${pages.length} error-code pages, newest ${newestLabel}, dropped: ${dropped.join(' ') || 'none'})`,
  );
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
  try {
    writeMovedPages(outDir, root);
  } catch (error) {
    console.error(`docs-404: ${error.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
