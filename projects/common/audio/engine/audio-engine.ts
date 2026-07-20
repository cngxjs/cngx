import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  InjectionToken,
  type Signal,
  effect,
  inject,
  isDevMode,
  signal,
} from '@angular/core';
import { injectMediaQuery } from '@cngx/common/layout';

import { createAutoplayGate } from '../autoplay-gate/autoplay-gate';
import { createDebouncer } from '../debouncer/debouncer';
import { CNGX_AUDIO_DEFAULT_EARCONS, type EarconConfig } from '../earcons/default-earcons';
import {
  CNGX_AUDIO_TONE_GENERATOR_FACTORY,
  DEFAULT_TONE_GAIN,
  type ToneOptions,
  type ToneStep,
} from '../tone-generator/tone-generator';
import { injectAudioConfig } from '../config/audio-config';

/**
 * Lifecycle state of the shared `AudioContext`, surfaced for debug panels and
 * headless e2e. Mute is a separate `muted` signal — this tracks the context,
 * not the play gate.
 */
export type AudioStatus = 'idle' | 'suspended' | 'running' | 'closed' | 'unsupported';

/** Advanced/testing seam for {@link createAudioEngine}. */
export interface AudioEngineOptions {
  /**
   * Override `AudioContext` construction. Defaults to the host window's
   * `AudioContext` / `webkitAudioContext`, or `null` when neither exists (SSR,
   * unsupported browser). Specs pass `createAudioContextMock`.
   */
  readonly contextFactory?: () => BaseAudioContext | null;
}

/**
 * The audio engine surface. A single write path for `muted` / `volume`
 * (no `mute()`/`unmute()` pair); every state change is a reactive `Signal`.
 */
export interface CngxAudioEngine {
  /**
   * Play a registered earcon by name. Gated + debounced centrally here.
   * `volume` (a `[0, 1]` multiplier over the per-tone default) scales just this
   * play — used by `[cngxAudio]`'s per-element `audioVolume` without touching
   * the shared master volume.
   */
  play(name: string, volume?: number): void;
  /** Play a single ad-hoc tone. Gated, not debounced, no `lastPlayed` update. */
  tone(freq: number, durationMs: number, opts?: ToneOptions): void;
  /** Play an ad-hoc tone sequence. Gated, not debounced. */
  sequence(steps: readonly ToneStep[]): void;
  /** Register or override an earcon at runtime. */
  register(name: string, config: EarconConfig): void;
  /** Arm the autoplay gate programmatically and resume the context if possible. */
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
  /** Name of the last earcon actually played, or `null`. Powers e2e + debug. */
  readonly lastPlayed: Signal<string | null>;
}

/** Signature of the engine factory — the shape a telemetry/audit override matches. */
export type CngxAudioEngineFactory = (options?: AudioEngineOptions) => CngxAudioEngine;

