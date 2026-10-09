import { readWorkspace } from '@schematics/angular/utility';
import { describe, expect, it } from 'vitest';

import { addLockstepDependency } from '../engine';
import { createFixtureTree, readFixture, runRule } from './run-schematic';

describe('readFixture', () => {
  it('reads the stock standalone app with posix paths', () => {
    const files = Object.keys(readFixture('standalone-app'));

    expect(files).toEqual(
      expect.arrayContaining(['angular.json', 'package.json', 'src/main.ts', 'src/app/app.config.ts', 'src/styles.css']),
    );
  });
});

describe('createFixtureTree', () => {
  it('is a workspace the @schematics/angular utilities can read', async () => {
    const workspace = await readWorkspace(createFixtureTree());

    expect([...workspace.projects.keys()]).toEqual(['fixture-app']);
  });

  it('applies overrides on top of the stock files', () => {
    const tree = createFixtureTree('standalone-app', {
      'src/styles.css': 'body {}\n',
      'eslint.config.js': 'module.exports = [];\n',
    });

    expect(tree.readContent('src/styles.css')).toBe('body {}\n');
    expect(tree.files).toContain('/eslint.config.js');
  });
});

describe('runRule', () => {
  it('returns the resulting tree and the log lines', async () => {
    const tree = createFixtureTree('standalone-app', {
      'package.json': JSON.stringify({ dependencies: { '@cngx/core': '^0.0.1' } }),
    });

    const run = await runRule(addLockstepDependency('@cngx/core', '0.1.0'), tree);

    expect(JSON.parse(run.tree.readContent('package.json')).dependencies['@cngx/core']).toBe('0.1.0');
    expect(run.logs).toContain('Replacing @cngx/core@^0.0.1 with 0.1.0 so every @cngx package stays on one version.');
  });
});
