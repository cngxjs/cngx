import { describe, expect, it } from 'vitest';

import { type ChangePlan, createChangePlan, type JsonEntry, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import {
  type InstallManifest,
  isSameInstall,
  parseInstallManifest,
  planManifest,
  planManifestUpdate,
  planUnreadableManifest,
  type ProjectRecord,
  recordedLibs,
  recordedStepIds,
} from './manifest';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;
const FIRST_RUN = '2026-10-11T10:00:00.000Z';
const SECOND_RUN = '2026-10-12T09:30:00.000Z';

const FIRST_PLAN: ChangePlan = createChangePlan([
  {
    changes: [
      {
        kind: 'add-dependency',
        id: 'dependency:@cngx/core',
        label: 'Add @cngx/core@0.1.0',
        reason: 'r',
        provenance: PROVENANCE,
        name: '@cngx/core',
        version: '0.1.0',
      },
      { kind: 'note', id: 'lint:config', label: 'Skip the eslint entry', reason: 'r', provenance: PROVENANCE },
    ],
    skipped: [{ id: 'dependency:@angular/cdk', label: 'Add @angular/cdk', reason: 'already declared as ^21.2.0' }],
  },
]);

// The same steps found in place on a second run.
const SECOND_PLAN: ChangePlan = createChangePlan([
  {
    changes: [{ kind: 'note', id: 'lint:config', label: 'Skip the eslint entry', reason: 'r', provenance: PROVENANCE }],
    skipped: [
      { id: 'dependency:@cngx/core', label: 'Add @cngx/core@0.1.0', reason: 'already pinned' },
      { id: 'dependency:@angular/cdk', label: 'Add @angular/cdk', reason: 'already declared as ^21.2.0' },
    ],
  },
]);

function writtenEntries(result: StepResult): readonly JsonEntry[] {
  const change = result.changes[0];
  if (change?.kind !== 'write-json') {
    throw new Error('no manifest write planned');
  }
  return change.entries;
}

// The record `planManifest` writes for the fixture project.
function written(result: StepResult): ProjectRecord {
  const entry = writtenEntries(result).find(([path]) => path[0] === 'projects');
  return entry?.[1] as unknown as ProjectRecord;
}

// The keys `planManifestUpdate` writes under the project's record.
function updated(result: StepResult): ProjectRecord {
  return Object.fromEntries(
    writtenEntries(result).map(([path, value]) => [path[2], value]),
  ) as unknown as ProjectRecord;
}

function file(projects: Readonly<Record<string, ProjectRecord>>): InstallManifest {
  return { schemaVersion: 2, projects };
}

function firstRun(): ProjectRecord {
  return written(planManifest(createFacts(), createAnswers(), VERSIONS, FIRST_PLAN, undefined, FIRST_RUN));
}

describe('planManifest', () => {
  it('writes the inputs of the first run', () => {
    const result = planManifest(createFacts(), createAnswers(), VERSIONS, FIRST_PLAN, undefined, FIRST_RUN);

    expect(result.changes[0]).toMatchObject({ kind: 'write-json', id: 'manifest:install', path: '.cngx/install.json' });
    expect(writtenEntries(result).map(([path]) => path)).toEqual([['schemaVersion'], ['projects', 'fixture-app']]);
    expect(writtenEntries(result)[0]?.[1]).toBe(2);
    expect(written(result)).toMatchObject({
      cngxVersion: '0.1.0',
      mcpVersion: '0.3.0',
      eslintPluginVersion: '0.2.0',
      angularVersion: '21.2.0',
      preset: 'recommended',
      answers: { preset: 'recommended', theme: 'cngx', lint: true },
      steps: [
        { id: 'dependency:@cngx/core', outcome: 'satisfied', provenance: PROVENANCE },
        { id: 'dependency:@angular/cdk', outcome: 'satisfied', provenance: PROVENANCE },
      ],
      createdAt: FIRST_RUN,
      updatedAt: FIRST_RUN,
    });
  });

  it('snapshots the facts without the app package.json', () => {
    const facts = written(planManifest(createFacts(), createAnswers(), VERSIONS, FIRST_PLAN, undefined, FIRST_RUN)).facts;

    expect(facts['manifest']).toBeUndefined();
    expect(facts['maturity']).toBe('fresh');
  });

  it('plans no write for a second run that finds every step in place, though the facts moved', () => {
    const result = planManifest(
      createFacts({ maturity: 'existing' }),
      createAnswers(),
      VERSIONS,
      SECOND_PLAN,
      firstRun(),
      SECOND_RUN,
    );

    expect(result.changes).toEqual([]);
    expect(result.skipped).toEqual([
      { id: 'manifest:install', label: 'Write .cngx/install.json', reason: `unchanged since ${FIRST_RUN}` },
    ]);
  });

  it('rewrites a changed answer with the original createdAt', () => {
    const next = written(
      planManifest(createFacts(), createAnswers({ i18n: 'de' }), VERSIONS, SECOND_PLAN, firstRun(), SECOND_RUN),
    );

    expect(next.createdAt).toBe(FIRST_RUN);
    expect(next.updatedAt).toBe(SECOND_RUN);
    expect(next.answers['i18n']).toBe('de');
  });

  it('keeps the provenance a step was first installed with', () => {
    const previous = { ...firstRun(), steps: [{ id: 'dependency:@cngx/core', outcome: 'satisfied' as const, provenance: { source: 'ng-add', version: '0.0.9' } }] };
    const next = written(
      planManifest(createFacts(), createAnswers({ i18n: 'de' }), VERSIONS, SECOND_PLAN, previous, SECOND_RUN),
    );

    expect(next.steps[0]).toEqual({
      id: 'dependency:@cngx/core',
      outcome: 'satisfied',
      provenance: { source: 'ng-add', version: '0.0.9' },
    });
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planManifest(
        deepFreeze(createFacts()),
        deepFreeze(createAnswers()),
        deepFreeze(VERSIONS),
        deepFreeze(FIRST_PLAN),
        deepFreeze(firstRun()),
        SECOND_RUN,
      ),
    ).not.toThrow();
  });
});

