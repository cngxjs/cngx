#!/usr/bin/env node
/**
 * One-shot: walk every examples/stories/**\/*.story.ts and split each story
 * into the artifact half (template / setup) and the demo-chrome half
 * (templateChrome / setupChrome).
 *
 * Chrome detection — template side:
 *   <div class="event-grid">     state-readout grids
 *   <div class="event-row">      stand-alone state rows (rare)
 *   <div class="button-row">     mode toggles / fail flags / retry buttons
 *   <div class="status-row">     status badges
 *   <div class="cngx-ex-chrome"> explicit opt-in marker
 *
 * Setup classification — for each setup decl:
 *   - referenced (transitively) by artifact template  → setup
 *   - referenced (transitively) by chrome template only → setupChrome
 *   - orphaned (referenced by neither) → setup (don't lose code)
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const STORIES_ROOT = join(ROOT, 'examples', 'stories');

const CHROME_CLASSES = ['event-grid', 'event-row', 'button-row', 'status-row', 'cngx-ex-chrome'];

// ---------- helpers borrowed from generate-examples.mjs ----------

function splitSetupDeclarations(setupText) {
  const lines = String(setupText).split('\n');
  const decls = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const m = /^\s*(?:(?:protected|private|public|readonly|static)\s+)+(\w+)\s*([=(:])/.exec(line);
    if (!m) { i++; continue; }
    const name = m[1];
    const trigger = m[2];
    const isMethod = trigger === '(';
    let block = line;
    let parenDepth = 0, bracketDepth = 0, braceDepth = 0, braceOpened = false;
    let counting = isMethod;
    const updateCounts = (s, from = 0) => {
      for (let k = from; k < s.length; k++) {
        const ch = s[k];
        if (ch === '(') parenDepth++;
        else if (ch === ')') parenDepth--;
        else if (ch === '[') bracketDepth++;
        else if (ch === ']') bracketDepth--;
        else if (ch === '{') { braceDepth++; braceOpened = true; }
        else if (ch === '}') braceDepth--;
      }
    };
    if (counting) updateCounts(line);
    else {
      const eqIdx = line.indexOf('=');
      if (eqIdx >= 0) { counting = true; updateCounts(line, eqIdx + 1); }
    }
    const isDone = () => {
      if (parenDepth !== 0 || bracketDepth !== 0 || braceDepth !== 0) return false;
      if (isMethod) return braceOpened;
      return block.trimEnd().endsWith(';');
    };
    i++;
    while (i < lines.length && !isDone()) {
      const nextLine = lines[i];
      block += '\n' + nextLine;
      if (!counting) {
        const eqIdx = nextLine.indexOf('=');
        if (eqIdx >= 0) { counting = true; updateCounts(nextLine, eqIdx + 1); }
      } else {
        updateCounts(nextLine);
      }
      i++;
    }
    decls.push({ name, code: block });
  }
  return decls;
}

function collectIdentifiers(text) {
  const refs = new Set();
  for (const m of String(text).matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)) {
    refs.add(m[1]);
  }
  return refs;
}

/** Walk decls transitively starting from `seeds`, expanding refs through each kept decl's body. */
function transitiveClosure(seedRefs, decls) {
  const refs = new Set(seedRefs);
  let changed = true;
  while (changed) {
    changed = false;
    for (const d of decls) {
      if (!refs.has(d.name)) continue;
      for (const m of d.code.matchAll(/\b([A-Za-z_$][A-Za-z0-9_$]*)\b/g)) {
        if (!refs.has(m[1])) { refs.add(m[1]); changed = true; }
      }
    }
  }
  return refs;
}

async function loadStory(storyPath) {
  const content = await readFile(storyPath, 'utf8');
  const stripped = content.replace(/^import type[^\n]+\n/m, '');
  const match = stripped.match(/export const STORY[^=]*=\s*([\s\S]+?);?\s*$/);
  if (!match) throw new Error(`No STORY export in ${storyPath}`);
  return new Function(`return (${match[1]})`)();
}

async function* walkFiles(dir, predicate) {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); }
  catch { return; }
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) yield* walkFiles(full, predicate);
    else if (ent.isFile() && predicate(full)) yield full;
  }
}

// ---------- Chrome extraction ----------

/**
 * Split an HTML/template string at the top-level chrome `<div>` blocks.
 * Returns { artifact, chrome } where artifact contains everything else and
 * chrome concatenates the chrome blocks in their original order.
 *
 * Walks balanced <div>/</div> per chrome opener so nested divs inside an
 * outer chrome block don't fool the walker. Chrome openers are matched by
 * class — any of the CHROME_CLASSES present in the class attribute counts.
 */
function splitTemplate(template) {
  const classAlt = CHROME_CLASSES.join('|');
  const openerRe = new RegExp(
    String.raw`<div\b[^>]*\bclass=["'][^"']*\b(?:${classAlt})\b[^"']*["'][^>]*>`,
    'g',
  );

  const artifactParts = [];
  const chromeParts = [];
  let cursor = 0;
  let m;
  while ((m = openerRe.exec(template)) !== null) {
    if (m.index > 0 && template[m.index - 1] === '\\') continue;
    artifactParts.push(template.slice(cursor, m.index));

    // Walk forward through matching </div> with brace balance.
    let depth = 1;
    let i = m.index + m[0].length;
    while (i < template.length && depth > 0) {
      const next = template.slice(i).match(/<\/?div\b[^>]*>/);
      if (!next) break;
      const absIdx = i + next.index;
      if (next[0].startsWith('</')) depth--;
      else depth++;
      i = absIdx + next[0].length;
    }
    chromeParts.push(template.slice(m.index, i));
    cursor = i;
    openerRe.lastIndex = i;
  }
  artifactParts.push(template.slice(cursor));

  // Collapse 3+ blank lines that the strip creates into 2.
  const artifact = artifactParts
    .join('')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '');

  const chrome = chromeParts
    .join('\n')
    .replace(/^\s*\n/, '')
    .replace(/\s+$/, '');

  return { artifact, chrome };
}

