#!/usr/bin/env node
// Usage:
//   npm run schematics:scaffold   # rewrite the generated module
//
// Renders the `ng new` application templates of the installed
// @schematics/angular for every supported variant and writes their bodies
// into the catalog ng add compares an app against. A file counts as the
// untouched scaffold only on an exact match with an entry, never on a
// heuristic, so the templates are the single source and
// `scripts/__tests__/scaffold-catalog.test.mjs` fails when a new
// @schematics/angular release changes one until the catalog is regenerated
// and reviewed.
//
// Each body is stored raw and, where it differs, formatted with the
// `.prettierrc` `ng new` writes: the Angular CLI runs the app's Prettier over
// every file a schematic edits, so both forms are what an app can hold. The
// project name, its class-cased form and the root selector are placeholders;
// detection substitutes them before comparing.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const OUT = 'projects/core/schematics/ng-add/detect/scaffold-catalog.generated.ts';

/** Stands in for the project name in every body; never a valid project name itself. */
export const NAME_PLACEHOLDER = '__cngx_scaffold_name__';

/**
 * Stands in for the root selector (`<prefix>-root`). A custom element name,
 * so Prettier's HTML parser reads `<cngx-scaffold-selector>` in `index.html`
 * as the element it stands for, not as text.
 */
export const SELECTOR_PLACEHOLDER = 'cngx-scaffold-selector';

/** Stands in for the class-cased project name, the `<title>` of `index.html`. */
export const TITLE_PLACEHOLDER = '__cngx_scaffold_title__';

const PRETTIERRC = 'workspace/files/.prettierrc.template';

// Template path inside @schematics/angular, the variant it is rendered for,
// and the options that variant passes. `zoneless` is the `ng new` default;
// the component files are the `ng new` standalone defaults (`templateUrl`,
// `styleUrl`, no `displayBlock`), with routing on or off and a CSS or SCSS
// stylesheet. Inline templates, inline styles, Sass and Less have no entry,
// so such an app is never the untouched scaffold.
const COMPONENT = { inlineTemplate: false, inlineStyle: false, displayBlock: false };
const STYLES = ['css', 'scss'];
const ROUTING = [
  { routing: true, name: 'routing' },
  { routing: false, name: 'no-routing' },
];

export const TEMPLATES = [
  {
    file: 'app.spec.ts',
    template: 'application/files/standalone-files/src/app/app__suffix__.spec.ts.template',
    variants: [
      { variant: 'zoneless', options: { zoneless: true } },
      { variant: 'zone', options: { zoneless: false } },
    ],
  },
  {
    file: 'app.ts',
    template: 'application/files/standalone-files/src/app/app__suffix__.ts.template',
    variants: ROUTING.flatMap(({ routing, name }) =>
      STYLES.map((style) => ({ variant: `${name}-${style}`, options: { ...COMPONENT, routing, style } })),
    ),
  },
  {
    file: 'app.html',
    template: 'application/files/common-files/src/app/app__suffix__.html.template',
    variants: ROUTING.map(({ routing, name }) => ({ variant: name, options: { ...COMPONENT, routing } })),
  },
  ...STYLES.map((style) => ({
    file: `app.${style}`,
    template: 'component/files/__name@dasherize@if-flat__/__name@dasherize__.__type@dasherize__.__style__.template',
    variants: [{ variant: style, options: { ...COMPONENT, style } }],
  })),
  {
    file: 'index.html',
    dir: 'src',
    template: 'application/files/common-files/src/index.html.template',
    variants: [{ variant: 'default', options: {} }],
  },
];

function schematicsRoot() {
  return dirname(require.resolve('@schematics/angular/package.json'));
}