describe('isSameInstall', () => {
  it('ignores facts, timestamps and step order', () => {
    const a = firstRun();
    const b: ProjectRecord = {
      ...a,
      facts: { maturity: 'existing' },
      updatedAt: SECOND_RUN,
      steps: [...a.steps].reverse(),
    };

    expect(isSameInstall(a, b)).toBe(true);
  });

  it('sees a changed version or step set', () => {
    const a = firstRun();

    expect(isSameInstall(a, { ...a, mcpVersion: '0.4.0' })).toBe(false);
    expect(isSameInstall(a, { ...a, steps: a.steps.slice(1) })).toBe(false);
  });

  it('reads an Angular patch bump as the same install and a minor bump as a new one', () => {
    const a: ProjectRecord = { ...firstRun(), angularVersion: '21.2.5' };

    expect(isSameInstall(a, { ...a, angularVersion: '21.2.6' })).toBe(true);
    expect(isSameInstall(a, { ...a, angularVersion: '21.3.0' })).toBe(false);
  });
});

describe('parseInstallManifest', () => {
  it('reads a manifest cngx wrote and rejects anything else', () => {
    const manifest = file({ 'fixture-app': firstRun() });

    expect(parseInstallManifest(JSON.stringify(manifest))).toEqual(manifest);
    expect(parseInstallManifest('{ "schemaVersion": 2, "steps": [] }')).toBeUndefined();
    expect(parseInstallManifest('not json')).toBeUndefined();
  });

  it('reads no earlier schema', () => {
    expect(parseInstallManifest(JSON.stringify({ schemaVersion: 1, ...firstRun() }))).toBeUndefined();
    expect(parseInstallManifest(JSON.stringify({ ...file({ 'fixture-app': firstRun() }), schemaVersion: 1 }))).toBeUndefined();
  });

  it('reads the whole file as unreadable when one record is malformed', () => {
    const record = firstRun();
    const withOther = (other: unknown) => JSON.stringify({ schemaVersion: 2, projects: { 'fixture-app': record, other } });

    expect(parseInstallManifest(withOther({ ...record, steps: [null] }))).toBeUndefined();
    expect(parseInstallManifest(withOther({ ...record, steps: [{ id: 'x', outcome: 'done' }] }))).toBeUndefined();
    expect(parseInstallManifest(withOther({ ...record, cngxVersion: 1 }))).toBeUndefined();
    expect(parseInstallManifest(withOther({ ...record, answers: [] }))).toBeUndefined();
    expect(parseInstallManifest(withOther('record'))).toBeUndefined();
    expect(parseInstallManifest(withOther(record))?.projects['other']).toEqual(record);
  });
});

