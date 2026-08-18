// Build-time snapshot: copy the compodocx `documentation.json` into the
// @cngx/mcp package so `npx @cngx/mcp` runs standalone offline. Two transforms
// bridge gaps in the raw data:
//
//   (a) stamp `cngxVersion` from the root package.json `version` - the raw
//       compodocx output carries only schemaVersion / generatedAt /
//       compodocxVersion, none of which is the library version the answers
//       ground against;
//   (b) rebase every `http://localhost:4200` example URL onto EXAMPLES_BASE_URL
//       (default the published GH Pages base), the same swap
//       scripts/backport-example-urls.mjs applies to the JSDoc tags, so
//       get_story_example returns URLs a consumer can actually open.
//
// The snapshot is generated, never committed (packages/mcp/data/ is gitignored).
//
// Usage:
//   node scripts/mcp-snapshot.mjs                                        # GH Pages default
//   node scripts/mcp-snapshot.mjs --base=https://example.com/examples    # explicit override
//   EXAMPLES_BASE_URL=https://example.com/examples node scripts/mcp-snapshot.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, '.compodoc', 'documentation.json');
const DEST_DIR = join(ROOT, 'packages', 'mcp', 'data');
const DEST = join(DEST_DIR, 'documentation.json');

const args = new Map(process.argv.slice(2).map((a) => a.split('=', 2)).map(([k, v]) => [k, v ?? '']));
// Precedence: --base=… CLI flag > EXAMPLES_BASE_URL env var > GH Pages default.
const BASE_URL = (args.get('--base') || process.env.EXAMPLES_BASE_URL || 'https://cngxjs.github.io/cngx/examples').replace(
  /\/+$/,
  '',
);

// Swap the scheme+host(+port)+path prefix before the `/#/` hash route for
// BASE_URL. URLs without a `/#/` route are left untouched.
function rebaseUrl(url) {
  if (typeof url !== 'string') return url;
  const at = url.indexOf('/#/');
  if (at === -1) return url;
  return BASE_URL + url.slice(at);
}

function rebaseEntries(entries) {
  let rebased = 0;
  for (const entry of entries ?? []) {
    if (!Array.isArray(entry.exampleUrls)) continue;
    entry.exampleUrls = entry.exampleUrls.map((url) => {
      const next = rebaseUrl(url);
      if (next !== url) rebased++;
      return next;
    });
  }
  return rebased;
}

function main() {
  if (!existsSync(SOURCE)) {
    console.error(
      `mcp-snapshot: ${SOURCE} not found. Run \`npm run docs:json\` first to generate the compodocx JSON.`,
    );
    process.exit(1);
  }

  const doc = JSON.parse(readFileSync(SOURCE, 'utf8'));

  const cngxVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  doc.cngxVersion = cngxVersion;

  const rebased = rebaseEntries(doc.components) + rebaseEntries(doc.directives);

  mkdirSync(DEST_DIR, { recursive: true });
  writeFileSync(DEST, JSON.stringify(doc));

  console.log(
    `mcp-snapshot: wrote packages/mcp/data/documentation.json ` +
      `(cngxVersion ${cngxVersion}, schemaVersion ${doc.schemaVersion}, ${rebased} example URL(s) rebased to ${BASE_URL}).`,
  );
}

main();
