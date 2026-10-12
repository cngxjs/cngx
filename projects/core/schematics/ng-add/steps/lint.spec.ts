import { describe, expect, it } from 'vitest';

import { type Change, parseManifest, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { type EslintConfigFacts } from '../detect/detect';
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

function byId(result: StepResult, id: string): Change | undefined {
  return result.changes.find((change) => change.id === id);
}

function edit(result: StepResult, content: string): string {
  const change = byId(result, 'lint:config');
  return change?.kind === 'edit-file' ? change.edit(content) : '';
}

describe('planLint', () => {
  it('adds the plugin as a pinned devDependency and its recommended blocks to a CommonJS config', () => {
    const result = planLint(createFacts({ eslintConfig: config() }), createAnswers(), VERSIONS);

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
      createFacts({ eslintConfig: config({ path: 'eslint.config.mjs', module: 'esm' }) }),
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
    const result = planLint(createFacts({ eslintConfig: config() }), createAnswers(), VERSIONS);
    const once = edit(result, ANGULAR_ESLINT_CJS);
    expect(edit(result, once)).toBe(once);
  });

  it('notes a missing or uneditable config instead of guessing', () => {
    expect(planLint(createFacts(), createAnswers(), VERSIONS).changes).toEqual([
      expect.objectContaining({
        kind: 'note',
        label: 'Skip the eslint entry',
        reason: 'no eslint flat config (eslint.config.js, .mjs or .cjs) found',
      }),
    ]);
    expect(planLint(createFacts({ eslintConfig: config({ editable: false }) }), createAnswers(), VERSIONS).changes).toEqual([
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
    const facts = createFacts({
      eslintConfig: config({ wired: true }),
      manifest: parseManifest(JSON.stringify({ devDependencies: { '@cngx/eslint-plugin': '^0.1.0' } })),
    });
    const result = planLint(facts, createAnswers(), VERSIONS);

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
      ['dependency:@cngx/eslint-plugin', 'already declared as ^0.1.0'],
      ['lint:config', 'already loaded in eslint.config.js'],
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planLint(deepFreeze(createFacts({ eslintConfig: config() })), deepFreeze(createAnswers()), deepFreeze(VERSIONS)),
    ).not.toThrow();
  });
});
