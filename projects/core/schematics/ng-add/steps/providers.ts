import { posix } from 'node:path';

import {
  type Change,
  type CngxLib,
  createNote,
  createProvenance,
  createProvenanceStamp,
  type LanguagePackArgument,
  type ProviderCall,
  skipChange,
  type StepResult,
} from '../../engine';
import { CNGX_LANGUAGE_FILE, type GeneratedFileState, type ProjectFacts } from '../detect/detect';
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

const LANGUAGE_MODULE = `./${posix.basename(CNGX_LANGUAGE_FILE, '.ts')}`;
const LANGUAGE_SIGNAL = 'cngxLanguagePack';

function isLanguageSignal(pack: LanguagePackArgument | undefined): boolean {
  const module = pack?.module;
  return (
    pack?.name === LANGUAGE_SIGNAL &&
    module !== undefined &&
    posix.basename(module).replace(/\.[cm]?[jt]s$/, '') === posix.basename(CNGX_LANGUAGE_FILE, '.ts')
  );
}

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
  /** What is provided, as in "Provide <subject>" or "Skip <subject>". */
  readonly subject: string;
  readonly reason: string;
  /** The package the provider comes from; without it selected it is skipped with a note. */
  readonly lib: CngxLib;
  readonly call: ProviderCall;
}

const FLOATING_UI = '@floating-ui/dom';

// The pack `withPack` takes: the switch signal, or the German pack itself.
function languagePack(answers: OnboardingAnswers): ProviderCall {
  return answers.runtimeSwitch
    ? { symbol: LANGUAGE_SIGNAL, module: LANGUAGE_MODULE, reference: true }
    : { symbol: 'CNGX_LANGUAGE_DE', module: '@cngx/core/i18n/de', reference: true };
}

function i18nPack(answers: OnboardingAnswers): ProviderCall {
  const pack = languagePack(answers);
  return {
    symbol: 'provideCngxI18n',
    module: '@cngx/core/i18n',
    args: [{ symbol: 'withPack', module: '@cngx/core/i18n', args: [pack] }],
  };
}

function wantedProviders(facts: ProjectFacts, answers: OnboardingAnswers): readonly Wanted[] {
  const feedback = (symbol: string): ProviderCall => ({ symbol, module: '@cngx/ui/feedback' });
  const wanted: readonly (Wanted | false)[] = [
    answers.a11yPreferences && {
      id: 'provider:a11y-preferences',
      subject: 'the a11y preferences',
      reason: 'density, text scale, motion and contrast stay inert without it',
      lib: 'core',
      call: {
        symbol: 'provideA11yPreferences',
        module: '@cngx/core',
        args: [{ symbol: 'withPersistence', module: '@cngx/core' }],
      },
    },
    isRtl(facts.sourceLocale) && {
      id: 'provider:direction',
      subject: 'the rtl direction',
      reason: `the source locale ${facts.sourceLocale ?? ''} is written right to left`,
      lib: 'core',
      call: { symbol: 'provideDirection', module: '@cngx/core', args: [{ literal: "'rtl'" }] },
    },
    answers.feedback && {
      id: 'provider:feedback',
      subject: 'toasts, alerts and banners',
      reason: 'CngxToaster, CngxAlerter and CngxBanner are not provided at the root',
      lib: 'ui',
      call: {
        ...feedback('provideFeedback'),
        args: [feedback('withToasts'), feedback('withAlerts'), feedback('withBanners')],
      },
    },
    answers.floatingFallback && {
      id: 'provider:floating-fallback',
      subject: 'the floating positioning fallback',
      reason: 'positions popovers where CSS anchor positioning is missing',
      lib: 'common',
      // The fallback takes Floating UI's functions; cngx never imports @floating-ui/dom itself.
      call: {
        symbol: 'provideFloatingFallback',
        module: '@cngx/common/popover',
        args: [
          { symbol: 'computePosition', module: FLOATING_UI, reference: true },
          { array: [{ symbol: 'flip', module: FLOATING_UI }, { symbol: 'shift', module: FLOATING_UI }] },
        ],
      },
    },
    answers.i18n === 'de' && {
      id: 'provider:i18n',
      subject: 'the German language pack',
      reason: answers.runtimeSwitch ? 'switchable at runtime' : 'every cngx string in German',
      lib: 'core',
      call: i18nPack(answers),
    },
  ];
  return wanted.filter((entry): entry is Wanted => entry !== false);
}

/**
 * Plans the root providers onboarding wires into the app config (or the
 * root NgModule; `addRootProvider` finds either): the a11y preferences, the
 * rtl direction for an RTL source locale, the feedback services, the
 * floating fallback and the language pack. A provider already present is
 * skipped, so a second run plans nothing; an answer the selected packages
 * cannot serve gets a note. An existing language provider is never
 * rewritten: with the runtime switch it gets a note naming the one edit
 * unless it already passes the signal from `cngx-language.ts`; without it,
 * one passing no pack gets that note and one passing its own pack is kept,
 * with the skip naming that pack. `cngx-language.ts` is created only when
 * missing; a file cngx did not write blocks the switch with a note.
 */
