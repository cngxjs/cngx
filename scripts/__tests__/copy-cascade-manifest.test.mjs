import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import {
  collectCascades,
  collectRepoCascades,
  MANIFEST_PATH,
  renderManifest,
  SCHEMA_VERSION,
} from '../copy-cascade-manifest.mjs';
import { buildCopyModel, createProgram, discoverTokens } from './_copy-program.mjs';
import { REPO_ROOT } from './_i18n-ast.mjs';
import { RULE_FIXTURES } from './reactive-i18n-coverage.fixtures.mjs';

// The manifest is the static join an inspector needs to say "input X
// overrides key Y of token Z". It must cover every cascade, classify copy
// exactly as the reactive-i18n guard does (same program, same fixtures
// configuration), and never drift from source.

/**
 * Exact number of input-over-bundle cascades in `projects/**`. A ratchet in
 * both directions: a new cascade updates this number in the same PR, so every
 * new copy seam is a visible, reviewed change.
 */
const CASCADE_COUNT = 67;

// One site per inventory shape:
//   A      input over a bundle key
//   A-lit  input over a bundle key over a literal
//   B1     input over a bundle function key called with params
//   B2     input over a whole-signal bundle
//   C      a cascade in a method
//   D      cascades nested in a larger computed, one arm untracked
//   E      a multi-tier chain in a pure factory, inputs passed as signals
const CASCADES = `
import { Directive, computed, effect, inject, input, untracked, type Signal } from '@angular/core';
import { coerceSignal } from './helpers';
import { DEMO_CONFIG, DEMO_SIGNAL_I18N, type DemoLabels, type DemoSignalI18n } from './tokens';

@Directive({ selector: '[cascades]' })
export class Cascades {
  private readonly i18n = inject(DEMO_SIGNAL_I18N);
  private readonly config = inject(DEMO_CONFIG);
  private readonly ariaLabels = coerceSignal(this.config.ariaLabels);
  private readonly setting = computed(() => (this.busy() ? 'busy' : undefined));

  readonly previousLabel = input<string | undefined>(undefined);
  readonly clearLabel = input<string | undefined>(undefined);
  readonly countLabel = input<string | undefined>(undefined);
  readonly labels = input<DemoSignalI18n | undefined>(undefined);
  readonly moreLabel = input<string | undefined>(undefined);
  readonly busy = input(false);

  protected readonly shapeA = computed(() => this.previousLabel() ?? this.i18n().previous);

  protected readonly shapeALit = computed(
    () => this.clearLabel() ?? this.ariaLabels().clear ?? 'Clear',
  );

  protected readonly shapeB1 = computed(() => this.countLabel() ?? this.i18n().count(3));

  protected readonly shapeB2 = computed(() => this.labels() ?? this.i18n());

  shapeC(): string {
    return this.moreLabel() ?? this.ariaLabels().more;
  }

  protected readonly shapeD = computed(() =>
    this.busy()
      ? (this.previousLabel() ?? this.i18n().previous)
      : untracked(() => this.clearLabel() ?? this.ariaLabels().clear),
  );

  protected readonly notCopy = computed(() => this.previousLabel() ?? this.setting());

  protected readonly unresolvable = computed(
    () => this.previousLabel() ?? this.setting() ?? this.i18n().previous,
  );

  constructor() {
    effect(() => {
      console.log(this.moreLabel() ?? untracked(() => this.ariaLabels().more));
    });
  }
}

export function createShapeE(options: {
  readonly label: Signal<string | undefined>;
  readonly i18n: Signal<DemoSignalI18n>;
  readonly fallback: Signal<DemoLabels>;
}) {
  const { label, i18n } = options;
  const resolved = computed(() => label() ?? options.fallback().clear ?? i18n().previous ?? null);
  return { resolved, text: (): string => label() ?? i18n().previous };
}
`;

