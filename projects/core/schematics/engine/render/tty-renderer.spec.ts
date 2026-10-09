import { ListrLogger } from 'listr2';
import { describe, expect, it } from 'vitest';

import { type Change } from '../plan/change';
import { createChangePlan } from '../plan/plan';
import { createPalette } from './palette';
import { type RenderLogger } from './renderer';
import { createTtyRenderer } from './tty-renderer';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;

function change(id: string, label: string): Change {
  return { kind: 'note', id, label, reason: `because ${id}`, provenance: PROVENANCE };
}

interface ListrEvent {
  readonly event: string;
  readonly data: unknown;
  readonly task?: { readonly title?: string };
}

/** Collects the test renderer's serialized events instead of writing them. */
class CapturingLogger extends ListrLogger {
  readonly events: ListrEvent[] = [];

  override toStdout(message: string | unknown[]): void {
    this.events.push(JSON.parse(String(message)) as ListrEvent);
  }
}

function capture() {
  const lines: string[] = [];
  const logger: RenderLogger = {
    info: (message) => lines.push(`info ${message}`),
    warn: (message) => lines.push(`warn ${message}`),
    error: (message) => lines.push(`error ${message}`),
  };
  return { lines, logger };
}

function tty() {
  const listrLogger = new CapturingLogger();
  const { lines, logger } = capture();
  const renderer = createTtyRenderer({
    color: createPalette({}, false),
    verbosity: 'normal',
    logger,
    listr: { renderer: 'test', rendererOptions: { logger: listrLogger, task: ['title'] } },
  });
  return { renderer, lines, events: listrLogger.events };
}

function finished(events: readonly ListrEvent[]): readonly string[] {
  return events
    .filter(
      (entry) =>
        entry.event === 'STATE' && (entry.data === 'COMPLETED' || entry.data === 'SKIPPED'),
    )
    .map((entry) => `${String(entry.data)} ${entry.task?.title ?? ''}`);
}

describe('createTtyRenderer', () => {
  it('renders one task per change in plan order', async () => {
    const { renderer, events } = tty();
    const plan = createChangePlan([
      {
        changes: [change('dependency', 'Add @cngx/core'), change('style', 'Import cngx.css')],
        skipped: [],
      },
      { changes: [change('provider', 'Add provideA11yPreferences')], skipped: [] },
    ]);

    await renderer.todo(plan);

    expect(finished(events)).toEqual([
      'COMPLETED Add @cngx/core - because dependency',
      'COMPLETED Import cngx.css - because style',
      'COMPLETED Add provideA11yPreferences - because provider',
    ]);
  });

  it('shows idempotent hits as skipped tasks after the changes', async () => {
    const { renderer, events } = tty();
    const plan = createChangePlan([
      {
        changes: [change('dependency', 'Add @cngx/core')],
        skipped: [{ id: 'style', label: 'Import cngx.css', reason: 'already imported' }],
      },
    ]);

    await renderer.todo(plan);

    expect(finished(events)).toEqual([
      'COMPLETED Add @cngx/core - because dependency',
      'SKIPPED Import cngx.css',
    ]);
    expect(events.find((entry) => entry.event === 'MESSAGE')?.data).toEqual({
      skip: 'Import cngx.css - already imported',
    });
  });

  it('prints warnings through the logger after the list', async () => {
    const { renderer, lines } = tty();

    await renderer.todo(
      createChangePlan([{ changes: [change('a', 'A')], skipped: [] }], ['no eslint config']),
    );

    expect(lines).toEqual(['warn ! no eslint config']);
  });

  it('starts no task list for an empty plan', async () => {
    const { renderer, lines, events } = tty();

    await renderer.todo(createChangePlan([]));

    expect(events).toEqual([]);
    expect(lines).toEqual(['info Nothing to change.']);
  });

  it('prints the summary as plain lines', () => {
    const { renderer, lines } = tty();

    renderer.summary(['cngx is set up.']);

    expect(lines).toEqual(['info cngx is set up.']);
  });
});
