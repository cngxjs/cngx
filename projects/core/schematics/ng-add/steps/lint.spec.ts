import { describe, expect, it } from 'vitest';

import { type Change, parseManifest, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { type EslintConfigFacts, type EslintStackFacts, type ProjectFacts } from '../detect/detect';
import { planLint } from './lint';

const ANGULAR_ESLINT_CJS = `// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
  },
]);
`;

const FLAT_ESM = `import eslint from '@eslint/js';

export default [
  eslint.configs.recommended,
];
`;

function config(overrides: Partial<EslintConfigFacts> = {}): EslintConfigFacts {
  return { path: 'eslint.config.js', module: 'cjs', editable: true, wired: false, ...overrides };
}

const STACK: EslintStackFacts = { eslintMajor: 9, templateParser: true, typescriptParser: true };

const PARSER_MANIFEST = parseManifest(JSON.stringify({ devDependencies: { '@angular-eslint/template-parser': '^21.0.0' } }));

// An app whose ESLint stack the plugin runs in; a spec states only what differs.
function eslintApp(overrides: Partial<ProjectFacts> = {}, stack: Partial<EslintStackFacts> = {}): ProjectFacts {
  return createFacts({ eslintConfig: config(), eslintStack: { ...STACK, ...stack }, manifest: PARSER_MANIFEST, ...overrides });
}

function notes(result: StepResult): readonly (readonly [string, string])[] {
  return result.changes.flatMap((change) => (change.kind === 'note' ? [[change.id, change.reason] as const] : []));
}

function byId(result: StepResult, id: string): Change | undefined {
  return result.changes.find((change) => change.id === id);
}

function edit(result: StepResult, content: string): string {
  const change = byId(result, 'lint:config');
  return change?.kind === 'edit-file' ? change.edit(content) : '';
}

describe('planLint', () => {
  it('adds the plugin as a pinned devDependency and its recommended blocks to a CommonJS config', () => {
    const result = planLint(eslintApp(), createAnswers(), VERSIONS);

    expect(byId(result, 'dependency:@cngx/eslint-plugin')).toMatchObject({
      kind: 'add-dependency',
      version: '0.2.0',
      dev: true,
    });
    expect(edit(result, ANGULAR_ESLINT_CJS)).toBe(`// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const cngx = require('@cngx/eslint-plugin'); /* cngx:lint:import */

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
  },
  ...cngx.configs.recommended,
]);
`);
  });

  it('uses a default import in an ES module config', () => {
    const result = planLint(
      eslintApp({ eslintConfig: config({ path: 'eslint.config.mjs', module: 'esm' }) }),
      createAnswers(),
      VERSIONS,
    );

    expect(edit(result, FLAT_ESM)).toBe(`import eslint from '@eslint/js';
import cngx from '@cngx/eslint-plugin'; /* cngx:lint:import */

export default [
  eslint.configs.recommended,
  ...cngx.configs.recommended,
];
`);
  });

  it('edits idempotently', () => {
    const result = planLint(eslintApp(), createAnswers(), VERSIONS);
    const once = edit(result, ANGULAR_ESLINT_CJS);
    expect(edit(result, once)).toBe(once);
  });

  it('notes a missing or uneditable config instead of guessing', () => {
    expect(planLint(createFacts(), createAnswers(), VERSIONS).changes).toEqual([
      expect.objectContaining({
        kind: 'note',
        label: 'Skip the eslint entry',
        reason:
          'no eslint flat config (eslint.config.js, .mjs, .cjs, .ts, .mts or .cts) found; set one up with `ng add angular-eslint`, then run `ng add @cngx/core` again',
      }),
    ]);
    expect(planLint(eslintApp({ eslintConfig: config({ editable: false }) }), createAnswers(), VERSIONS).changes).toEqual([
      expect.objectContaining({
        reason: 'eslint.config.js exports no array cngx can extend; add ...cngx.configs.recommended by hand',
      }),
    ]);
  });

  it('plans nothing when the lint answer is no', () => {
    expect(planLint(createFacts({ eslintConfig: config() }), createAnswers({ lint: false }), VERSIONS)).toEqual({
      changes: [],
      skipped: [],
    });
  });

  it('skips a declared plugin and an already wired config', () => {
    const facts = eslintApp({
      eslintConfig: config({ wired: true }),
      manifest: parseManifest(
        JSON.stringify({ devDependencies: { '@cngx/eslint-plugin': '^0.1.0', '@angular-eslint/template-parser': '^21.0.0' } }),
      ),
    });
    const result = planLint(facts, createAnswers(), VERSIONS);

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
      ['dependency:@cngx/eslint-plugin', 'already declared as ^0.1.0'],
      ['dependency:@angular-eslint/template-parser', 'already declared as ^21.0.0'],
      ['lint:config', 'already loaded in eslint.config.js'],
    ]);
  });

  it('edits a TypeScript flat config like an ES module one', () => {
    const result = planLint(eslintApp({ eslintConfig: config({ path: 'eslint.config.ts', module: 'esm' }) }), createAnswers(), VERSIONS);

    expect(byId(result, 'lint:config')).toMatchObject({ kind: 'edit-file', path: 'eslint.config.ts' });
    expect(edit(result, FLAT_ESM)).toContain("import cngx from '@cngx/eslint-plugin';");
  });

  describe('an ESLint setup the plugin cannot run in', () => {
    const blocked = (facts: ProjectFacts): StepResult => planLint(facts, createAnswers(), VERSIONS);

    it('notes ESLint below 9 with the command that updates it and adds nothing', () => {
      const facts = eslintApp(
        { manifest: parseManifest(JSON.stringify({ devDependencies: { eslint: '^8.57.0' } })) },
        { eslintMajor: 8 },
      );
      expect(blocked(facts)).toEqual({
        changes: [
          expect.objectContaining({
            kind: 'note',
            id: 'lint:config',
            reason:
              '@cngx/eslint-plugin needs ESLint 9 or later and this app declares eslint ^8.57.0; raise eslint to `^9` in devDependencies and reinstall, or run `ng add angular-eslint`, then run `ng add @cngx/core` again',
          }),
        ],
        skipped: [],
      });
      const managed = eslintApp(
        { manifest: parseManifest(JSON.stringify({ devDependencies: { eslint: '^8.57.0', 'angular-eslint': '18.4.0' } })) },
        { eslintMajor: 8 },
      );
      expect(notes(blocked(managed))[0][1]).toContain('raise eslint to `^9` in devDependencies and reinstall (with angular-eslint: `ng update angular-eslint`)');
    });

    it('names the migration command for a legacy eslintrc config', () => {
      const facts = eslintApp({ eslintConfig: undefined, legacyEslintConfig: '.eslintrc.json' });
      expect(notes(blocked(facts))).toEqual([
        ['lint:config', '.eslintrc.json is a legacy config; migrate with `npx @eslint/migrate-config .eslintrc.json`, then run `ng add @cngx/core` again'],
      ]);
      expect(blocked(facts).changes).toHaveLength(1);
    });

    it('prefers a flat config over a leftover eslintrc', () => {
      const result = blocked(eslintApp({ legacyEslintConfig: '.eslintrc.json' }));
      expect(notes(result)).toEqual([]);
      expect(byId(result, 'lint:config')?.kind).toBe('edit-file');
    });

    it('notes a stack without a TypeScript parser', () => {
      expect(blocked(eslintApp({}, { typescriptParser: false })).changes).toEqual([
        expect.objectContaining({
          kind: 'note',
          id: 'lint:config',
          reason:
            'the cngx rules lint TypeScript through your typescript-eslint setup; add typescript-eslint or run `ng add angular-eslint`, then run `ng add @cngx/core` again',
        }),
      ]);
    });
  });

  describe('the template parser', () => {
    it('pins it on the angular-eslint version line when angular-eslint is declared', () => {
      const facts = eslintApp(
        { manifest: parseManifest(JSON.stringify({ devDependencies: { 'angular-eslint': '21.3.0' } })) },
        { templateParser: false },
      );
      const result = planLint(facts, createAnswers(), VERSIONS);

      expect(byId(result, 'dependency:@angular-eslint/template-parser')).toMatchObject({
        kind: 'add-dependency',
        name: '@angular-eslint/template-parser',
        version: '21.3.0',
        dev: true,
      });
      expect(notes(result)).toEqual([]);
      expect(byId(result, 'lint:config')?.kind).toBe('edit-file');
    });

    it('blocks the entry without angular-eslint, since the plugin cannot load without it', () => {
      const result = planLint(eslintApp({}, { templateParser: false }), createAnswers(), VERSIONS);

      expect(result).toEqual({
        changes: [
          expect.objectContaining({
            kind: 'note',
            id: 'lint:config',
            reason:
              '@cngx/eslint-plugin loads @angular-eslint/template-parser; add it as a devDependency or run `ng add angular-eslint`, then run `ng add @cngx/core` again',
          }),
        ],
        skipped: [],
      });
    });

    it('adds nothing when it is declared', () => {
      const result = planLint(eslintApp(), createAnswers(), VERSIONS);
      expect(result.changes.map((change) => change.id)).toEqual(['dependency:@cngx/eslint-plugin', 'lint:config']);
      expect(result.skipped.map((step) => step.id)).toEqual(['dependency:@angular-eslint/template-parser']);
    });
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planLint(
        deepFreeze(eslintApp({ manifest: parseManifest(JSON.stringify({ devDependencies: { 'angular-eslint': '^21.0.0' } })) }, { templateParser: false })),
        deepFreeze(createAnswers()),
        deepFreeze(VERSIONS),
      ),
    ).not.toThrow();
    expect(() =>
      planLint(deepFreeze(eslintApp({}, { eslintMajor: 8 })), deepFreeze(createAnswers()), deepFreeze(VERSIONS)),
    ).not.toThrow();
  });
});