const FIXTURE_ROOT = resolve(REPO_ROOT, 'scripts/__tests__/__copy-cascade-fixtures__');
const FIXTURE_VIRTUAL = {
  [resolve(FIXTURE_ROOT, 'tokens.ts')]: RULE_FIXTURES.sources['tokens.ts'],
  [resolve(FIXTURE_ROOT, 'helpers.ts')]: RULE_FIXTURES.sources['helpers.ts'],
  [resolve(FIXTURE_ROOT, 'cascades.ts')]: CASCADES,
};
const FIXTURE_PROGRAM = createProgram(Object.keys(FIXTURE_VIRTUAL), FIXTURE_VIRTUAL);
const FIXTURE_FILES = Object.keys(FIXTURE_VIRTUAL).map((path) =>
  FIXTURE_PROGRAM.getSourceFile(path),
);
const FIXTURE_MODEL = buildCopyModel(
  FIXTURE_PROGRAM,
  discoverTokens(FIXTURE_FILES),
  RULE_FIXTURES.copyTokens,
  RULE_FIXTURES.helpers,
  RULE_FIXTURES.localeReaders,
);
const FIXTURE_ENTRIES = collectCascades(FIXTURE_MODEL, FIXTURE_FILES, FIXTURE_ROOT);

/** @param {string} member */
const fixture = (member) => {
  const found = FIXTURE_ENTRIES.filter((e) => e.member === member);
  return found.map(({ file, line, ...rest }) => rest);
};

const input = (field) => ({ kind: 'input', field });
const bundle = (field, path, token) => ({ kind: 'bundle', field, path, token });

const MANIFEST = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
const SCHEMA = JSON.parse(
  readFileSync(resolve(REPO_ROOT, 'scripts/manifests/copy-cascades.schema.json'), 'utf-8'),
);

/**
 * The entry keys, `enclosing` values and tier kind/fields the schema admits.
 */
const schemaShape = () => {
  const entry = SCHEMA.$defs.entry;
  const tiers = new Map();
  for (const variant of SCHEMA.$defs.tier.oneOf) {
    const kind = variant.properties.kind;
    const fields = Object.keys(variant.properties).sort();
    for (const k of kind.enum ?? [kind.const]) {
      tiers.set(k, fields);
    }
  }
  return {
    entryKeys: new Set(Object.keys(entry.properties)),
    enclosing: entry.properties.enclosing.enum,
    tiers,
  };
};

/** Every schema violation in `entries`, as readable rows. */
const schemaViolations = (entries) => {
  const shape = schemaShape();
  const out = [];
  for (const entry of entries) {
    const where = `${entry.file}:${entry.line}`;
    for (const key of Object.keys(entry)) {
      if (!shape.entryKeys.has(key)) {
        out.push(`${where} key ${key}`);
      }
    }
    if (!shape.enclosing.includes(entry.enclosing)) {
      out.push(`${where} enclosing ${entry.enclosing}`);
    }
    for (const tier of entry.tiers ?? []) {
      const fields = shape.tiers.get(tier.kind);
      if (!fields) {
        out.push(`${where} tier kind ${tier.kind}`);
      } else if (Object.keys(tier).sort().join() !== fields.join()) {
        out.push(`${where} ${tier.kind} fields ${Object.keys(tier).sort().join()}`);
      }
    }
  }
  return out;
};

