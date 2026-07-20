import { InjectionToken, inject } from '@angular/core';

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
