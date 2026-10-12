import { describe, expect, it } from 'vitest';

import { createChangePlan, type JsonEntry, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { type InstallManifest, planManifest } from './manifest';
import { planManifestReruns, readRecordedAnswers } from './reruns';

const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;
const FIRST_RUN = '2026-10-11T10:00:00.000Z';

function written(result: StepResult): InstallManifest {
  const change = result.changes[0];
  if (change?.kind !== 'write-json') {
    throw new Error('no manifest write planned');
  }
  return Object.fromEntries(
    change.entries.map(([path, value]: JsonEntry) => [path[0], value]),
  ) as unknown as InstallManifest;
}

function firstRun(): InstallManifest {
  return written(
    planManifest(
      createFacts(),
      createAnswers(),
      VERSIONS,
      createChangePlan([]),
      undefined,
      FIRST_RUN,
    ),
  );
}

describe('readRecordedAnswers', () => {
  it('reads the answers an install recorded', () => {
    expect(readRecordedAnswers(firstRun())).toEqual(createAnswers());
  });

  it('reads no answers when one is missing or outside the vocabulary', () => {
    const manifest = firstRun();

    expect(
      readRecordedAnswers({ ...manifest, answers: { ...manifest.answers, theme: 'brand' } }),
    ).toBeUndefined();
    expect(
      readRecordedAnswers({
        ...manifest,
        answers: { ...manifest.answers, libs: ['core', 'charts'] },
      }),
    ).toBeUndefined();
    expect(
      readRecordedAnswers({ ...manifest, answers: { preset: 'recommended' } }),
    ).toBeUndefined();
  });
});

const NEXT = { ...VERSIONS, cngx: '0.2.0', mcp: '0.4.0' } as const;

function installed(ids: readonly string[]): InstallManifest {
  return {
    ...firstRun(),
    answers: JSON.parse(
      JSON.stringify(createAnswers({ aiTools: ['claude'] })),
    ) as InstallManifest['answers'],
    steps: ids.map((id) => ({ id, outcome: 'satisfied' as const, provenance: PROVENANCE })),
  };
}

function themeChanges(result: StepResult): StepResult['changes'] {
  return result.changes.filter((change) => change.id.startsWith('theme:'));
}

describe('planManifestReruns', () => {
  it('regenerates a helper README cngx wrote when the MCP version moved', () => {
    const facts = createFacts({
      helperReadme: { generated: true, fingerprint: 'old' },
      mcpConfigs: { claude: 'wired', cursor: 'absent', vscode: 'absent' },
    });

    const result = planManifestReruns(facts, installed(['helper-readme:file']), NEXT);

    expect(result.changes).toContainEqual(
      expect.objectContaining({
        kind: 'edit-file',
        id: 'helper-readme:file',
        path: '.cngx/README.md',
      }),
    );
  });

  it('names a recorded helper README that is gone instead of writing it again', () => {
    const result = planManifestReruns(createFacts(), installed(['helper-readme:file']), NEXT);

    expect(result.changes).toContainEqual(
      expect.objectContaining({ kind: 'note', id: 'helper-readme:file' }),
    );
    expect(result.changes.some((change) => change.kind === 'create-file')).toBe(false);
  });

  it('leaves the helper README alone while the MCP version stands', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: 'old' } });

    const result = planManifestReruns(facts, installed(['helper-readme:file']), {
      ...NEXT,
      mcp: VERSIONS.mcp,
    });

    expect(result.changes.map((change) => change.id)).not.toContain('helper-readme:file');
  });

  it('names a recorded theme step that is no longer in place instead of restoring it', () => {
    const result = planManifestReruns(
      createFacts(),
      installed(['theme:stylesheet', 'theme:file']),
      NEXT,
    );

    expect(themeChanges(result).map((change) => [change.kind, change.id])).toEqual([
      ['note', 'theme:stylesheet'],
      ['note', 'theme:file'],
      ['note', 'theme:entry'],
    ]);
    expect(result.changes[0]?.reason).toMatch(/run ng add @cngx\/core to restore it/);
  });

  it('names a theme step the answers ask for that was never installed', () => {
    const result = planManifestReruns(createFacts(), installed(['theme:file']), NEXT);

    expect(result.changes.find((change) => change.id === 'theme:stylesheet')?.reason).toMatch(
      /never installed; run ng add @cngx\/core to add it/,
    );
  });

  it('reports recorded theme steps in place as skipped', () => {
    const facts = createFacts({ cngxStylesheet: true, cngxThemePath: 'src/cngx-theme.css' });

    const result = planManifestReruns(
      facts,
      installed(['theme:stylesheet', 'theme:file', 'theme:entry']),
      NEXT,
    );

    expect(themeChanges(result)).toEqual([]);
    expect(result.skipped.map((step) => step.id)).toEqual([
      'theme:stylesheet',
      'theme:file',
      'theme:entry',
    ]);
  });

  it('says so when the recorded answers cannot be read', () => {
    const manifest = { ...firstRun(), answers: {} };

    const result = planManifestReruns(createFacts(), manifest, NEXT);

    expect(result.changes).toEqual([
      expect.objectContaining({ kind: 'note', id: 'manifest:answers' }),
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planManifestReruns(
        deepFreeze(createFacts()),
        deepFreeze(installed(['theme:file'])),
        deepFreeze(NEXT),
      ),
    ).not.toThrow();
  });
});
