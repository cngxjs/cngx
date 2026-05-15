// Inject @example-url JSDoc tags into library classes so each documented
// symbol points at its iframe demo in the examples app.
//
// Idempotent: every run strips existing @example-url lines from the target
// JSDoc block before re-emitting the current set, so manifest changes flow
// through without manual cleanup.
//
// Usage:
//   node scripts/backport-example-urls.mjs                                  # uses EXAMPLES_BASE_URL or http://localhost:4200
//   node scripts/backport-example-urls.mjs --base=https://example.com/ex    # explicit override
//   EXAMPLES_BASE_URL=https://cngxjs.github.io/cngx/examples node …         # env-driven (CI / prod build)

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ROUTES_META_PATH = join(ROOT, 'examples', 'src', 'app', '_routes-meta.ts');
const PROJECTS_DIR = join(ROOT, 'projects');

const args = new Map(process.argv.slice(2).map((a) => a.split('=', 2)).map(([k, v]) => [k, v ?? '']));
// Resolve the base URL embedded into <example-url> tags.
// Precedence: --base=… CLI flag > EXAMPLES_BASE_URL env var > localhost default.
// Use the env var in CI (production docs build) so prod docs point at the
// hosted examples app instead of a dev port that won't resolve.
const BASE_URL =
  args.get('--base') || process.env.EXAMPLES_BASE_URL || 'http://localhost:4200';

async function* walkFiles(dir, predicate) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(p, predicate);
    else if (predicate(p)) yield p;
  }
}

/** Build symbol → source-file map from every `export { Name } from './path'` in projects/**\/public-api.ts. */
async function buildSymbolMap() {
  const map = new Map();
  for await (const apiPath of walkFiles(PROJECTS_DIR, (p) => p.endsWith('/public-api.ts'))) {
    const apiDir = dirname(apiPath);
    const src = await readFile(apiPath, 'utf8');
    for (const m of src.matchAll(/export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const targetPath = resolve(apiDir, m[2]) + '.ts';
      for (const raw of m[1].split(',')) {
        const id = raw.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]?.trim();
        if (id && !map.has(id) && /^[A-Z_]/.test(id)) {
          map.set(id, targetPath);
        }
      }
    }
  }
  return map;
}

/** Parse the generated _routes-meta.ts and return ROUTES_META as a JS array. */
async function loadRoutes() {
  const src = await readFile(ROUTES_META_PATH, 'utf8');
  const m = src.match(/ROUTES_META[^=]*=\s*(\[[\s\S]*?\n\]);?/);
  if (!m) throw new Error('Could not locate ROUTES_META in ' + ROUTES_META_PATH);
  // Strip trailing commas (valid JS object literal syntax, not JSON).
  const cleaned = m[1].replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(cleaned);
}

/**
 * Inject @example-url lines into the JSDoc above `export class <name>` in the
 * given file content. Strips any existing @example-url lines first.
 * Returns null if the class declaration cannot be found.
 */
/**
 * Count unescaped backticks before `pos` to determine whether `pos` falls
 * inside an open template literal. Returns true if so — used to skip class
 * matches that are decoys inside `template: \`…\`` strings.
 */
function isInsideTemplateLiteral(src, pos) {
  let count = 0;
  for (let i = 0; i < pos; i++) {
    if (src[i] === '\\') { i++; continue; }
    if (src[i] === '`') count++;
  }
  return count % 2 === 1;
}

/** Locate the topmost top-level Angular decorator before `classPos`. */
function findTopDecoratorPos(src, classPos) {
  const decoratorRe = /\n[ \t]*@(Component|Directive|Injectable|Pipe|NgModule)\b/g;
  let topDecoratorPos = -1;
  let m;
  while ((m = decoratorRe.exec(src)) !== null) {
    if (m.index >= classPos) break;
    if (isInsideTemplateLiteral(src, m.index + 1)) continue;
    topDecoratorPos = m.index + 1; // skip leading \n
  }
  return topDecoratorPos;
}

