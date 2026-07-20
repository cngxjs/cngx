import {
  InjectionToken,
  Optional,
  type Provider,
  type Signal,
  SkipSelf,
  inject,
} from '@angular/core';

import {
  CNGX_AUDIO_CONFIG,
  type CngxAudioConfig,
  type CngxAudioFeature,
  foldAudioFeatures,
} from './config/audio-config';
import type { EarconConfig } from './earcons/default-earcons';
import { CNGX_AUDIO_ENGINE_FACTORY, type AudioStatus } from './engine/audio-engine';
import type { ToneOptions, ToneStep } from './tone-generator/tone-generator';

/**
 * The public audio handle. A typed projection of the engine surface — callers
 * depend on this interface, the engine implementation stays internal-flexible.
 *
 * @category common/audio
 */
export interface CngxAudioHandle {
  /** Play a registered earcon by name, optionally at a `[0, 1]` volume multiplier. */
  play(name: string, volume?: number): void;
  /** Play a single ad-hoc tone. */
  tone(freq: number, durationMs: number, opts?: ToneOptions): void;
  /** Play an ad-hoc tone sequence. */
  sequence(steps: readonly ToneStep[]): void;
  /** Register or override an earcon at runtime. */
  register(name: string, config: EarconConfig): void;
  /** Arm the autoplay gate programmatically. */
  armAutoplay(): void;
  /** Set the global mute state. */
  setMuted(muted: boolean): void;
  /** Set master volume, clamped to `[0, 1]`. */
  setVolume(volume: number): void;
  /** `true` when globally muted. */
  readonly muted: Signal<boolean>;
  /** Master volume in `[0, 1]`. */
  readonly volume: Signal<number>;
  /** Shared-context lifecycle state. */
  readonly status: Signal<AudioStatus>;
  /** Name of the last earcon actually played, or `null`. */
  readonly lastPlayed: Signal<string | null>;
}

/**
 * The shared engine instance. Lazily built from `CNGX_AUDIO_ENGINE_FACTORY` and
 * memoised per injector so every directive shares one `AudioContext`, mute
 * state, and volume. `@internal` — the public entry point is {@link injectCngxAudio};
 * consumers override the swappable factory, not this instance anchor. Scope it
 * to a component by re-providing it in `viewProviders`.
 *
 * @internal
 */
export const CNGX_AUDIO_ENGINE = new InjectionToken<CngxAudioHandle>('CngxAudioEngineInstance', {
  providedIn: 'root',
  factory: () => inject(CNGX_AUDIO_ENGINE_FACTORY)(),
});

/**
 * Resolve the shared audio handle. Must run in an injection context (field
 * initialiser or constructor).
 *
 * ```typescript
 * export class MyToggle {
 *   private readonly audio = injectCngxAudio();
 *   protected readonly muted = this.audio.muted;
 *   protected toggle(): void {
 *     this.audio.setMuted(!this.muted());
 *   }
 * }
 * ```
 *
 * @category common/audio
 */
export function injectCngxAudio(): CngxAudioHandle {
  return inject(CNGX_AUDIO_ENGINE);
}

/**
 * Component-scope audio config — place in a component's `viewProviders` so a
 * subtree runs its own muted / volume / earcon set, independent of the app-wide
 * `provideCngxAudio(...)`.
 *
 * ```typescript
 * @Component({
 *   selector: 'app-mixer',
 *   viewProviders: [provideCngxAudioAt(withVolume(0.3), withEarcons({ ... }))],
 * })
 * export class Mixer {}
 * ```
 *
 * Returns `Provider[]` (not `EnvironmentProviders`) so it can sit in
 * `viewProviders`. The root `provideCngxAudio` must be registered at
 * **application bootstrap**: {@link CNGX_AUDIO_ENGINE} is `providedIn: 'root'`,
 * so its factory resolves the config from the root injector and a provider
 * registered on a lazy route never reaches it.
 *
 * Features **layer over** the ancestor config (root, or an enclosing scope)
 * rather than replacing it — the `provideMenuConfigAt` pattern. Scalar fields
 * (`muted`, `volume`, `debounceMs`, `respectReducedMotion`) override; `earcons`
 * merge, so a subtree adds or overrides individual earcons without dropping the
 * app-wide registry.
 *
 * The default shared engine is a single, process-global `AudioContext`; this
 * deliberately re-provides {@link CNGX_AUDIO_ENGINE} so the subtree gets an
 * **isolated engine** reading the scoped {@link CNGX_AUDIO_CONFIG} — a
 * config-only override would be inert against the already-built root engine.
 * That engine owns a **second `AudioContext`**, created lazily on its first play
 * and closed with the component's `DestroyRef`. Browsers cap the number of live
 * `AudioContext`s, so reach for this only when a subtree genuinely needs an
 * independent audio scope — per-element `[audioVolume]` / `[audioDisabled]`
 * cover the common case without a second context.
 *
 * @category common/audio
 * @relatedTo provideCngxAudio, injectCngxAudio
 */
export function provideCngxAudioAt(...features: CngxAudioFeature[]): Provider[] {
  return [
    {
      provide: CNGX_AUDIO_CONFIG,
      useFactory: (parent: Partial<CngxAudioConfig> | null): Partial<CngxAudioConfig> => {
        const base = parent ?? {};
        const scoped = foldAudioFeatures(features);
        return { ...base, ...scoped, earcons: { ...base.earcons, ...scoped.earcons } };
      },
      deps: [[new SkipSelf(), new Optional(), CNGX_AUDIO_CONFIG]],
    },
    { provide: CNGX_AUDIO_ENGINE, useFactory: () => inject(CNGX_AUDIO_ENGINE_FACTORY)() },
  ];
}
