import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';

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
  /** `CngxSegmentedProgress` `aria-valuetext`: completed and total segment count. */
  readonly segmentedProgressValueText: (now: number, max: number) => string;
  /** Default of the `CngxChip` `removeAriaLabel` input. */
  readonly chipRemove: string;
}

/**
 * @internal - the English avatar-group summary for a given noun. Shared by the
 * default formatter and by `CngxAvatarGroup` when a consumer binds its own
 * noun or overrides only `avatarGroupNoun`.
 */
export function composeAvatarGroupLabel(total: number, hidden: number, noun: string): string {
  return hidden > 0 ? `${total} ${noun}, ${hidden} not shown` : `${total} ${noun}`;
}

/** @internal */
export const DISPLAY_I18N_DEFAULTS: CngxDisplayI18n = {
  avatarStatus: (status) => status,
  avatarGroupNoun: 'avatars',
  avatarGroupLabel: (total, hidden) => composeAvatarGroupLabel(total, hidden, 'avatars'),
  segmentedProgressValueText: (now, max) => `${now} of ${max}`,
  chipRemove: 'Remove',
};

/**
 * DI token for the display i18n bundle. `providedIn: 'root'` with English
 * defaults; the value is a `Signal`, shared by every reader under one
 * injector.
 *
 * @category common/display/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/i18n/display-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAvatar, CngxAvatarGroup, CngxSegmentedProgress, CngxChip
 */
export const CNGX_DISPLAY_I18N = new InjectionToken<Signal<CngxDisplayI18n>>('CngxDisplayI18n', {
  providedIn: 'root',
  factory: () => coerceSignal(DISPLAY_I18N_DEFAULTS),
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
 * Override display labels via a partial bundle - unset keys keep the English
 * default. Pass a `Signal` of a partial bundle to switch languages at
 * runtime.
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
 * scopes a subtree through `viewProviders`.
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
        coerceSignal(DISPLAY_I18N_DEFAULTS),
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
