import {
  type EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

import type { EarconConfig } from '../earcons/default-earcons';

/**
 * Global configuration for the audio system. Provided via `provideCngxAudio()`
 * with `with*` features (see the provider section below). Consumers never
 * construct this object directly.
 *
 * @category common/audio
 */
export interface CngxAudioConfig {
  /** Start muted. Default `false`. */
  readonly muted: boolean;
  /** Master volume in `[0, 1]`. Default `1`. */
  readonly volume: number;
  /** Mute audio when `prefers-reduced-motion: reduce` is set. Default `true`. */
  readonly respectReducedMotion: boolean;
  /** Same-name suppression window in ms. Default `100`. */
  readonly debounceMs: number;
  /** Extra or overriding earcons, merged over the six built-ins. Default `{}`. */
  readonly earcons: Readonly<Record<string, EarconConfig>>;
}

/** Library defaults — English, browser-native. */
export const CNGX_AUDIO_DEFAULTS: CngxAudioConfig = {
  muted: false,
  volume: 1,
  respectReducedMotion: true,
  debounceMs: 100,
  earcons: {},
};

/**
 * Injection token carrying the partial audio config contributed by
 * `provideCngxAudio(...)`. Read the resolved, defaults-merged config with
 * {@link injectAudioConfig}.
 *
 * @category common/audio
 * @relatedTo provideCngxAudio, injectAudioConfig
 */
export const CNGX_AUDIO_CONFIG = new InjectionToken<Partial<CngxAudioConfig>>('CngxAudioConfig', {
  providedIn: 'root',
  factory: () => ({}),
});

/**
 * Resolve the effective audio config: library defaults merged with whatever
 * `provideCngxAudio(...)` contributed. Runs in an injection context.
 *
 * @category common/audio
 */
export function injectAudioConfig(): CngxAudioConfig {
  return { ...CNGX_AUDIO_DEFAULTS, ...inject(CNGX_AUDIO_CONFIG, { optional: true }) };
}

/** A feature returned by a `with*` helper, folded into the config by {@link provideCngxAudio}. */
export interface CngxAudioFeature {
  /** @internal */
  readonly _apply: (config: Partial<CngxAudioConfig>) => Partial<CngxAudioConfig>;
}

/**
 * Register global audio defaults. Mirrors `provideFeedback` — a single small
 * config object folded through `with*` features.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideCngxAudio(
 *       withVolume(0.6),
 *       withEarcons({ send: { sequence: [{ freq: 880, duration: 60 }] } }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category common/audio
 */
export function provideCngxAudio(...features: CngxAudioFeature[]): EnvironmentProviders {
  let config: Partial<CngxAudioConfig> = {};
  for (const feature of features) {
    config = feature._apply(config);
  }
  return makeEnvironmentProviders([{ provide: CNGX_AUDIO_CONFIG, useValue: config }]);
}

/**
 * Register or override earcons globally. Merged over the six built-ins and over
 * any earlier `withEarcons` in the same `provideCngxAudio` call.
 *
 * @category common/audio
 */
export function withEarcons(earcons: Record<string, EarconConfig>): CngxAudioFeature {
  return { _apply: (c) => ({ ...c, earcons: { ...c.earcons, ...earcons } }) };
}

/**
 * Set the master volume in `[0, 1]`.
 *
 * @category common/audio
 */
export function withVolume(volume: number): CngxAudioFeature {
  return { _apply: (c) => ({ ...c, volume }) };
}

/**
 * Start muted (or explicitly unmuted with `withMuted(false)`).
 *
 * @category common/audio
 */
export function withMuted(muted = true): CngxAudioFeature {
  return { _apply: (c) => ({ ...c, muted }) };
}

/**
 * Toggle the `prefers-reduced-motion` mute gate. `true` by default in the
 * library; pass `false` to keep audio playing under reduced-motion.
 *
 * @category common/audio
 */
export function withRespectReducedMotion(respect: boolean): CngxAudioFeature {
  return { _apply: (c) => ({ ...c, respectReducedMotion: respect }) };
}

/**
 * Set the same-name suppression window in milliseconds.
 *
 * @category common/audio
 */
export function withDebounceMs(ms: number): CngxAudioFeature {
  return { _apply: (c) => ({ ...c, debounceMs: ms }) };
}
