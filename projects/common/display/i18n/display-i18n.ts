import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import {
  createNestedOverrideMerge,
  createOverrideMerge,
  injectLocale,
  type CngxNestedOverrides,
} from '@cngx/core/utils';

import {
  CNGX_DISPLAY_LANGUAGE_EN,
  type CngxDisplayLanguageSection,
} from './display-language-section';

/**
 * Presence states `CngxAvatar` renders a status dot for.
 *
 * @category common/display/i18n
 * @since 0.1.0
 */
export type CngxAvatarStatus = 'online' | 'offline' | 'busy' | 'away';

/**
 * Display-atom i18n surface. Library defaults are English; consumers override
 * via {@link provideDisplayI18n}. Reactive from birth: the token carries a
 * `Signal`, and {@link withDisplayI18nLabels} accepts a `Signal` of a partial
 * bundle, so a runtime language switch re-derives every read.
 *
 * Per-instance inputs (`statusLabel`, `labelFormat`, `valueTextFormat`, a bound
 * `label` / `removeAriaLabel`) still win over the bundle. `avatarGroupNoun`
 * and `chipRemove` seed string inputs at construction, so they are static per
 * instance; the formatter keys are read reactively.
 *
 * @category common/display/i18n
 * @since 0.1.0
 */
export interface CngxDisplayI18n {
  /** `CngxAvatar` status dot accessible name. English keeps the raw status word. */
  readonly avatarStatus: (status: CngxAvatarStatus) => string;
  /** Default of the `CngxAvatarGroup` `label` input: the entity noun. */
  readonly avatarGroupNoun: string;
  /** `CngxAvatarGroup` accessible summary; `hidden` is `0` when nothing is collapsed. */
  readonly avatarGroupLabel: (total: number, hidden: number) => string;
  /**
   * The avatar-group summary for a given noun - the language's message with a
   * consumer-bound `label` noun or an overridden `avatarGroupNoun`.
   */
  readonly avatarGroupLabelFor: (total: number, hidden: number, noun: string) => string;
  /** Visible `+N` pill of `CngxAvatarGroup`. */
  readonly avatarGroupOverflow: (count: number) => string;
  /** `CngxSegmentedProgress` `aria-valuetext`: completed and total segment count. */
  readonly segmentedProgressValueText: (now: number, max: number) => string;
  /** Default of the `CngxChip` `removeAriaLabel` input. */
  readonly chipRemove: string;
  /** `CngxBadge` text for a count above its `max`, e.g. `99+`. */
  readonly badgeOverflow: (max: number) => string;
}

/** @internal `avatarGroupLabel` functions built from a language section, not by a consumer. */
const SECTION_AVATAR_GROUP_LABELS = new WeakSet<object>();

/**
 * @internal Whether an `avatarGroupLabel` came from a language section. Such a
 * formatter composes from `avatarGroupLabelFor` and the resolved noun, so a
 * noun-only override still reaches AT; a consumer formatter owns the phrase.
 */
export function isSectionAvatarGroupLabel(format: CngxDisplayI18n['avatarGroupLabel']): boolean {
  return SECTION_AVATAR_GROUP_LABELS.has(format);
}

/** @internal Turns a display section into the token's keys for a locale. */
function displayBundleFrom(section: CngxDisplayLanguageSection, locale: string): CngxDisplayI18n {
  const avatarGroupLabelFor = (count: number, hidden: number, noun: string): string =>
    formatMessage(
      hidden > 0 ? section.avatarGroupLabelHidden : section.avatarGroupLabel,
      { count, hidden, noun },
      locale,
    );
  const avatarGroupLabel = (total: number, hidden: number): string =>
    avatarGroupLabelFor(total, hidden, section.avatarGroupNoun);
  SECTION_AVATAR_GROUP_LABELS.add(avatarGroupLabel);
  return {
    avatarStatus: (status) => section.avatarStatus[status],
    avatarGroupNoun: section.avatarGroupNoun,
    avatarGroupLabel,
    avatarGroupLabelFor,
    avatarGroupOverflow: (count) => formatMessage(section.avatarGroupOverflow, { count }, locale),
    segmentedProgressValueText: (now, max) =>
      formatMessage(section.segmentedProgressValueText, { now, max }, locale),
    chipRemove: section.chipRemove,
    badgeOverflow: (max) => formatMessage(section.badgeOverflow, { max }, locale),
  };
}

