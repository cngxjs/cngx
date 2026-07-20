import { InjectionToken, type Signal, inject } from '@angular/core';

import type { EarconConfig } from './earcons/default-earcons';
import { CNGX_AUDIO_ENGINE_FACTORY, type AudioStatus } from './engine/audio-engine';
import type { ToneOptions, ToneStep } from './tone-generator/tone-generator';

/**
 * The public audio handle. A typed projection of the engine surface — callers
 * depend on this interface, the engine implementation stays internal-flexible.
 *
 * @category common/audio
 */
export interface CngxAudio {
  /** Play a registered earcon by name. */
  play(name: string): void;
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
export const CNGX_AUDIO_ENGINE = new InjectionToken<CngxAudio>('CngxAudioEngineInstance', {
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
export function injectCngxAudio(): CngxAudio {
  return inject(CNGX_AUDIO_ENGINE);
}
