/**
 * @module @cngx/common/audio
 *
 * Signal-first audio-feedback system. A thin directive layer over a small
 * Web Audio adapter: zero asset weight (earcons synthesised from
 * `OscillatorNode`), a single shared `AudioContext` behind the engine, and
 * the `provideCngxAudio(...)` aggregator. Mirrors the shape of the sibling
 * feedback primitives (`CngxRipple`, `CngxPressable`, `CngxSpeak`) — the
 * fourth sense, audition, as composable atoms.
 */

// Handle + component-scope provider
export { injectCngxAudio, provideCngxAudioAt, type CngxAudioHandle } from './inject-audio';

// Config + provider
export {
  CNGX_AUDIO_CONFIG,
  CNGX_AUDIO_DEFAULTS,
  injectAudioConfig,
  provideCngxAudio,
  withEarcons,
  withVolume,
  withMuted,
  withRespectReducedMotion,
  withDebounceMs,
  type CngxAudioConfig,
  type CngxAudioFeature,
} from './config/audio-config';

// Engine — boundary DI token + factory + alias
export {
  createAudioEngine,
  CNGX_AUDIO_ENGINE_FACTORY,
  type CngxAudioEngine,
  type CngxAudioEngineFactory,
  type AudioEngineOptions,
  type AudioStatus,
} from './engine/audio-engine';

// Tone generator — boundary DI token + factory + alias
export {
  createToneGenerator,
  CNGX_AUDIO_TONE_GENERATOR_FACTORY,
  type CngxToneGenerator,
  type CngxAudioToneGeneratorFactory,
  type ToneGeneratorDeps,
  type ToneOptions,
  type ToneStep,
} from './tone-generator/tone-generator';

// Token-less composed factories
export { createAutoplayGate, type CngxAutoplayGate, type GestureEventTarget } from './autoplay-gate/autoplay-gate';
export { createDebouncer, type CngxDebouncer } from './debouncer/debouncer';

// Earcon value type (the CNGX_AUDIO_DEFAULT_EARCONS const stays internal)
export type { EarconConfig } from './earcons/default-earcons';

// Event-mode directive
export { CngxAudio } from './event-mode/audio.directive';

// Status-, zone-, and pitch-mode directives (Phase 2)
export { CngxAudioStatus } from './status-mode/audio-status.directive';
export { CngxAudioZone, type CngxAudioZoneBinding } from './zone-mode/audio-zone.directive';
export { CngxAudioPitch } from './pitch-mode/audio-pitch.directive';