const NO_SECTION: CngxNestedOverrides<CngxDisplayLanguageSection, 'avatarStatus'> = {};

/** @internal The display section of the active pack over English, mapped for the locale. */
function displayBundleFromPack(): Signal<CngxDisplayI18n> {
  const pack = injectLanguageSection('display');
  const locale = injectLocale();
  const section = createNestedOverrideMerge<CngxDisplayLanguageSection, 'avatarStatus'>(
    CNGX_DISPLAY_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
    'avatarStatus',
  );
  return computed(() => displayBundleFrom(section(), locale()));
}

/**
 * DI token for the display i18n bundle. `providedIn: 'root'`: the display
 * section of the active language pack over the English defaults, formatted
 * for the app locale; the value is a `Signal`, shared by every reader under
 * one injector.
 *
 * @category common/display/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/i18n/display-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAvatar, CngxAvatarGroup, CngxSegmentedProgress, CngxChip
 */
export const CNGX_DISPLAY_I18N = new InjectionToken<Signal<CngxDisplayI18n>>('CngxDisplayI18n', {
  providedIn: 'root',
  factory: displayBundleFromPack,
});

/**
 * Branded feature-fn for {@link provideDisplayI18n}.
 *
 * @category common/display/i18n
 * @since 0.1.0
 */
export type CngxDisplayI18nFeature = ((
  bundle: Signal<CngxDisplayI18n>,
) => Signal<CngxDisplayI18n>) & {
  readonly _target: 'i18n';
};

/** @internal */
function defineDisplayI18nFeature(
  fn: (bundle: Signal<CngxDisplayI18n>) => Signal<CngxDisplayI18n>,
): CngxDisplayI18nFeature {
  return Object.assign(fn, { _target: 'i18n' as const });
}

/**
 * Override display labels via a partial bundle - unset keys keep the
 * language pack's copy, or the English default. Pass a `Signal` of a partial
 * bundle to switch languages at runtime.
 *
 * @category common/display/i18n
 * @since 0.1.0
 */
export function withDisplayI18nLabels(
  overrides: Partial<CngxDisplayI18n> | Signal<Partial<CngxDisplayI18n>>,
): CngxDisplayI18nFeature {
  return defineDisplayI18nFeature((bundle) => createOverrideMerge(bundle, overrides));
}

/**
 * Provider for the display i18n bundle. Returns a plain `Provider`, so it also
 * scopes a subtree through `viewProviders`. The features apply on top of the
 * active language pack.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideDisplayI18n(
 *       withDisplayI18nLabels({
 *         avatarStatus: (status) => ({ online: 'online', offline: 'offline', busy: 'beschaeftigt', away: 'abwesend' })[status],
 *         chipRemove: 'Entfernen',
 *       }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/display/i18n
 * @since 0.1.0
 */
export function provideDisplayI18n(...features: readonly CngxDisplayI18nFeature[]): Provider {
  return {
    provide: CNGX_DISPLAY_I18N,
    useFactory: () =>
      features.reduce<Signal<CngxDisplayI18n>>(
        (bundle, feat) => feat(bundle),
        displayBundleFromPack(),
      ),
  };
}

/**
 * Inject the resolved display i18n bundle signal. Read it inside a
 * `computed()` or template so a runtime override flip re-derives.
 *
 * @category common/display/i18n
 * @since 0.1.0
 */
export function injectDisplayI18n(): Signal<CngxDisplayI18n> {
  return inject(CNGX_DISPLAY_I18N);
}
