import { describe, expect, it } from 'vitest';

import { createMemoryTree } from './memory-tree';
import { listFiles } from './walk';

const TREE = {
  'package.json': '{}\n',
  'src/main.ts': '',
  'src/app/app.ts': '',
  'src/app/app.html': '',
  'src/app/app.spec.ts': '',
  'node_modules/@cngx/core/index.d.ts': '',
  'src/node_modules/stray.ts': '',
};

describe('listFiles', () => {
  it('lists every file below the root, sorted and without the leading slash', () => {
    expect(listFiles(createMemoryTree(TREE), '/')).toEqual([
      'node_modules/@cngx/core/index.d.ts',
      'package.json',
      'src/app/app.html',
      'src/app/app.spec.ts',
      'src/app/app.ts',
      'src/main.ts',
      'src/node_modules/stray.ts',
    ]);
  });

  it('starts at a nested root', () => {
    expect(listFiles(createMemoryTree(TREE), 'src/app')).toEqual([
      'src/app/app.html',
      'src/app/app.spec.ts',
      'src/app/app.ts',
    ]);
  });

  it('skips a root-only directory at the root and enters it deeper down', () => {
    const tree = createMemoryTree({ 'dist/main.js': '', 'src/app/dist/page.ts': '' });

    expect(listFiles(tree, '/', { skipRootDirs: new Set(['dist']) })).toEqual(['src/app/dist/page.ts']);
  });

  it('never enters a skipped directory, at any depth', () => {
    const files = listFiles(createMemoryTree(TREE), '/', { skipDirs: new Set(['node_modules']) });

    expect(files).not.toContain('node_modules/@cngx/core/index.d.ts');
    expect(files).not.toContain('src/node_modules/stray.ts');
    expect(files).toContain('src/main.ts');
  });

  it('keeps only the files `accept` takes', () => {
    const files = listFiles(createMemoryTree(TREE), 'src', {
      accept: (path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'),
    });

    expect(files).toEqual(['src/app/app.ts', 'src/main.ts', 'src/node_modules/stray.ts']);
  });

  it('lists nothing for a missing root', () => {
    expect(listFiles(createMemoryTree(TREE), 'projects')).toEqual([]);
  });
});
