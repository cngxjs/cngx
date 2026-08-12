import { DOCUMENT } from '@angular/common';
import {
  effect,
  inject,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
  untracked,
  type EnvironmentProviders,
  type WritableSignal,
} from '@angular/core';

import {
  CNGX_CONTRAST,
  type CngxContrastPreference,
  injectContrast,
  provideContrast,
} from './contrast';
import { CNGX_DENSITY, type CngxDensityValue, injectDensity, provideDensity } from './density';
import { CNGX_MOTION, type CngxMotionPreference, injectMotion, provideMotion } from './motion';
import {
  CNGX_TEXT_SCALE,
  type CngxTextScaleValue,
  injectTextScale,
  provideTextScale,
} from './text-scale';

/**
 * A feature for {@link provideA11yPreferences}. Each `with*`
 * helper returns one of these carrying a hidden `_target` discriminator
 * the aggregator dispatches on. This mirrors the Select-family config
 * cascade (`provideCngxSelect`), but the aggregator *reduces* the axis
 * features to one scalar per axis (last-wins on duplicates) and forwards
 * it to the single-arg `provide<Axis>(initial)` rather than bucketing
 * same-kind features.
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export type CngxA11yPrefFeature =
  | { readonly _target: 'density'; readonly value: CngxDensityValue }
  | { readonly _target: 'textScale'; readonly value: CngxTextScaleValue }
  | { readonly _target: 'motion'; readonly value: CngxMotionPreference }
  | { readonly _target: 'contrast'; readonly value: CngxContrastPreference }
  | { readonly _target: 'persistence'; readonly storageKey: string };

/**
 * Set the initial density rung the aggregator installs. Omitting this
 * feature leaves density at its `comfortable` default.
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export function withDensity(value: CngxDensityValue): CngxA11yPrefFeature {
  return { _target: 'density', value };
}

/**
 * Set the initial text-scale rung the aggregator installs. Omitting this
 * feature leaves text-scale at its `md` (identity) default.
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export function withTextScale(value: CngxTextScaleValue): CngxA11yPrefFeature {
  return { _target: 'textScale', value };
}

/**
 * Set the initial motion preference the aggregator installs. Omitting
 * this feature leaves motion at its `auto` default, which follows the OS
 * `prefers-reduced-motion` query.
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export function withMotion(value: CngxMotionPreference): CngxA11yPrefFeature {
  return { _target: 'motion', value };
}

/**
 * Set the initial contrast preference the aggregator installs. Omitting
 * this feature leaves contrast at its `auto` default, which follows the
 * OS `prefers-contrast` query.
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export function withContrast(value: CngxContrastPreference): CngxA11yPrefFeature {
  return { _target: 'contrast', value };
}

/**
 * Persist explicit accessibility choices to `localStorage` under
 * `storageKey` and rehydrate them on the next load. On startup a stored
 * value overrides an axis only when it is a known-valid member of that
 * axis' union; an unknown, invalid, or missing value leaves the axis at
 * its own default, so a motion/contrast `auto` stays OS-driven and is
 * never clobbered. The write-back skips the initial value, so only an
 * actual change (a user pick, or a valid rehydrate) is stored: an
 * untouched default is never written. The whole feature is browser-guarded
 * via `DOCUMENT.defaultView` and is a no-op on the server.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideA11yPreferences(withPersistence())],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export function withPersistence(storageKey = 'cngx-a11y'): CngxA11yPrefFeature {
  return { _target: 'persistence', storageKey };
}

/**
 * Install all four accessibility axes (density, text-scale, motion,
 * contrast) behind one call. Each axis is set from its matching `with*`
 * feature, or left at its own library default when the feature is
 * omitted. Duplicate axis features are last-wins.
 *
 * This is composition over configuration (Pillar 3): the aggregator only
 * forwards the resolved initials to the existing `provideDensity` /
 * `provideTextScale` / `provideMotion` / `provideContrast`, so no
 * reflector logic is duplicated. The accessibility panel then binds to
 * the four writable signals via {@link injectA11yPreferences}.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideA11yPreferences(withTextScale('lg'), withMotion('reduced')),
 *   ],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo injectA11yPreferences
 * @relatedTo withDensity
 * @relatedTo withTextScale
 * @relatedTo withMotion
 * @relatedTo withContrast
 * @since 0.1.0
 */