/** The installed @schematics/angular version, read from its own package.json. */
export function schematicsVersion(root = schematicsRoot()) {
  return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function fingerprint(body) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

// The renderer @schematics/angular applies its own templates with. `utils`
// stands in for `strings` of @angular-devkit/core: `classify` turns the name
// into the title placeholder, so detection substitutes the classified name.
function render(text, options) {
  const { template } = require('@angular-devkit/core');
  const utils = { classify: (name) => (name === NAME_PLACEHOLDER ? TITLE_PLACEHOLDER : name) };
  return template(text, {})({ suffix: '', name: NAME_PLACEHOLDER, selector: SELECTOR_PLACEHOLDER, utils, ...options });
}

async function format(body, path, prettierrc) {
  const prettier = await import('prettier');
  return prettier.format(body, { ...prettierrc, filepath: path });
}

/**
 * Every catalog entry for the installed templates: one per file and
 * variant, raw first; the formatted body is a second entry only when
 * Prettier changes the raw one.
 */
export async function collectEntries(root = schematicsRoot()) {
  const major = Number(schematicsVersion(root).split('.')[0]);
  const prettierrc = JSON.parse(readFileSync(resolve(root, PRETTIERRC), 'utf8'));
  const entries = [];
  for (const { file, dir = 'src/app', template, variants } of TEMPLATES) {
    const text = readFileSync(resolve(root, template), 'utf8');
    for (const { variant, options } of variants) {
      const raw = normalize(render(text, options));
      const formatted = normalize(await format(raw, posix.join(dir, file), prettierrc));
      const bodies = formatted === raw ? [['raw', raw]] : [['raw', raw], ['prettier', formatted]];
      for (const [form, body] of bodies) {
        entries.push({ major, file, variant, form, template, body, fingerprint: fingerprint(body) });
      }
    }
  }
  return entries;
}

const quote = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function entry({ major, file, variant, form, template, body, fingerprint: print }) {
  return [
    '  {',
    `    major: ${major},`,
    `    file: ${quote(file)},`,
    `    variant: ${quote(variant)},`,
    `    form: ${quote(form)},`,
    `    template: ${quote(template)},`,
    `    fingerprint: ${quote(print)},`,
    `    body: ${JSON.stringify(body)},`,
    '  },',
  ].join('\n');
}

/** The generated module for the installed templates. */
export async function renderCatalogModule(root = schematicsRoot()) {
  const entries = await collectEntries(root);
  return [
    `// Generated by scripts/generate-scaffold-catalog.mjs from @schematics/angular ${schematicsVersion(root)}.`,
    '// Do not edit; run `npm run schematics:scaffold`.',
    '',
    '/** Stands in for the project name in every body; detection substitutes it before comparing. */',
    `export const SCAFFOLD_NAME_PLACEHOLDER = ${quote(NAME_PLACEHOLDER)};`,
    '',
    '/** Stands in for the root selector (`<prefix>-root`) in every body. */',
    `export const SCAFFOLD_SELECTOR_PLACEHOLDER = ${quote(SELECTOR_PLACEHOLDER)};`,
    '',
    '/** Stands in for the class-cased project name, the `<title>` of `index.html`. */',
    `export const SCAFFOLD_TITLE_PLACEHOLDER = ${quote(TITLE_PLACEHOLDER)};`,
    '',
    '/** One `ng new` file as @schematics/angular renders it for one variant. */',
    'export interface ScaffoldEntry {',
    '  /** The Angular CLI major the templates belong to. */',
    '  readonly major: number;',
    '  /** The file name in `src/app`; `index.html` is the one in `src`. */',
    '  readonly file: string;',
    '  readonly variant: string;',
    '  /** `raw` as rendered, `prettier` as formatted with the `ng new` `.prettierrc`. */',
    "  readonly form: 'raw' | 'prettier';",
    '  /** The template path inside @schematics/angular. */',
    '  readonly template: string;',
    '  readonly fingerprint: string;',
    '  /** The body with LF line endings and the project name, title and selector as placeholders. */',
    '  readonly body: string;',
    '}',
    '',
    'export const SCAFFOLD_CATALOG: readonly ScaffoldEntry[] = [',
    ...entries.map(entry),
    '];',
    '',
  ].join('\n');
}

async function main() {
  const module = await renderCatalogModule();
  writeFileSync(resolve(ROOT, OUT), module);
  const count = (await collectEntries()).length;
  process.stdout.write(`${OUT}: ${count} entries\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
