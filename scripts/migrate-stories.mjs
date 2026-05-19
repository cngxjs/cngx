#!/usr/bin/env node
/**
 * One-shot migration: split each multi-section *-demo.story.ts into one
 * self-contained *.story.ts per section, mirrored onto the generated
 * features tree.
 *
 *   examples/src/app/features/forms/select/single-select/clearable.component.ts
 *     ←→ examples/stories/forms/select/single-select/clearable.story.ts
 *
 * Strategy: walk the already-generated features tree (which has the
 * correct path-derivation baked in), read each component's
 * `// Source: examples/stories/.../<file>.story.ts#section[N]` header
 * to find the source section, then emit a self-contained .story.ts at
 * the mirrored path.
 *
 * After this runs, scripts/examples-gen/index.mjs is refactored to walk
 * examples/stories/**\/*.story.ts recursively. Old <demo>-demo folders
 * become obsolete and get deleted.
 */

import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const FEATURES_DIR = join(ROOT, 'examples', 'src', 'app', 'features');
const STORIES_ROOT = join(ROOT, 'examples', 'stories');

// ---------- Helpers borrowed from generate-examples.mjs ----------

function stripCommentsForScan(s) {
  return String(s ?? '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

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

function pruneStorySetup(storySetup, section) {
  if (!storySetup?.trim()) return '';
  const decls = splitSetupDeclarations(storySetup);
  if (decls.length === 0) return storySetup;
  const refs = collectIdentifiers((section.setup ?? '') + '\n' + (section.template ?? ''));
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
  return decls.filter((d) => refs.has(d.name)).map((d) => d.code).join('\n');
}

async function loadStory(storyPath) {
  const content = await readFile(storyPath, 'utf8');
  const stripped = content.replace(/^import type[^\n]+\n/m, '');
  const match = stripped.match(/export const STORY[^=]*=\s*([\s\S]+?);?\s*$/);
  if (!match) throw new Error(`No STORY export in ${storyPath}`);
  return new Function(`return (${match[1]})`)();
}

// ---------- File walking ----------

async function* walkComponents(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walkComponents(full);
    } else if (ent.isFile() && ent.name.endsWith('.component.ts')) {
      yield full;
    }
  }
}

// ---------- Per-section spec construction ----------

