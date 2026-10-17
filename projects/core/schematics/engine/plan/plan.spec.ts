import { describe, expect, it } from 'vitest';

import { type Change, type SkippedStep, type StepResult } from './change';
import { createChangePlan, planSections } from './plan';

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

describe('planSections', () => {
  const cngx = (name: string, overrides: Partial<Change> = {}): Change =>
    ({ ...DEPENDENCY, id: `dependency:@cngx/${name}`, label: `Add @cngx/${name}@0.1.0`, name: `@cngx/${name}`, ...overrides }) as Change;

  it('folds the lockstep @cngx additions into one line where the first stood, and counts every change', () => {
    const cdk: Change = { ...DEPENDENCY, id: 'dependency:@angular/cdk', label: 'Add @angular/cdk@^21.2.0', name: '@angular/cdk', version: '^21.2.0' };
    const plan = createChangePlan([{ changes: [cngx('utils'), cngx('core'), cdk, cngx('ui'), PROVIDER], skipped: [] }]);

    expect(planSections(plan)[0]).toEqual({
      title: 'Planned',
      marker: '+',
      count: 5,
      items: [
        { label: 'Add 3 @cngx packages at 0.1.0', reason: 'utils, core, ui' },
        { label: 'Add @angular/cdk@^21.2.0', reason: 'lockstep with @cngx/ui' },
        { label: 'Add provideA11yPreferences(withPersistence())', reason: 'recommended preset' },
      ],
    });
  });

  it('keeps a single @cngx addition, a devDependency and one with its own reason on their own lines', () => {
    const plan = createChangePlan([
      {
        changes: [
          cngx('core'),
          cngx('eslint-plugin', { dev: true } as Partial<Change>),
          cngx('forms', { reason: 'replaces ^0.0.9; every @cngx package stays on one version' }),
        ],
        skipped: [],
      },
    ]);

    expect(planSections(plan)[0]?.items.map((item) => item.label)).toEqual([
      'Add @cngx/core@0.1.0',
      'Add @cngx/eslint-plugin@0.1.0',
      'Add @cngx/forms@0.1.0',
    ]);
  });

  it('folds the lockstep @cngx packages already in place the same way', () => {
    const pinned = (name: string, reason = 'already pinned'): SkippedStep => ({
      id: `dependency:@cngx/${name}`,
      label: `Add @cngx/${name}@0.1.0`,
      reason,
    });
    const plan = createChangePlan([
      {
        changes: [],
        skipped: [
          pinned('utils'),
          { id: 'style-import', label: 'Import cngx.css', reason: 'styles.css already imports it' },
          pinned('core'),
          pinned('eslint-plugin', 'already declared as ^0.2.0'),
          { id: 'dependency:@cngx/eslint-plugin', label: 'Add @cngx/eslint-plugin@0.1.0', reason: 'already pinned' },
        ],
      },
    ]);

    expect(planSections(plan)[0]).toEqual({
      title: 'Already in place',
      marker: '=',
      count: 5,
      items: [
        { label: 'Add 2 @cngx packages at 0.1.0', reason: 'already pinned' },
        { label: 'Import cngx.css', reason: 'styles.css already imports it' },
        { label: 'Add @cngx/eslint-plugin@0.1.0', reason: 'already declared as ^0.2.0' },
        { label: 'Add @cngx/eslint-plugin@0.1.0', reason: 'already pinned' },
      ],
    });
  });
});