/**
 * Re-emit the story file with rewritten template / templateChrome / setup /
 * setupChrome fields. Other fields are preserved verbatim.
 */
function rewriteStoryFile(original, spec) {
  // Use a structural rewrite: build the new content from the spec object,
  // matching the formatting conventions used by scripts/migrate-stories.mjs.
  const importMatch = original.match(/^import type[^\n]+\n/m);
  const importLine = importMatch ? importMatch[0].trim() : `import type { DemoSpec } from '../../dev-tools/demo-spec';`;

  const ts = (s) => "'" + String(s).replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'";
  const bt = (s) => '`' + String(s).replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${') + '`';
  const arrOfStrings = (arr) => '[\n' + arr.map((s) => '    ' + ts(s)).join(',\n') + ',\n  ]';
  const arrLit = (arr) => '[' + arr.map((s) => ts(s)).join(', ') + ']';

  const lines = [];
  lines.push(importLine);
  lines.push('');
  lines.push('export const STORY: DemoSpec = {');
  lines.push(`  title: ${ts(spec.title)},`);
  if (spec.subtitle) lines.push(`  subtitle: ${ts(spec.subtitle)},`);
  if (spec.description) lines.push(`  description: ${ts(spec.description)},`);
  if (spec.level) lines.push(`  level: ${ts(spec.level)},`);
  if (spec.audience?.length) lines.push(`  audience: ${arrLit(spec.audience)},`);
  if (spec.artifact) lines.push(`  artifact: ${ts(spec.artifact)},`);
  if (spec.focus?.length) lines.push(`  focus: ${arrLit(spec.focus)},`);
  if (spec.stability) lines.push(`  stability: ${ts(spec.stability)},`);
  if (spec.framework) lines.push(`  framework: ${ts(spec.framework)},`);
  if (spec.apiComponents?.length) lines.push(`  apiComponents: ${arrOfStrings(spec.apiComponents)},`);
  if (spec.moduleImports?.length) lines.push(`  moduleImports: ${arrOfStrings(spec.moduleImports)},`);
  if (spec.hostDirectives?.length) lines.push(`  hostDirectives: ${arrLit(spec.hostDirectives)},`);
  if (spec.imports?.length) lines.push(`  imports: ${arrLit(spec.imports)},`);
  if (spec.setup) lines.push(`  setup: ${bt(spec.setup)},`);
  if (spec.setupChrome) lines.push(`  setupChrome: ${bt(spec.setupChrome)},`);
  lines.push(`  template: ${bt(spec.template)},`);
  if (spec.templateChrome) lines.push(`  templateChrome: ${bt(spec.templateChrome)},`);
  if (spec.css) lines.push(`  css: ${bt(spec.css)},`);
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

// ---------- Main ----------

async function main() {
  let touched = 0;
  let unchanged = 0;
  let skipped = 0;

  for await (const storyPath of walkFiles(STORIES_ROOT, (p) => p.endsWith('.story.ts'))) {
    let story;
    try {
      story = await loadStory(storyPath);
    } catch (err) {
      console.warn(`Skipping ${relative(STORIES_ROOT, storyPath)}: ${err.message}`);
      skipped++;
      continue;
    }

    if (story.templateChrome || story.setupChrome) {
      // Already split — skip.
      unchanged++;
      continue;
    }

    const original = await readFile(storyPath, 'utf8');
    const { artifact: artifactTemplate, chrome: chromeTemplate } = splitTemplate(story.template ?? '');

    if (!chromeTemplate) {
      // Nothing to split.
      unchanged++;
      continue;
    }

    // Classify setup decls.
    const decls = splitSetupDeclarations(story.setup ?? '');
    const artifactRefs = transitiveClosure(collectIdentifiers(artifactTemplate), decls);
    const chromeRefs = transitiveClosure(collectIdentifiers(chromeTemplate), decls);

    const setupParts = [];
    const setupChromeParts = [];
    for (const d of decls) {
      if (artifactRefs.has(d.name)) {
        setupParts.push(d.code);
      } else if (chromeRefs.has(d.name)) {
        setupChromeParts.push(d.code);
      } else {
        // Orphan — referenced by neither. Keep in setup to be safe.
        setupParts.push(d.code);
      }
    }

    const newSpec = {
      ...story,
      template: artifactTemplate,
      templateChrome: chromeTemplate || undefined,
      setup: setupParts.join('\n') || undefined,
      setupChrome: setupChromeParts.join('\n') || undefined,
    };

    const out = rewriteStoryFile(original, newSpec);
    await writeFile(storyPath, out);
    touched++;
  }

  console.log(`Chrome extracted: ${touched} stories rewritten, ${unchanged} unchanged, ${skipped} skipped.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
