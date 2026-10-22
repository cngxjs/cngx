import { logging } from '@angular-devkit/core';
import { callRule, type SchematicContext } from '@angular-devkit/schematics';
import { DependencyType, InstallBehavior } from '@schematics/angular/utility';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { addDependency } from './add-dependency';

const context = { logger: new logging.Logger('add-dependency-spec') } as unknown as SchematicContext;

async function add(manifest: string): Promise<string> {
  const rule = addDependency('@cngx/eslint-plugin', '0.2.0', { type: DependencyType.Dev, install: InstallBehavior.None });
  const tree = await lastValueFrom(callRule(rule, createMemoryTree({ 'package.json': manifest }), context));
  return tree.readText('package.json');
}

describe('addDependency', () => {
  it('adds the dependency the way @schematics/angular does', async () => {
    expect(JSON.parse(await add('{ "devDependencies": {} }\n')).devDependencies).toEqual({ '@cngx/eslint-plugin': '0.2.0' });
  });

  it('keeps the trailing newline of package.json', async () => {
    expect(await add('{\n  "devDependencies": {}\n}\n')).toBe('{\n  "devDependencies": {\n    "@cngx/eslint-plugin": "0.2.0"\n  }\n}\n');
  });

  it('keeps the CRLF line endings of package.json', async () => {
    expect(await add('{\r\n  "devDependencies": {}\r\n}\r\n')).toBe(
      '{\r\n  "devDependencies": {\r\n    "@cngx/eslint-plugin": "0.2.0"\r\n  }\r\n}\r\n',
    );
  });

  it('adds no newline the file did not have', async () => {
    expect(await add('{\n  "devDependencies": {}\n}')).toBe('{\n  "devDependencies": {\n    "@cngx/eslint-plugin": "0.2.0"\n  }\n}');
  });

  it.each([
    ['tabs', '\t'],
    ['four spaces', '    '],
    ['twelve spaces, past the ten JSON.stringify takes', ' '.repeat(12)],
  ])('keeps a package.json indented with %s, so only the added lines differ', async (_name, indent) => {
    const before = ['{', `${indent}"name": "app",`, `${indent}"devDependencies": {`, `${indent}${indent}"eslint": "^9.0.0"`, `${indent}}`, '}', ''].join('\n');
    const after = [
      '{',
      `${indent}"name": "app",`,
      `${indent}"devDependencies": {`,
      `${indent}${indent}"@cngx/eslint-plugin": "0.2.0",`,
      `${indent}${indent}"eslint": "^9.0.0"`,
      `${indent}}`,
      '}',
      '',
    ].join('\n');

    expect(await add(before)).toBe(after);
  });

  it('leaves package.json untouched when the dependency is already declared', async () => {
    const manifest = '{\n\t"devDependencies": { "@cngx/eslint-plugin": "0.2.0" }\n}\n';
    const rule = addDependency('@cngx/eslint-plugin', '0.2.0', { type: DependencyType.Dev, install: InstallBehavior.None });
    const tree = await lastValueFrom(callRule(rule, createMemoryTree({ 'package.json': manifest }), context));

    expect(tree.readText('package.json')).toBe(manifest);
  });
});
