import { describe, expect, it } from 'vitest';

import {
  type AiTool,
  createPromptFlow,
  type MultiSelectQuestion,
  NG_ADD_PRESETS,
  type NgAddOptions,
  parseManifest,
  type PromptAdapter,
  type PromptChoice,
} from '../../engine';
import { createFacts } from '../../testing/onboarding';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers } from '../steps/model';
import { askOnboarding, askPreset, givenAnswers, libsFloorNote, presetChangeNote, presetDefaults, PRESET_CHOICES, withLibsFloor } from './questions';

const ESLINT = { path: 'eslint.config.js', module: 'cjs', editable: true, wired: false } as const;
const MATERIAL = {
  present: true,
  themeShape: 'map-api',
  themePath: 'src/styles.scss',
  themeVariable: undefined,
  density: 0,
} as const;

// Answers every question with its default and records which keys were asked.
function recordingAdapter(asked: string[]): PromptAdapter {
  return {
    select: (question) => {
      asked.push(question.key);
      return Promise.resolve(question.default);
    },
    multiSelect: (question) => {
      asked.push(question.key);
      return Promise.resolve(question.default);
    },
    confirm: (question) => {
      asked.push(question.key);
      return Promise.resolve(question.default);
    },
  };
}

async function ask(
  facts: ProjectFacts,
  options: NgAddOptions = {},
  interactive = true,
  installed: readonly string[] = [],
  adapter?: PromptAdapter,
  recorded?: OnboardingAnswers,
) {
  const asked: string[] = [];
  const flow = createPromptFlow({
    canPrompt: interactive,
    answers: givenAnswers(options),
    adapter: adapter ?? recordingAdapter(asked),
  });
  const { answers, explicitAiTools } = await askOnboarding(
    facts,
    options,
    flow,
    installed,
    recorded,
  );
  return { answers, explicitAiTools, asked };
}

// Records the AI tooling choices and answers them with `picks`.
function editorPicker(picks: readonly AiTool[]) {
  const shown: PromptChoice<string>[] = [];
  const adapter: PromptAdapter = {
    ...recordingAdapter([]),
    multiSelect: <T extends string>(question: MultiSelectQuestion<T>) => {
      if (question.key !== 'aiTools') {
        return Promise.resolve(question.default);
      }
      shown.push(...question.choices);
      return Promise.resolve(
        question.choices
          .map((choice) => choice.value)
          .filter((value) => picks.some((pick) => pick === value)),
      );
    },
  };
  return { adapter, shown };
}

const CLAUDE_ONLY = { claude: true, cursor: false, vscode: false } as const;

describe('presetDefaults', () => {
  it('installs only the packages for minimal', () => {
    expect(presetDefaults('minimal', createFacts())).toMatchObject({ theme: 'none', lint: false, a11yPreferences: false });
  });

  it('themes, lints and provides the a11y preferences for recommended', () => {
    expect(presetDefaults('recommended', createFacts())).toMatchObject({
      theme: 'cngx',
      lint: true,
      a11yPreferences: true,
      i18n: 'en',
    });
    expect(presetDefaults('recommended', createFacts({ material: MATERIAL })).theme).toBe('material');
  });

  it('adds the German pack, feedback, the floating fallback and the detected editors for full', () => {
    expect(
      presetDefaults('full', createFacts({ editors: { claude: true, cursor: false, vscode: true } })),
    ).toMatchObject({ i18n: 'de', feedback: true, floatingFallback: true, aiTools: ['claude', 'vscode'] });
  });
});