function clampVolume(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Create the audio engine: composes the autoplay gate, tone generator, and
 * debouncer over one lazily-created shared `AudioContext`. Reduced-motion muting
 * reuses the existing `injectMediaQuery('(prefers-reduced-motion: reduce)')`
 * primitive rather than a fourth `matchMedia` reader (the inline ripple/skeleton/
 * reduced-motion readers are tracked as `audio-accepted-debt.md` §1).
 *
 * The four mute conditions are enforced centrally in `play()`/`tone()`/
 * `sequence()`: global mute, reduced-motion, and autoplay-not-armed here;
 * per-element `[audioDisabled]` in the `[cngxAudio]` directive.
 *
 * Runs in an injection context (calls `inject()` for DOCUMENT, DestroyRef, the
 * tone-generator factory, and the reduced-motion query). Never `providedIn:
 * 'root'` — feature-scoped via `CNGX_AUDIO_ENGINE_FACTORY`.
 */
export const createAudioEngine: CngxAudioEngineFactory = (options) => {
  const doc = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);
  const toneGeneratorFactory = inject(CNGX_AUDIO_TONE_GENERATOR_FACTORY);
  const config = injectAudioConfig();
  const reducedMotion = injectMediaQuery('(prefers-reduced-motion: reduce)');

  const muted = signal(config.muted);
  const volume = signal(clampVolume(config.volume));
  const status = signal<AudioStatus>('idle');
  const lastPlayed = signal<string | null>(null);

  const gate = createAutoplayGate({ target: doc, destroyRef });
  const debouncer = createDebouncer({ windowMs: config.debounceMs });
  const earcons = new Map<string, EarconConfig>(
    Object.entries({ ...CNGX_AUDIO_DEFAULT_EARCONS, ...config.earcons }),
  );

  let context: BaseAudioContext | null = null;
  let masterGain: GainNode | null = null;

  const contextFactory =
    options?.contextFactory ??
    ((): BaseAudioContext | null => {
      const view = doc.defaultView as
        | (Window & {
            AudioContext?: typeof AudioContext;
            webkitAudioContext?: typeof AudioContext;
          })
        | null;
      const Ctor = view?.AudioContext ?? view?.webkitAudioContext;
      return Ctor ? new Ctor() : null;
    });

  const toneGenerator = toneGeneratorFactory({
    context: () => context!,
    destination: () => masterGain!,
  });

  function resumeIfArmed(): void {
    if (context && gate.armed() && context.state === 'suspended') {
      void (context as AudioContext).resume().then(
        () => status.set('running'),
        () => undefined,
      );
    }
  }

  function ensureContext(): BaseAudioContext | null {
    if (context) {
      return context;
    }
    const created = contextFactory();
    if (!created) {
      status.set('unsupported');
      return null;
    }
    context = created;
    masterGain = created.createGain();
    masterGain.gain.value = volume();
    masterGain.connect(created.destination);
    status.set(created.state as AudioStatus);
    resumeIfArmed();
    return context;
  }

  function blocked(): boolean {
    return muted() || (config.respectReducedMotion && reducedMotion()) || !gate.armed();
  }

  // Volume is communicated to the master node reactively — the single writer is
  // setVolume(), but binding through an effect keeps the node in sync from any
  // future volume source too.
  effect(() => {
    const v = volume();
    if (masterGain) {
      masterGain.gain.value = v;
    }
  });

  // Suspend on tab hide (frees the audio hardware); resume on return if armed.
  const onVisibility = (): void => {
    if (!context) {
      return;
    }
    if (doc.hidden) {
      if (context.state === 'running') {
        void (context as AudioContext).suspend().then(
          () => status.set('suspended'),
          () => undefined,
        );
      }
    } else {
      resumeIfArmed();
    }
  };
  doc.addEventListener('visibilitychange', onVisibility);
  destroyRef.onDestroy(() => {
    doc.removeEventListener('visibilitychange', onVisibility);
    void (context as AudioContext | null)?.close?.();
  });

  return {
    play(name, volume) {
      if (blocked()) {
        return;
      }
      if (!ensureContext()) {
        return;
      }
      resumeIfArmed();
      if (!debouncer.shouldFire(name)) {
        return;
      }
      const earcon = earcons.get(name);
      if (!earcon) {
        if (isDevMode()) {
          console.warn(
            `[cngxAudio] Unknown earcon "${name}". Register it via withEarcons({...}) or engine.register(name, config).`,
          );
        }
        return;
      }
      const sequence =
        volume === undefined
          ? earcon.sequence
          : earcon.sequence.map((step) => ({
              ...step,
              gain: (step.gain ?? DEFAULT_TONE_GAIN) * clampVolume(volume),
            }));
      toneGenerator.sequence(sequence);
      lastPlayed.set(name);
    },
    tone(freq, durationMs, opts) {
      if (blocked() || !ensureContext()) {
        return;
      }
      resumeIfArmed();
      toneGenerator.tone(freq, durationMs, opts);
    },
    sequence(steps) {
      if (blocked() || !ensureContext()) {
        return;
      }
      resumeIfArmed();
      toneGenerator.sequence(steps);
    },
    register(name, earconConfig) {
      earcons.set(name, earconConfig);
    },
    armAutoplay() {
      gate.arm();
      resumeIfArmed();
    },
    setMuted(next) {
      muted.set(next);
    },
    setVolume(next) {
      volume.set(clampVolume(next));
    },
    muted: muted.asReadonly(),
    volume: volume.asReadonly(),
    status: status.asReadonly(),
    lastPlayed: lastPlayed.asReadonly(),
  };
};

/**
 * Swappable engine factory. Defaults to {@link createAudioEngine}. Override to
 * wrap the engine with telemetry/audit logging — the documented second consumer
 * of this boundary token. Feature-scoped; never `providedIn: 'root'`.
 *
 * @relatedTo createAudioEngine, injectCngxAudio
 */
export const CNGX_AUDIO_ENGINE_FACTORY = new InjectionToken<CngxAudioEngineFactory>(
  'CngxAudioEngineFactory',
  { providedIn: 'root', factory: () => createAudioEngine },
);
