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

function recording(lines: string[]): RenderLogger {
  return {
    info: (message) => lines.push(message),
    warn: (message) => lines.push(message),
    error: (message) => lines.push(message),
  };
}

function run(isTTY: boolean, env: Readonly<Record<string, string>>, quiet: boolean) {
  const lines: string[] = [];
  const terminalLines: string[] = [];
  const listrLogger = new CountingLogger();
  const renderer = createRenderer({
    isTTY,
    color: createPalette(env, isTTY),
    quiet,
    logger: recording(lines),
    terminal: recording(terminalLines),
    listr: { renderer: 'test', rendererOptions: { logger: listrLogger } },
  });
  return { renderer, lines, terminalLines, listrEvents: () => listrLogger.events };
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

  it('writes the live renderer lines to the terminal, past the CLI logger', () => {
    const { renderer, lines, terminalLines } = run(true, {}, false);

    renderer.summary(['cngx applied 1 change.']);

    expect(terminalLines).toEqual(['cngx applied 1 change.']);
    expect(lines).toEqual([]);
  });

  it('keeps the plain lines on the CLI logger', () => {
    const { renderer, lines, terminalLines } = run(true, { NO_COLOR: '1' }, false);

    renderer.summary(['cngx applied 1 change.']);

    expect(lines).toEqual(['cngx applied 1 change.']);
    expect(terminalLines).toEqual([]);
  });
});
