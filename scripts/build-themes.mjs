#!/usr/bin/env node
/**
 * Build @cngx/themes — copies CSS assets + package.json to dist/themes.
 *
 * @cngx/themes is a CSS-only npm package (no Angular code, no
 * ng-package.json entry). Two consumer files are shipped verbatim:
 *
 *   - dist/themes/cngx.css         — single-import default theme
 *   - dist/themes/example-brand.css — example consumer-side brand override
 *
 * Relative @imports inside cngx.css (../core/theming/X.css, etc.) resolve
 * correctly at the consumer once @cngx/themes is installed alongside the
 * peer @cngx/core, @cngx/common, @cngx/forms, @cngx/ui packages — npm's
 * flat node_modules layout puts them at the same depth so the relative
 * paths cross between sibling packages without modification.
 *
 * package.json keeps the 0.0.0-PLACEHOLDER token; publish.mjs swaps in
 * the real version before `npm publish`.
 */

import { mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'projects', 'themes');
const DEST = join(ROOT, 'dist', 'themes');

mkdirSync(DEST, { recursive: true });

const entries = readdirSync(SRC);
for (const entry of entries) {
  const fullSrc = join(SRC, entry);
  if (!statSync(fullSrc).isFile()) continue;
  const fullDest = join(DEST, entry);
  copyFileSync(fullSrc, fullDest);
  console.log(`  copied ${entry}`);
}

console.log(`\nBuilt @cngx/themes to ${DEST}`);
