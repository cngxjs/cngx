import { describe, expect, it } from 'vitest';

import { type ChangePlan, createChangePlan, createMemoryTree, type JsonEntry, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import {
  type InstallManifest,
  isSameInstall,
  parseInstallManifest,
  planManifest,
  planManifestReruns,
  readManifest,
  recordedAnswers,
  updateManifest,
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

function written(result: StepResult): InstallManifest {
  const change = result.changes[0];
  if (change?.kind !== 'write-json') {
    throw new Error('no manifest write planned');
  }
  return Object.fromEntries(change.entries.map(([path, value]: JsonEntry) => [path[0], value])) as unknown as InstallManifest;
}

function firstRun(): InstallManifest {
  return written(planManifest(createFacts(), createAnswers(), VERSIONS, FIRST_PLAN, undefined, FIRST_RUN));
}

describe('planManifest', () => {
  it('writes the inputs of the first run', () => {
    const result = planManifest(createFacts(), createAnswers(), VERSIONS, FIRST_PLAN, undefined, FIRST_RUN);

    expect(result.changes[0]).toMatchObject({ kind: 'write-json', id: 'manifest:install', path: '.cngx/install.json' });
    expect(written(result)).toMatchObject({
      schemaVersion: 1,
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
    const b: InstallManifest = {
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
});

describe('parseInstallManifest', () => {
  it('reads a manifest cngx wrote and rejects anything else', () => {
    expect(parseInstallManifest(JSON.stringify(firstRun()))?.createdAt).toBe(FIRST_RUN);
    expect(parseInstallManifest('{ "schemaVersion": 2, "steps": [] }')).toBeUndefined();
    expect(parseInstallManifest('not json')).toBeUndefined();
  });

  it('reads a hand-edited manifest with a malformed step or field as no previous install', () => {
    const manifest = firstRun();

    expect(parseInstallManifest(JSON.stringify({ ...manifest, steps: [null] }))).toBeUndefined();
    expect(parseInstallManifest(JSON.stringify({ ...manifest, steps: [{ id: 'x', outcome: 'done' }] }))).toBeUndefined();
    expect(parseInstallManifest(JSON.stringify({ ...manifest, cngxVersion: 1 }))).toBeUndefined();
    expect(parseInstallManifest(JSON.stringify({ ...manifest, answers: [] }))).toBeUndefined();
    expect(parseInstallManifest(JSON.stringify(manifest))).toEqual(manifest);
  });
});

describe('readManifest', () => {
  it('reads the install manifest from the tree', () => {
    const tree = createMemoryTree({ '.cngx/install.json': JSON.stringify(firstRun()) });

    expect(readManifest(tree)).toEqual(firstRun());
  });

  it('reads no manifest from a tree without one or with a foreign file', () => {
    expect(readManifest(createMemoryTree())).toBeUndefined();
    expect(readManifest(createMemoryTree({ '.cngx/install.json': '[]' }))).toBeUndefined();
  });
});

describe('recordedAnswers', () => {
  it('reads the answers an install recorded', () => {
    expect(recordedAnswers(firstRun())).toEqual(createAnswers());
  });

  it('reads no answers when one is missing or outside the vocabulary', () => {
    const manifest = firstRun();

    expect(recordedAnswers({ ...manifest, answers: { ...manifest.answers, theme: 'brand' } })).toBeUndefined();
    expect(recordedAnswers({ ...manifest, answers: { ...manifest.answers, libs: ['core', 'charts'] } })).toBeUndefined();
    expect(recordedAnswers({ ...manifest, answers: { preset: 'recommended' } })).toBeUndefined();
  });
});

const NEXT = { ...VERSIONS, cngx: '0.2.0', mcp: '0.4.0' } as const;

function installed(ids: readonly string[]): InstallManifest {
  return {
    ...firstRun(),
    answers: JSON.parse(JSON.stringify(createAnswers({ aiTools: ['claude'] }))) as InstallManifest['answers'],
    steps: ids.map((id) => ({ id, outcome: 'satisfied' as const, provenance: PROVENANCE })),
  };
}

describe('planManifestReruns', () => {
  it('regenerates a helper README cngx wrote when the MCP version moved', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: 'old' }, mcpConfigs: { claude: 'wired', cursor: 'absent', vscode: 'absent' } });

    const result = planManifestReruns(facts, installed(['helper-readme:file']), NEXT);

    expect(result.changes).toContainEqual(
      expect.objectContaining({ kind: 'edit-file', id: 'helper-readme:file', path: '.cngx/README.md' }),
    );
  });

  it('names a recorded helper README that is gone instead of writing it again', () => {
    const result = planManifestReruns(createFacts(), installed(['helper-readme:file']), NEXT);

    expect(result.changes).toContainEqual(expect.objectContaining({ kind: 'note', id: 'helper-readme:file' }));
    expect(result.changes.some((change) => change.kind === 'create-file')).toBe(false);
  });

  it('leaves the helper README alone while the MCP version stands', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: 'old' } });

    const result = planManifestReruns(facts, installed(['helper-readme:file']), { ...NEXT, mcp: VERSIONS.mcp });

    expect(result.changes.map((change) => change.id)).not.toContain('helper-readme:file');
  });

  it('names a recorded theme step that is no longer in place instead of restoring it', () => {
    const result = planManifestReruns(createFacts(), installed(['theme:stylesheet', 'theme:file']), NEXT);

    expect(result.changes.map((change) => [change.kind, change.id])).toEqual([
      ['note', 'theme:stylesheet'],
      ['note', 'theme:file'],
    ]);
    expect(result.changes[0]?.reason).toMatch(/run ng add @cngx\/core to restore it/);
  });

  it('reports recorded theme steps in place as skipped', () => {
    const facts = createFacts({ cngxStylesheet: true, cngxThemePath: 'src/cngx-theme.css' });

    const result = planManifestReruns(facts, installed(['theme:stylesheet', 'theme:file', 'theme:entry']), NEXT);

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => step.id)).toEqual(['theme:stylesheet', 'theme:file', 'theme:entry']);
  });

  it('says so when the recorded answers cannot be read', () => {
    const manifest = { ...firstRun(), answers: {} };

    const result = planManifestReruns(createFacts(), manifest, NEXT);

    expect(result.changes).toEqual([expect.objectContaining({ kind: 'note', id: 'manifest:answers' })]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planManifestReruns(deepFreeze(createFacts()), deepFreeze(installed(['theme:file'])), deepFreeze(NEXT)),
    ).not.toThrow();
  });
});

describe('updateManifest', () => {
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
    const next = written(updateManifest(installed(['helper-readme:file', 'theme:file']), NEXT, RERUN, SECOND_RUN));

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
    const result = updateManifest(firstRun(), VERSIONS, createChangePlan([]), SECOND_RUN);

    expect(result.changes).toEqual([]);
    expect(result.skipped).toEqual([
      { id: 'manifest:install', label: 'Update .cngx/install.json', reason: `unchanged since ${FIRST_RUN}` },
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      updateManifest(deepFreeze(firstRun()), deepFreeze(NEXT), deepFreeze(RERUN), SECOND_RUN),
    ).not.toThrow();
  });
});
