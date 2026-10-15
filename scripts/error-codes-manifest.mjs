// Generates `scripts/manifests/error-codes.json` and the `Error Codes` node of
// `core-concepts/summary.json`. The prose of a code lives on its page,
// `core-concepts/error-codes/cngx<nnnn>.md`; everything else is derived: the
// codes, their lib and severity from the `cngxDevWarn` / `cngxDevError` call
// sites and the `new CngxRuntimeError(...)` constructions, whether the code
// survives a production build, their title from the page.
//
//   node scripts/error-codes-manifest.mjs           write the manifest and the summary node
//   node scripts/error-codes-manifest.mjs --check   exit 1 when either is stale

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as prettier from 'prettier';
import { collectHelperCalls, collectRuntimeErrors } from './dev-diagnostics.mjs';
import { sourceFiles } from './devtools-prod-strip-check.mjs';
import { DEFAULT_BASE_URL } from './llms-publish.mjs';
import { isLibrarySource } from './__tests__/source-roots.mjs';

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Bumped together with `error-codes.schema.json` on any shape change. */
export const SCHEMA_VERSION = 2;

export const MANIFEST_PATH = resolve(REPO_ROOT, 'scripts/manifests/error-codes.json');
export const SUMMARY_PATH = resolve(REPO_ROOT, 'core-concepts/summary.json');
export const PAGES_DIR = resolve(REPO_ROOT, 'core-concepts/error-codes');

export const DOCS_BASE_URL = `${DEFAULT_BASE_URL}/additional-documentation/error-codes/`;

/** The code range each lib emits in. `0000` and `6000-9999` are never used. */
export const CODE_RANGES = [
  { lib: 'core', from: 1, to: 899 },
  { lib: 'utils', from: 900, to: 999 },
  { lib: 'common', from: 1000, to: 1999 },
  { lib: 'forms', from: 2000, to: 2999 },
  { lib: 'ui', from: 3000, to: 3999 },
  { lib: 'data-display', from: 4000, to: 4999 },
  { lib: 'interop', from: 5000, to: 5999 },
];

export const SUMMARY_NODE_TITLE = 'Error Codes';

const CODE_PATTERN = /^CNGX\d{4}$/;
const PAGE_FILE = /^cngx\d{4}\.md$/;
const RETIRED = /^> Retired in \S+\.$/m;
/**
 * The sections every code page carries after its intro, named after the
 * code's severity: `### Fixing the warning` / `### Debugging the warning`
 * for `warn`, `... the error` for `error` and `throw` (the shape of Angular's
 * error pages).
 */
const PAGE_SECTIONS = ['Fixing', 'Debugging'];
const SEVERITY_NOUN = { warn: 'warning', error: 'error', throw: 'error' };

/**
 * A `collectRuntimeErrors` row as a manifest call site: severity `throw`; a
 * dev-only construction is `stripped` with its code, every other one keeps
 * its code in production (`code-only`).
 */
export function throwCall({ file, line, code, devOnly }) {
  return { file, line, code, severity: 'throw', production: devOnly ? 'stripped' : 'code-only' };
}

/** The lib a repo-relative `projects/<lib>/...` path belongs to. */
export function libOf(file) {
  return /^projects\/([^/]+)\//.exec(file)?.[1] ?? null;
}

/** The range entry a code falls in, or undefined. */
export function rangeOf(code) {
  const n = Number(code.slice(4));
  return CODE_RANGES.find((r) => n >= r.from && n <= r.to);
}

/**
 * Parses one code page. `name` is the file name (`cngx0001.md`).
 *
 * @returns {{ name: string; code: string | null; title: string | null; retired: boolean; sections: string[] }}
 */
