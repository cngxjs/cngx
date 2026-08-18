// Distils the recipe pack from the example stories per the curation criterion
// in packages/plugin/pack/SCHEMA.md: one recipe per demo folder that exercises
// the async state machine, using that folder's async example as the
// representative. Each recipe is a projection of the canonical story - its
// title, its description, the cngx symbols it composes, and the artifact
// template (chrome excluded) as the wiring.
//
// parseStory evaluates the story object literal with new Function. That is safe
// here and only here: the input is first-party committed source under
// examples/stories, the generator runs at build time (never in the shipped
// plugin), and a story that fails to evaluate is skipped, not fatal. This
// mirrors examples-gen's loadStory. Do not point it at untrusted input.

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { computeSourceHash, upsertManifestEntry } from './plugin-token-reference.mjs';

const STORIES_ROOT = 'examples/stories';
const RECIPES_DIR = 'packages/plugin/pack/recipes';
const MANIFEST = 'packages/plugin/pack/pack-manifest.json';

// The async-state-machine API surface. A story is a recipe candidate when its
// artifact touches one of these - the async wiring is the pack's centre of
// gravity.
const ASYNC_API =
  /\b(AsyncStatus|CngxAsyncState|createAsyncState|createManualState|injectAsyncState|resolveAsyncView|buildAsyncStateView|CngxAsyncContainer|CngxAsyncClick|CngxAsync|CngxAlertOn|CngxToastOn|CngxBannerOn)\b/;

const normalizeDashes = (text) => text.replace(/\s*[\u2014\u2013]\s*/g, ' - ');
const stripHtml = (text) => (text ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function parseStory(source) {
  const stripped = source.replace(/^import type[^\n]+\n/m, '');
  const match = stripped.match(/export const STORY[^=]*=\s*([\s\S]+?);?\s*$/);
  if (!match) {
    return null;
  }
  try {
    return new Function(`return (${match[1]})`)();
  } catch {
    return null;
  }
}

export function demonstratesAsync(story) {
  const blob = [
    story.setup ?? '',
    story.template ?? '',
    ...(Array.isArray(story.apiComponents) ? story.apiComponents : []),
    ...(Array.isArray(story.moduleImports) ? story.moduleImports : []),
  ].join(' ');
  return ASYNC_API.test(blob);
}

function cngxSymbolsFromImport(line) {
  const match = line.match(/import\s+(?:type\s+)?\{([^}]+)\}/);
  if (!match) {
    return [];
  }
  return match[1]
    .split(',')
    .map((part) => part.trim().replace(/^type\s+/, '').split(/\s+as\s+/).pop()?.trim())
    .filter((name) => name && /^Cngx/.test(name));
}

export function recipeSymbols(story) {
  const api = (Array.isArray(story.apiComponents) ? story.apiComponents : []).filter((name) =>
    /^Cngx/.test(name),
  );
  if (api.length > 0) {
    return [...new Set(api)];
  }
  const imported = (Array.isArray(story.moduleImports) ? story.moduleImports : []).flatMap(
    cngxSymbolsFromImport,
  );
  return [...new Set(imported)];
}

function buildWiring(story) {
  const template = (story.template ?? '').trim();
  const setup = (story.setup ?? '').trim();
  const chosen = template.length >= setup.length ? template || setup : setup || template;
  return chosen ? normalizeDashes(chosen) : null;
}

export function storyToRecipe(story) {
  const symbols = recipeSymbols(story);
  if (symbols.length === 0) {
    return null;
  }
  const wiring = buildWiring(story);
  if (!wiring) {
    return null;
  }
  const whenToUse = normalizeDashes(
    stripHtml(story.description) || stripHtml(story.subtitle) || story.title,
  );
  return { title: story.title, whenToUse, symbols, wiring };
}

const yamlString = (value) => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

export function renderRecipe(recipe) {
  const lines = [
    '---',
    `title: ${yamlString(recipe.title)}`,
    `whenToUse: ${yamlString(recipe.whenToUse)}`,
    `symbols: [${recipe.symbols.join(', ')}]`,
    '---',
    '',
    `# ${recipe.title}`,
    '',
    recipe.whenToUse,
    '',
    '## Symbols',
    '',
    ...recipe.symbols.map((symbol) => `- \`${symbol}\``),
    '',
    '## Wiring',
    '',
    '```',
    recipe.wiring,
    '```',
    '',
  ];
  if (recipe.theming) {
    lines.push('## Theming', '', recipe.theming, '');
  }
  return lines.join('\n');
}

function* walkStories(root) {
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) {
      yield* walkStories(path);
    } else if (path.endsWith('.story.ts')) {
      yield path;
    }
  }
}

const demoFolder = (storyPath) => relative(STORIES_ROOT, storyPath).replace(/\/[^/]+\.story\.ts$/, '');
const exampleSlug = (storyPath) => storyPath.replace(/^.*\//, '').replace(/\.story\.ts$/, '');
const recipeName = (folder) => folder.replace(/\//g, '-');

// Within a folder's async examples, prefer the plainest one: a basic/happy-path
// slug first, then an explicitly async/state slug, then the shortest title.
function representativeRank(slug) {
  if (/basic|happy-path/.test(slug)) {
    return 0;
  }
  if (/async|state/.test(slug)) {
    return 1;
  }
  return 2;
}

function preferReplacement(candidate, current) {
  const byRank = representativeRank(candidate.slug) - representativeRank(current.slug);
  if (byRank !== 0) {
    return byRank < 0;
  }
  const byTitle = candidate.titleLen - current.titleLen;
  if (byTitle !== 0) {
    return byTitle < 0;
  }
  return candidate.slug.localeCompare(current.slug) < 0;
}

export function selectRecipeStories(entries) {
  const byFolder = new Map();
  for (const entry of entries) {
    if (!demonstratesAsync(entry.story)) {
      continue;
    }
    const candidate = {
      ...entry,
      folder: demoFolder(entry.path),
      slug: exampleSlug(entry.path),
      titleLen: (entry.story.title ?? '').length,
    };
    const current = byFolder.get(candidate.folder);
    if (!current || preferReplacement(candidate, current)) {
      byFolder.set(candidate.folder, candidate);
    }
  }
  return [...byFolder.values()].sort((a, b) => a.folder.localeCompare(b.folder));
}

function main() {
  const entries = [];
  for (const path of walkStories(STORIES_ROOT)) {
    const story = parseStory(readFileSync(path, 'utf8'));
    if (story) {
      entries.push({ path, story });
    }
  }

  const selected = selectRecipeStories(entries);
  mkdirSync(resolve(RECIPES_DIR), { recursive: true });

  let manifest = JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'));
  let written = 0;
  for (const entry of selected) {
    const recipe = storyToRecipe(entry.story);
    if (!recipe) {
      continue;
    }
    const name = recipeName(entry.folder);
    writeFileSync(resolve(RECIPES_DIR, `${name}.md`), renderRecipe(recipe));
    manifest = upsertManifestEntry(manifest, {
      artifact: `pack/recipes/${name}.md`,
      source: entry.path,
      contentHash: computeSourceHash(readFileSync(entry.path)),
    });
    written += 1;
  }
  writeFileSync(resolve(MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`recipes: ${written} written from ${selected.length} async demo folders\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
