// Turn absolute <example-url> JSDoc tags across the library source into
// relative hash routes. compodocx resolves a relative tag against
// `exampleUrlBase` (.compodocrc.json: the published examples app;
// docs:serve / docs:watch pass the local dev server), so the source carries
// no host. The example-url set is HAND-CURATED in each class's JSDoc - this
// script never adds or removes a tag, it only drops everything before `/#/`.
//
// To surface a demo as an iframe on a component's Example tab, add the tag by
// hand:  * <example-url>/#/<route-path></example-url>
// To drop one, delete the line - it stays gone (nothing re-derives it).
//
// Usage:
//   node scripts/relativize-example-urls.mjs    # idempotent; rerun after merging a branch with absolute tags

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROJECTS_DIR = join(ROOT, 'projects');

async function* walkTs(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkTs(p);
    else if (p.endsWith('.ts')) yield p;
  }
}

// Match a single <example-url> tag with something before its `/#/` hash
// route and keep only the route. Tags without a `/#/` hash route are left
// untouched.
const TAG_RE = /(<example-url>)[^<]+?(\/#\/[^<]*)(<\/example-url>)/g;

async function main() {
  let editedFiles = 0;
  let relativizedTags = 0;

  for await (const file of walkTs(PROJECTS_DIR)) {
    const src = await readFile(file, 'utf8');
    if (!src.includes('<example-url>')) continue;

    let count = 0;
    const next = src.replace(TAG_RE, (_m, open, path, close) => {
      count++;
      return `${open}${path}${close}`;
    });

    if (next !== src) {
      await writeFile(file, next);
      editedFiles++;
      relativizedTags += count;
      console.log(`Relativized ${relative(ROOT, file)} (${count} tag(s))`);
    }
  }

  console.log(
    `\nDone. ${editedFiles} file(s) touched, ${relativizedTags} <example-url> tag(s) made relative.`,
  );
  console.log('No tags added or removed - the example-url set is hand-curated in JSDoc.');
}

await main().catch((err) => {
  console.error(err);
  process.exit(1);
});
