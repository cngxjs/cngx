import { describe, expect, it } from 'vitest';

import { type Change } from '../plan/change';
import { type ChangePlan, createChangePlan } from '../plan/plan';
import { createPalette } from './palette';
import { createPlainRenderer } from './plain-renderer';
import { type RenderLogger } from './renderer';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;
const ANSI = /\u001b\[/;

const DEPENDENCY: Change = {
  kind: 'add-dependency',
  id: 'dependency:@cngx/core',
  label: 'Add @cngx/core@0.1.0',
  reason: 'lockstep with @cngx/ui',
  provenance: PROVENANCE,
  name: '@cngx/core',
  version: '0.1.0',
};

const STYLE: Change = {
  kind: 'add-style-import',
  id: 'style-import',
  label: 'Import cngx.css',
  reason: 'global stylesheet',
  provenance: PROVENANCE,
  path: 'src/styles.css',
  statement: "@import '@cngx/themes/cngx.css';",
};

const NOTE: Change = {
  kind: 'note',
  id: 'note:doctor',
  label: 'Run npx @cngx/doctor',
  reason: 'checks the wiring',
  provenance: PROVENANCE,
};

const PLAN: ChangePlan = createChangePlan(
  [
    { changes: [DEPENDENCY, STYLE], skipped: [] },
    {
      changes: [NOTE],
      skipped: [
        { id: 'provider:a11y', label: 'Add provideA11yPreferences', reason: 'already provided' },
      ],
    },
  ],
  ['no eslint config found'],
);

interface Captured {
  readonly logger: RenderLogger;
  readonly lines: string[];
}

function capture(): Captured {
  const lines: string[] = [];
  return {
    lines,
    logger: {
      info: (message) => lines.push(`info ${message}`),
      warn: (message) => lines.push(`warn ${message}`),
      error: (message) => lines.push(`error ${message}`),
    },
  };
}

function renderer(quiet: boolean, env: Readonly<Record<string, string>> = {}, isTTY = false) {
  const { logger, lines } = capture();
  return {
    lines,
    renderer: createPlainRenderer({ color: createPalette(env, isTTY), quiet, logger }),
  };
}

describe('createPlainRenderer', () => {
  it('prints the described plan as the todo list', async () => {
    const { lines, renderer: plain } = renderer(false);

    await plain.todo(PLAN);

    expect(lines).toMatchSnapshot();
  });

  it('prints a pending plan the same way, since its lines tick nothing', async () => {
    const done = renderer(false);
    const pending = renderer(false);

    await done.renderer.todo(PLAN);
    await pending.renderer.todo(PLAN, { pending: true });

    expect(pending.lines).toEqual(done.lines);
  });

  it('prints the preflight checklist with one level per status', () => {
    const { lines, renderer: plain } = renderer(false);

    plain.preflight([
      { label: 'Angular 21.2.1', status: 'ok' },
      { label: 'Uncommitted changes', status: 'warn', detail: '3 files' },
      { label: 'Angular 20', status: 'fail', detail: 'needs ^21.2.0' },
    ]);

    expect(lines).toEqual([
      'info Preflight:',
      'info   ok Angular 21.2.1',
      'warn   ! Uncommitted changes (3 files)',
      'error   x Angular 20 (needs ^21.2.0)',
    ]);
  });

  it('folds the detail into a label that already ends in a parenthesis', () => {
    const { lines, renderer: plain } = renderer(false);

    plain.preflight([
      { label: 'Angular 21.2.25 (installed, declares ^21.2.0)', status: 'ok', detail: 'cngx needs 21.2+' },
      { label: 'Project app (picked; pass --project to choose)', status: 'warn', detail: 'fresh app' },
    ]);

    expect(lines).toEqual([
      'info Preflight:',
      'info   ok Angular 21.2.25 (installed, declares ^21.2.0; cngx needs 21.2+)',
      'warn   ! Project app (picked; pass --project to choose; fresh app)',
    ]);
  });

  it('prints a heading unless quiet', () => {
    const loud = renderer(false);
    const quiet = renderer(true);

    loud.renderer.heading('cngx 0.2.0 migration');
    quiet.renderer.heading('cngx 0.2.0 migration');

    expect(loud.lines).toEqual(['info cngx 0.2.0 migration']);
    expect(quiet.lines).toEqual([]);
  });

  it('colours the plan the way the Angular CLI does on a coloured terminal', async () => {
    const { lines, renderer: coloured } = renderer(false, { FORCE_COLOR: '1' }, true);
    const color = createPalette({ FORCE_COLOR: '1' }, true);

    await coloured.todo(PLAN);

    expect(lines).toEqual([
      `info ${color.bold('Planned (2):')}`,
      `info   ${color.green('+')} Add @cngx/core@0.1.0 ${color.dim('- lockstep with @cngx/ui')}`,
      `info   ${color.green('+')} Import cngx.css ${color.dim('- global stylesheet')}`,
      `info ${color.bold('Notes (1):')}`,
      `info   ${color.yellow('-')} Run npx @cngx/doctor ${color.dim('- checks the wiring')}`,
      `info ${color.bold('Already in place (1):')}`,
      `info   ${color.dim('=')} Add provideA11yPreferences ${color.dim('- already provided')}`,
      `info ${color.bold('Warnings (1):')}`,
      `info   ${color.yellow('!')} no eslint config found`,
    ]);
  });

  it('bolds the summary section headings only', () => {
    const { lines, renderer: coloured } = renderer(false, { FORCE_COLOR: '1' }, true);
    const color = createPalette({ FORCE_COLOR: '1' }, true);

    coloured.summary(['cngx applied 2 changes.', 'Next steps:', '  Run `npx @cngx/doctor` to check the wiring.']);

    expect(lines).toEqual([
      'info cngx applied 2 changes.',
      `info ${color.bold('Next steps:')}`,
      'info   Run `npx @cngx/doctor` to check the wiring.',
    ]);
  });

  it('emits only the summary when quiet', async () => {
    const { lines, renderer: plain } = renderer(true);

    plain.preflight([{ label: 'Angular 21.2.1', status: 'ok' }]);
    await plain.todo(PLAN);
    plain.note('Reading the workspace');
    plain.summary(['cngx is set up.', 'Next: npx @cngx/doctor']);

    expect(lines).toEqual(['info cngx is set up.', 'info Next: npx @cngx/doctor']);
  });

  it('strips ANSI under NO_COLOR even on a terminal', async () => {
    const { lines, renderer: plain } = renderer(false, { NO_COLOR: '1' }, true);

    plain.preflight([{ label: 'Angular 21.2.1', status: 'ok' }]);
    await plain.todo(PLAN);
    plain.note('Reading the workspace');

    expect(lines.filter((line) => ANSI.test(line))).toEqual([]);
  });

  it('colours the markers when colour is on', () => {
    const { lines, renderer: plain } = renderer(false, { FORCE_COLOR: '1' });

    plain.preflight([{ label: 'Angular 21.2.1', status: 'ok' }]);

    expect(lines.every((line) => ANSI.test(line))).toBe(true);
  });

  it('prints the lockstep @cngx additions as one folded line', async () => {
    const { lines, renderer: plain } = renderer(false);
    const utils: Change = { ...DEPENDENCY, id: 'dependency:@cngx/utils', label: 'Add @cngx/utils@0.1.0', name: '@cngx/utils' };

    await plain.todo(createChangePlan([{ changes: [utils, DEPENDENCY], skipped: [] }]));

    expect(lines).toEqual(['info Planned (2):', 'info   + Add 2 @cngx packages at 0.1.0 - utils, core']);
  });

  it('says so when the plan is empty', async () => {
    const { lines, renderer: plain } = renderer(false);

    await plain.todo(createChangePlan([]));

    expect(lines).toEqual(['info Nothing to change.']);
  });

  it('does not mutate the plan', async () => {
    const before = JSON.stringify(PLAN);

    await renderer(false).renderer.todo(PLAN);

    expect(JSON.stringify(PLAN)).toBe(before);
  });
});
