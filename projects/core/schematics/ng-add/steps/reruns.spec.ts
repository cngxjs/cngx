import { describe, expect, it } from 'vitest';

import { createChangePlan, type JsonEntry, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { type InstallManifest, planManifest } from './manifest';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';
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

// What a preset answers before any flag; the shell passes `presetDefaults`.
function defaultsFor(preset: OnboardingAnswers['preset']): OnboardingAnswers {
  return createAnswers({ preset, floatingFallback: preset === 'full' });
}

const read = (manifest: InstallManifest) => readRecordedAnswers(manifest, defaultsFor);
const rerun = (facts: ProjectFacts, manifest: InstallManifest, versions: Versions) =>
  planManifestReruns(facts, manifest, versions, defaultsFor);

describe('readRecordedAnswers', () => {
  it('reads the answers an install recorded', () => {
    expect(read(firstRun())).toEqual(createAnswers());
  });

  it('fills an answer a newer release added from the recorded preset default', () => {
    const { floatingFallback: _dropped, aiTools: _alsoDropped, ...older } = firstRun().answers;

    expect(read({ ...firstRun(), answers: { ...older, preset: 'full' } })).toEqual(
      createAnswers({ preset: 'full', floatingFallback: true, aiTools: [] }),
    );
  });

  it('reads no answers when the preset is missing or a recorded answer is outside the vocabulary', () => {
    const manifest = firstRun();
    const { preset: _preset, ...withoutPreset } = manifest.answers;

    expect(read({ ...manifest, answers: { ...manifest.answers, theme: 'brand' } })).toBeUndefined();
    expect(read({ ...manifest, answers: { ...manifest.answers, libs: ['core', 'charts'] } })).toBeUndefined();
    expect(read({ ...manifest, answers: { ...manifest.answers, lint: 'yes' } })).toBeUndefined();
    expect(read({ ...manifest, answers: withoutPreset })).toBeUndefined();
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

    const result = rerun(facts, installed(['helper-readme:file']), NEXT);

    expect(result.changes).toContainEqual(
      expect.objectContaining({
        kind: 'edit-file',
        id: 'helper-readme:file',
        path: '.cngx/README.md',
      }),
    );
  });

  it('leaves an editor the user removed out of the regenerated README', () => {
    const facts = createFacts({
      helperReadme: { generated: true, fingerprint: 'old' },
      mcpConfigs: { claude: 'present', cursor: 'absent', vscode: 'wired' },
      mcpPins: { claude: undefined, cursor: undefined, vscode: '0.3.0' },
    });
    const manifest = {
      ...installed(['helper-readme:file', 'ai-tools:claude', 'ai-tools:vscode']),
      answers: JSON.parse(JSON.stringify(createAnswers({ aiTools: ['claude', 'vscode'] }))) as InstallManifest['answers'],
    };

    const readme = rerun(facts, manifest, NEXT).changes.find((change) => change.id === 'helper-readme:file');

    expect(readme?.kind).toBe('edit-file');
    const content = readme?.kind === 'edit-file' ? readme.edit('') : '';
    expect(content).toContain('- `.vscode/mcp.json`');
    expect(content).not.toContain('- `.mcp.json`');
    expect(content).not.toContain('claude mcp list');
  });

  it('names a recorded helper README that is gone instead of writing it again', () => {
    const result = rerun(createFacts(), installed(['helper-readme:file']), NEXT);

    expect(result.changes).toContainEqual(
      expect.objectContaining({ kind: 'note', id: 'helper-readme:file' }),
    );
    expect(result.changes.some((change) => change.kind === 'create-file')).toBe(false);
  });

  it('leaves the helper README alone while the MCP version stands', () => {
    const facts = createFacts({ helperReadme: { generated: true, fingerprint: 'old' } });

    const result = rerun(facts, installed(['helper-readme:file']), {
      ...NEXT,
      mcp: VERSIONS.mcp,
    });

    expect(result.changes.map((change) => change.id)).not.toContain('helper-readme:file');
  });

  it('names a recorded theme step that is no longer in place instead of restoring it', () => {
    const result = rerun(
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
    const result = rerun(createFacts(), installed(['theme:file']), NEXT);

    expect(result.changes.find((change) => change.id === 'theme:stylesheet')?.reason).toMatch(
      /never installed; run ng add @cngx\/core to add it/,
    );
  });

  it('names only the theme file when its build entry is still listed', () => {
    const facts = createFacts({ cngxStylesheet: true, cngxThemeListed: true });

    const result = rerun(facts, installed(['theme:stylesheet', 'theme:file', 'theme:entry']), NEXT);

    expect(themeChanges(result).map((change) => [change.kind, change.id])).toEqual([['note', 'theme:file']]);
    expect(result.skipped.map((step) => step.id)).toContain('theme:entry');
  });

  it('reports recorded theme steps in place as skipped', () => {
    const facts = createFacts({ cngxStylesheet: true, cngxThemePath: 'src/cngx-theme.css' });

    const result = rerun(
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

    const result = rerun(createFacts(), manifest, NEXT);

    expect(result.changes).toEqual([
      expect.objectContaining({ kind: 'note', id: 'manifest:answers' }),
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      rerun(
        deepFreeze(createFacts()),
        deepFreeze(installed(['theme:file'])),
        deepFreeze(NEXT),
      ),
    ).not.toThrow();
  });
});
