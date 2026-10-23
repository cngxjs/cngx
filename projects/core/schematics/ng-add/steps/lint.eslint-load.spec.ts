import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { loadESLint } from 'eslint';
import { createJiti } from 'jiti';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createMemoryTree, parseManifest } from '../../engine';
import { createAnswers, createFacts, VERSIONS } from '../../testing/onboarding';
import { detectEslintConfig } from '../detect/eslint';
import { planLint } from './lint';

const ROOT = join(__dirname, '..', '..', '..', '..', '..');
const PLUGIN_SOURCE = join(ROOT, 'packages', 'eslint-plugin', 'src', 'plugin.ts');

// The workspace packages an edited config and the plugin load, linked into
// the temp app so they resolve the way an installed app resolves them.
const LINKED = ['eslint', '@eslint', 'typescript-eslint', '@typescript-eslint', '@angular-eslint', 'jiti', 'typescript'];

const CJS_DEFINE_CONFIG = `// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
  },
]);
`;

const CJS_BARE = `const eslint = require('@eslint/js');

module.exports = [
  eslint.configs.recommended,
  { files: ['**/*.ts'] },
];
`;

const ESM_BARE = `import eslint from '@eslint/js';

export default [
  eslint.configs.recommended,
  { files: ['**/*.ts'] },
];
`;

const ESM_DEFINE_CONFIG = `import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
  },
]);
`;

const TS_DEFINE_CONFIG = `import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const files: string[] = ['**/*.ts'];

export default defineConfig([
  {
    files,
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
  },
]);
`;

const CTS_BARE = `const eslint = require('@eslint/js');

module.exports = [
  eslint.configs.recommended,
  { files: ['**/*.ts'] },
];
`;

// Every flat config name cngx edits, in the module system each is written in.
const CONFIGS: readonly (readonly [string, string])[] = [
  ['eslint.config.js', CJS_DEFINE_CONFIG],
  ['eslint.config.js', ESM_DEFINE_CONFIG],
  ['eslint.config.cjs', CJS_BARE],
  ['eslint.config.mjs', ESM_BARE],
  ['eslint.config.ts', TS_DEFINE_CONFIG],
  ['eslint.config.mts', ESM_BARE],
  ['eslint.config.cts', CTS_BARE],
];

const STACK = {
  eslintMajor: 9,
  templateParser: true,
  typescriptParser: true,
  angularEslint: undefined,
  templateParserMajor: undefined,
} as const;

const PARSER_MANIFEST = parseManifest(
  JSON.stringify({ devDependencies: { '@angular-eslint/template-parser': '^21.0.0', 'typescript-eslint': '^8.0.0' } }),
);

interface ConfigBlock {
  readonly files?: readonly string[];
  readonly rules?: Record<string, unknown>;
}

interface PluginShape {
  readonly configs: { readonly recommended: readonly ConfigBlock[] };
}

// The rule names the given recommended blocks switch on.
function rulesOf(blocks: readonly ConfigBlock[]): readonly string[] {
  return blocks.flatMap((block) => Object.keys(block.rules ?? {})).sort();
}

// The config as `ng add` leaves it: detected, planned and edited in memory.
function editedConfig(name: string, content: string): string {
  const eslintConfig = detectEslintConfig(createMemoryTree({ [name]: content }), '');
  const result = planLint(
    createFacts({ eslintConfig, eslintStack: STACK, manifest: PARSER_MANIFEST }),
    createAnswers({ lint: true }),
    VERSIONS,
  );
  const change = result.changes.find((candidate) => candidate.id === 'lint:config');
  if (change?.kind !== 'edit-file') {
    throw new Error(`no lint:config edit planned for ${name}`);
  }
  return change.edit(content);
}

// An app folder whose node_modules holds the workspace's ESLint stack and a
// `@cngx/eslint-plugin` whose entry is the plugin loaded from its sources.
function createApp(base: string): string {
  const app = mkdtempSync(join(base, 'app-'));
  const modules = join(app, 'node_modules');
  mkdirSync(join(modules, '@cngx', 'eslint-plugin'), { recursive: true });
  for (const name of LINKED) {
    symlinkSync(join(ROOT, 'node_modules', name), join(modules, name), 'dir');
  }
  writeFileSync(
    join(modules, '@cngx', 'eslint-plugin', 'package.json'),
    JSON.stringify({ name: '@cngx/eslint-plugin', main: 'index.js' }),
  );
  // The package entry is `export = plugin`: the plugin object is the module.
  writeFileSync(
    join(modules, '@cngx', 'eslint-plugin', 'index.js'),
    `module.exports = require(${JSON.stringify(join(ROOT, 'node_modules', 'jiti'))}).createJiti(__filename)(${JSON.stringify(PLUGIN_SOURCE)}).plugin;\n`,
  );
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'fixture-app', private: true }));
  return app;
}

describe('the lint step edit, loaded by ESLint', () => {
  let base: string | undefined;
  let tsRules: readonly string[];
  let templateRules: readonly string[];

  beforeAll(() => {
    base = mkdtempSync(join(tmpdir(), 'cngx-eslint-load-'));
    const { plugin } = createJiti(__filename)(PLUGIN_SOURCE) as { plugin: PluginShape };
    const { recommended } = plugin.configs;
    tsRules = rulesOf(recommended.filter((block) => block.files === undefined));
    templateRules = rulesOf(recommended.filter((block) => block.files?.includes('**/*.html') === true));
  });

  afterAll(() => {
    if (base !== undefined) {
      rmSync(base, { recursive: true, force: true });
    }
  });

  it('expects the recommended rules of both surfaces', () => {
    expect(tsRules.length).toBeGreaterThan(0);
    expect(templateRules.length).toBeGreaterThan(0);
  });

  it.each(CONFIGS)('%s loads with the recommended cngx rules on a component and its template', async (name, content) => {
    const app = createApp(base ?? tmpdir());
    const configFile = join(app, name);
    writeFileSync(configFile, editedConfig(name, content));
    const ESLint = await loadESLint({ useFlatConfig: true });
    const eslint = new ESLint({ cwd: app, overrideConfigFile: configFile });
    const cngxRulesFor = async (file: string): Promise<readonly string[]> => {
      const config = (await eslint.calculateConfigForFile(join(app, file))) as
        | { rules?: Record<string, unknown> }
        | undefined;
      if (config === undefined) {
        throw new Error(`${name} applies no config to ${file}`);
      }
      return Object.keys(config.rules ?? {})
        .filter((rule) => rule.startsWith('cngx/'))
        .sort();
    };

    expect(await cngxRulesFor('src/app/app.ts')).toEqual(tsRules);
    expect(await cngxRulesFor('src/app/app.html')).toEqual([...tsRules, ...templateRules].sort());
  }, 30_000);
});