export function provideA11yPreferences(
  ...features: CngxA11yPrefFeature[]
): EnvironmentProviders {
  let density: CngxDensityValue | undefined;
  let textScale: CngxTextScaleValue | undefined;
  let motion: CngxMotionPreference | undefined;
  let contrast: CngxContrastPreference | undefined;
  let storageKey: string | undefined;

  for (const feature of features) {
    switch (feature._target) {
      case 'density':
        density = feature.value;
        break;
      case 'textScale':
        textScale = feature.value;
        break;
      case 'motion':
        motion = feature.value;
        break;
      case 'contrast':
        contrast = feature.value;
        break;
      case 'persistence':
        storageKey = feature.storageKey;
        break;
    }
  }

  // `undefined` triggers each provider's default parameter, so an omitted
  // axis keeps its own library default without re-stating it here.
  const providers: EnvironmentProviders[] = [
    provideDensity(density),
    provideTextScale(textScale),
    provideMotion(motion),
    provideContrast(contrast),
  ];
  // Persistence is installed after the axis reflectors so its rehydrate
  // set() lands before any reflector's first flush (no default flash).
  if (storageKey !== undefined) {
    providers.push(providePersistence(storageKey));
  }
  return makeEnvironmentProviders(providers);
}

/**
 * Read the four accessibility-axis signals as one bundle in an injection
 * context. Each is the same `WritableSignal` the axis token holds, so the
 * accessibility panel both reads current state and writes user choices
 * through it (`injectA11yPreferences().motion.set('reduced')`).
 *
 * @category core/theming
 * @relatedTo provideA11yPreferences
 * @since 0.1.0
 */
export function injectA11yPreferences(): {
  readonly density: WritableSignal<CngxDensityValue>;
  readonly textScale: WritableSignal<CngxTextScaleValue>;
  readonly motion: WritableSignal<CngxMotionPreference>;
  readonly contrast: WritableSignal<CngxContrastPreference>;
} {
  return {
    density: injectDensity(),
    textScale: injectTextScale(),
    motion: injectMotion(),
    contrast: injectContrast(),
  };
}

// Valid members per axis, used only to validate a rehydrated value.
const DENSITY_VALUES: readonly CngxDensityValue[] = ['comfortable', 'compact', 'spacious'];
const TEXT_SCALE_VALUES: readonly CngxTextScaleValue[] = ['sm', 'md', 'lg'];
const MOTION_VALUES: readonly CngxMotionPreference[] = ['full', 'reduced', 'auto'];
const CONTRAST_VALUES: readonly CngxContrastPreference[] = ['normal', 'more', 'auto'];

function readStored(storage: Storage, storageKey: string): Record<string, unknown> {
  try {
    const raw = storage.getItem(storageKey);
    if (raw === null) {
      return {};
    }
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    // Corrupt JSON is treated as an empty store, never a crash.
    return {};
  }
}

function installAxisPersistence<T extends string>(
  storage: Storage,
  storageKey: string,
  axisKey: string,
  sig: WritableSignal<T>,
  values: readonly T[],
): void {
  // Rehydrate before the write-back effect exists, so a valid stored
  // value is applied and the effect's first (skipped) flush sees it.
  const stored = readStored(storage, storageKey)[axisKey];
  if (typeof stored === 'string' && (values as readonly string[]).includes(stored)) {
    sig.set(stored as T);
  }

  // `first` is a plain closure boolean (never a signal): a signal write
  // inside the effect would be a signal-write-in-effect violation. It
  // skips the initial flush so an untouched default is never persisted;
  // only a subsequent change writes.
  let first = true;
  effect(() => {
    const value = sig();
    if (first) {
      first = false;
      return;
    }
    untracked(() => {
      const next = readStored(storage, storageKey);
      next[axisKey] = value;
      storage.setItem(storageKey, JSON.stringify(next));
    });
  });
}

function providePersistence(storageKey: string): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => {
      const storage = inject(DOCUMENT).defaultView?.localStorage;
      if (!storage) {
        // Server / no `localStorage`: rehydrate and write-back are skipped.
        return;
      }
      installAxisPersistence(storage, storageKey, 'density', inject(CNGX_DENSITY), DENSITY_VALUES);
      installAxisPersistence(
        storage,
        storageKey,
        'textScale',
        inject(CNGX_TEXT_SCALE),
        TEXT_SCALE_VALUES,
      );
      installAxisPersistence(storage, storageKey, 'motion', inject(CNGX_MOTION), MOTION_VALUES);
      installAxisPersistence(
        storage,
        storageKey,
        'contrast',
        inject(CNGX_CONTRAST),
        CONTRAST_VALUES,
      );
    }),
  ]);
}
