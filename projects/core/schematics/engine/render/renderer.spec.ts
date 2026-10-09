import { ListrLogger } from 'listr2';
import { describe, expect, it } from 'vitest';

import { createChangePlan } from '../plan/plan';
import { createPalette } from './palette';
import { createRenderer, type RenderLogger, type Verbosity } from './renderer';

const PLAN = createChangePlan([
  {
    changes: [
      {
        kind: 'note',
        id: 'a',
        label: 'A',
        reason: 'r',
        provenance: { source: 'ng-add', version: '0.1.0' },
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

function run(isTTY: boolean, env: Readonly<Record<string, string>>, verbosity: Verbosity) {
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
    verbosity,
    logger,
    listr: { renderer: 'test', rendererOptions: { logger: listrLogger } },
  });
  return { renderer, lines, listrEvents: () => listrLogger.events };
}

describe('createRenderer', () => {
  it('uses the task list on an interactive coloured terminal', async () => {
    const { renderer, lines, listrEvents } = run(true, {}, 'normal');

    await renderer.todo(PLAN);

    expect(listrEvents()).toBeGreaterThan(0);
    expect(lines).toEqual([]);
  });

  it.each([
    ['no terminal', false, {}, 'normal'],
    ['NO_COLOR', true, { NO_COLOR: '1' }, 'normal'],
    ['--quiet', true, {}, 'quiet'],
  ] as const)('falls back to plain lines for %s', async (_case, isTTY, env, verbosity) => {
    const { renderer, listrEvents } = run(isTTY, env, verbosity);

    await renderer.todo(PLAN);

    expect(listrEvents()).toBe(0);
  });
});
