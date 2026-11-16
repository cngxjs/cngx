/**
 * Keeps the layout and navigation stories on the library skin.
 *
 * Scope: `examples/stories/ui/{sidenav,nav-rail}/`,
 * `examples/stories/common/layout/` and
 * `examples/stories/common/interactive/nav/`. Only the story `template` is
 * read; `templateChrome` and `templateChromeBefore` are demo controls and
 * exempt.
 *
 * R1  An element whose skin the library ships (a `cngx-*` element, a nav
 *     atom, an element carrying a library skin class such as `.cngx-sidebar`
 *     or `.cngx-drawer`) carries only classes `projects/**` defines. A rule
 *     in `examples/src/styles.scss` that names a class of a scoped story and
 *     whose subject (the last compound of the selector) is such an element
 *     only SETs `--cngx-*` tokens.
 * R2  Every `demo-*` class in a template appears in the story's `css` field,
 *     so the code panel shows what the consumer has to write. Shared chrome
 *     classes of the examples app (`chip`, `sort-btn`, ...) are not story
 *     classes here.
 * R3  Under `common/layout/{sidebar,drawer}/`, `ui/{sidenav,nav-rail}/` and
 *     `common/interactive/nav/` a template carries no class `projects/**`
 *     does not define, shared chrome classes included. Exempt:
 *     STORY_CLASS_EXEMPT.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const SCOPE = [
  'examples/stories/ui/sidenav',
  'examples/stories/ui/nav-rail',
  'examples/stories/common/layout',
  'examples/stories/common/interactive/nav',
];

const R3_SCOPE = [
  'examples/stories/common/layout/sidebar/',
  'examples/stories/common/layout/drawer/',
  'examples/stories/ui/sidenav/',
  'examples/stories/ui/nav-rail/',
  'examples/stories/common/interactive/nav/',
];

const STORY_CLASS_EXEMPT = [
  {
    file: 'examples/stories/common/layout/drawer/standalone-surface.story.ts',
    reason:
      '[cngxDrawerSurface] is behaviour only and has no skin; the story builds and positions its own surface (R2 applies)',
  },
];

const NAV_ATOM_ATTRIBUTES = [
  'cngxnavlink',
  'cngxnavgroup',
  'cngxnavgroupcontent',
  'cngxnavlabel',
  'cngxnavbadge',
  'cngxnavicon',
  'cngxnavmark',
  'cngxnavname',
  'cngxnavheader',
  'cngxnavfooter',
];

function walk(dir, test) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      return walk(path, test);
    }
    return test(path) ? [path] : [];
  });
}

const rel = (path) => relative(ROOT, path).split('\\').join('/');

const withoutComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** The raw text of a template-literal field (`  <name>: \`...\``) of a story, or ''. */
export function storyField(source, name) {
  const start = source.indexOf(`\n  ${name}: \``);
  if (start < 0) {
    return '';
  }
  let i = source.indexOf('`', start) + 1;
  let out = '';
  while (i < source.length && source[i] !== '`') {
    if (source[i] === '\\') {
      out += source[i + 1];
      i += 2;
      continue;
    }
    out += source[i];
    i += 1;
  }
  return out;
}

