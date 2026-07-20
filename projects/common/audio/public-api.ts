/**
 * @module @cngx/common/audio
 *
 * Signal-first audio-feedback system. A thin directive layer over a small
 * Web Audio adapter: zero asset weight (earcons synthesised from
 * `OscillatorNode`), a single shared `AudioContext` behind the engine, and
 * the `provideCngxAudio(...)` aggregator. Mirrors the shape of the sibling
 * feedback primitives (`CngxRipple`, `CngxPressable`, `CngxSpeak`) — the
 * fourth sense, audition, as composable atoms.
 *
 * The public surface is populated across Phase 1 (engine + `[cngxAudio]`
 * event-mode) and Phase 2 (`[cngxAudioStatus]`, `[cngxAudioZone]`,
 * `[cngxAudioPitch]`).
 */
export {};
