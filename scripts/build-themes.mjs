#!/usr/bin/env node
/**
 * Build @cngx/themes — copies CSS + SCSS assets + package.json to dist/themes.
 *
 * Two consumer paths:
 *
 *   - dist/themes/cngx.css         — single-import default theme (CDK only)
 *   - dist/themes/material/<comp>-theme.scss — opt-in Material-bridge mixins
 *     for consumers who pair cngx with @angular/material. Each file exports
 *     a Sass @mixin theme($theme) that wires the cngx component to Material's
 *     theme variables. Consumer @use's the file alongside their Material setup.
 *
 * Relative @imports inside cngx.css (../core/theming/X.css, etc.) resolve
 * via npm's flat node_modules layout once @cngx/themes is installed
 * alongside @cngx/core, @cngx/common, @cngx/forms, @cngx/ui peers.
 *
 * package.json keeps the 0.0.0-PLACEHOLDER token; publish.mjs swaps in
 * the real version before `npm publish`.
 */

import { mkdirSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = join(ROOT, 'projects', 'themes');
const DEST = join(ROOT, 'dist', 'themes');

function copyRecursive(srcDir, destDir) {
  mkdirSync(destDir, { recursive: true });
  for (const entry of readdirSync(srcDir)) {
    const fullSrc = join(srcDir, entry);
    const fullDest = join(destDir, entry);
    const stat = statSync(fullSrc);
    if (stat.isDirectory()) {
      copyRecursive(fullSrc, fullDest);
    } else if (stat.isFile()) {
      copyFileSync(fullSrc, fullDest);
      console.log(`  copied ${relative(SRC, fullSrc)}`);
    }
  }
}

copyRecursive(SRC, DEST);

console.log(`\nBuilt @cngx/themes to ${DEST}`);