export function parsePage(name, text) {
  const h1 = /^# (.+)$/m.exec(text)?.[1].trim() ?? null;
  const h2 = /^## (.+)$/m.exec(text)?.[1].trim() ?? null;
  const sections = [...text.matchAll(/^### (.+?)\s*$/gm)].map((m) => m[1]);
  return { name, code: h1, title: h2, retired: RETIRED.test(text), sections };
}

/**
 * The required sections `page` lacks. `noun` is `warning` or `error` from the
 * code's severity; without one (a retired page, or a code with two severities,
 * which fails on its own) either noun passes.
 */
function missingSections(page, noun) {
  const nouns = noun ? [noun] : [...new Set(Object.values(SEVERITY_NOUN))];
  return PAGE_SECTIONS.filter(
    (verb) => !nouns.some((n) => page.sections.includes(`${verb} the ${n}`)),
  ).map((verb) => `${verb} the ${noun ?? 'warning|error'}`);
}

/** Every code page under `dir` (files named `cngx<nnnn>.md`). */
export function readPages(dir = PAGES_DIR) {
  if (!existsSync(dir)) {
    return [];
  }
  return readdirSync(dir)
    .filter((name) => PAGE_FILE.test(name))
    .sort()
    .map((name) => parsePage(name, readFileSync(resolve(dir, name), 'utf8')));
}

/**
 * Joins call sites and pages into manifest entries, or the reasons it cannot.
 *
 * @param {{ file: string; severity: string; code: string | null; production?: string }[]} calls
 *   console helper calls (always `stripped`) and `throwCall` rows
 * @param {ReturnType<typeof parsePage>[]} pages
 * @param {{ hasIndex?: boolean }} [options] whether `error-codes/index.md` exists
 */
export function buildCodes(calls, pages, { hasIndex = true } = {}) {
  const errors = [];
  const byCode = new Map();
  for (const call of calls) {
    if (call.code === null || !CODE_PATTERN.test(call.code)) {
      continue;
    }
    const lib = libOf(call.file);
    const range = rangeOf(call.code);
    if (!range || range.lib !== lib) {
      errors.push(
        `${call.file}:${call.line} ${call.code} lies outside the ${lib} range` +
          (range ? ` (it belongs to ${range.lib})` : ''),
      );
    }
    const entry = byCode.get(call.code) ?? {
      libs: new Set(),
      severities: new Set(),
      productions: new Set(),
      files: new Set(),
    };
    entry.libs.add(lib);
    entry.severities.add(call.severity);
    entry.productions.add(call.production ?? 'stripped');
    entry.files.add(call.file);
    byCode.set(call.code, entry);
  }

  const pageByCode = new Map();
  for (const page of pages) {
    const expected = page.name.slice(0, -'.md'.length).toUpperCase();
    if (page.code !== expected) {
      errors.push(
        `${page.name}: the H1 must be "# ${expected}", found ${JSON.stringify(page.code)}`,
      );
      continue;
    }
    if (!page.title) {
      errors.push(`${page.name}: no "## <title>" heading`);
    }
    const severities = byCode.get(page.code)?.severities;
    const noun = severities?.size === 1 ? SEVERITY_NOUN[[...severities][0]] : undefined;
    for (const section of missingSections(page, noun)) {
      errors.push(`${page.name}: no "### ${section}" section`);
    }
    pageByCode.set(page.code, page);
  }

  for (const [code, entry] of byCode) {
    const page = pageByCode.get(code);
    if (!page) {
      errors.push(`${code} has no page at core-concepts/error-codes/${code.toLowerCase()}.md`);
    } else if (page.retired) {
      errors.push(`${code} is retired but still called in ${[...entry.files].join(', ')}`);
    }
    if (entry.severities.size > 1) {
      errors.push(`${code} is emitted with two severities (${[...entry.severities].join(', ')})`);
    }
    if (entry.severities.size === 1 && entry.productions.size > 1) {
      errors.push(
        `${code} is thrown both dev-only and in production; give each condition its own code`,
      );
    }
    if (entry.libs.size > 1) {
      errors.push(`${code} is reused across libs (${[...entry.libs].join(', ')})`);
    }
  }
  for (const [code, page] of pageByCode) {
    if (!byCode.has(code) && !page.retired) {
      errors.push(`${page.name} has no call site; mark it "> Retired in <version>." or remove it`);
    }
  }

  const codes = [...new Set([...byCode.keys(), ...pageByCode.keys()])].sort().map((code) => {
    const entry = byCode.get(code);
    const page = pageByCode.get(code);
    const retired = !entry;
    return {
      code,
      lib: retired ? (rangeOf(code)?.lib ?? null) : [...entry.libs][0],
      severity: retired ? null : [...entry.severities][0],
      production: retired ? null : [...entry.productions][0],
      title: page?.title ?? null,
      page: `core-concepts/error-codes/${code.toLowerCase()}.md`,
      url: `${DOCS_BASE_URL}${code.toLowerCase()}.html`,
      status: retired ? 'retired' : 'active',
      files: retired ? [] : [...entry.files].sort(),
    };
  });
  if (codes.length > 0 && !hasIndex) {
    errors.push('core-concepts/error-codes/index.md is missing; the Error Codes node needs it');
  }
  return { codes, errors };
}

/** The manifest object for `codes`. */
export function manifestOf(codes) {
  return {
    $schema: './error-codes.schema.json',
    schemaVersion: SCHEMA_VERSION,
    docsBaseUrl: DOCS_BASE_URL,
    ranges: CODE_RANGES,
    codes,
  };
}

/** The formatted manifest file. */
export async function renderManifest(codes) {
  const options = (await prettier.resolveConfig(MANIFEST_PATH)) ?? {};
  return prettier.format(JSON.stringify(manifestOf(codes)), {
    ...options,
    filepath: MANIFEST_PATH,
  });
}

/**
 * `summary` with its `Error Codes` node replaced by one built from `codes`:
 * kept in place when present, appended when new, dropped when there are no
 * codes. Every other node is left as it is.
 */
export function withSummaryNode(summary, codes) {
  const node =
    codes.length === 0
      ? null
      : {
          title: SUMMARY_NODE_TITLE,
          file: 'error-codes/index.md',
          children: codes.map(({ code }) => ({
            title: code,
            file: `error-codes/${code.toLowerCase()}.md`,
          })),
        };
  const index = summary.findIndex((entry) => entry.title === SUMMARY_NODE_TITLE);
  if (index === -1) {
    return node ? [...summary, node] : [...summary];
  }
  const next = [...summary];
  if (node) {
    next[index] = node;
  } else {
    next.splice(index, 1);
  }
  return next;
}

/** The `Error Codes` node of a parsed `summary.json`, or null. */
export function summaryNodeOf(summary) {
  return summary.find((entry) => entry.title === SUMMARY_NODE_TITLE) ?? null;
}

/** `summary.json` keeps its four-space layout. */
export function renderSummary(summary) {
  return `${JSON.stringify(summary, null, 4)}\n`;
}

/**
 * The library sources the call sites are read from, as [{ path, text }]:
 * `projects/**` minus specs, tooling roots, example folders and the
 * unpublished `projects/testing`. The published `testing` entries of the libs stay in.
 */
export function readSources() {
  return sourceFiles('projects', REPO_ROOT)
    .map((path) => path.split('\\').join('/'))
    .filter(isLibrarySource)
    .map((path) => ({ path, text: readFileSync(resolve(REPO_ROOT, path), 'utf8') }));
}

/**
 * Generates both outputs from the repo; `errors` is empty when it is
 * consistent. The generator owns only the `Error Codes` node of
 * `summary.json`: `summaryStale` compares that node alone, and the file is
 * rewritten only when the node changes, so a hand edit elsewhere in it is
 * never reformatted or reported.
 */
export async function generate() {
  const sources = readSources();
  const calls = [...collectHelperCalls(sources), ...collectRuntimeErrors(sources).map(throwCall)];
  const { codes, errors } = buildCodes(calls, readPages(), {
    hasIndex: existsSync(resolve(PAGES_DIR, 'index.md')),
  });
  const manifest = await renderManifest(codes);
  const current = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
  const next = withSummaryNode(current, codes);
  const summaryNode = summaryNodeOf(next);
  const summaryStale = JSON.stringify(summaryNodeOf(current)) !== JSON.stringify(summaryNode);
  return { codes, errors, manifest, summary: renderSummary(next), summaryNode, summaryStale };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { codes, errors, manifest, summary, summaryStale } = await generate();
  if (errors.length > 0) {
    console.error(`error-codes - ${errors.length} problem(s):`);
    for (const error of errors) {
      console.error(`  ${error}`);
    }
    process.exit(1);
  }
  const currentManifest = existsSync(MANIFEST_PATH) ? readFileSync(MANIFEST_PATH, 'utf8') : '';
  if (process.argv.includes('--check')) {
    if (currentManifest !== manifest || summaryStale) {
      console.error(
        'scripts/manifests/error-codes.json or the Error Codes node of core-concepts/summary.json is stale. ' +
          'Run `npm run manifest:error-codes`.',
      );
      process.exit(1);
    }
  } else {
    if (currentManifest !== manifest) {
      writeFileSync(MANIFEST_PATH, manifest);
    }
    if (summaryStale) {
      writeFileSync(SUMMARY_PATH, summary);
    }
    console.log(`Wrote scripts/manifests/error-codes.json (${codes.length} code(s))`);
  }
}