export function planProviders(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  const provenance = createProvenance('ng-add', versions.cngx);
  const languageFile = posix.join(posix.dirname(facts.appConfigPath), CNGX_LANGUAGE_FILE);
  const libs = selectedLibs(answers.libs);
  const wanted = wantedProviders(facts, answers);
  const file: Change = {
    kind: 'create-file',
    id: 'provider:i18n-file',
    label: `Create ${languageFile}`,
    reason: 'the signal that switches the language pack',
    provenance,
    path: languageFile,
    content: renderLanguageFile(versions.cngx, startsGerman(facts.sourceLocale)),
  };
  // The provider already passes the switch signal from the language file,
  // whatever the import calls it.
  const switchWired = isLanguageSignal(facts.languagePack);
  // A file someone else wrote is never overwritten, and the provider would
  // import a signal it may not export.
  const foreignFile = createNote({
    id: 'provider:i18n-file',
    label: `Keep ${languageFile}`,
    reason: 'cngx did not write it, so runtime language switching is skipped; move it aside and run `ng add @cngx/core` again',
    provenance,
  });
  const providers = wanted.filter(({ lib }) => libs.includes(lib)).flatMap((entry): readonly Change[] => {
    const provider: Change = {
      kind: 'add-provider',
      id: entry.id,
      label: `Provide ${entry.subject}`,
      reason: entry.reason,
      call: entry.call,
      provenance,
      project: facts.project,
      path: facts.appConfigPath,
    };
    if (entry.id !== 'provider:i18n' || !answers.runtimeSwitch) {
      return [provider];
    }
    if (facts.languageFile === 'foreign' && !switchWired) {
      return [foreignFile];
    }
    return facts.languageFile === 'absent' ? [file, provider] : [provider];
  });
  const switching = answers.runtimeSwitch && providers.some((change) => change.kind === 'add-provider' && change.id === 'provider:i18n');
  const isProvided = (change: Change): boolean =>
    change.kind === 'add-provider' && facts.rootProviders.includes(change.call.symbol);
  const unserved: readonly Change[] = wanted
    .filter(({ lib }) => !libs.includes(lib))
    .map(({ id, subject, lib }) =>
      createNote({
        id,
        label: `Skip ${subject}`,
        reason: `it comes from @cngx/${lib}, which is not selected`,
        provenance,
      }),
    );
  const switchWithoutPack: readonly Change[] =
    answers.runtimeSwitch && answers.i18n !== 'de'
      ? [
          createNote({
            id: 'provider:i18n-switch',
            label: 'Skip runtime language switching',
            reason: 'it switches to the German pack; pass --i18n=de with it',
            provenance,
          }),
        ]
      : [];
  const notes = [...unserved, ...switchWithoutPack];
  const fileSkip: Readonly<Record<GeneratedFileState, string | undefined>> = {
    absent: undefined,
    generated: 'already generated',
    foreign: `cngx did not write it; provideCngxI18n already passes ${LANGUAGE_SIGNAL}`,
  };
  const fileReason = switching ? fileSkip[facts.languageFile] : undefined;
  const existingFile = fileReason === undefined ? [] : [skipChange(file, fileReason)];
  // An existing language provider is not rewritten. When it lacks the pack
  // the answers need (the switch signal, or any pack for German), the run
  // names the one edit instead of skipping silently.
  const provided = providers.filter(isProvided);
  const packMissing = answers.runtimeSwitch ? !switchWired : facts.languagePack === undefined;
  const needsPackEdit = (change: Change): boolean => change.id === 'provider:i18n' && packMissing;
  const pack = languagePack(answers);
  const current = facts.languagePack === undefined ? 'no pack' : `\`withPack(${facts.languagePack.text})\``;
  const packEdit: readonly Change[] = provided.some(needsPackEdit)
    ? [
        createNote({
          id: 'provider:i18n-pack',
          label: answers.runtimeSwitch ? 'Switch the language at runtime' : 'Use the German language pack',
          reason: `provideCngxI18n in ${facts.appConfigPath} passes ${current}; pass \`withPack(${pack.symbol})\` with ${pack.symbol} imported from '${pack.module}'`,
          provenance,
        }),
      ]
    : [];
  // A kept pack other than the one asked for is named, so the skip never
  // reads as if German were in place.
  const providedReason = (change: Change): string =>
    change.id === 'provider:i18n' && facts.languagePack !== undefined && facts.languagePack.name !== pack.symbol
      ? `already passes \`withPack(${facts.languagePack.text})\`; cngx keeps that pack`
      : 'already provided';
  return {
    changes: [...providers.filter((change) => !isProvided(change)), ...packEdit, ...notes],
    skipped: [
      ...provided.filter((change) => !needsPackEdit(change)).map((change) => skipChange(change, providedReason(change))),
      ...existingFile,
    ],
  };
}
