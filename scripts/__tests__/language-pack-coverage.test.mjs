import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { renderEnglishTemplate, TEMPLATE_PATH } from '../generate-language-template.mjs';
import { COPY_TOKENS } from './reactive-i18n-coverage.fixtures.mjs';

/**
 * Language-pack completeness. Every copy token reads exactly one section of
 * the pack, every section is read by a token, and every shipped pack covers
 * every English key with the same message shape and placeholder names. The
 * English template must equal what the generator renders from `dist/`, and a
 * consumer that imports every entry compiles `withPack` with each shipped
 * pack. Needs `npm run build:libs` first.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];
const THIRD_PARTY = ['@angular', '@floating-ui', 'rxjs', 'tslib'];

/** Copy token -> the pack section it reads. Tokens without copy are not listed. */
const TOKEN_SECTIONS = {
  CNGX_STEPPER_CONFIG: 'stepper',
  CNGX_STEPPER_I18N: 'stepper',
  CNGX_TABS_CONFIG: 'tabs',
  CNGX_TABS_I18N: 'tabs',
  CNGX_CARD_I18N: 'card',
  CNGX_CHART_I18N: 'chart',
  CNGX_KPI_I18N: 'kpi',
  CNGX_RECYCLER_I18N: 'recycler',
  CNGX_DIALOG_DEFAULTS: 'dialog',
  CNGX_DISPLAY_I18N: 'display',
  CNGX_INTERACTIVE_I18N: 'interactive',
  CNGX_MENU_CONFIG: 'menu',
  CNGX_LAYOUT_I18N: 'layout',
  CNGX_POPOVER_PANEL_CONFIG: 'popover',
  CNGX_TIMELINE_CONFIG: 'timeline',
  CNGX_SELECT_CONFIG: 'select',
  CNGX_ACTION_SELECT_CONFIG: 'select',
  CNGX_REORDERABLE_SELECT_CONFIG: 'select',
  CNGX_ERROR_MESSAGES: 'formField',
  CNGX_FORM_FIELD_I18N: 'formField',
  CNGX_FORM_FIELD_CONFIG: 'formField',
  CNGX_FILTER_BUILDER_CONFIG: 'filterBuilder',
  CNGX_INPUT_CONFIG: 'input',
  CNGX_TREETABLE_CONFIG: 'treetable',
  CNGX_FEEDBACK_I18N: 'feedback',
  CNGX_DATA_GRID_ACCORDION_CONFIG: 'dataGridAccordion',
  CNGX_SIDENAV_CONFIG: 'sidenav',
  CNGX_SPEAK_I18N: 'speak',
  CNGX_COMMAND_PALETTE_CONFIG: 'commandPalette',
  CNGX_PAGINATOR_CONFIG: 'paginator',
  CNGX_ACCORDION_CONFIG: 'accordion',
  CNGX_BREADCRUMB_CONFIG: 'breadcrumb',
  CNGX_CHART_PANEL_CONFIG: 'chartPanel',
  CNGX_INCREMENTAL_LIST_CONFIG: 'collection',
  CNGX_STAT_CARD_CONFIG: 'statCard',
  CNGX_TOC_CONFIG: 'toc',
  CNGX_A11Y_PANEL_CONFIG: 'a11yPanel',
};

/** The pack itself and the locale carry no section. */
const PACK_TOKENS = new Set(['CNGX_LANGUAGE_PACK', 'CNGX_LOCALE']);

/**
 * Keys the component renders as structure (placeholders become elements), so
 * they are plain strings in every pack, never plural objects or functions.
 */
const STRUCTURAL_KEYS = ['card.timestamp', 'paginator.range'];

const SHIPPED_PACKS = [
  { path: 'projects/core/i18n/de/language-de.ts', name: 'CNGX_LANGUAGE_DE', entry: 'de' },
];

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

/** The object literal a shipped pack file exports, evaluated as data. */
function readPack(path, name) {
  const file = join(ROOT, path);
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.ES2022,
    true,
  );
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (declaration.name.getText() === name && declaration.initializer) {
        return new Function(`return (${declaration.initializer.getText()});`)();
      }
    }
  }
  throw new Error(`${path} exports no ${name}`);
}

const ENGLISH = readPack('projects/core/i18n/en/language-en.ts', 'CNGX_LANGUAGE_EN');

function isPlural(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.other === 'string' &&
    Object.keys(value).every((key) => PLURAL_CATEGORIES.has(key))
  );
}

function placeholders(message) {
  return [...new Set([...message.matchAll(/\{(\w+)\}/g)].map((match) => match[1]))].sort();
}

/**
 * Every difference between `pack` and `english`: missing or extra keys, a
 * message whose shape (string, plural, record) differs, and placeholder names
 * the English message does not use or a string form leaves out.
 */