/** Start tags of a template: `{ tag, attrs: lower-cased attribute names, classes }`. */
export function templateElements(template) {
  const elements = [];
  for (const match of template.matchAll(/<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g)) {
    const attrText = match[2];
    const attrs = [...attrText.matchAll(/(?:^|\s)([[(]*[\w.@*#-]+[\])]*)(?=[\s=/]|$)/g)].map((m) =>
      m[1].toLowerCase(),
    );
    const classes = [];
    for (const m of attrText.matchAll(/(?:^|\s)class="([^"]*)"/g)) {
      classes.push(...m[1].split(/\s+/).filter(Boolean));
    }
    for (const m of attrText.matchAll(/\[class\.([\w-]+)\]/g)) {
      classes.push(m[1]);
    }
    elements.push({ tag: match[1].toLowerCase(), attrs, classes });
  }
  return elements;
}

/** Every `cngx-*` class literal the library source mentions. */
export function libraryClasses(files) {
  const set = new Set();
  for (const { source } of files) {
    for (const m of source.matchAll(/\bcngx-[a-z0-9][\w-]*/g)) {
      set.add(m[0]);
    }
  }
  return set;
}

/** Classes a library stylesheet selects (`.cngx-x` in a selector or an `@scope` prelude). */
export function librarySkinClasses(cssFiles) {
  const set = new Set();
  for (const { source } of cssFiles) {
    for (const m of withoutComments(source).matchAll(/\.(cngx-[a-z0-9][\w-]*)/g)) {
      set.add(m[1]);
    }
  }
  return set;
}

export function isSkinned(element, skinClasses) {
  if (element.tag.startsWith('cngx-')) {
    return true;
  }
  if (element.attrs.some((attr) => NAV_ATOM_ATTRIBUTES.includes(attr.replace(/[[\]()]/g, '')))) {
    return true;
  }
  return element.classes.some((cls) => skinClasses.has(cls));
}

/** R1 (template half) and R3 problems of one story. */
export function scanStoryTemplate(file, template, { known, skin, strict }) {
  const problems = [];
  for (const element of templateElements(template)) {
    for (const cls of element.classes) {
      if (known.has(cls)) {
        continue;
      }
      if (strict) {
        problems.push(`${file}: R3 class "${cls}" on <${element.tag}>`);
        continue;
      }
      if (isSkinned(element, skin)) {
        problems.push(`${file}: R1 story class "${cls}" on the library-skinned <${element.tag}>`);
      }
    }
  }
  return problems;
}

/** R2 problems: `demo-*` template classes missing from the story's css field. */
export function scanStoryCss(file, template, css) {
  const classes = new Set(templateElements(template).flatMap((element) => element.classes));
  return [...classes]
    .filter((cls) => cls.startsWith('demo-'))
    .filter((cls) => !new RegExp(`\\.${cls}(?![\\w-])`).test(css))
    .map((cls) => `${file}: R2 class "${cls}" is not in the story css field`);
}

/** Top-level and `@media`-nested rules of a stylesheet: `{ selector, body }`. */
export function cssRules(source) {
  const src = withoutComments(source);
  const rules = [];
  const visit = (text) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) {
        return;
      }
      const prelude = text.slice(i, open).split(';').pop().trim();
      let depth = 0;
      let close = open;
      for (; close < text.length; close += 1) {
        if (text[close] === '{') {
          depth += 1;
        } else if (text[close] === '}') {
          depth -= 1;
          if (depth === 0) {
            break;
          }
        }
      }
      const body = text.slice(open + 1, close);
      if (/^@(media|supports|layer|container)/.test(prelude)) {
        visit(body);
      } else if (!prelude.startsWith('@')) {
        rules.push({ selector: prelude, body });
      }
      i = close + 1;
    }
  };
  visit(src);
  return rules;
}

/** The last compound selector of a complex selector. */
export function subjectCompound(selector) {
  const flat = selector.replace(/\([^()]*(\([^()]*\))*[^()]*\)/g, '()');
  return (
    flat
      .trim()
      .split(/\s*[\s>+~]\s*/)
      .pop() ?? ''
  );
}

export function reachesSkinned(compound, skin) {
  if (/(^|[^\w-])cngx-[\w-]+/.test(compound.replace(/\.[\w-]+|\[[^\]]*\]/g, ''))) {
    return true;
  }
  return [...compound.matchAll(/\.(cngx-[\w-]+)/g)].some((m) => skin.has(m[1]));
}

/** R1 (stylesheet half): rules naming a story class whose subject is library-skinned. */
export function scanStyles(source, storyClasses, skin) {
  const problems = [];
  for (const { selector, body } of cssRules(source)) {
    for (const part of selector.split(',')) {
      const mentionsStory = [...storyClasses].some((cls) =>
        new RegExp(`\\.${cls}(?![\\w-])`).test(part),
      );
      if (!mentionsStory || !reachesSkinned(subjectCompound(part), skin)) {
        continue;
      }
      const declarations = body
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean);
      if (declarations.some((d) => !d.startsWith('--cngx-'))) {
        problems.push(`styles.scss: R1 "${part.trim()}" styles a library-skinned element`);
      }
    }
  }
  return problems;
}

function libraryFiles() {
  const isSource = (path) =>
    /\.(ts|css|scss|html)$/.test(path) &&
    !/\.spec\.ts$/.test(path) &&
    !path.includes('node_modules');
  return walk(join(ROOT, 'projects'), isSource).map((path) => ({
    path: rel(path),
    source: readFileSync(path, 'utf8'),
  }));
}

