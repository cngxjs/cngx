#!/usr/bin/env node
// Postprocess compodocx output.
// Idempotently appends rules to docs/styles/compodocx.css so the playground
// tab shows only the launch button — the source snippet is redundant when
// the runnable StackBlitz manifest carries the same code.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = resolve(process.cwd(), 'docs/styles/compodocx.css');
const marker = '/* cngx:playground-snippet-override */';
const overrides = `
${marker}
.cdx-playground-snippet { display: none; }
.cdx-tab-panel#playground .cdx-playground-launch { margin-top: 0; }
`;

const css = await readFile(target, 'utf8');
if (css.includes(marker)) {
  process.exit(0);
}
await writeFile(target, css + overrides, 'utf8');