function packDifferences(english, pack, path = '') {
  if (typeof english === 'string') {
    if (typeof pack !== 'string') {
      return [`${path}: expected a string`];
    }
    const want = placeholders(english).join(',');
    const got = placeholders(pack).join(',');
    return want === got ? [] : [`${path}: placeholders {${got}}, English {${want}}`];
  }
  if (isPlural(english)) {
    if (!isPlural(pack)) {
      return [`${path}: expected a plural object`];
    }
    const allowed = new Set(Object.values(english).flatMap(placeholders));
    const problems = Object.entries(pack)
      .filter(([, form]) => placeholders(form).some((name) => !allowed.has(name)))
      .map(([category]) => `${path}.${category}: placeholder English does not use`);
    if (placeholders(pack.other).join(',') !== placeholders(english.other).join(',')) {
      problems.push(`${path}.other: placeholders differ from English`);
    }
    return problems;
  }
  if (pack === null || typeof pack !== 'object' || isPlural(pack)) {
    return [`${path}: expected a record`];
  }
  const problems = Object.keys(pack)
    .filter((key) => !(key in english))
    .map((key) => `${path ? `${path}.` : ''}${key}: not in English`);
  for (const key of Object.keys(english)) {
    const child = path ? `${path}.${key}` : key;
    if (!(key in pack)) {
      problems.push(`${child}: missing`);
    } else {
      problems.push(...packDifferences(english[key], pack[key], child));
    }
  }
  return problems;
}

function at(pack, path) {
  return path.split('.').reduce((value, key) => value?.[key], pack);
}

/** All source files under a directory, specs left out. */
function sourcesUnder(dir) {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts'),
    )
    .map((entry) => join(entry.parentPath, entry.name));
}