describe('askPreset', () => {
  it('offers every preset', () => {
    expect(PRESET_CHOICES.map((choice) => choice.value)).toEqual(NG_ADD_PRESETS);
  });

  it('asks the preset on a terminal and defaults to recommended', async () => {
    const asked: string[] = [];
    const flow = createPromptFlow({ canPrompt: true, adapter: recordingAdapter(asked) });

    expect(await askPreset({}, flow)).toBe('recommended');
    expect(asked).toEqual(['preset']);
  });

  it('takes --preset without asking', async () => {
    const asked: string[] = [];
    const flow = createPromptFlow({ canPrompt: true, adapter: recordingAdapter(asked) });

    expect(await askPreset({ preset: 'full' }, flow)).toBe('full');
    expect(asked).toEqual([]);
  });

  it('falls back to recommended without a terminal', async () => {
    const asked: string[] = [];
    const flow = createPromptFlow({ canPrompt: false, adapter: recordingAdapter(asked) });

    expect(await askPreset({}, flow)).toBe('recommended');
    expect(asked).toEqual([]);
  });

  it('defaults to the recorded preset on a re-run, asked or not', async () => {
    const asked: string[] = [];
    const terminal = createPromptFlow({ canPrompt: true, adapter: recordingAdapter(asked) });
    const noTerminal = createPromptFlow({ canPrompt: false, adapter: recordingAdapter([]) });

    expect(await askPreset({}, terminal, 'full')).toBe('full');
    expect(await askPreset({}, noTerminal, 'minimal')).toBe('minimal');
    expect(await askPreset({ preset: 'recommended' }, noTerminal, 'full')).toBe('recommended');
    expect(asked).toEqual(['preset']);
  });
});

