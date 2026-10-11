import { posix } from 'node:path';

import {
  type Change,
  createProvenanceStamp,
  type Provenance,
  type ProviderCall,
  skipChange,
  type StepResult,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { selectedLibs } from './dependencies';
import { type OnboardingAnswers, type Versions } from './model';

// Same list as the runtime direction lookup in @cngx/core/i18n
// (`provide-i18n.ts`); the spec keeps them in step.
export const RTL_LANGUAGES: ReadonlySet<string> = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'he',
  'iw',
  'ks',
  'ps',
  'sd',
  'syr',
  'ug',
  'ur',
  'yi',
]);

const LANGUAGE_FILE = 'cngx-language';
const LANGUAGE_SIGNAL = 'cngxLanguagePack';

function isRtl(locale: string | undefined): boolean {
  const language = locale?.split(/[-_]/)[0]?.toLowerCase();
  return language !== undefined && RTL_LANGUAGES.has(language);
}

function startsGerman(locale: string | undefined): boolean {
  return locale?.split(/[-_]/)[0]?.toLowerCase() === 'de';
}

function renderLanguageFile(version: string, german: boolean): string {
  return [
    createProvenanceStamp('ng-add providers', version).trimEnd(),
    "import { signal } from '@angular/core';",
    "import { type CngxCompleteLanguagePack } from '@cngx/core/i18n';",
    "import { CNGX_LANGUAGE_DE } from '@cngx/core/i18n/de';",
    '',
    '/** The language packs the app can switch between; `undefined` is English. */',
    'export const CNGX_LANGUAGE_PACKS = { en: undefined, de: CNGX_LANGUAGE_DE } as const;',
    '',
    '/** The active cngx language pack. Set it to switch every cngx string at runtime. */',
    `export const ${LANGUAGE_SIGNAL} = signal<CngxCompleteLanguagePack | undefined>(${german ? 'CNGX_LANGUAGE_DE' : 'undefined'});`,
    '',
  ].join('\n');
}

interface Wanted {
  readonly id: string;
  readonly label: string;
  readonly reason: string;
  readonly call: ProviderCall;
}

function i18nPack(answers: OnboardingAnswers): ProviderCall {
  const pack: ProviderCall = answers.runtimeSwitch
    ? { symbol: LANGUAGE_SIGNAL, module: `./${LANGUAGE_FILE}`, reference: true }
    : { symbol: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de', reference: true };
  return {
    symbol: 'provideCngxI18n',
    module: '@cngx/core/i18n',
    args: [{ symbol: 'withPack', module: '@cngx/core/i18n', args: [pack] }],
  };
}

function wantedProviders(facts: ProjectFacts, answers: OnboardingAnswers): readonly Wanted[] {
  const libs = selectedLibs(answers.libs);
  const feedback = (symbol: string): ProviderCall => ({ symbol, module: '@cngx/ui/feedback' });
  return [
    ...(answers.a11yPreferences
      ? [
          {
            id: 'provider:a11y-preferences',
            label: 'Provide the a11y preferences',
            reason: 'density, text scale, motion and contrast stay inert without it',
            call: {
              symbol: 'provideA11yPreferences',
              module: '@cngx/core',
              args: [{ symbol: 'withPersistence', module: '@cngx/core' }],
            },
          },
        ]
      : []),
    ...(isRtl(facts.sourceLocale)
      ? [
          {
            id: 'provider:direction',
            label: 'Provide the rtl direction',
            reason: `the source locale ${facts.sourceLocale ?? ''} is written right to left`,
            call: { symbol: 'provideDirection', module: '@cngx/core', args: [{ literal: "'rtl'" }] },
          },
        ]
      : []),
    ...(answers.feedback && libs.includes('ui')
      ? [
          {
            id: 'provider:feedback',
            label: 'Provide toasts, alerts and banners',
            reason: 'CngxToaster, CngxAlerter and CngxBanner are not provided at the root',
            call: {
              ...feedback('provideFeedback'),
              args: [feedback('withToasts'), feedback('withAlerts'), feedback('withBanners')],
            },
          },
        ]
      : []),
    ...(answers.floatingFallback && libs.includes('common')
      ? [
          {
            id: 'provider:floating-fallback',
            label: 'Provide the floating positioning fallback',
            reason: 'positions popovers where CSS anchor positioning is missing',
            call: { symbol: 'provideFloatingFallback', module: '@cngx/common/popover' },
          },
        ]
      : []),
    ...(answers.i18n === 'de'
      ? [
          {
            id: 'provider:i18n',
            label: 'Provide the German language pack',
            reason: answers.runtimeSwitch ? 'switchable at runtime' : 'every cngx string in German',
            call: i18nPack(answers),
          },
        ]
      : []),
  ];
}

/**
 * Plans the root providers onboarding wires into the app config (or the
 * root NgModule; `addRootProvider` finds either): the a11y preferences, the
 * rtl direction for an RTL source locale, the feedback services, the
 * floating fallback and the language pack. A provider already present is
 * skipped, so a second run plans nothing.
 */
export function planProviders(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const languageFile = posix.join(posix.dirname(facts.appConfigPath), `${LANGUAGE_FILE}.ts`);
  const changes = wantedProviders(facts, answers).flatMap((wanted): readonly Change[] => {
    const provider: Change = { kind: 'add-provider', ...wanted, provenance, project: facts.project };
    if (wanted.id !== 'provider:i18n' || !answers.runtimeSwitch) {
      return [provider];
    }
    const file: Change = {
      kind: 'create-file',
      id: 'provider:i18n-file',
      label: `Create ${languageFile}`,
      reason: 'the signal that switches the language pack',
      provenance,
      path: languageFile,
      content: renderLanguageFile(versions.cngx, startsGerman(facts.sourceLocale)),
    };
    return [file, provider];
  });
  const isProvided = (change: Change): boolean => {
    const symbol = change.kind === 'add-provider' ? change.call.symbol : 'provideCngxI18n';
    return facts.rootProviders.includes(symbol);
  };
  return {
    changes: changes.filter((change) => !isProvided(change)),
    skipped: changes.filter(isProvided).map((change) => skipChange(change, 'already provided')),
  };
}
