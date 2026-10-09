import { describe, expect, it } from 'vitest';

import { createMemoryTree } from './memory-tree';

const SEED = {
  'package.json': '{ "name": "app" }\n',
  'src/app/app.config.ts': 'export const appConfig = {};\n',
};

describe('createMemoryTree', () => {
  it('reads every seeded file at its path', () => {
    const tree = createMemoryTree(SEED);

    expect(tree.readText('package.json')).toBe(SEED['package.json']);
    expect(tree.readText('/src/app/app.config.ts')).toBe(SEED['src/app/app.config.ts']);
    expect(tree.getDir('src/app').subfiles).toEqual(['app.config.ts']);
  });

  it('treats seeded files as existing: overwrite works, create fails', () => {
    const tree = createMemoryTree(SEED);

    tree.overwrite('package.json', '{}\n');

    expect(tree.readText('package.json')).toBe('{}\n');
    expect(() => tree.create('package.json', '{}\n')).toThrow();
  });

  it('starts empty without a seed', () => {
    const tree = createMemoryTree();

    expect(tree.exists('package.json')).toBe(false);
    tree.create('package.json', '{}\n');
    expect(tree.readText('package.json')).toBe('{}\n');
  });

  it('does not read the seed object after creation', () => {
    const seed: Record<string, string> = { 'a.txt': 'a' };
    const tree = createMemoryTree(seed);

    seed['b.txt'] = 'b';

    expect(tree.exists('b.txt')).toBe(false);
  });
});
