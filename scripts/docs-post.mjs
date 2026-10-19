#!/usr/bin/env node
// Postprocess compodocx output.
// Idempotently appends rules to docs/styles/compodocx.css so the playground
// tab shows only the launch button - the source snippet is redundant when
// the runnable StackBlitz manifest carries the same code.

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// compodocx copies `customFavicon` to images/favicon.ico but every page links
// images/favicon.svg, so the brand favicon lands under the name the pages use.
await copyFile(
  resolve(process.cwd(), 'brand/favicon.svg'),
  resolve(process.cwd(), 'docs/images/favicon.svg'),
);

// The overview page renders the root README, whose logo points at brand/.
await mkdir(resolve(process.cwd(), 'docs/brand'), { recursive: true });
for (const file of ['cngx-lockup-full-on-light.svg', 'cngx-lockup-full-on-dark.svg']) {
  await copyFile(resolve(process.cwd(), 'brand', file), resolve(process.cwd(), 'docs/brand', file));
}

const target = resolve(process.cwd(), 'docs/styles/compodocx.css');
const marker = '/* cngx:playground-snippet-override */';
const overrides = `
${marker}
.cdx-playground-snippet { display: none; }
.cdx-tab-panel#playground .cdx-playground-launch { margin-top: 0; }

/* cngx:ai-generated-note */
.cdx-ai-generated-note {
    display: flex;
    align-items: center;
    gap: var(--cdx-space-3, 12px);
    margin: 0 0 var(--cdx-space-6, 24px) 0;
    padding: var(--cdx-space-3, 12px) var(--cdx-space-4, 16px);
    border-left: 3px solid var(--color-cdx-border-strong, #d1d5db);
    background: var(--color-cdx-bg-alt, #f9fafb);
    border-radius: 0 var(--cdx-radius-md, 8px) var(--cdx-radius-md, 8px) 0;
    font-size: 0.8125rem;
    color: var(--color-cdx-text-muted, #6b7280);
}

/* cngx:hide-getting-started-links */
/* compodocx auto-discovers CHANGELOG.md/LICENSE from the repo root and has no
   flag to suppress them; drop their sidebar entries (the pages still build). */
#sidebar li.link:has(> a[data-type="chapter-link"][href$="changelog.html"]),
#sidebar li.link:has(> a[data-type="chapter-link"][href$="license.html"]) {
    display: none;
}
`;

const css = await readFile(target, 'utf8');
if (css.includes(marker)) {
  process.exit(0);
}
await writeFile(target, css + overrides, 'utf8');
