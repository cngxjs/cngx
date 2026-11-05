// Build-time snapshot: copy the compodocx `documentation.json` into the
// @cngx/mcp and @cngx/cli packages so `npx @cngx/mcp` and `npx @cngx/cli` run
// standalone offline. One snapshot step feeds both packages. Two transforms
// bridge gaps in the raw data:
//
//   (a) stamp `cngxVersion` from the root package.json `version`, or from
//       `--cngx-version=<v>` when the release run stamps the version it is
//       about to publish - the raw
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
// The cngxErrorCodes block is also written alone to .compodoc/error-codes.json,
// which .github/workflows/snapshot-api.yml uploads as a release asset. It stays
// out of packages/*/data, because both packages publish data/ whole.
//
// Usage:
//   node scripts/mcp-snapshot.mjs                                        # GH Pages default
//   node scripts/mcp-snapshot.mjs --base=https://example.com/examples    # explicit override
//   EXAMPLES_BASE_URL=https://example.com/examples node scripts/mcp-snapshot.mjs
//   node scripts/mcp-snapshot.mjs --cngx-version=0.3.0 --require-llm-dump  # release stamp, dump required

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = join(ROOT, '.compodoc', 'documentation.json');
const DEST_DIR = join(ROOT, 'packages', 'mcp', 'data');
const DEST = join(DEST_DIR, 'documentation.json');
const CLI_DEST_DIR = join(ROOT, 'packages', 'cli', 'data');
const CLI_DEST = join(CLI_DEST_DIR, 'documentation.json');
// The verbatim compodocx llm-md dump (npm run docs:llm). Optional to the dev
// build: copied when present, warned-and-skipped when absent so a docs-less
// checkout still builds; the cngx://llms-full resource degrades to an empty
// read. The release run passes --require-llm-dump, which makes it mandatory.
const LLM_DUMP_SOURCE = join(ROOT, '.compodoc-llm', 'llm-context.md');
const LLM_DUMP_DEST = join(DEST_DIR, 'llm-context.md');
// The error-code manifest (npm run manifest:error-codes) is the single source
// for the bundled cngxErrorCodes block: the page prose plus each code's lib,
// severity, production behaviour, title, url and call-site messages. Pages are
// read relative to ROOT from the manifest `page` paths.
const ERROR_CODES_MANIFEST = join(ROOT, 'scripts', 'manifests', 'error-codes.json');
export const ERROR_CODE_ASSET = join(ROOT, '.compodoc', 'error-codes.json');

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

/**
 * Deduplicate the call-site message texts of one code in first-seen order.
 * Several call sites can print the same text, so the block carries each distinct
 * text once and drops the per-site `file`.
 */
export function dedupeMessageTexts(messages) {
  const seen = new Set();
  const texts = [];
  for (const message of messages ?? []) {
    if (!seen.has(message.text)) {
      seen.add(message.text);
      texts.push(message.text);
    }
  }
  return texts;
}

/**
 * The page markdown as the snapshot carries it: without the `@aiGenerated`
 * marker line and the `# CNGXnnnn` heading, with relative `cngxNNNN.html` links
 * rewritten to absolute `docsBaseUrl` links. An already-absolute link is left
 * untouched - its `(` is followed by the scheme, not by `cngx`.
 */
export function stripPageBody(raw, docsBaseUrl) {
  return raw
    .replace(/^<!--\s*@aiGenerated\b[^\n]*-->[ \t]*\n?/m, '')
    .replace(/^#[ \t]+CNGX\d{4}[ \t]*\n?/m, '')
    .replace(/\]\((cngx\d{4}\.html)\)/g, `](${docsBaseUrl}$1)`)
    .trim();
}

/**
 * Build the `cngxErrorCodes` block from the error-codes manifest and the page
 * bodies. `schemaVersion`, `docsBaseUrl` and `ranges` are copied verbatim; each
 * code keeps the answer-relevant fields, drops `files` and `page`, deduplicates
 * its message texts and carries its stripped page body. `readPage(page)` returns
 * the raw markdown for a manifest `page` path.
 */