describe('layout story classes', () => {
  const library = libraryFiles();
  const known = libraryClasses(library);
  const skin = librarySkinClasses(library.filter(({ path }) => /\.(css|scss)$/.test(path)));
  const stories = SCOPE.flatMap((dir) =>
    walk(join(ROOT, dir), (path) => path.endsWith('.story.ts')),
  ).map((path) => {
    const source = readFileSync(path, 'utf8');
    return {
      file: rel(path),
      template: storyField(source, 'template'),
      css: storyField(source, 'css'),
    };
  });
  const exempt = new Set(STORY_CLASS_EXEMPT.map((row) => row.file));

  it('scans the scoped stories', () => {
    expect(stories.length).toBeGreaterThan(40);
    expect(known.has('cngx-sidebar')).toBe(true);
    expect(skin.has('cngx-drawer')).toBe(true);
  });

  it('R1 / R3: templates carry no story class where the library skins or owns the story', () => {
    const problems = stories.flatMap(({ file, template }) => {
      const strict = R3_SCOPE.some((dir) => file.startsWith(dir)) && !exempt.has(file);
      return scanStoryTemplate(file, template, { known, skin, strict });
    });
    expect(problems).toEqual([]);
  });

  it('R2: every demo-* class of a template is shown in the story css field', () => {
    const problems = stories.flatMap(({ file, template, css }) =>
      scanStoryCss(file, template, css),
    );
    expect(problems).toEqual([]);
  });

  it('R1: no examples rule styles a library-skinned element of a scoped story beyond tokens', () => {
    const storyClasses = new Set(
      stories.flatMap(({ template }) =>
        templateElements(template)
          .flatMap((element) => element.classes)
          .filter((cls) => !known.has(cls)),
      ),
    );
    const styles = readFileSync(join(ROOT, 'examples/src/styles.scss'), 'utf8');
    expect(scanStyles(styles, storyClasses, skin)).toEqual([]);
  });

  it.each(STORY_CLASS_EXEMPT)('$file is a scoped story with a reason', ({ file, reason }) => {
    expect(reason.length).toBeGreaterThan(0);
    expect(stories.some((story) => story.file === file)).toBe(true);
  });
});

describe('layout story class scanners', () => {
  const skin = new Set(['cngx-sidebar']);
  const known = new Set(['cngx-sidebar', 'cngx-backdrop']);

  it('flags a story class on a library-skinned element', () => {
    const template =
      '<aside cngxSidebar class="cngx-sidebar demo-x"></aside><div class="demo-y"></div>';
    expect(scanStoryTemplate('s', template, { known, skin, strict: false })).toEqual([
      's: R1 story class "demo-x" on the library-skinned <aside>',
    ]);
  });

  it('flags a story class on a nav atom and on a cngx element', () => {
    const template = '<a cngxNavLink class="row"></a><cngx-stack class="frame"></cngx-stack>';
    expect(scanStoryTemplate('s', template, { known, skin, strict: false })).toHaveLength(2);
  });

  it('flags every unknown class under R3', () => {
    const template =
      '<div class="chip"></div><div [class.demo-on]="x"></div><div class="cngx-backdrop"></div>';
    expect(scanStoryTemplate('s', template, { known, skin, strict: true })).toEqual([
      's: R3 class "chip" on <div>',
      's: R3 class "demo-on" on <div>',
    ]);
  });

  it('asks for demo-* classes in the css field', () => {
    expect(scanStoryCss('s', '<div class="demo-a chip"></div>', '.demo-a { color: red; }')).toEqual(
      [],
    );
    expect(
      scanStoryCss('s', '<div class="demo-a"></div>', '.demo-ab { color: red; }'),
    ).toHaveLength(1);
  });

  it('lets a story rule set tokens on a skinned element and style its own children', () => {
    const styles = [
      '.demo-a.cngx-sidebar { --cngx-sidebar-bg: red; }',
      '.cngx-sidebar .demo-a { color: red; }',
      '.demo-a cngx-avatar { color: red; }',
      '@media (forced-colors: active) { .demo-a.cngx-sidebar { border: 0; } }',
    ].join('\n');
    expect(scanStyles(styles, new Set(['demo-a']), skin)).toEqual([
      'styles.scss: R1 ".demo-a cngx-avatar" styles a library-skinned element',
      'styles.scss: R1 ".demo-a.cngx-sidebar" styles a library-skinned element',
    ]);
  });

  it('reads an escaped template-literal field', () => {
    const source = "export const STORY = {\n  css: `.a::after { content: '\\`'; }`,\n};";
    expect(storyField(source, 'css')).toBe(".a::after { content: '`'; }");
  });
});
