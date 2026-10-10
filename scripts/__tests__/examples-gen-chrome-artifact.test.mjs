import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  chromeHiddenClasses,
  isSelectorSource,
  selectorsInSource,
} from '../examples-gen/code-panel.mjs';
import { parseStory } from '../plugin-recipes.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STORIES = join(ROOT, 'examples', 'stories');

const filesUnder = (dir, keep) =>
  readdirSync(dir, { recursive: true })
    .map((f) => join(dir, f))
    .filter(keep);

function selectorMap() {
  const map = new Map();
  for (const file of filesUnder(join(ROOT, 'projects'), isSelectorSource)) {
    for (const [className, selectors] of selectorsInSource(readFileSync(file, 'utf8'))) {
      map.set(className, [...new Set([...(map.get(className) ?? []), ...selectors])]);
    }
  }
  return map;
}

describe('examples chrome divs', () => {
  const stories = filesUnder(STORIES, (f) => f.endsWith('.story.ts')).map((file) => ({
    route: relative(STORIES, file).replace(/\.story\.ts$/, ''),
    story: parseStory(readFileSync(file, 'utf8')),
  }));

  it('parses every story', () => {
    expect(stories.filter((s) => s.story === null).map((s) => s.route)).toEqual([]);
  });

  it.fails('no story wraps an artifact element in a chrome-class div', () => {
    const map = selectorMap();
    const hits = stories
      .filter((s) => s.story)
      .map(({ route, story }) => [route, chromeHiddenClasses(story, map)])
      .filter(([, classes]) => classes.length > 0)
      .map(([route, classes]) => `${route}: ${classes.join(', ')}`);
    expect(hits).toEqual([]);
  });
});
