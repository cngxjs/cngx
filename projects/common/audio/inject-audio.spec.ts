import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_AUDIO_CONFIG } from './config/audio-config';
import { type CngxAudio, injectCngxAudio } from './inject-audio';

beforeEach(() => {
  // Engine construction reads injectMediaQuery; jsdom has no matchMedia.
  (window as unknown as Record<string, unknown>)['matchMedia'] = vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as Record<string, unknown>)['matchMedia'];
});

function inject(config?: Record<string, unknown>): CngxAudio {
  TestBed.configureTestingModule({
    providers: config ? [{ provide: CNGX_AUDIO_CONFIG, useValue: config }] : [],
  });
  return TestBed.runInInjectionContext(() => injectCngxAudio());
}

describe('injectCngxAudio', () => {
  it('returns a handle exposing the public audio surface', () => {
    const audio = inject();
    expect(typeof audio.play).toBe('function');
    expect(typeof audio.setMuted).toBe('function');
    expect(typeof audio.muted).toBe('function');
    expect(typeof audio.status).toBe('function');
    expect(typeof audio.lastPlayed).toBe('function');
  });

  it('shares one engine instance across calls in the same injector', () => {
    inject();
    const a = TestBed.runInInjectionContext(() => injectCngxAudio());
    const b = TestBed.runInInjectionContext(() => injectCngxAudio());
    expect(a).toBe(b);
  });

  it('reflects config on the handle signals', () => {
    const audio = inject({ muted: true, volume: 0.4 });
    expect(audio.muted()).toBe(true);
    expect(audio.volume()).toBe(0.4);
  });

  it('setMuted round-trips through the shared handle', () => {
    const audio = inject();
    audio.setMuted(true);
    expect(audio.muted()).toBe(true);
    audio.setMuted(false);
    expect(audio.muted()).toBe(false);
  });
});
