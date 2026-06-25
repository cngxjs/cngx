// Rebase the base URL of existing <example-url> JSDoc tags across the library
// source. The example-url set is HAND-CURATED in each class's JSDoc — this
// script never adds or removes a tag, it only swaps the scheme+host(+path)
// prefix (everything before `/#/`) for BASE_URL so production docs point at
// the hosted examples app instead of a dev port.
//
// To surface a demo as an iframe on a component's Example tab, add the tag by
// hand:  * <example-url>http://localhost:4200/#/<route-path></example-url>
// To drop one, delete the line — it stays gone (nothing re-derives it).
//
// Usage:
//   node scripts/backport-example-urls.mjs                                   # localhost default (idempotent)
//   node scripts/backport-example-urls.mjs --base=https://example.com/ex     # explicit override
//   EXAMPLES_BASE_URL=https://cngxjs.github.io/cngx/examples node …          # env-driven (CI / prod build)

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECTS_DIR = join(ROOT, 'projects');

const args = new Map(process.argv.slice(2).map((a) => a.split('=', 2)).map(([k, v]) => [k, v ?? '']));
// Precedence: --base=… CLI flag > EXAMPLES_BASE_URL env var > localhost default.
const BASE_URL = (args.get('--base') || process.env.EXAMPLES_BASE_URL || 'http://localhost:4200').replace(/\/+$/, '');

async function* walkTs(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkTs(p);
    else if (p.endsWith('.ts')) yield p;
  }
}

// Match a single <example-url> tag: capture the `/#/<path>` portion, replace
// the host/prefix before it with BASE_URL. Tags without a `/#/` hash route are
// left untouched.
const TAG_RE = /(<example-url>)[^<]*?(\/#\/[^<]*)(<\/example-url>)/g;

async function main() {
  let editedFiles = 0;
  let rebasedTags = 0;

  for await (const file of walkTs(PROJECTS_DIR)) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('<example-url>')) continue;

    let count = 0;
    const next = src.replace(TAG_RE, (_m, open, path, close) => {
      count++;
      return `${open}${BASE_URL}${path}${close}`;
    });

    if (next !== src) {
      await writeFile(file, next);
      editedFiles++;
      rebasedTags += count;
      console.log(`Rebased ${relative(ROOT, file)} (${count} tag(s))`);
    }
  }

  console.log(`\nDone. ${editedFiles} file(s) touched, ${rebasedTags} <example-url> tag(s) rebased to ${BASE_URL}.`);
  console.log('No tags added or removed — the example-url set is hand-curated in JSDoc.');
}

await main().catch((err) => {
  console.error(err);
  process.exit(1);
});
