import { ListrLogger } from 'listr2';
import { describe, expect, it } from 'vitest';

import { createChangePlan } from '../plan/plan';
import { createPalette } from './palette';
import { createRenderer, type RenderLogger } from './renderer';

const PLAN = createChangePlan([
  {
    changes: [
      {
        kind: 'create-file',
        id: 'a',
        label: 'A',
        reason: 'r',
        provenance: { source: 'ng-add', version: '0.1.0' },
        path: 'a.ts',
        content: '',
      },
    ],
    skipped: [],
  },
]);

class CountingLogger extends ListrLogger {
  events = 0;

  override toStdout(): void {
    this.events += 1;
  }
}

function run(isTTY: boolean, env: Readonly<Record<string, string>>, quiet: boolean) {
  const lines: string[] = [];
  const logger: RenderLogger = {
    info: (message) => lines.push(message),
    warn: (message) => lines.push(message),
    error: (message) => lines.push(message),
  };
  const listrLogger = new CountingLogger();
  const renderer = createRenderer({
    isTTY,
    color: createPalette(env, isTTY),
    quiet,
    logger,
    listr: { renderer: 'test', rendererOptions: { logger: listrLogger } },
  });
  return { renderer, lines, listrEvents: () => listrLogger.events };
}

describe('createRenderer', () => {
  it('uses the task list on an interactive coloured terminal', async () => {
    const { renderer, lines, listrEvents } = run(true, {}, false);

    await renderer.todo(PLAN);

    expect(listrEvents()).toBeGreaterThan(0);
    expect(lines).toEqual([]);
  });

  it.each([
    ['no terminal', false, {}, false],
    ['NO_COLOR', true, { NO_COLOR: '1' }, false],
    ['--quiet', true, {}, true],
  ] as const)('falls back to plain lines for %s', async (_case, isTTY, env, quiet) => {
    const { renderer, listrEvents } = run(isTTY, env, quiet);

    await renderer.todo(PLAN);

    expect(listrEvents()).toBe(0);
  });
});
