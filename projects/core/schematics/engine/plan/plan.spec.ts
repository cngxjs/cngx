import { describe, expect, it } from 'vitest';

import { type Change, type StepResult } from './change';
import { createChangePlan, describeChangePlan } from './plan';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;

const DEPENDENCY: Change = {
  kind: 'add-dependency',
  id: 'dependency:@cngx/core',
  label: 'Add @cngx/core@0.1.0',
  reason: 'lockstep with @cngx/ui',
  provenance: PROVENANCE,
  name: '@cngx/core',
  version: '0.1.0',
};

const PROVIDER: Change = {
  kind: 'add-provider',
  id: 'provider:a11y',
  label: 'Add provideA11yPreferences(withPersistence())',
  reason: 'recommended preset',
  provenance: PROVENANCE,
  project: 'app',
  call: { symbol: 'provideA11yPreferences', module: '@cngx/core' },
};

const DEPENDENCIES: StepResult = { changes: [DEPENDENCY], skipped: [] };
const PROVIDERS: StepResult = {
  changes: [PROVIDER],
  skipped: [{ id: 'style-import', label: 'Import cngx.css', reason: 'styles.css already imports it' }],
};

describe('createChangePlan', () => {
  it('concatenates changes and skipped entries in step order', () => {
    const plan = createChangePlan([DEPENDENCIES, PROVIDERS]);

    expect(plan.changes.map((change) => change.id)).toEqual(['dependency:@cngx/core', 'provider:a11y']);
    expect(plan.skipped.map((step) => step.id)).toEqual(['style-import']);
    expect(plan.warnings).toEqual([]);
  });

  it('carries the warnings it is given', () => {
    expect(createChangePlan([], ['no eslint config']).warnings).toEqual(['no eslint config']);
  });

  it('does not mutate its inputs', () => {
    const results = [DEPENDENCIES, PROVIDERS];
    const warnings = ['w'];
    const before = JSON.stringify({ results, warnings });

    const plan = createChangePlan(results, warnings);

    expect(JSON.stringify({ results, warnings })).toBe(before);
    expect(plan.warnings).not.toBe(warnings);
  });
});

describe('describeChangePlan', () => {
  it('lists planned changes, idempotent hits and warnings', () => {
    const plan = createChangePlan([DEPENDENCIES, PROVIDERS], ['no eslint config found']);

    expect(describeChangePlan(plan)).toBe(
      [
        'Planned (2):',
        '  + Add @cngx/core@0.1.0 - lockstep with @cngx/ui',
        '  + Add provideA11yPreferences(withPersistence()) - recommended preset',
        'Already in place (1):',
        '  = Import cngx.css - styles.css already imports it',
        'Warnings (1):',
        '  ! no eslint config found',
      ].join('\n'),
    );
  });

  it('omits empty sections', () => {
    expect(describeChangePlan(createChangePlan([DEPENDENCIES]))).toBe(
      ['Planned (1):', '  + Add @cngx/core@0.1.0 - lockstep with @cngx/ui'].join('\n'),
    );
  });

  it('says so when there is nothing to do', () => {
    expect(describeChangePlan(createChangePlan([]))).toBe('Nothing to change.');
  });
});
