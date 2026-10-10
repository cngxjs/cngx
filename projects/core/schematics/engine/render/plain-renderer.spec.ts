import { describe, expect, it } from 'vitest';

import { type Change } from '../plan/change';
import { type ChangePlan, createChangePlan } from '../plan/plan';
import { createPalette } from './palette';
import { createPlainRenderer } from './plain-renderer';
import { type RenderLogger, type Verbosity } from './renderer';

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

function renderer(verbosity: Verbosity, env: Readonly<Record<string, string>> = {}, isTTY = false) {
  const { logger, lines } = capture();
  return {
    lines,
    renderer: createPlainRenderer({ color: createPalette(env, isTTY), verbosity, logger }),
  };
}

describe('createPlainRenderer', () => {
  it('prints the described plan as the todo list', async () => {
    const { lines, renderer: plain } = renderer('normal');

    await plain.todo(PLAN);

    expect(lines).toMatchSnapshot();
  });

  it('adds what each change touches when verbose', async () => {
    const { lines, renderer: plain } = renderer('verbose');

    await plain.todo(PLAN);

    expect(lines.slice(lines.indexOf('info Details:'))).toEqual([
      'info Details:',
      'info   dependency:@cngx/core: add-dependency @cngx/core@0.1.0',
      'info   style-import: add-style-import src/styles.css',
      'info   note:doctor: note',
    ]);
  });

  it('prints the preflight checklist with one level per status', () => {
    const { lines, renderer: plain } = renderer('normal');

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

  it('emits only the summary when quiet', async () => {
    const { lines, renderer: plain } = renderer('quiet');

    plain.preflight([{ label: 'Angular 21.2.1', status: 'ok' }]);
    await plain.todo(PLAN);
    plain.note('Reading the workspace');
    plain.summary(['cngx is set up.', 'Next: npx @cngx/doctor']);

    expect(lines).toEqual(['info cngx is set up.', 'info Next: npx @cngx/doctor']);
  });

  it('strips ANSI under NO_COLOR even on a terminal', async () => {
    const { lines, renderer: plain } = renderer('verbose', { NO_COLOR: '1' }, true);

    plain.preflight([{ label: 'Angular 21.2.1', status: 'ok' }]);
    await plain.todo(PLAN);
    plain.note('Reading the workspace');

    expect(lines.filter((line) => ANSI.test(line))).toEqual([]);
  });

  it('colours the markers when colour is on', () => {
    const { lines, renderer: plain } = renderer('normal', { FORCE_COLOR: '1' });

    plain.preflight([{ label: 'Angular 21.2.1', status: 'ok' }]);

    expect(lines.every((line) => ANSI.test(line))).toBe(true);
  });

  it('says so when the plan is empty', async () => {
    const { lines, renderer: plain } = renderer('normal');

    await plain.todo(createChangePlan([]));

    expect(lines).toEqual(['info Nothing to change.']);
  });

  it('does not mutate the plan', async () => {
    const before = JSON.stringify(PLAN);

    await renderer('verbose').renderer.todo(PLAN);

    expect(JSON.stringify(PLAN)).toBe(before);
  });
});
