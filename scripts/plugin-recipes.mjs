// Distils the recipe pack from the example stories per the curation criterion
// in packages/plugin/pack/SCHEMA.md: one recipe per demo folder that exercises
// the async state machine, using that folder's async example as the
// representative. Each recipe is a projection of the canonical story - its
// title, its description, the cngx symbols it composes, and the artifact
// template (chrome excluded) as the wiring.

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  buildDisplayedHtml,
  dedentClassBody,
  importedSymbols,
} from './examples-gen/code-panel.mjs';
import { parseStory } from './examples-gen/story.mjs';
import { computeSourceHash, upsertManifestEntry } from './plugin-token-reference.mjs';

const STORIES_ROOT = 'examples/stories';
const PLUGIN_ROOT = 'packages/plugin';
const RECIPES_DIR = 'packages/plugin/pack/recipes';
const MANIFEST = 'packages/plugin/pack/pack-manifest.json';

// The async-state-machine API surface. A story is a recipe candidate when its
// artifact touches one of these - the async wiring is the pack's centre of
// gravity.
const ASYNC_API =
  /\b(AsyncStatus|CngxAsyncState|createAsyncState|createManualState|injectAsyncState|resolveAsyncView|buildAsyncStateView|CngxAsyncContainer|CngxAsyncClick|CngxAsync|CngxAlertOn|CngxToastOn|CngxBannerOn)\b/;

const normalizeDashes = (text) => text.replace(/\s*[\u2014\u2013]\s*/g, ' - ');
const stripHtml = (text) => (text ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

export function demonstratesAsync(story) {
  const blob = [
    story.setup ?? '',
    story.template ?? '',
    ...(Array.isArray(story.apiComponents) ? story.apiComponents : []),
    ...(Array.isArray(story.moduleImports) ? story.moduleImports : []),
  ].join(' ');
  return ASYNC_API.test(blob);
}

export function recipeSymbols(story) {
  const api = (Array.isArray(story.apiComponents) ? story.apiComponents : []).filter((name) =>
    /^Cngx/.test(name),
  );
  if (api.length > 0) {
    return [...new Set(api)];
  }
  const imported = (Array.isArray(story.moduleImports) ? story.moduleImports : []).flatMap((line) =>
    importedSymbols(line).filter((name) => /^Cngx/.test(name)),
  );
  return [...new Set(imported)];
}

export function storyToRecipe(story) {
  const symbols = recipeSymbols(story);
  if (symbols.length === 0) {
    return null;
  }
  // Both fields render as the code panels show them: the template through the
  // Template panel builder (chrome divs out, markup dedent), the setup through
  // the class-body dedent.
  const template = normalizeDashes(buildDisplayedHtml(story.template).trim());
  const setup = normalizeDashes(dedentClassBody(story.setup ?? '').trim());
  // The template is the composition surface a recipe teaches, so it is the
  // wiring. The class setup that backs it rides alongside as its own field
  // rather than replacing the template (the old "longer wins" rule hid the
  // template on setup-heavy async examples).
  const wiring = template || setup;
  if (!wiring) {
    return null;
  }
  const whenToUse = normalizeDashes(
    stripHtml(story.description) || stripHtml(story.subtitle) || story.title,
  );
  const recipe = { title: story.title, whenToUse, symbols, wiring };
  if (template && setup) {
    recipe.setup = setup;
  }
  return recipe;
}

const yamlString = (value) => `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

const wiringLang = (wiring) => (wiring.trimStart().startsWith('<') ? 'html' : 'ts');

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
  ];
  if (recipe.setup) {
    lines.push('## Setup', '', '```ts', recipe.setup, '```', '');
  }
  lines.push('## Wiring', '', `\`\`\`${wiringLang(recipe.wiring)}`, recipe.wiring, '```', '');
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

// Every story under STORIES_ROOT as `{ path, story }`. A story that does not
// parse is left out and handed to `onError(path, err)`.
export function collectStoryEntries(onError) {
  const entries = [];
  for (const path of walkStories(STORIES_ROOT)) {
    try {
      entries.push({ path, story: parseStory(readFileSync(path, 'utf8'), path) });
    } catch (err) {
      onError(path, err);
    }
  }
  return entries;
}

const demoFolder = (storyPath) => relative(STORIES_ROOT, storyPath).replace(/\/[^/]+\.story\.ts$/, '');
const exampleSlug = (storyPath) => storyPath.replace(/^.*\//, '').replace(/\.story\.ts$/, '');
const recipeName = (folder) => folder.replace(/\//g, '-');

export function recipeArtifact(folder) {
  return `pack/recipes/${recipeName(folder)}.md`;
}

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

// The recipes the pack ships for these stories: one `{ artifact, source, body }`
// per selected folder whose representative yields a recipe. The generator
// writes exactly this list and the drift check compares against it.
export function expectedRecipes(entries) {
  return selectRecipeStories(entries).flatMap((entry) => {
    const recipe = storyToRecipe(entry.story);
    if (!recipe) {
      return [];
    }
    return [
      { artifact: recipeArtifact(entry.folder), source: entry.path, body: renderRecipe(recipe) },
    ];
  });
}

function main() {
  const entries = collectStoryEntries((path, err) => {
    process.stderr.write(`Skipping ${path}: ${err.message}\n`);
  });

  const selected = selectRecipeStories(entries);
  const recipes = expectedRecipes(entries);
  mkdirSync(resolve(RECIPES_DIR), { recursive: true });

  let manifest = JSON.parse(readFileSync(resolve(MANIFEST), 'utf8'));
  for (const recipe of recipes) {
    writeFileSync(resolve(PLUGIN_ROOT, recipe.artifact), recipe.body);
    manifest = upsertManifestEntry(manifest, {
      artifact: recipe.artifact,
      source: recipe.source,
      contentHash: computeSourceHash(readFileSync(recipe.source)),
    });
  }
  writeFileSync(resolve(MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `recipes: ${recipes.length} written from ${selected.length} async demo folders\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
