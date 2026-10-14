import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  type AddProvider,
  type Change,
  CNGX_LIBS,
  type CngxLib,
  type ProviderArg,
  type StepResult,
} from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { selectedLibs } from './dependencies';
import { planProviders, RTL_LANGUAGES } from './providers';

function render(call: ProviderArg): string {
  if ('literal' in call) {
    return call.literal;
  }
  if ('array' in call) {
    return `[${call.array.map(render).join(', ')}]`;
  }
  if (call.reference === true) {
    return call.symbol;
  }
  return `${call.symbol}(${(call.args ?? []).map(render).join(', ')})`;
}

function provided(result: StepResult): readonly string[] {
  return result.changes
    .filter((change): change is AddProvider => change.kind === 'add-provider')
    .map((change) => render(change.call));
}

function byId(result: StepResult, id: string): Change | undefined {
  return result.changes.find((change) => change.id === id);
}

describe('planProviders', () => {
  it('provides the a11y preferences with persistence for recommended', () => {
    const result = planProviders(createFacts(), createAnswers(), VERSIONS);

    expect(provided(result)).toEqual(['provideA11yPreferences(withPersistence())']);
    expect(byId(result, 'provider:a11y-preferences')).toMatchObject({
      project: 'fixture-app',
      path: 'src/app/app.config.ts',
      call: { module: '@cngx/core', args: [{ symbol: 'withPersistence', module: '@cngx/core' }] },
    });
  });

  it('provides nothing the answers leave out', () => {
    expect(planProviders(createFacts(), createAnswers({ a11yPreferences: false }), VERSIONS)).toEqual({
      changes: [],
      skipped: [],
    });
  });

  it('sets the direction to rtl only for an RTL source locale', () => {
    for (const locale of ['ar', 'he-IL', 'fa_IR', 'UR']) {
      expect(provided(planProviders(createFacts({ sourceLocale: locale }), createAnswers(), VERSIONS))).toContain(
        "provideDirection('rtl')",
      );
    }
    expect(provided(planProviders(createFacts({ sourceLocale: 'de-AT' }), createAnswers(), VERSIONS))).not.toContain(
      "provideDirection('rtl')",
    );
  });

  it('provides toasts, alerts and banners when ui is selected and feedback confirmed', () => {
    expect(provided(planProviders(createFacts(), createAnswers({ feedback: true }), VERSIONS))).toContain(
      'provideFeedback(withToasts(), withAlerts(), withBanners())',
    );
    const withoutUi = planProviders(createFacts(), createAnswers({ feedback: true, libs: ['forms'] }), VERSIONS);
    expect(provided(withoutUi)).not.toContain('provideFeedback(withToasts(), withAlerts(), withBanners())');
    expect(byId(withoutUi, 'provider:feedback')).toMatchObject({
      kind: 'note',
      label: 'Skip toasts, alerts and banners',
      reason: 'it comes from @cngx/ui, which is not selected',
    });
    expect(byId(planProviders(createFacts(), createAnswers({ feedback: true }), VERSIONS), 'provider:feedback')).toMatchObject({
      call: { module: '@cngx/ui/feedback' },
    });
  });

  it('provides the floating fallback on request when common is installed', () => {
    const result = planProviders(createFacts(), createAnswers({ floatingFallback: true }), VERSIONS);
    expect(provided(result)).toContain('provideFloatingFallback(computePosition, [flip(), shift()])');
    expect(byId(result, 'provider:floating-fallback')).toMatchObject({
      call: {
        symbol: 'provideFloatingFallback',
        module: '@cngx/common/popover',
        args: [
          { symbol: 'computePosition', module: '@floating-ui/dom', reference: true },
          { array: [{ symbol: 'flip', module: '@floating-ui/dom' }, { symbol: 'shift', module: '@floating-ui/dom' }] },
        ],
      },
    });
    const withoutCommon = planProviders(
      createFacts(),
      createAnswers({ floatingFallback: true, libs: ['utils'], theme: 'none' }),
      VERSIONS,
    );
    expect(provided(withoutCommon)).not.toContain('provideFloatingFallback(computePosition, [flip(), shift()])');
    expect(byId(withoutCommon, 'provider:floating-fallback')).toMatchObject({
      kind: 'note',
      label: 'Skip the floating positioning fallback',
    });
  });

  it('provides the German pack for i18n de', () => {
    const result = planProviders(createFacts(), createAnswers({ i18n: 'de' }), VERSIONS);
    expect(provided(result)).toContain('provideCngxI18n(withPack(CNGX_LANGUAGE_DE))');
    expect(byId(result, 'provider:i18n')).toMatchObject({
      call: {
        module: '@cngx/core/i18n',
        args: [{ symbol: 'withPack', args: [{ symbol: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de', reference: true }] }],
      },
    });
  });

  describe('runtime switching', () => {
    it('provides a language signal from a generated file next to the app config', () => {
      const result = planProviders(createFacts(), createAnswers({ i18n: 'de', runtimeSwitch: true }), VERSIONS);
      const file = byId(result, 'provider:i18n-file');

      expect(provided(result)).toContain('provideCngxI18n(withPack(cngxLanguagePack))');
      expect(byId(result, 'provider:i18n')).toMatchObject({
        call: { args: [{ args: [{ symbol: 'cngxLanguagePack', module: './cngx-language', reference: true }] }] },
      });
      expect(file).toMatchObject({ kind: 'create-file', path: 'src/app/cngx-language.ts' });
      const content = file?.kind === 'create-file' ? file.content : '';
      expect(content).toContain("import { CNGX_LANGUAGE_DE } from '@cngx/core/i18n/de';");
      expect(content).toContain(
        'export const cngxLanguagePack = signal<CngxCompleteLanguagePack | undefined>(undefined);',
      );
      expect(content).toContain('export const CNGX_LANGUAGE_PACKS = { en: undefined, de: CNGX_LANGUAGE_DE } as const;');
    });

    it('starts in German for a German source locale', () => {
      const result = planProviders(
        createFacts({ sourceLocale: 'de-DE' }),
        createAnswers({ i18n: 'de', runtimeSwitch: true }),
        VERSIONS,
      );
      const file = byId(result, 'provider:i18n-file');
      expect(file?.kind === 'create-file' ? file.content : '').toContain(
        'signal<CngxCompleteLanguagePack | undefined>(CNGX_LANGUAGE_DE)',
      );
    });

    it('places the file next to an app config outside src/app', () => {
      const facts = createFacts({ appConfigPath: 'src/config/root.config.ts' });
      const result = planProviders(facts, createAnswers({ i18n: 'de', runtimeSwitch: true }), VERSIONS);
      expect(byId(result, 'provider:i18n-file')).toMatchObject({ path: 'src/config/cngx-language.ts' });
    });

    it('keeps a generated language file and still provides the pack from it', () => {
      const result = planProviders(
        createFacts({ languageFile: 'generated' }),
        createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes.map((change) => [change.kind, change.id])).toEqual([['add-provider', 'provider:i18n']]);
      expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([['provider:i18n-file', 'already generated']]);
    });

    it('notes a language file cngx did not write and plans neither the file nor the provider', () => {
      const result = planProviders(
        createFacts({ languageFile: 'foreign' }),
        createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes).toEqual([
        expect.objectContaining({
          kind: 'note',
          id: 'provider:i18n-file',
          label: 'Keep src/app/cngx-language.ts',
          reason: 'cngx did not write it, so runtime language switching is skipped; move it aside and run `ng add @cngx/core` again',
        }),
      ]);
      expect(result.skipped).toEqual([]);
    });

    it('names the edit when an existing language provider passes another pack', () => {
      const result = planProviders(
        createFacts({ rootProviders: ['provideCngxI18n'], languagePack: { text: 'CNGX_LANGUAGE_DE', name: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de' } }),
        createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes).toEqual([
        expect.objectContaining({ kind: 'create-file', id: 'provider:i18n-file', path: 'src/app/cngx-language.ts' }),
        expect.objectContaining({
          kind: 'note',
          id: 'provider:i18n-pack',
          label: 'Switch the language at runtime',
          reason:
            "provideCngxI18n in src/app/app.config.ts passes `withPack(CNGX_LANGUAGE_DE)`; pass `withPack(cngxLanguagePack)` with cngxLanguagePack imported from './cngx-language'",
        }),
      ]);
      expect(result.skipped).toEqual([]);
    });

    it('takes an aliased or namespaced cngxLanguagePack as a wired switch', () => {
      for (const text of ['pack', 'lang.cngxLanguagePack']) {
        const result = planProviders(
          createFacts({
            rootProviders: ['provideCngxI18n'],
            languageFile: 'generated',
            languagePack: { text, name: 'cngxLanguagePack', module: './cngx-language' },
          }),
          createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
          VERSIONS,
        );

        expect(result.changes).toEqual([]);
        expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
          ['provider:i18n', 'already provided'],
          ['provider:i18n-file', 'already generated'],
        ]);
      }
    });

    it('takes a cngxLanguagePack from another module as no switch and names the edit', () => {
      const result = planProviders(
        createFacts({
          rootProviders: ['provideCngxI18n'],
          languageFile: 'generated',
          languagePack: { text: 'cngxLanguagePack', name: 'cngxLanguagePack', module: '@acme/i18n' },
        }),
        createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes.map((change) => [change.kind, change.id])).toEqual([['note', 'provider:i18n-pack']]);
    });

    it('leaves a language file cngx did not write alone when the provider already passes its signal', () => {
      const result = planProviders(
        createFacts({
          rootProviders: ['provideCngxI18n'],
          languageFile: 'foreign',
          languagePack: { text: 'cngxLanguagePack', name: 'cngxLanguagePack', module: './cngx-language' },
        }),
        createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes).toEqual([]);
      expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
        ['provider:i18n', 'already provided'],
        ['provider:i18n-file', 'cngx did not write it; provideCngxI18n already passes cngxLanguagePack'],
      ]);
    });

    it('names the edit for a language provider without a pack', () => {
      const result = planProviders(
        createFacts({ rootProviders: ['provideCngxI18n'], languageFile: 'generated' }),
        createAnswers({ i18n: 'de', runtimeSwitch: true, a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes).toEqual([
        expect.objectContaining({ kind: 'note', reason: expect.stringContaining('passes no pack;') }),
      ]);
      expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([['provider:i18n-file', 'already generated']]);
    });

    it('keeps the plain skip without the runtime switch', () => {
      const result = planProviders(
        createFacts({ rootProviders: ['provideCngxI18n'], languagePack: { text: 'CNGX_LANGUAGE_DE', name: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de' } }),
        createAnswers({ i18n: 'de', a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes).toEqual([]);
      expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([['provider:i18n', 'already provided']]);
    });

    it('names the pack it keeps when an existing language provider passes its own', () => {
      const result = planProviders(
        createFacts({ rootProviders: ['provideCngxI18n'], languagePack: { text: 'MY_PACK', name: 'MY_PACK', module: './my-pack' } }),
        createAnswers({ i18n: 'de', a11yPreferences: false }),
        VERSIONS,
      );

      expect(result.changes).toEqual([]);
      expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
        ['provider:i18n', 'already passes `withPack(MY_PACK)`; cngx keeps that pack'],
      ]);
    });

    it('says why it does not apply without the German pack', () => {
      const result = planProviders(createFacts(), createAnswers({ runtimeSwitch: true, a11yPreferences: false }), VERSIONS);
      expect(result.changes).toEqual([
        expect.objectContaining({
          kind: 'note',
          id: 'provider:i18n-switch',
          label: 'Skip runtime language switching',
          reason: 'it switches to the German pack; pass --i18n=de with it',
        }),
      ]);
    });
  });

  it('skips the @cngx/core providers with a note when core is not selected', () => {
    const result = planProviders(
      createFacts({ sourceLocale: 'ar' }),
      createAnswers({ libs: ['utils'], theme: 'none', i18n: 'de' }),
      VERSIONS,
    );

    expect(provided(result)).toEqual([]);
    expect(result.changes.map((change) => [change.kind, change.label, change.reason])).toEqual([
      ['note', 'Skip the a11y preferences', 'it comes from @cngx/core, which is not selected'],
      ['note', 'Skip the rtl direction', 'it comes from @cngx/core, which is not selected'],
      ['note', 'Skip the German language pack', 'it comes from @cngx/core, which is not selected'],
    ]);
  });

  it('imports nothing from a @cngx package the selection leaves out', () => {
    const modules = (call: ProviderArg): readonly string[] => {
      if ('literal' in call) {
        return [];
      }
      return 'array' in call ? call.array.flatMap(modules) : [call.module, ...(call.args ?? []).flatMap(modules)];
    };
    const selections: readonly (readonly CngxLib[])[] = [['utils'], ['core'], ['common'], ['forms'], ['ui'], [...CNGX_LIBS]];

    for (const libs of selections) {
      const answers = createAnswers({ libs, theme: 'none', i18n: 'de', feedback: true, floatingFallback: true });
      const result = planProviders(createFacts({ sourceLocale: 'he' }), answers, VERSIONS);
      const imported = result.changes
        .filter((change): change is AddProvider => change.kind === 'add-provider')
        .flatMap((change) => modules(change.call))
        .filter((module) => module.startsWith('@cngx/'))
        .map((module) => module.split('/')[1]);

      expect(imported.filter((lib) => !selectedLibs(libs).some((selected) => selected === lib))).toEqual([]);
    }
  });

  it('skips providers the app already has', () => {
    const facts = createFacts({
      rootProviders: ['provideRouter', 'provideA11yPreferences', 'provideCngxI18n'],
      languageFile: 'generated',
      languagePack: { text: 'cngxLanguagePack', name: 'cngxLanguagePack', module: './cngx-language' },
    });
    const result = planProviders(facts, createAnswers({ i18n: 'de', runtimeSwitch: true }), VERSIONS);

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
      ['provider:a11y-preferences', 'already provided'],
      ['provider:i18n', 'already provided'],
      ['provider:i18n-file', 'already generated'],
    ]);
  });

  it('names the edit when an existing language provider passes no pack for German', () => {
    const result = planProviders(
      createFacts({ rootProviders: ['provideCngxI18n'] }),
      createAnswers({ i18n: 'de', a11yPreferences: false }),
      VERSIONS,
    );

    expect(result.changes).toEqual([
      expect.objectContaining({
        kind: 'note',
        id: 'provider:i18n-pack',
        label: 'Use the German language pack',
        reason:
          "provideCngxI18n in src/app/app.config.ts passes no pack; pass `withPack(CNGX_LANGUAGE_DE)` with CNGX_LANGUAGE_DE imported from '@cngx/core/i18n/de'",
      }),
    ]);
    expect(result.skipped).toEqual([]);
  });

  it('keeps its RTL list in step with the runtime list of @cngx/core/i18n', () => {
    const source = readFileSync(join(__dirname, '../../../i18n/provide-i18n.ts'), 'utf8');
    const block = /const RTL_LANGUAGES = new Set\(\[([^\]]*)\]\)/.exec(source)?.[1] ?? '';
    expect([...RTL_LANGUAGES]).toEqual([...block.matchAll(/'([a-z]+)'/g)].map((match) => match[1]));
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planProviders(
        deepFreeze(createFacts({ sourceLocale: 'ar' })),
        deepFreeze(createAnswers({ i18n: 'de', runtimeSwitch: true, feedback: true, floatingFallback: true })),
        deepFreeze(VERSIONS),
      ),
    ).not.toThrow();
  });
});