const DECLARATION = (token) => new RegExp(`^export const ${token}\\b`, 'm');
const FACTORY_CALL = /create(?:Nested)?LanguageSection\(\s*'(\w+)'/g;

/** `projects/<lib>/<entry>` of the file that declares `token`. */
function entryOf(token) {
  for (const lib of LIBS) {
    const dir = join(ROOT, 'projects', lib);
    for (const file of sourcesUnder(dir)) {
      if (DECLARATION(token).test(readFileSync(file, 'utf8'))) {
        const [entry] = file.slice(dir.length + 1).split('/');
        return join(dir, entry);
      }
    }
  }
  return undefined;
}

describe('language-pack coverage', () => {
  const copyTokens = COPY_TOKENS.map((entry) => entry.token).filter(
    (token) => !PACK_TOKENS.has(token),
  );

  it('maps every copy token to exactly one section, and only copy tokens', () => {
    expect(Object.keys(TOKEN_SECTIONS).sort()).toEqual([...copyTokens].sort());
  });

  it('maps tokens only to sections of the English template', () => {
    const unknown = Object.entries(TOKEN_SECTIONS).filter(([, area]) => !(area in ENGLISH));
    expect(unknown).toEqual([]);
  });

  it('reads every section of the English template from some token', () => {
    const read = new Set(Object.values(TOKEN_SECTIONS));
    const unread = Object.keys(ENGLISH).filter((area) => area !== 'locale' && !read.has(area));
    expect(unread).toEqual([]);
  });

  it("builds each token's section with the language-section factory in the token's entry", () => {
    const mismatches = [];
    for (const [token, area] of Object.entries(TOKEN_SECTIONS)) {
      const entry = entryOf(token);
      if (!entry) {
        mismatches.push(`${token}: declaration not found`);
        continue;
      }
      const areas = new Set(
        sourcesUnder(entry).flatMap((file) =>
          [...readFileSync(file, 'utf8').matchAll(FACTORY_CALL)].map((match) => match[1]),
        ),
      );
      if (!areas.has(area)) {
        mismatches.push(`${token}: ${entry.slice(ROOT.length + 1)} builds no '${area}' section`);
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('keeps the structural keys plain strings in English', () => {
    for (const path of STRUCTURAL_KEYS) {
      expect(typeof at(ENGLISH, path), path).toBe('string');
    }
  });

  for (const shipped of SHIPPED_PACKS) {
    describe(shipped.name, () => {
      const pack = readPack(shipped.path, shipped.name);

      it('covers every English key with the same shape and placeholder names', () => {
        const { locale: _locale, ...english } = ENGLISH;
        const { locale, ...sections } = pack;
        expect(typeof locale).toBe('string');
        expect(packDifferences(english, sections)).toEqual([]);
      });

      it('keeps the structural keys plain strings', () => {
        for (const path of STRUCTURAL_KEYS) {
          expect(typeof at(pack, path), path).toBe('string');
        }
      });
    });
  }

  describe('the shape check', () => {
    it('reports a missing key, a renamed placeholder and a lost plural', () => {
      const english = {
        a: {
          title: 'Title',
          count: '{count} rows',
          items: { one: '{count} item', other: '{count} items' },
        },
      };
      const pack = { a: { count: '{n} Zeilen', items: '{count} Einträge' } };
      expect(packDifferences(english, pack)).toEqual([
        'a.title: missing',
        'a.count: placeholders {n}, English {count}',
        'a.items: expected a plural object',
      ]);
    });

    it('accepts a plural form that drops the count when English does too', () => {
      const english = { a: { one: 'one threshold', other: '{count} thresholds' } };
      const pack = { a: { one: 'ein Schwellenwert', other: '{count} Schwellenwerte' } };
      expect(packDifferences(english, pack)).toEqual([]);
    });
  });
});

describe('the English template', () => {
  it('equals the template generated from dist/', async () => {
    const rendered = await renderEnglishTemplate();
    expect(
      readFileSync(TEMPLATE_PATH, 'utf8') === rendered,
      'run `node scripts/generate-language-template.mjs`',
    ).toBe(true);
  });
});

describe('shipped packs against an app that imports every entry', () => {
  let workDir;
  let entries;

  const COMPILER_OPTIONS = {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: [],
  };

  function compile(source) {
    const file = join(workDir, `consumer-${Math.random().toString(36).slice(2)}.ts`);
    writeFileSync(file, source);
    const program = ts.createProgram([file], COMPILER_OPTIONS);
    return ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
  }

  /** Every `@cngx/*` entry whose types add a section to the pack. */
  function sectionEntries() {
    const found = [];
    for (const lib of LIBS) {
      const manifest = join(DIST, lib, 'package.json');
      if (!existsSync(manifest)) {
        continue;
      }
      for (const [key, target] of Object.entries(
        JSON.parse(readFileSync(manifest, 'utf8')).exports,
      )) {
        const types = typeof target === 'object' ? target.types : undefined;
        if (
          !types ||
          !readFileSync(join(DIST, lib, types), 'utf8').includes('interface CngxLanguagePack {')
        ) {
          continue;
        }
        if (lib !== 'core') {
          found.push(`@cngx/${lib}${key.slice(1)}`);
        }
      }
    }
    return found;
  }

  beforeAll(() => {
    const missing = ['core', 'common', 'forms', 'data-display', 'ui'].filter(
      (lib) => !existsSync(join(DIST, lib, 'package.json')),
    );
    if (missing.length > 0) {
      throw new Error(`dist/ lacks ${missing.join(', ')} - run \`npm run build:libs\` first`);
    }
    workDir = mkdtempSync(join(tmpdir(), 'cngx-language-pack-coverage-'));
    const modules = join(workDir, 'node_modules');
    mkdirSync(join(modules, '@cngx'), { recursive: true });
    for (const lib of LIBS) {
      if (existsSync(join(DIST, lib, 'package.json'))) {
        cpSync(join(DIST, lib), join(modules, '@cngx', lib), { recursive: true });
      }
    }
    for (const pkg of THIRD_PARTY) {
      if (existsSync(join(ROOT, 'node_modules', pkg))) {
        symlinkSync(join(ROOT, 'node_modules', pkg), join(modules, pkg), 'dir');
      }
    }
    entries = sectionEntries();
  });

  afterAll(() => {
    if (workDir) {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  const consumer = (body) =>
    `${entries.map((entry) => `import type {} from '${entry}';`).join('\n')}
    import { provideCngxI18n, withPack } from '@cngx/core/i18n';
    import { CNGX_LANGUAGE_EN } from '@cngx/core/i18n/en';
    ${SHIPPED_PACKS.map((p) => `import { ${p.name} } from '@cngx/core/i18n/${p.entry}';`).join('\n')}
    ${body}`;

  it('finds a section entry for every section of the English template', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('compiles withPack with the English template and every shipped pack', () => {
    const packs = ['CNGX_LANGUAGE_EN', ...SHIPPED_PACKS.map((p) => p.name)];
    const diagnostics = compile(
      consumer(packs.map((name) => `provideCngxI18n(withPack(${name}));`).join('\n')),
    );
    expect(diagnostics).toEqual([]);
  });

  it('rejects a shipped pack with a section left out', () => {
    const [shipped] = SHIPPED_PACKS;
    const diagnostics = compile(
      consumer(`const { card: _card, ...rest } = ${shipped.name};
      provideCngxI18n(withPack(rest));`),
    );
    expect(diagnostics.some((message) => message.includes("'card'"))).toBe(true);
  });
});