describe('recordedStepIds and recordedLibs', () => {
  it('read every project record', () => {
    const alpha: ProjectRecord = {
      ...firstRun(),
      answers: { ...firstRun().answers, libs: ['ui', 'core'] },
      steps: [{ id: 'a', outcome: 'satisfied', provenance: PROVENANCE }],
    };
    const beta: ProjectRecord = {
      ...firstRun(),
      answers: { ...firstRun().answers, libs: ['forms', 'core', 'nope'] },
      steps: [
        { id: 'b', outcome: 'satisfied', provenance: PROVENANCE },
        { id: 'a', outcome: 'satisfied', provenance: PROVENANCE },
      ],
    };

    expect(recordedStepIds(file({ alpha, beta }))).toEqual(['a', 'b']);
    expect(recordedLibs(file({ alpha, beta }))).toEqual(['core', 'ui']);
    expect(recordedStepIds(undefined)).toEqual([]);
    expect(recordedLibs(undefined)).toEqual([]);
  });
});

describe('planUnreadableManifest', () => {
  it('keeps the file under the copy path and empties it for the new record', () => {
    const result = planUnreadableManifest('fixture-app', 'not json', '.cngx/install.json.unreadable-2', VERSIONS);
    const [copy, reset] = result.changes;

    expect(copy).toMatchObject({
      kind: 'create-file',
      id: 'manifest:unreadable',
      label: 'Start a new install record',
      reason:
        '.cngx/install.json exists but cngx cannot read it; it is kept as .cngx/install.json.unreadable-2 and replaced by a record of fixture-app only',
      path: '.cngx/install.json.unreadable-2',
      content: 'not json',
    });
    expect(reset).toMatchObject({ kind: 'edit-file', path: '.cngx/install.json' });
    expect(reset?.kind === 'edit-file' ? reset.edit('not json') : undefined).toBe('{}\n');
  });
});

const NEXT = { ...VERSIONS, cngx: '0.2.0', mcp: '0.4.0' } as const;

function installed(ids: readonly string[]): ProjectRecord {
  return {
    ...firstRun(),
    answers: JSON.parse(JSON.stringify(createAnswers({ aiTools: ['claude'] }))) as ProjectRecord['answers'],
    steps: ids.map((id) => ({ id, outcome: 'satisfied' as const, provenance: PROVENANCE })),
  };
}

describe('planManifestUpdate', () => {
  const RERUN: ChangePlan = createChangePlan([
    {
      changes: [
        {
          kind: 'edit-file',
          id: 'helper-readme:file',
          label: 'Update .cngx/README.md',
          reason: 'r',
          provenance: { source: 'ng-add helper-readme', version: '0.2.0' },
          path: '.cngx/README.md',
          edit: (content) => content,
        },
      ],
      skipped: [],
    },
  ]);

  it('records the new versions, the re-run steps and the update time', () => {
    const result = planManifestUpdate('fixture-app', installed(['helper-readme:file', 'theme:file']), NEXT, RERUN, SECOND_RUN);
    const next = updated(result);

    expect(writtenEntries(result).map(([path]) => path.slice(0, 2))).toEqual(
      Array.from({ length: 4 }, () => ['projects', 'fixture-app']),
    );
    expect(Object.keys(next)).toEqual(['cngxVersion', 'mcpVersion', 'steps', 'updatedAt']);
    expect(next).toMatchObject({
      cngxVersion: '0.2.0',
      mcpVersion: '0.4.0',
      updatedAt: SECOND_RUN,
      steps: [
        { id: 'helper-readme:file', outcome: 'satisfied', provenance: { source: 'ng-add helper-readme', version: '0.2.0' } },
        { id: 'theme:file', outcome: 'satisfied', provenance: PROVENANCE },
      ],
    });
  });

  it('plans no write when versions and steps stand', () => {
    const result = planManifestUpdate('fixture-app', firstRun(), VERSIONS, createChangePlan([]), SECOND_RUN);

    expect(result.changes).toEqual([]);
    expect(result.skipped).toEqual([
      { id: 'manifest:install', label: 'Update .cngx/install.json for fixture-app', reason: `unchanged since ${FIRST_RUN}` },
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planManifestUpdate('fixture-app', deepFreeze(firstRun()), deepFreeze(NEXT), deepFreeze(RERUN), SECOND_RUN),
    ).not.toThrow();
  });
});
