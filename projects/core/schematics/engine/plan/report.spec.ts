import { describe, expect, it } from 'vitest';

import { type Change } from './change';
import { createChangePlan } from './plan';
import { createReport } from './report';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;

const CHANGES: readonly Change[] = [
  {
    kind: 'add-dependency',
    id: 'dependency:@cngx/core',
    label: 'Add @cngx/core@0.1.0',
    reason: 'lockstep',
    provenance: PROVENANCE,
    name: '@cngx/core',
    version: '0.1.0',
  },
  {
    kind: 'add-dependency',
    id: 'dependency:@cngx/utils',
    label: 'Add @cngx/utils@0.1.0',
    reason: 'lockstep',
    provenance: PROVENANCE,
    name: '@cngx/utils',
    version: '0.1.0',
  },
  {
    kind: 'add-style-import',
    id: 'style-import',
    label: 'Import cngx.css',
    reason: 'global stylesheet',
    provenance: PROVENANCE,
    path: 'src/styles.css',
    statement: "@import '@cngx/themes/cngx.css';",
  },
  {
    kind: 'add-provider',
    id: 'provider:a11y',
    label: 'Add provideA11yPreferences(withPersistence())',
    reason: 'recommended preset',
    provenance: PROVENANCE,
    project: 'app',
    call: { symbol: 'provideA11yPreferences', module: '@cngx/core' },
  },
  {
    kind: 'note',
    id: 'note:x',
    label: 'Note',
    reason: 'r',
    provenance: PROVENANCE,
  },
];

const PLAN = createChangePlan(
  [
    {
      changes: CHANGES,
      skipped: [{ id: 'lint', label: 'Add the eslint plugin', reason: 'already configured' }],
    },
  ],
  ['no eslint config'],
);

describe('createReport', () => {
  it('lists the planned changes in plan order', () => {
    expect(createReport(PLAN).changes).toEqual([
      'Add @cngx/core@0.1.0',
      'Add @cngx/utils@0.1.0',
      'Import cngx.css',
      'Add provideA11yPreferences(withPersistence())',
    ]);
  });

  it('lists notes apart from the changes', () => {
    expect(createReport(PLAN).notes).toEqual(['Note - r']);
  });

  it('lists each touched file once and leaves out changes without a file', () => {
    expect(createReport(PLAN).files).toEqual(['package.json', 'src/styles.css']);
  });

  it('refuses a change kind it has no file mapping for', () => {
    const unknown = { kind: 'add-import', id: 'i', label: 'l', reason: 'r', path: 'main.ts' } as unknown as Change;

    expect(() => createReport(createChangePlan([{ changes: [unknown], skipped: [] }]))).toThrow(
      'No file for change',
    );
  });

  it('lists the file a provider goes into when the step names it', () => {
    const plan = createChangePlan([
      {
        changes: [
          {
            kind: 'add-provider',
            id: 'provider:a11y',
            label: 'Provide the a11y preferences',
            reason: 'r',
            provenance: PROVENANCE,
            project: 'app',
            path: 'src/app/app.config.ts',
            call: { symbol: 'provideA11yPreferences', module: '@cngx/core' },
          },
        ],
        skipped: [],
      },
    ]);

    expect(createReport(plan).files).toEqual(['src/app/app.config.ts']);
  });

  it('carries the skipped steps and warnings', () => {
    const report = createReport(PLAN);

    expect(report.skipped.map((step) => step.id)).toEqual(['lint']);
    expect(report.warnings).toEqual(['no eslint config']);
  });

  it('leads the next steps with the doctor and links the docs', () => {
    const report = createReport(PLAN);

    expect(report.nextSteps[0]).toContain('npx @cngx/doctor');
    expect(report.links).toEqual([
      { label: 'cngx documentation', url: 'https://cngxjs.github.io/cngx/' },
    ]);
  });

  it('reports an empty plan as nothing changed', () => {
    const report = createReport(createChangePlan([]));

    expect(report.changes).toEqual([]);
    expect(report.files).toEqual([]);
    expect(report.skipped).toEqual([]);
  });

  it('does not mutate the plan and shares no arrays with it', () => {
    const before = JSON.stringify(PLAN);

    const report = createReport(PLAN);

    expect(JSON.stringify(PLAN)).toBe(before);
    expect(report.skipped).not.toBe(PLAN.skipped);
    expect(report.warnings).not.toBe(PLAN.warnings);
  });
});
