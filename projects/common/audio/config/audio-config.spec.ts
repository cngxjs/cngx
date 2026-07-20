import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  CNGX_AUDIO_DEFAULTS,
  injectAudioConfig,
  provideCngxAudio,
  withDebounceMs,
  withEarcons,
  withMuted,
  withRespectReducedMotion,
  withVolume,
} from './audio-config';

function resolve(...providers: ReturnType<typeof provideCngxAudio>[]) {
  TestBed.configureTestingModule({ providers });
  return TestBed.runInInjectionContext(() => injectAudioConfig());
}

describe('audio config', () => {
  it('returns library defaults when nothing is provided', () => {
    TestBed.configureTestingModule({ providers: [] });
    const cfg = TestBed.runInInjectionContext(() => injectAudioConfig());
    expect(cfg).toEqual(CNGX_AUDIO_DEFAULTS);
  });

  it('applies individual features over the defaults', () => {
    const cfg = resolve(provideCngxAudio(withVolume(0.5), withMuted(), withDebounceMs(250)));
    expect(cfg.volume).toBe(0.5);
    expect(cfg.muted).toBe(true);
    expect(cfg.debounceMs).toBe(250);
    // Untouched keys keep their defaults.
    expect(cfg.respectReducedMotion).toBe(true);
  });

  it('lets a later feature override an earlier one', () => {
    const cfg = resolve(provideCngxAudio(withVolume(0.3), withVolume(0.7)));
    expect(cfg.volume).toBe(0.7);
  });

  it('withMuted(false) explicitly unmutes', () => {
    const cfg = resolve(provideCngxAudio(withMuted(false)));
    expect(cfg.muted).toBe(false);
  });

  it('withRespectReducedMotion(false) disables the reduced-motion gate', () => {
    const cfg = resolve(provideCngxAudio(withRespectReducedMotion(false)));
    expect(cfg.respectReducedMotion).toBe(false);
  });

  it('merges earcons across multiple withEarcons features', () => {
    const cfg = resolve(
      provideCngxAudio(
        withEarcons({ a: { sequence: [{ freq: 400, duration: 50 }] } }),
        withEarcons({ b: { sequence: [{ freq: 500, duration: 50 }] } }),
      ),
    );
    expect(Object.keys(cfg.earcons).sort()).toEqual(['a', 'b']);
  });
});