export function buildErrorCodeBlock(manifest, readPage) {
  return {
    schemaVersion: manifest.schemaVersion,
    docsBaseUrl: manifest.docsBaseUrl,
    ranges: manifest.ranges,
    codes: manifest.codes.map((code) => ({
      code: code.code,
      lib: code.lib,
      severity: code.severity,
      production: code.production,
      title: code.title,
      status: code.status,
      url: code.url,
      messages: dedupeMessageTexts(code.messages),
      body: stripPageBody(readPage(code.page), manifest.docsBaseUrl),
    })),
  };
}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Reads the snapshot flags. `cngxVersion` is `--cngx-version=<v>` when given
 * (a malformed one throws), else `rootVersion`; base precedence is the
 * `--base=` flag, then `env.EXAMPLES_BASE_URL`, then the GH Pages default.
 */
export function parseSnapshotArgs(argv, rootVersion, env = {}) {
  const args = new Map(argv.map((a) => a.split('=', 2)).map(([k, v]) => [k, v ?? '']));
  const baseUrl = (args.get('--base') || env.EXAMPLES_BASE_URL || 'https://cngxjs.github.io/cngx/examples').replace(
    /\/+$/,
    '',
  );
  let cngxVersion = rootVersion;
  if (args.has('--cngx-version')) {
    cngxVersion = args.get('--cngx-version');
    if (!SEMVER.test(cngxVersion)) {
      throw new Error(`--cngx-version "${cngxVersion}" is not a well-formed semver`);
    }
  }
  return { baseUrl, cngxVersion, requireLlmDump: args.has('--require-llm-dump') };
}

/**
 * Whether the llm-md dump at `source` is there to copy. A missing dump is a
 * skip for the dev build and a thrown error under `--require-llm-dump`.
 */
export function llmDumpPresent(source, required, exists = existsSync) {
  if (exists(source)) {
    return true;
  }
  if (required) {
    throw new Error(`${source} not found and --require-llm-dump is set. Run \`npm run docs:llm\` first.`);
  }
  return false;
}

function main() {
  let options;
  try {
    options = parseSnapshotArgs(
      process.argv.slice(2),
      JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version,
      process.env,
    );
  } catch (error) {
    console.error(`mcp-snapshot: ${error.message}`);
    process.exit(1);
  }
  const { baseUrl: BASE_URL, cngxVersion, requireLlmDump } = options;

  // Checked before anything is written, so a required dump that is missing
  // leaves the data dirs as they were.
  let dumpPresent;
  try {
    dumpPresent = llmDumpPresent(LLM_DUMP_SOURCE, requireLlmDump);
  } catch (error) {
    console.error(`mcp-snapshot: ${error.message}`);
    process.exit(1);
  }

  if (!existsSync(SOURCE)) {
    console.error(
      `mcp-snapshot: ${SOURCE} not found. Run \`npm run docs:json\` first to generate the compodocx JSON.`,
    );
    process.exit(1);
  }

  if (!existsSync(ERROR_CODES_MANIFEST)) {
    console.error(
      `mcp-snapshot: ${ERROR_CODES_MANIFEST} not found. Run \`npm run manifest:error-codes\` first.`,
    );
    process.exit(1);
  }

  const doc = JSON.parse(readFileSync(SOURCE, 'utf8'));

  doc.cngxVersion = cngxVersion;

  const errorCodeManifest = JSON.parse(readFileSync(ERROR_CODES_MANIFEST, 'utf8'));
  doc.cngxErrorCodes = buildErrorCodeBlock(errorCodeManifest, (page) => readFileSync(join(ROOT, page), 'utf8'));

  const rebased = rebaseExampleUrls(doc, BASE_URL);

  const json = JSON.stringify(doc);
  mkdirSync(DEST_DIR, { recursive: true });
  writeFileSync(DEST, json);
  mkdirSync(CLI_DEST_DIR, { recursive: true });
  writeFileSync(CLI_DEST, json);
  writeFileSync(ERROR_CODE_ASSET, JSON.stringify(doc.cngxErrorCodes));

  console.log(
    `mcp-snapshot: wrote packages/mcp/data/documentation.json, packages/cli/data/documentation.json ` +
      `and .compodoc/error-codes.json ` +
      `(cngxVersion ${cngxVersion}, schemaVersion ${doc.schemaVersion}, ` +
      `${doc.cngxErrorCodes.codes.length} error code(s), ${rebased} example URL(s) rebased to ${BASE_URL}).`,
  );

  if (dumpPresent) {
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
