import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createNodeTree } from './node-tree';

describe('createNodeTree', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'cngx-node-tree-'));
    mkdirSync(join(root, 'src'));
    writeFileSync(join(root, 'package.json'), '{ "name": "app" }\n');
    writeFileSync(join(root, 'src', 'main.ts'), 'bootstrap();\n');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('reads the files under root', () => {
    const { tree } = createNodeTree(root);

    expect(tree.readText('package.json')).toBe('{ "name": "app" }\n');
    expect(tree.getDir('src').subfiles).toEqual(['main.ts']);
  });

  it('keeps writes staged until commit', async () => {
    const { tree, commit } = createNodeTree(root);

    tree.overwrite('package.json', '{}\n');
    tree.create('src/app.config.ts', 'export const appConfig = {};\n');

    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe('{ "name": "app" }\n');

    await commit();

    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe('{}\n');
    expect(readFileSync(join(root, 'src', 'app.config.ts'), 'utf8')).toBe('export const appConfig = {};\n');
  });

  it('commits the tree a rule hands back instead of the input', async () => {
    const { tree, commit } = createNodeTree(root);
    const branch = tree.branch();

    branch.create('branch.txt', 'from the branch\n');
    await commit(branch);

    expect(readFileSync(join(root, 'branch.txt'), 'utf8')).toBe('from the branch\n');
  });

  it('applies deletes and leaves untouched files alone', async () => {
    const { tree, commit } = createNodeTree(root);

    tree.delete('src/main.ts');
    await commit();

    expect(() => readFileSync(join(root, 'src', 'main.ts'), 'utf8')).toThrow();
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe('{ "name": "app" }\n');
  });
});