function injectExampleUrls(src, className, urls) {
  const classRe = new RegExp(`\\bexport\\s+(?:abstract\\s+)?class\\s+${className}\\b`);
  const classMatch = classRe.exec(src);
  if (!classMatch) return null;
  if (isInsideTemplateLiteral(src, classMatch.index)) return null;

  // Anchor the JSDoc search to the topmost top-level decorator (not to
  // `export class`), because multi-class files with template literals
  // between decorator and class confuse a naive backwards scan.
  const topDecorator = findTopDecoratorPos(src, classMatch.index);
  const anchor = topDecorator !== -1 ? topDecorator : classMatch.index;

  // Walk back from anchor over whitespace to find the immediately preceding
  // `*/`. Skip if it's inside any template literal.
  const before = src.slice(0, anchor);
  const trimmed = before.replace(/\s+$/, '');
  if (!trimmed.endsWith('*/')) {
    return injectFreshJsdoc(src, classMatch.index, urls);
  }
  const jsdocEnd = trimmed.length - 2; // position of `*` in `*/`
  if (isInsideTemplateLiteral(src, jsdocEnd)) {
    return injectFreshJsdoc(src, classMatch.index, urls);
  }

  // Find the matching `/**` opener.
  const jsdocStart = src.lastIndexOf('/**', jsdocEnd);
  if (jsdocStart === -1) return null;

  const blockBody = src.slice(jsdocStart + 3, jsdocEnd);
  // Strip existing example-url lines — both the new compodocx HTML form
  // (`* <example-url>...</example-url>`) and the legacy `@example-url` form
  // emitted by earlier runs of this script.
  const cleaned = blockBody
    .replace(/^\s*\*\s*<example-url>[^<]*<\/example-url>[ \t]*$\n?/gm, '')
    .replace(/^\s*\*\s*@example-url\s+\S*[ \t]*$\n?/gm, '');

  // Determine the indent used for inner JSDoc lines.
  const indentMatch = /^([ \t]*)\* /m.exec(cleaned);
  const innerIndent = indentMatch ? indentMatch[1] : ' ';

  // Build the URL lines using compodocx's <example-url> HTML tag — surfaces
  // on the Example tab of component/directive pages.
  const urlLines = urls
    .map((u) => `${innerIndent}* <example-url>${u}</example-url>`)
    .join('\n');

  // Trim trailing whitespace/newlines from cleaned body so we can append cleanly.
  const cleanedTrimmed = cleaned.replace(/\s+$/, '');
  // The closing `*/` line typically has its own indent; capture it.
  const closeIndent = (() => {
    const m = /\n([ \t]*)$/.exec(src.slice(0, jsdocEnd));
    return m ? m[1] : '';
  })();

  const rebuiltBody = `${cleanedTrimmed}\n${urlLines}\n${closeIndent}`;

  return src.slice(0, jsdocStart + 3) + rebuiltBody + src.slice(jsdocEnd);
}

function injectFreshJsdoc(src, atIndex, urls) {
  // Walk back from `export class` through any decorator chain (including
  // multi-line decorator bodies) to find the line index where the JSDoc
  // should be inserted — directly above the topmost `@Decorator` line.
  const before = src.slice(0, atIndex);
  const lines = before.split('\n');
  const classLineIdx = lines.length - 1;

  let topDecoratorIdx = classLineIdx;
  const isStatementBoundary = (line) =>
    /^\s*(import\s|export\s|class\s|function\s|const\s|let\s|var\s|enum\s|interface\s|type\s|\/\*\*|\*\/|\/\/)/.test(
      line,
    );
  for (let i = classLineIdx - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.trim() === '') continue;
    if (isStatementBoundary(line)) break;
    if (/^\s*@[\w$]/.test(line)) {
      topDecoratorIdx = i;
    }
    // Otherwise it's a decorator body continuation line — keep walking back.
  }

  // Byte offset for insertion = start of topDecoratorIdx line.
  let offset = 0;
  for (let k = 0; k < topDecoratorIdx; k++) offset += lines[k].length + 1;

  const insertLine = lines[topDecoratorIdx] ?? '';
  const indent = /^([ \t]*)/.exec(insertLine)?.[1] ?? '';
  const block = [
    `${indent}/**`,
    ...urls.map((u) => `${indent} * <example-url>${u}</example-url>`),
    `${indent} */`,
    '',
  ].join('\n');
  return src.slice(0, offset) + block + src.slice(offset);
}

async function main() {
  const symbolMap = await buildSymbolMap();
  const routes = await loadRoutes();

  // Group URLs by API symbol.
  const urlsBySymbol = new Map();
  for (const r of routes) {
    // Hash-routed URLs (#/path) — the examples app uses withHashLocation()
    // so it works on GitHub Pages without a 404 SPA fallback.
    const url = `${BASE_URL}/#/${r.path}`;
    for (const sym of r.apiComponents ?? []) {
      if (!urlsBySymbol.has(sym)) urlsBySymbol.set(sym, new Set());
      urlsBySymbol.get(sym).add(url);
    }
  }

  let edited = 0;
  let skippedNoFile = 0;
  let skippedNoClass = 0;
  const editedFiles = new Map(); // filePath → { src, classNames: Set }

  // Process each symbol, batching multiple symbols per file.
  for (const [sym, urlSet] of urlsBySymbol) {
    const filePath = symbolMap.get(sym);
    if (!filePath) {
      skippedNoFile++;
      continue;
    }
    if (!editedFiles.has(filePath)) {
      editedFiles.set(filePath, { src: await readFile(filePath, 'utf8'), classes: [] });
    }
    editedFiles.get(filePath).classes.push({ sym, urls: [...urlSet].sort() });
  }

  for (const [filePath, info] of editedFiles) {
    let src = info.src;
    let touchedClasses = 0;
    for (const { sym, urls } of info.classes) {
      const next = injectExampleUrls(src, sym, urls);
      if (next === null) {
        skippedNoClass++;
        continue;
      }
      if (next !== src) {
        src = next;
        touchedClasses++;
      }
    }
    if (src !== info.src) {
      await writeFile(filePath, src);
      edited++;
      console.log(`Edited ${relative(ROOT, filePath)}: ${touchedClasses} class(es)`);
    }
  }

  console.log(`\nDone. ${edited} files edited.`);
  if (skippedNoFile > 0) console.log(`Skipped ${skippedNoFile} symbols (no source file resolved).`);
  if (skippedNoClass > 0) console.log(`Skipped ${skippedNoClass} symbols (class declaration not found).`);
}

await main().catch((err) => {
  console.error(err);
  process.exit(1);
});
