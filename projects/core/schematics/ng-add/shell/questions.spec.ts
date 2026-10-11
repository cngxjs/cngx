import { describe, expect, it } from 'vitest';

import { createPromptFlow, type NgAddOptions, type PromptAdapter } from '../../engine';
import { createFacts } from '../../testing/onboarding';
import { type ProjectFacts } from '../detect/detect';
import { askOnboarding, givenAnswers, presetDefaults } from './questions';

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

async function ask(facts: ProjectFacts, options: NgAddOptions = {}, interactive = true) {
  const asked: string[] = [];
  const flow = createPromptFlow({
    canPrompt: interactive,
    answers: givenAnswers(options),
    adapter: recordingAdapter(asked),
  });
  return { answers: await askOnboarding(facts, options, flow), asked };
}

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

describe('askOnboarding', () => {
  it('asks the packages, language and feedback for a plain app', async () => {
    const { asked } = await ask(createFacts());
    expect(asked).toEqual(['libs', 'i18n', 'feedback']);
  });

  it('asks the theme only with Material and the lint entry only with an eslint config', async () => {
    const { asked } = await ask(createFacts({ material: MATERIAL, eslintConfig: ESLINT }));
    expect(asked).toEqual(['libs', 'theme', 'i18n', 'lint', 'feedback']);
  });

  it('asks about runtime switching only for German', async () => {
    const { asked } = await ask(createFacts(), { i18n: 'de' });
    expect(asked).toEqual(['libs', 'runtimeSwitch', 'feedback']);
  });

  it('skips the feedback question when @cngx/ui is not selected', async () => {
    const { asked, answers } = await ask(createFacts(), { libs: ['forms'] });
    expect(asked).toEqual(['i18n']);
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
    });
    expect(asked).toEqual([]);
    expect(answers).toMatchObject({ libs: ['ui'], lint: false, feedback: true, theme: 'none', floatingFallback: true });
  });

  it('answers with the preset defaults without a terminal', async () => {
    const { asked, answers } = await ask(createFacts({ eslintConfig: ESLINT }), { preset: 'full' }, false);
    expect(asked).toEqual([]);
    expect(answers).toMatchObject({ preset: 'full', i18n: 'de', runtimeSwitch: false, lint: true, feedback: true });
  });

  it('selects every package and the detected editors when the schema registry passes empty lists', async () => {
    const { answers } = await ask(
      createFacts({ editors: { claude: true, cursor: false, vscode: false } }),
      { preset: 'full', libs: [], aiTools: [] },
      false,
    );
    expect(answers.libs).toHaveLength(7);
    expect(answers.aiTools).toEqual(['claude']);
  });

  it('rejects a flag value no question offers', async () => {
    await expect(ask(createFacts(), { libs: ['charts'] })).rejects.toThrow('"charts" is not a valid answer for libs.');
  });
});

describe('givenAnswers', () => {
  it('keeps only the answer flags that were given', () => {
    expect(givenAnswers({ preset: 'full', quiet: true, lint: false, libs: ['ui'] })).toEqual({ lint: false, libs: ['ui'] });
  });

  it('reads the empty list the schema registry fills in for an unset array as not given', () => {
    expect(givenAnswers({ libs: [], aiTools: [] })).toEqual({});
  });
});
