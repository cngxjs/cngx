import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type AddProvider, type Change, type ProviderCall, type ProviderLiteral, type StepResult } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { planProviders, RTL_LANGUAGES } from './providers';

function render(call: ProviderCall | ProviderLiteral): string {
  if ('literal' in call) {
    return call.literal;
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
      label: 'Skip the feedback providers',
      reason: 'toasts, alerts and banners come from @cngx/ui, which is not selected',
    });
    expect(byId(planProviders(createFacts(), createAnswers({ feedback: true }), VERSIONS), 'provider:feedback')).toMatchObject({
      call: { module: '@cngx/ui/feedback' },
    });
  });

  it('provides the floating fallback on request when common is installed', () => {
    const result = planProviders(createFacts(), createAnswers({ floatingFallback: true }), VERSIONS);
    expect(provided(result)).toContain('provideFloatingFallback()');
    expect(byId(result, 'provider:floating-fallback')).toMatchObject({ call: { module: '@cngx/common/popover' } });
    const withoutCommon = planProviders(
      createFacts(),
      createAnswers({ floatingFallback: true, libs: ['utils'], theme: 'none' }),
      VERSIONS,
    );
    expect(provided(withoutCommon)).not.toContain('provideFloatingFallback()');
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

    it('says why it does not apply without the German pack', () => {
      const result = planProviders(createFacts(), createAnswers({ runtimeSwitch: true, a11yPreferences: false }), VERSIONS);
      expect(result.changes).toEqual([
        expect.objectContaining({
          kind: 'note',
          label: 'Skip runtime language switching',
          reason: 'it switches to the German pack; pass --i18n=de with it',
        }),
      ]);
    });
  });

  it('skips providers the app already has', () => {
    const facts = createFacts({ rootProviders: ['provideRouter', 'provideA11yPreferences', 'provideCngxI18n'] });
    const result = planProviders(facts, createAnswers({ i18n: 'de', runtimeSwitch: true }), VERSIONS);

    expect(result.changes).toEqual([]);
    expect(result.skipped.map((step) => [step.id, step.reason])).toEqual([
      ['provider:a11y-preferences', 'already provided'],
      ['provider:i18n-file', 'already provided'],
      ['provider:i18n', 'already provided'],
    ]);
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