describe('askOnboarding', () => {
  it('asks the packages, language and feedback for a plain app', async () => {
    const { asked } = await ask(createFacts());
    expect(asked).toEqual(['libs', 'i18n', 'feedback', 'aiTools']);
  });

  it('asks the theme only with Material and the lint entry only with an eslint config', async () => {
    const { asked } = await ask(createFacts({ material: MATERIAL, eslintConfig: ESLINT }));
    expect(asked).toEqual(['libs', 'theme', 'i18n', 'lint', 'feedback', 'aiTools']);
  });

  it('asks about runtime switching only for German', async () => {
    const { asked } = await ask(createFacts(), { i18n: 'de' });
    expect(asked).toEqual(['libs', 'runtimeSwitch', 'feedback', 'aiTools']);
  });

  it('skips the feedback question when @cngx/ui is not selected', async () => {
    const { asked, answers } = await ask(createFacts(), { libs: ['forms'] });
    expect(asked).toEqual(['i18n', 'aiTools']);
    expect(answers.feedback).toBe(false);
  });

  it('keeps an explicit answer whose question does not apply, so the step can say why', async () => {
    const { answers } = await ask(createFacts(), { libs: ['forms'], feedback: true, i18n: 'en', runtimeSwitch: true });
    expect(answers).toMatchObject({ feedback: true, runtimeSwitch: true });
  });

  it('lets flags answer and asks nothing they cover', async () => {
    const { asked, answers } = await ask(createFacts({ eslintConfig: ESLINT }), {
      libs: ['ui'],
      i18n: 'en',
      lint: false,
      feedback: true,
      theme: 'none',
      floatingFallback: true,
      aiTools: ['cursor'],
    });
    expect(asked).toEqual([]);
    expect(answers).toMatchObject({ libs: ['ui'], lint: false, feedback: true, theme: 'none', floatingFallback: true });
  });

  it('answers with the preset defaults without a terminal', async () => {
    const { asked, answers } = await ask(createFacts({ eslintConfig: ESLINT }), { preset: 'full' }, false);
    expect(asked).toEqual([]);
    expect(answers).toMatchObject({ preset: 'full', i18n: 'de', runtimeSwitch: false, lint: true, feedback: true });
  });

  it('selects every package and the detected editors when no list flag is given', async () => {
    const { answers } = await ask(
      createFacts({ editors: { claude: true, cursor: false, vscode: false } }),
      { preset: 'full' },
      false,
    );
    expect(answers.libs).toHaveLength(7);
    expect(answers.aiTools).toEqual(['claude']);
  });

  it('asks nothing core provides and drops those preset defaults when core is not selected', async () => {
    const { asked, answers } = await ask(createFacts(), { preset: 'full', libs: ['utils'] });

    expect(asked).toEqual(['aiTools']);
    expect(answers).toMatchObject({ i18n: 'en', a11yPreferences: false, floatingFallback: false, feedback: false });
  });

  it('keeps an explicit core answer without core, so the step can say why it is skipped', async () => {
    const { answers } = await ask(createFacts(), { libs: ['utils'], i18n: 'de', a11yPreferences: true });

    expect(answers).toMatchObject({ i18n: 'de', a11yPreferences: true });
  });

  it('rejects a list flag entry the question does not offer', async () => {
    await expect(
      ask(createFacts(), { aiTools: ['emacs'] } as unknown as NgAddOptions),
    ).rejects.toThrow('"emacs" is not a valid answer for --ai-tools.');
  });

  it('asks which editors get the cngx mcp server, with the detected ones preselected', async () => {
    const { adapter, shown } = editorPicker(['claude']);
    const { answers } = await ask(
      createFacts({ editors: { claude: true, cursor: false, vscode: true } }),
      {},
      true,
      [],
      adapter,
    );

    expect(shown).toEqual([
      { value: 'claude', name: 'Claude Code', checked: true },
      { value: 'cursor', name: 'Cursor', checked: false },
      { value: 'vscode', name: 'VS Code', checked: true },
    ]);
    expect(answers.aiTools).toEqual(['claude']);
  });

  it('does not preselect an editor whose cngx server the user removed since the last install', async () => {
    const { adapter, shown } = editorPicker([]);
    await ask(
      createFacts({
        editors: CLAUDE_ONLY,
        mcpConfigs: { claude: 'present', cursor: 'absent', vscode: 'absent' },
      }),
      {},
      true,
      ['ai-tools:claude'],
      adapter,
    );

    expect(shown.find((choice) => choice.value === 'claude')?.checked).toBe(false);
  });

  it('counts an interactive pick as explicit, so it overrides a recorded removal', async () => {
    const { adapter } = editorPicker(['claude']);
    const { explicitAiTools } = await ask(
      createFacts({ editors: CLAUDE_ONLY }),
      {},
      true,
      ['ai-tools:claude'],
      adapter,
    );

    expect(explicitAiTools).toEqual(['claude']);
  });

  it('lets the --ai-tools flag answer the question and counts it as explicit', async () => {
    const { asked, answers, explicitAiTools } = await ask(createFacts({ editors: CLAUDE_ONLY }), {
      aiTools: ['vscode'],
    });

    expect(asked).not.toContain('aiTools');
    expect(answers.aiTools).toEqual(['vscode']);
    expect(explicitAiTools).toEqual(['vscode']);
  });

  it('answers the editors with the preset default without a terminal and counts nothing as explicit', async () => {
    const { answers, explicitAiTools } = await ask(
      createFacts({ editors: CLAUDE_ONLY }),
      { preset: 'full' },
      false,
    );

    expect(answers.aiTools).toEqual(['claude']);
    expect(explicitAiTools).toEqual([]);
  });

  it('starts a re-run with the recorded preset from the recorded answers', async () => {
    const recorded = {
      ...presetDefaults('recommended', createFacts()),
      i18n: 'de',
      aiTools: ['claude'],
    } as const;
    const { answers, explicitAiTools } = await ask(
      createFacts(),
      {},
      false,
      [],
      undefined,
      recorded,
    );

    expect(answers).toMatchObject({ preset: 'recommended', i18n: 'de', aiTools: ['claude'] });
    expect(explicitAiTools).toEqual([]);
  });

  it('lets a flag override a recorded answer', async () => {
    const recorded = { ...presetDefaults('recommended', createFacts()), i18n: 'de' } as const;
    const { answers } = await ask(createFacts(), { i18n: 'en' }, false, [], undefined, recorded);

    expect(answers.i18n).toBe('en');
  });

  it('starts from the preset defaults when the run picks another preset than the recorded one', async () => {
    const recorded = { ...presetDefaults('recommended', createFacts()), i18n: 'en' } as const;
    const { answers } = await ask(
      createFacts(),
      { preset: 'full' },
      false,
      [],
      undefined,
      recorded,
    );

    expect(answers).toMatchObject({ preset: 'full', i18n: 'de', feedback: true });
  });

  it('preselects the recorded editors on a re-run instead of every detected one', async () => {
    const { adapter, shown } = editorPicker([]);
    const recorded = {
      ...presetDefaults('recommended', createFacts()),
      aiTools: ['claude'],
    } as const;
    await ask(
      createFacts({ editors: { claude: true, cursor: false, vscode: true } }),
      {},
      true,
      [],
      adapter,
      recorded,
    );

    expect(shown.map((choice) => [choice.value, choice.checked])).toEqual([
      ['claude', true],
      ['cursor', false],
      ['vscode', false],
    ]);
  });

  it('rejects a flag value no question offers', async () => {
    await expect(ask(createFacts(), { libs: ['charts'] } as unknown as NgAddOptions)).rejects.toThrow('"charts" is not a valid answer for --libs.');
  });
});

