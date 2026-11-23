import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  chromeHiddenClasses,
  isSelectorSource,
  selectorsInSource,
} from '../examples-gen/code-panel.mjs';
import { parseStory } from '../examples-gen/story.mjs';

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

const NOT_MEMBERS = new Set([
  'if',
  'for',
  'while',
  'switch',
  'return',
  'catch',
  'constructor',
  'super',
]);

/** Names of class members declared at brace depth 0 of a `setup` / `setupChrome` body. */
function classMembers(body = '') {
  const names = new Set();
  let depth = 0;
  for (const line of body.split('\n')) {
    const code = line
      .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, "''")
      .replace(/\/\/.*$/, '');
    if (depth === 0) {
      const decl = code.match(
        /^\s*(?:(?:public|protected|private|readonly|static|override|async|get|set)\s+)*#?([A-Za-z_$][\w$]*)\s*[!?]?\s*[=:(<]/,
      );
      if (decl && !NOT_MEMBERS.has(decl[1])) {
        names.add(decl[1]);
      }
    }
    for (const ch of code) {
      if ('{(['.includes(ch)) {
        depth++;
      } else if ('})]'.includes(ch)) {
        depth--;
      }
    }
  }
  return names;
}

/** Interpolations, bound attribute values and control-flow headers of a template. */
function templateExpressions(template = '') {
  return [
    ...[...template.matchAll(/\{\{([\s\S]*?)\}\}/g)].map((m) => m[1]),
    ...[...template.matchAll(/[[(*][^\s=]*\s*=\s*"([^"]*)"/g)].map((m) => m[1]),
    ...[...template.matchAll(/@(?:if|else if|for|switch|case|let|defer)\b([^{\n]*)/g)].map(
      (m) => m[1],
    ),
  ].join('\n');
}

/** Members only `setupChrome` declares that the displayed `setup` or `template` still reads. */
function chromeOnlyReads(story) {
  const own = classMembers(story.setup);
  const expressions = templateExpressions(story.template);
  return [...classMembers(story.setupChrome)]
    .filter((name) => !own.has(name))
    .filter((name) => {
      const id = name.replace(/\$/g, '\\$');
      return (
        new RegExp(`(?<![.\\w$])${id}\\b`).test(expressions) ||
        new RegExp(`this\\.${id}\\b`).test(story.setup ?? '')
      );
    });
}

/**
 * String keys handed to `wrapDemoAction` / `failDemoActionWhen` that name no member of the story.
 * The keys cannot be typed (the members are protected), so a rename is caught here instead.
 */
function unknownDemoActionKeys(story) {
  const members = new Set([...classMembers(story.setup), ...classMembers(story.setupChrome)]);
  const calls = `${story.setup ?? ''}\n${story.setupChrome ?? ''}`;
  return [
    ...calls.matchAll(/\b(?:wrapDemoAction|failDemoActionWhen)\(\s*this\s*,\s*['"]([\w$]+)['"]/g),
  ]
    .map((m) => m[1])
    .filter((key) => !members.has(key));
}

describe('examples chrome divs', () => {
  const stories = filesUnder(STORIES, (f) => f.endsWith('.story.ts')).map((file) => {
    const route = relative(STORIES, file).replace(/\.story\.ts$/, '');
    try {
      return { route, story: parseStory(readFileSync(file, 'utf8'), route) };
    } catch (err) {
      return { route, error: err.message };
    }
  });

  it('parses every story', () => {
    expect(stories.filter((s) => s.error).map((s) => s.error)).toEqual([]);
  });

  it('no story wraps an artifact element in a chrome-class div', () => {
    const map = selectorMap();
    const hits = stories
      .filter((s) => s.story)
      .map(({ route, story }) => [route, chromeHiddenClasses(story, map)])
      .filter(([, classes]) => classes.length > 0)
      .map(([route, classes]) => `${route}: ${classes.join(', ')}`);
    expect(hits).toEqual([]);
  });

  it('no displayed setup or template reads a member declared only in setupChrome', () => {
    const hits = stories
      .filter((s) => s.story?.setupChrome)
      .map(({ route, story }) => [route, chromeOnlyReads(story)])
      .filter(([, names]) => names.length > 0)
      .map(([route, names]) => `${route}: ${names.join(', ')}`);
    expect(hits).toEqual([]);
  });

  it('every demo action key names a member of its story', () => {
    const hits = stories
      .filter((s) => s.story)
      .map(({ route, story }) => [route, unknownDemoActionKeys(story)])
      .filter(([, keys]) => keys.length > 0)
      .map(([route, keys]) => `${route}: ${keys.join(', ')}`);
    expect(hits).toEqual([]);
  });

  it('flags a demo action key whose member was renamed', () => {
    const story = {
      setup: 'protected readonly saveDraft = () => Promise.resolve();',
      setupChrome:
        "private readonly knob = wrapDemoAction(this, 'save', (o) => o);\nprivate readonly fail = failDemoActionWhen(\n  this,\n  'saveDraft',\n  () => false,\n  () => 'x',\n);",
    };
    expect(unknownDemoActionKeys(story)).toEqual(['save']);
  });

  it('flags a template binding, a setup read and a control-flow read of a chrome-only member', () => {
    const story = {
      setup: 'protected readonly run = () => (this.failNext ? 1 : 0);',
      setupChrome:
        'protected failNext = false;\nprotected readonly mode = signal(1);\nprotected readonly log = signal([]);\nprotected readonly local = 1;',
      template: '<p [attr.mode]="1" title="log">{{ local }}</p>@if (mode()) {<b>log</b>}',
    };
    expect(chromeOnlyReads(story).sort()).toEqual(['failNext', 'local', 'mode']);
  });
});
