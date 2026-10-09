import { logging } from '@angular-devkit/core';
import { callRule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { addLockstepDependency } from './lockstep';

async function run(dependencies: Record<string, string>): Promise<{ tree: Tree; messages: string[] }> {
  const tree = createMemoryTree({ 'package.json': JSON.stringify({ dependencies }) });
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
    expect(messages).toContain('Replacing @cngx/core@^0.0.9 with 0.1.0 so every @cngx package stays on one version.');
  });

  it('stays silent when the pin already matches', async () => {
    const { tree, messages } = await run({ '@cngx/core': '0.1.0' });

    expect(declared(tree)['@cngx/core']).toBe('0.1.0');
    expect(messages).toEqual([]);
  });
});