describe('copy-cascade manifest generator', () => {
  it('type-checks the fixture', () => {
    const diagnostics = ts
      .getPreEmitDiagnostics(FIXTURE_PROGRAM)
      .filter((d) => d.file && d.file.fileName.startsWith(FIXTURE_ROOT))
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    expect(diagnostics).toEqual([]);
  });

  it('A: input over a bundle key', () => {
    expect(fixture('shapeA')).toEqual([
      {
        class: 'Cascades',
        member: 'shapeA',
        enclosing: 'computed',
        tiers: [input('previousLabel'), bundle('i18n', ['previous'], 'DEMO_SIGNAL_I18N')],
      },
    ]);
  });

  it('A-lit: input over a bundle key over a literal', () => {
    expect(fixture('shapeALit')[0].tiers).toEqual([
      input('clearLabel'),
      bundle('ariaLabels', ['clear'], 'DEMO_CONFIG'),
      { kind: 'literal', value: 'Clear' },
    ]);
  });

  it('B1: input over a bundle function key', () => {
    expect(fixture('shapeB1')[0].tiers).toEqual([
      input('countLabel'),
      { kind: 'bundle-fn', field: 'i18n', path: ['count'], token: 'DEMO_SIGNAL_I18N' },
    ]);
  });

  it('B2: input over a whole-signal bundle', () => {
    expect(fixture('shapeB2')[0].tiers).toEqual([
      input('labels'),
      { kind: 'bundle-signal', field: 'i18n', path: [], token: 'DEMO_SIGNAL_I18N' },
    ]);
  });

  it('C: a cascade in a method', () => {
    expect(fixture('shapeC')).toEqual([
      {
        class: 'Cascades',
        member: 'shapeC',
        enclosing: 'method',
        tiers: [input('moreLabel'), bundle('ariaLabels', ['more'], 'DEMO_CONFIG')],
      },
    ]);
  });

  it('D: each cascade nested in a larger computed is its own entry', () => {
    expect(fixture('shapeD')).toEqual([
      {
        class: 'Cascades',
        member: 'shapeD',
        enclosing: 'computed',
        tiers: [input('previousLabel'), bundle('i18n', ['previous'], 'DEMO_SIGNAL_I18N')],
      },
      {
        class: 'Cascades',
        member: 'shapeD',
        enclosing: 'untracked',
        tiers: [input('clearLabel'), bundle('ariaLabels', ['clear'], 'DEMO_CONFIG')],
      },
    ]);
  });

  it('E: a multi-tier chain in a pure factory, inputs passed as signals', () => {
    expect(fixture('createShapeE.resolved')).toEqual([
      {
        class: null,
        member: 'createShapeE.resolved',
        enclosing: 'computed',
        tiers: [
          input('label'),
          bundle('options', ['fallback', 'clear'], 'DEMO_CONFIG'),
          bundle('i18n', ['previous'], 'DEMO_SIGNAL_I18N'),
          { kind: 'literal', value: null },
        ],
      },
    ]);
    expect(fixture('createShapeE.text')[0].enclosing).toBe('function');
  });

  it('reads an untracked tier through its body, in an effect', () => {
    expect(fixture('constructor')).toEqual([
      {
        class: 'Cascades',
        member: 'constructor',
        enclosing: 'effect',
        tiers: [input('moreLabel'), bundle('ariaLabels', ['more'], 'DEMO_CONFIG')],
      },
    ]);
  });

  it('skips a chain with no copy tier', () => {
    expect(fixture('notCopy')).toEqual([]);
  });

  it('emits a chain it cannot classify as unresolved instead of dropping it', () => {
    expect(fixture('unresolvable')).toEqual([
      {
        class: 'Cascades',
        member: 'unresolvable',
        enclosing: 'computed',
        unresolved: 'operand `this.setting()` is neither input nor copy',
      },
    ]);
  });

  it('sorts entries by file and line', () => {
    const lines = FIXTURE_ENTRIES.map((e) => e.line);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
  });
});

describe('copy-cascade manifest', () => {
  const entries = collectRepoCascades();

  it('matches the source (run `npm run manifest:copy` after changing a cascade)', async () => {
    const rendered = await renderManifest(entries);
    expect(
      rendered === readFileSync(MANIFEST_PATH, 'utf-8'),
      'scripts/manifests/copy-cascades.json is stale. Run `npm run manifest:copy`.',
    ).toBe(true);
  });

  it('resolves every cascade', () => {
    expect(entries.filter((e) => e.unresolved)).toEqual([]);
  });

  it('holds exactly the ratcheted number of cascades', () => {
    expect(entries.length).toBe(CASCADE_COUNT);
  });

  it('conforms to the schema', () => {
    expect(schemaViolations(MANIFEST.entries)).toEqual([]);
  });

  it('carries the schema version of the schema and the generator', () => {
    expect(MANIFEST.schemaVersion).toBe(SCHEMA.properties.schemaVersion.const);
    expect(MANIFEST.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('admits nothing in the schema the generator cannot produce', () => {
    const shape = schemaShape();
    const enclosing = new Set(FIXTURE_ENTRIES.map((e) => e.enclosing));
    const kinds = new Set(FIXTURE_ENTRIES.flatMap((e) => (e.tiers ?? []).map((t) => t.kind)));
    const keys = new Set(FIXTURE_ENTRIES.flatMap((e) => Object.keys(e)));
    expect(shape.enclosing.filter((value) => !enclosing.has(value))).toEqual([]);
    expect([...shape.tiers.keys()].filter((kind) => !kinds.has(kind))).toEqual([]);
    expect([...shape.entryKeys].filter((key) => !keys.has(key))).toEqual([]);
    expect(schemaViolations(FIXTURE_ENTRIES)).toEqual([]);
  });
});
