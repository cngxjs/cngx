// Build-time snapshot: copy the compodocx `documentation.json` into the
// @cngx/mcp and @cngx/cli packages so `npx @cngx/mcp` and `npx @cngx/cli` run
// standalone offline. One snapshot step feeds both packages. Two transforms
// bridge gaps in the raw data:
//
//   (a) stamp `cngxVersion` from the root package.json `version` - the raw
//       compodocx output carries only schemaVersion / generatedAt /
//       compodocxVersion, none of which is the library version the answers
//       ground against;
//   (b) rebase every example URL (components, directives and injectables)
//       onto EXAMPLES_BASE_URL (default the published GH Pages base). The
//       export already resolves the relative <example-url> tags against
//       `exampleUrlBase`; the rebase keeps a JSON built with another base
//       (e.g. `--exampleUrlBase http://localhost:4200`) from leaking it, so
//       get_story_example returns URLs a consumer can actually open.
//
// The snapshot is generated, never committed (packages/mcp/data/ and
// packages/cli/data/ are gitignored). `build:mcp` and `build:cli` load the
// written snapshot through the compiled loader afterwards
// (scripts/mcp-bundle-check.mjs), so an unreadable bundle fails the build.
// The llm-md dump goes to @cngx/mcp only: no cli command reads it.
//
// Usage:
//   node scripts/mcp-snapshot.mjs                                        # GH Pages default
//   node scripts/mcp-snapshot.mjs --base=https://example.com/examples    # explicit override
//   EXAMPLES_BASE_URL=https://example.com/examples node scripts/mcp-snapshot.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, '.compodoc', 'documentation.json');
const DEST_DIR = join(ROOT, 'packages', 'mcp', 'data');
const DEST = join(DEST_DIR, 'documentation.json');
const CLI_DEST_DIR = join(ROOT, 'packages', 'cli', 'data');
const CLI_DEST = join(CLI_DEST_DIR, 'documentation.json');
// The verbatim compodocx llm-md dump (npm run docs:llm). Optional to the build:
// copied when present, warned-and-skipped when absent so a docs-less checkout
// still builds; the cngx://llms-full resource degrades to an empty read.
const LLM_DUMP_SOURCE = join(ROOT, '.compodoc-llm', 'llm-context.md');
const LLM_DUMP_DEST = join(DEST_DIR, 'llm-context.md');

// Swap the scheme+host(+port)+path prefix before the `/#/` hash route for
// `base`. URLs without a `/#/` route are left untouched. Same rule as
// packages/mcp/src/core/data/example-urls.ts, which applies it to snapshots
// fetched at runtime.
export function rebaseUrl(url, base) {
  if (typeof url !== 'string') return url;
  const at = url.indexOf('/#/');
  if (at === -1) return url;
  return base + url.slice(at);
}

/**
 * Rebase the `exampleUrls` of every component, directive and injectable of
 * `doc` onto `base`, in place. Returns the number of URLs that changed.
 */
export function rebaseExampleUrls(doc, base) {
  let rebased = 0;
  for (const entry of [...(doc.components ?? []), ...(doc.directives ?? []), ...(doc.injectables ?? [])]) {
    if (!Array.isArray(entry.exampleUrls)) continue;
    entry.exampleUrls = entry.exampleUrls.map((url) => {
      const next = rebaseUrl(url, base);
      if (next !== url) rebased++;
      return next;
    });
  }
  return rebased;
}

function main() {
  const args = new Map(process.argv.slice(2).map((a) => a.split('=', 2)).map(([k, v]) => [k, v ?? '']));
  // Precedence: --base=… CLI flag > EXAMPLES_BASE_URL env var > GH Pages default.
  const BASE_URL = (args.get('--base') || process.env.EXAMPLES_BASE_URL || 'https://cngxjs.github.io/cngx/examples').replace(
    /\/+$/,
    '',
  );

  if (!existsSync(SOURCE)) {
    console.error(
      `mcp-snapshot: ${SOURCE} not found. Run \`npm run docs:json\` first to generate the compodocx JSON.`,
    );
    process.exit(1);
  }

  const doc = JSON.parse(readFileSync(SOURCE, 'utf8'));

  const cngxVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;
  doc.cngxVersion = cngxVersion;

  const rebased = rebaseExampleUrls(doc, BASE_URL);

  const json = JSON.stringify(doc);
  mkdirSync(DEST_DIR, { recursive: true });
  writeFileSync(DEST, json);
  mkdirSync(CLI_DEST_DIR, { recursive: true });
  writeFileSync(CLI_DEST, json);

  console.log(
    `mcp-snapshot: wrote packages/mcp/data/documentation.json and packages/cli/data/documentation.json ` +
      `(cngxVersion ${cngxVersion}, schemaVersion ${doc.schemaVersion}, ${rebased} example URL(s) rebased to ${BASE_URL}).`,
  );

  if (existsSync(LLM_DUMP_SOURCE)) {
    const dump = readFileSync(LLM_DUMP_SOURCE);
    writeFileSync(LLM_DUMP_DEST, dump);
    console.log(`mcp-snapshot: copied packages/mcp/data/llm-context.md (${dump.byteLength} bytes).`);
  } else {
    console.warn(
      `mcp-snapshot: ${LLM_DUMP_SOURCE} not found; skipping the llm-md dump. ` +
        `Run \`npm run docs:llm\` before \`npm run build:mcp\` to bundle the cngx://llms-full body.`,
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