describe('givenAnswers', () => {
  it('keeps only the answer flags that were given', () => {
    expect(givenAnswers({ preset: 'full', quiet: true, lint: false, libs: ['ui'] })).toEqual({ lint: false, libs: ['ui'] });
  });

  it('drops the answers the parsed options leave undefined', () => {
    expect(givenAnswers({ libs: undefined, aiTools: undefined, lint: undefined })).toEqual({});
  });
});

describe('presetChangeNote', () => {
  const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;
  const recorded = presetDefaults('full', createFacts());

  it('names a re-run that starts from another preset than the recorded one', () => {
    expect(presetChangeNote({}, recorded, PROVENANCE).changes).toEqual([
      {
        kind: 'note',
        id: 'answers:preset',
        label: 'Start from the recommended preset',
        reason:
          'the last install used full, so its answers are not reused; pass --preset=full to keep them',
        provenance: PROVENANCE,
      },
    ]);
  });

  it('plans nothing on a first install or with the recorded preset', () => {
    expect(presetChangeNote({}, undefined, PROVENANCE).changes).toEqual([]);
    expect(presetChangeNote({ preset: 'full' }, recorded, PROVENANCE).changes).toEqual([]);
  });
});

describe('withLibsFloor', () => {
  const declaring = (...names: string[]) =>
    createFacts({
      manifest: parseManifest(JSON.stringify({ dependencies: Object.fromEntries(names.map((name) => [name, '0.1.0'])) })),
    });

  it('adds the recorded libs and the declared ones in package order', () => {
    const recorded = { ...presetDefaults('recommended', createFacts()), libs: ['ui'] as const };

    expect(withLibsFloor(['core'], declaring('@cngx/forms'), recorded)).toEqual(['core', 'forms', 'ui']);
  });

  it('reads a declaration from devDependencies too', () => {
    const facts = createFacts({ manifest: parseManifest(JSON.stringify({ devDependencies: { '@cngx/forms': '0.1.0' } })) });

    expect(withLibsFloor(['core'], facts, undefined)).toEqual(['core', 'forms']);
  });

  it('records no declared lib that is only a peer of the kept ones', () => {
    expect(withLibsFloor(['forms'], declaring('@cngx/utils', '@cngx/core', '@cngx/common'), undefined)).toEqual(['forms']);
  });

  it('records no declared lib that is only a peer of another declared one', () => {
    expect(withLibsFloor(['core'], declaring('@cngx/common', '@cngx/ui'), undefined)).toEqual(['core', 'ui']);
  });

  it('counts no @cngx package outside the libs', () => {
    expect(withLibsFloor(['core'], declaring('@cngx/themes', '@cngx/mcp', '@cngx/eslint-plugin'), undefined)).toEqual(['core']);
  });
});

describe('libsFloorNote', () => {
  const PROVENANCE = { source: 'ng-add', version: '0.1.0' } as const;

  it('names the libs the floor kept beyond the answer', () => {
    expect(libsFloorNote(['core'], ['core', 'forms', 'ui'], 'fixture-app', PROVENANCE).changes).toEqual([
      {
        kind: 'note',
        id: 'answers:libs',
        label: 'Keep the recorded packages',
        reason:
          '@cngx/forms, @cngx/ui stay because the last install recorded them or package.json declares them; to remove one, delete it from package.json and from projects.fixture-app.answers.libs in .cngx/install.json',
        provenance: PROVENANCE,
      },
    ]);
  });

  it('plans nothing when the answer holds every kept lib or its peers', () => {
    expect(libsFloorNote(['core', 'forms'], ['core', 'forms'], 'fixture-app', PROVENANCE).changes).toEqual([]);
    expect(libsFloorNote(['forms'], ['utils', 'core', 'forms'], 'fixture-app', PROVENANCE).changes).toEqual([]);
  });
});