function buildPerSectionSpec(story, section, prunedStorySetup) {
  const scanText =
    stripCommentsForScan(prunedStorySetup) +
    '\n' +
    stripCommentsForScan(section.setup ?? '') +
    '\n' +
    (section.template ?? '');
  const explicitRefs = new Set([
    ...(section.imports ?? []),
    ...(story.hostDirectives ?? []),
  ]);

  function isReferenced(id) {
    if (explicitRefs.has(id)) return true;
    return new RegExp(String.raw`\b${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`).test(scanText);
  }

  const filteredModuleImports = (story.moduleImports ?? [])
    .filter((line) => !/from\s*['"]@angular\/core['"]/.test(line))
    .map((line) => {
      const match = line.match(/^(\s*import\s*(?:type\s+)?\{)([^}]+)(\}\s*from\s*['"][^'"]+['"];?\s*)$/);
      if (!match) return line;
      const [, head, body, tail] = match;
      const kept = body
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((spec) => {
          const parts = spec.replace(/^type\s+/, '').split(/\s+as\s+/);
          const id = (parts.length > 1 ? parts[1] : parts[0])?.trim();
          return isReferenced(id);
        });
      if (kept.length === 0) return null;
      return `${head} ${kept.join(', ')} ${tail.trim()}`;
    })
    .filter((line) => line !== null);

  const focus = section.focus ?? story.focus;
  const artifact = section.artifact ?? story.artifact;
  const framework = section.framework ?? story.framework;

  const mergedSetup = [prunedStorySetup, section.setup ?? '']
    .map((s) => (s ?? '').trim())
    .filter(Boolean)
    .join('\n\n');

  return {
    title: section.title,
    subtitle: section.subtitle,
    description: story.description,
    level: story.level,
    audience: story.audience,
    artifact,
    focus,
    stability: story.stability,
    framework,
    apiComponents: story.apiComponents,
    moduleImports: filteredModuleImports.length > 0 ? filteredModuleImports : undefined,
    hostDirectives: story.hostDirectives,
    imports: section.imports,
    setup: mergedSetup || undefined,
    template: section.template,
    css: section.css,
  };
}

// ---------- TS literal emit ----------

function tsString(s) {
  return "'" + String(s).replaceAll('\\', '\\\\').replaceAll("'", "\\'") + "'";
}

function tsBacktick(s) {
  return '`' + String(s).replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${') + '`';
}

function tsArrayOfStrings(arr, indent = '    ') {
  if (!arr || arr.length === 0) return '[]';
  return '[\n' + arr.map((s) => indent + tsString(s)).join(',\n') + ',\n  ]';
}

function tsArrayLiteralStrings(arr) {
  if (!arr || arr.length === 0) return '[]';
  return '[' + arr.map((s) => tsString(s)).join(', ') + ']';
}

function emitStoryFile(spec, importRelPath) {
  const lines = [];
  lines.push(`import type { DemoSpec } from '${importRelPath}';`);
  lines.push('');
  lines.push('export const STORY: DemoSpec = {');
  lines.push(`  title: ${tsString(spec.title)},`);
  if (spec.subtitle) lines.push(`  subtitle: ${tsString(spec.subtitle)},`);
  if (spec.description) lines.push(`  description: ${tsString(spec.description)},`);
  if (spec.level) lines.push(`  level: ${tsString(spec.level)},`);
  if (spec.audience?.length) lines.push(`  audience: ${tsArrayLiteralStrings(spec.audience)},`);
  if (spec.artifact) lines.push(`  artifact: ${tsString(spec.artifact)},`);
  if (spec.focus?.length) lines.push(`  focus: ${tsArrayLiteralStrings(spec.focus)},`);
  if (spec.stability) lines.push(`  stability: ${tsString(spec.stability)},`);
  if (spec.framework) lines.push(`  framework: ${tsString(spec.framework)},`);
  if (spec.apiComponents?.length) lines.push(`  apiComponents: ${tsArrayOfStrings(spec.apiComponents)},`);
  if (spec.moduleImports?.length) lines.push(`  moduleImports: ${tsArrayOfStrings(spec.moduleImports)},`);
  if (spec.hostDirectives?.length) lines.push(`  hostDirectives: ${tsArrayLiteralStrings(spec.hostDirectives)},`);
  if (spec.imports?.length) lines.push(`  imports: ${tsArrayLiteralStrings(spec.imports)},`);
  if (spec.setup) lines.push(`  setup: ${tsBacktick(spec.setup)},`);
  lines.push(`  template: ${tsBacktick(spec.template)},`);
  if (spec.css) lines.push(`  css: ${tsBacktick(spec.css)},`);
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

// ---------- Main ----------

const SOURCE_RE = /^\/\/\s*Source:\s*(examples\/stories\/[^#]+\.story\.ts)#section\[(\d+)\]/m;

async function main() {
  if (!existsSync(FEATURES_DIR)) {
    console.error(`Features dir missing: ${FEATURES_DIR}`);
    console.error(`Run \`npm run examples:generate\` first.`);
    process.exit(1);
  }

  const storyCache = new Map();
  const helpersWritten = new Set();
  let stories = 0;
  let helpers = 0;

  for await (const componentPath of walkComponents(FEATURES_DIR)) {
    const componentSrc = await readFile(componentPath, 'utf8');
    const m = SOURCE_RE.exec(componentSrc);
    if (!m) {
      console.warn(`No Source header in ${componentPath}`);
      continue;
    }
    const [, storyRelPath, sectionIdxStr] = m;
    const sectionIdx = parseInt(sectionIdxStr, 10);
    const storyAbsPath = join(ROOT, storyRelPath);

    let story = storyCache.get(storyAbsPath);
    if (!story) {
      story = await loadStory(storyAbsPath);
      storyCache.set(storyAbsPath, story);
    }
    const section = story.sections?.[sectionIdx];
    if (!section) {
      console.warn(`Section ${sectionIdx} missing in ${storyAbsPath} (referenced by ${componentPath})`);
      continue;
    }

    // Target story path: replace src/app/features/ → stories/, .component.ts → .story.ts
    const relFromFeatures = componentPath.slice(FEATURES_DIR.length + 1); // e.g. forms/select/single-select/clearable.component.ts
    const targetRel = relFromFeatures.replace(/\.component\.ts$/, '.story.ts');
    const targetAbs = join(STORIES_ROOT, targetRel);
    const targetDir = dirname(targetAbs);
    await mkdir(targetDir, { recursive: true });

    // Build per-section spec
    const prunedStorySetup = pruneStorySetup(story.setup ?? '', section);
    const spec = buildPerSectionSpec(story, section, prunedStorySetup);

    // Compute import path to examples/dev-tools/demo-spec from the target file location.
    // targetDir is examples/stories/<segments>/, dev-tools is examples/dev-tools/
    // depth from targetDir → examples: 1 (for stories) + number of segments
    const segmentCount = targetRel.split('/').length - 1; // exclude the file itself
    const upCount = segmentCount + 1; // +1 for 'stories' → 'examples'
    const importRel = '../'.repeat(upCount) + 'dev-tools/demo-spec';

    const code = emitStoryFile(spec, importRel);
    await writeFile(targetAbs, code);
    stories++;

    // Co-located helpers: scan moduleImports of the ORIGINAL story for `from './x'`
    // and copy them next to the new target (each demo folder gets its own copy).
    const helperFiles = new Set();
    for (const line of story.moduleImports ?? []) {
      const m2 = line.match(/from\s+['"](\.\/[^'"]+)['"]/);
      if (m2) helperFiles.add(m2[1]);
    }
    if (helperFiles.size > 0) {
      const sourceDir = dirname(storyAbsPath);
      for (const rel of helperFiles) {
        const helperKey = targetDir + '|' + rel;
        if (helpersWritten.has(helperKey)) continue;
        const candidates = [join(sourceDir, rel + '.ts'), join(sourceDir, rel)];
        for (const candidate of candidates) {
          try {
            const content = await readFile(candidate, 'utf8');
            const destName = rel.replace(/^\.\//, '') + (candidate.endsWith('.ts') ? '.ts' : '');
            await writeFile(join(targetDir, destName), content);
            helpersWritten.add(helperKey);
            helpers++;
            break;
          } catch { /* try next */ }
        }
      }
    }
  }

  console.log(`Migrated ${stories} stories, copied ${helpers} helpers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
