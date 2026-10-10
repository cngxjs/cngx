import { logging } from '@angular-devkit/core';
import { callRule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { addLockstepDependency } from './lockstep';

async function run(
  dependencies: Record<string, string>,
  devDependencies?: Record<string, string>,
): Promise<{ tree: Tree; messages: string[] }> {
  const tree = createMemoryTree({ 'package.json': JSON.stringify({ dependencies, devDependencies }) });
  const logger = new logging.Logger('lockstep-spec');
  const messages: string[] = [];
  logger.subscribe((entry) => messages.push(entry.message));
  // addDependency touches only the logger when it schedules no install.
  const context = { logger } as unknown as SchematicContext;
  const result = await lastValueFrom(callRule(addLockstepDependency('@cngx/core', '0.1.0'), tree, context));
  return { tree: result, messages };
}

function declared(tree: Tree): Record<string, string> {
  return (JSON.parse(tree.readText('package.json')) as { dependencies: Record<string, string> }).dependencies;
}

describe('addLockstepDependency', () => {
  it('adds the package at the exact version', async () => {
    const { tree, messages } = await run({});

    expect(declared(tree)['@cngx/core']).toBe('0.1.0');
    expect(messages).toEqual([]);
  });

  it('replaces an older pin and logs the replacement', async () => {
    const { tree, messages } = await run({ '@cngx/core': '^0.0.9' });

    expect(declared(tree)['@cngx/core']).toBe('0.1.0');
    expect(messages).toEqual(['Replacing @cngx/core@^0.0.9 with 0.1.0 so every @cngx package stays on one version.']);
  });

  it('keeps the other dependencies and their order when it replaces a pin', async () => {
    const { tree } = await run({ '@angular/core': '^21.2.0', '@cngx/core': '^0.0.9', zone: '1.0.0' });

    expect(Object.entries(declared(tree))).toEqual([
      ['@angular/core', '^21.2.0'],
      ['@cngx/core', '0.1.0'],
      ['zone', '1.0.0'],
    ]);
  });

  it('stays silent when the pin already matches', async () => {
    const { tree, messages } = await run({ '@cngx/core': '0.1.0' });

    expect(declared(tree)['@cngx/core']).toBe('0.1.0');
    expect(messages).toEqual([]);
  });

  it('moves an older pin out of devDependencies instead of leaving it behind', async () => {
    const { tree, messages } = await run({}, { '@cngx/core': '^0.0.9', vitest: '4.0.0' });
    const manifest = JSON.parse(tree.readText('package.json')) as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    expect(manifest.dependencies['@cngx/core']).toBe('0.1.0');
    expect(manifest.devDependencies).toEqual({ vitest: '4.0.0' });
    expect(messages).toEqual(['Replacing @cngx/core@^0.0.9 with 0.1.0 so every @cngx package stays on one version.']);
  });
});
