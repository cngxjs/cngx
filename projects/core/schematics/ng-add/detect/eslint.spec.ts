import { describe, expect, it } from 'vitest';

import { parseManifest } from '../../engine';
import { createFixtureTree } from '../../testing/run-schematic';
import { detectEslintConfig, detectEslintStack, detectLegacyEslintConfig, type EslintStackFacts } from './eslint';

function configOf(path: string, content: string) {
  return detectEslintConfig(createFixtureTree('standalone-app', { [path]: content }), '');
}

describe('detectEslintConfig', () => {
  it('finds the eslint flat config in js, mjs, cjs, ts, mts or cts', () => {
    expect(configOf('eslint.config.mjs', 'export default [];')).toEqual({
      path: 'eslint.config.mjs',
      module: 'esm',
      editable: true,
      wired: false,
    });
    expect(configOf('eslint.config.cjs', 'module.exports = [];')?.module).toBe('cjs');
    expect(configOf('eslint.config.ts', 'export default [];')).toEqual({
      path: 'eslint.config.ts',
      module: 'esm',
      editable: true,
      wired: false,
    });
    expect(configOf('eslint.config.mts', 'export default [];')?.module).toBe('esm');
    expect(configOf('eslint.config.cts', 'module.exports = [];')).toEqual({
      path: 'eslint.config.cts',
      module: 'cjs',
      editable: true,
      wired: false,
    });
    expect(configOf('.eslintrc.json', '{}')).toBeUndefined();
  });

  it('reads the module format, editability and cngx wiring of an eslint.config.js', () => {
    const angularEslint = `// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");

module.exports = defineConfig([
  { files: ["**/*.ts"] },
]);
`;
    expect(configOf('eslint.config.js', angularEslint)).toEqual({
      path: 'eslint.config.js',
      module: 'cjs',
      editable: true,
      wired: false,
    });
    const esm = "import cngx from '@cngx/eslint-plugin';\nexport default tseslint.config({ files: [] });\n";
    expect(configOf('eslint.config.js', esm)).toEqual({
      path: 'eslint.config.js',
      module: 'esm',
      editable: false,
      wired: true,
    });
  });

  it('reads a commented-out plugin as not wired and a require as wired', () => {
    expect(configOf('eslint.config.mjs', "// import cngx from '@cngx/eslint-plugin';\nexport default [];\n")?.wired).toBe(false);
    expect(configOf('eslint.config.mjs', "/* '@cngx/eslint-plugin' */\nexport default [];\n")?.wired).toBe(false);
    expect(configOf('eslint.config.cjs', "const cngx = require('@cngx/eslint-plugin');\nmodule.exports = [];\n")?.wired).toBe(true);
  });

  it('prefers the project-level config over the workspace one', () => {
    const tree = createFixtureTree('standalone-app', {
      'eslint.config.js': 'module.exports = [];',
      'projects/web/eslint.config.mjs': 'export default [];',
    });

    expect(detectEslintConfig(tree, 'projects/web')?.path).toBe('projects/web/eslint.config.mjs');
    expect(detectEslintConfig(tree, 'projects/other')?.path).toBe('eslint.config.js');
    expect(detectEslintConfig(tree, '')?.path).toBe('eslint.config.js');
  });

  it('prefers a project-level legacy config too', () => {
    const tree = createFixtureTree('standalone-app', { 'projects/web/.eslintrc.json': '{}' });

    expect(detectLegacyEslintConfig(tree, 'projects/web')?.path).toBe('projects/web/.eslintrc.json');
  });
});

describe('detectLegacyEslintConfig', () => {
  it('finds a legacy eslintrc config in every name ESLint 8 read', () => {
    for (const path of ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', '.eslintrc.yaml', '.eslintrc.yml']) {
      expect(detectLegacyEslintConfig(createFixtureTree('standalone-app', { [path]: '{}' }), '')).toEqual({ path });
    }
    expect(
      detectLegacyEslintConfig(createFixtureTree('standalone-app', { 'eslint.config.js': 'export default [];' }), ''),
    ).toBeUndefined();
  });
});

describe('detectEslintStack', () => {
  const stackOf = (devDependencies: Record<string, string>): EslintStackFacts => {
    const manifest = JSON.parse(createFixtureTree().readText('package.json')) as Record<string, unknown>;
    return detectEslintStack(parseManifest(JSON.stringify({ ...manifest, devDependencies })));
  };
  const majorOf = (range: string): number | undefined => stackOf({ eslint: range }).eslintMajor;

  it('reads the highest ESLint major the declared range admits', () => {
    expect(majorOf('^8.57.0')).toBe(8);
    expect(majorOf('~8.1.0')).toBe(8);
    expect(majorOf('8.x')).toBe(8);
    expect(majorOf('^9.0.0')).toBe(9);
    expect(majorOf('^8.57.0 || ^9.0.0')).toBe(9);
    expect(majorOf('>=8 <10')).toBe(9);
    expect(majorOf('<9')).toBe(8);
    expect(majorOf('<9.1')).toBe(9);
    expect(majorOf('<=8.57.0')).toBe(8);
    expect(majorOf('8.0.0 - 9.1.0')).toBe(9);
  });

  it('reads the major of a prerelease range, not a digit of its tag', () => {
    expect(majorOf('^9.0.0-rc.1')).toBe(9);
    expect(majorOf('^10.0.0-alpha.0')).toBe(10);
    expect(majorOf('~8.57.0-beta.2+build.5')).toBe(8);
    expect(majorOf('<9.0.0-rc.0')).toBe(8);
    expect(majorOf('>=9.0.0-rc.0')).toBeUndefined();
  });

  it('reads no major for an open, unreadable or missing range, so it never blocks', () => {
    expect(majorOf('>=8')).toBeUndefined();
    expect(majorOf('^8.57.0 || >=9')).toBeUndefined();
    expect(majorOf('*')).toBeUndefined();
    expect(majorOf('latest')).toBeUndefined();
    expect(detectEslintStack(parseManifest(createFixtureTree().readText('package.json'))).eslintMajor).toBeUndefined();
  });

  it('takes typescript-eslint, its parser or angular-eslint as a TypeScript parser', () => {
    for (const name of ['typescript-eslint', '@typescript-eslint/parser', 'angular-eslint']) {
      expect(stackOf({ eslint: '^9.0.0', [name]: '^8.0.0' }).typescriptParser).toBe(true);
    }
    expect(stackOf({ eslint: '^9.0.0' }).typescriptParser).toBe(false);
  });

  it('sees the template parser only when it is declared itself', () => {
    expect(stackOf({ '@angular-eslint/template-parser': '^21.0.0' }).templateParser).toBe(true);
    expect(stackOf({ 'angular-eslint': '^21.0.0' }).templateParser).toBe(false);
  });

  it('records the declared angular-eslint range for the template parser version line', () => {
    expect(stackOf({ 'angular-eslint': '21.3.0' }).angularEslint).toBe('21.3.0');
    expect(stackOf({ eslint: '^9.0.0' }).angularEslint).toBeUndefined();
  });

  it('reads the template parser line from its own range, else from angular-eslint', () => {
    const lineOf = (packages: Record<string, string>): number | undefined => stackOf(packages).templateParserMajor;
    expect(lineOf({ 'angular-eslint': '18.4.0' })).toBe(18);
    expect(lineOf({ 'angular-eslint': '^21.0.0', '@angular-eslint/template-parser': '^18.0.0' })).toBe(18);
    expect(lineOf({ 'angular-eslint': '>=18' })).toBeUndefined();
    expect(lineOf({ eslint: '^9.0.0' })).toBeUndefined();
  });
});
