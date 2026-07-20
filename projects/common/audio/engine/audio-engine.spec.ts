import { type AudioContextMock, createAudioContextMock, createMatchMediaMock } from '@cngx/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { type CngxAudioConfig, CNGX_AUDIO_CONFIG } from '../config/audio-config';
import { type CngxAudioEngine, createAudioEngine } from './audio-engine';

function setupEngine(opts?: {
  reducedMotion?: boolean;
  config?: Partial<CngxAudioConfig>;
}): { engine: CngxAudioEngine; ctx: AudioContextMock; flipReducedMotion: (v: boolean) => void } {
  // jsdom ships no window.matchMedia; seed a placeholder so the shared mock's
  // install() has something to bind/restore.
  (window as unknown as Record<string, unknown>)['matchMedia'] = vi.fn();
  const mm = createMatchMediaMock(opts?.reducedMotion ?? false);
  mm.install(window);
  const ctx = createAudioContextMock('suspended');

  TestBed.configureTestingModule({
    providers: opts?.config ? [{ provide: CNGX_AUDIO_CONFIG, useValue: opts.config }] : [],
  });

  const engine = TestBed.runInInjectionContext(() =>
    createAudioEngine({ contextFactory: () => ctx as unknown as BaseAudioContext }),
  );

  return { engine, ctx, flipReducedMotion: (v) => mm.trigger(v) };
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as Record<string, unknown>)['matchMedia'];
});

describe('createAudioEngine', () => {
  describe('autoplay gate', () => {
    it('suppresses play until armed', () => {
      const { engine, ctx } = setupEngine();
      engine.play('tap');
      expect(engine.lastPlayed()).toBeNull();
      expect(ctx.oscillators).toHaveLength(0);
    });

    it('plays once armed', () => {
      const { engine, ctx } = setupEngine();
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.lastPlayed()).toBe('tap');
      expect(ctx.oscillators.length).toBeGreaterThan(0);
    });
  });

  describe('reduced-motion gate', () => {
    it('suppresses play while reduced-motion is set', () => {
      const { engine, ctx } = setupEngine({ reducedMotion: true });
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.lastPlayed()).toBeNull();
      expect(ctx.oscillators).toHaveLength(0);
    });

    it('plays again after a live reduced-motion change to false', () => {
      const { engine, flipReducedMotion } = setupEngine({ reducedMotion: true });
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.lastPlayed()).toBeNull();

      flipReducedMotion(false);
      engine.play('tap');
      expect(engine.lastPlayed()).toBe('tap');
    });

    it('ignores reduced-motion when respectReducedMotion is false', () => {
      const { engine } = setupEngine({ reducedMotion: true, config: { respectReducedMotion: false } });
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.lastPlayed()).toBe('tap');
    });
  });

  describe('mute gate', () => {
    it('suppresses play while muted', () => {
      const { engine } = setupEngine({ config: { muted: true } });
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.lastPlayed()).toBeNull();
      expect(engine.muted()).toBe(true);
    });

    it('resumes playing after unmute', () => {
      const { engine } = setupEngine({ config: { muted: true } });
      engine.armAutoplay();
      engine.setMuted(false);
      engine.play('tap');
      expect(engine.lastPlayed()).toBe('tap');
    });
  });

  describe('debouncer', () => {
    it('plays the same earcon at most once per window', () => {
      const { engine, ctx } = setupEngine();
      engine.armAutoplay();
      engine.play('tap');
      engine.play('tap');
      // tap is a single-tone earcon -> exactly one oscillator, second play debounced.
      expect(ctx.oscillators).toHaveLength(1);
    });
  });

  describe('lastPlayed', () => {
    it('advances once per accepted play and stays put when suppressed', () => {
      const { engine } = setupEngine();
      engine.armAutoplay();
      engine.play('success');
      expect(engine.lastPlayed()).toBe('success');

      engine.setMuted(true);
      engine.play('error');
      expect(engine.lastPlayed()).toBe('success');
    });

    it('does not advance for an unknown earcon and warns in dev mode', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { engine } = setupEngine();
      engine.armAutoplay();
      engine.play('does-not-exist');
      expect(engine.lastPlayed()).toBeNull();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('status', () => {
    it('starts idle before any play', () => {
      const { engine } = setupEngine();
      expect(engine.status()).toBe('idle');
    });

    it('creates and resumes the context on the first armed play', async () => {
      const { engine } = setupEngine();
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.status()).not.toBe('idle');
      await Promise.resolve();
      expect(engine.status()).toBe('running');
    });

    it('reports unsupported when no AudioContext can be created', () => {
      (window as unknown as Record<string, unknown>)['matchMedia'] = vi.fn();
      const mm = createMatchMediaMock(false);
      mm.install(window);
      TestBed.configureTestingModule({ providers: [] });
      const engine = TestBed.runInInjectionContext(() =>
        createAudioEngine({ contextFactory: () => null }),
      );
      engine.armAutoplay();
      engine.play('tap');
      expect(engine.status()).toBe('unsupported');
      expect(engine.lastPlayed()).toBeNull();
    });
  });

  describe('volume', () => {
    it('clamps volume to [0, 1]', () => {
      const { engine } = setupEngine();
      engine.setVolume(5);
      expect(engine.volume()).toBe(1);
      engine.setVolume(-2);
      expect(engine.volume()).toBe(0);
    });

    it('syncs the master gain node when volume changes', () => {
      const { engine, ctx } = setupEngine();
      engine.armAutoplay();
      engine.play('tap'); // creates the context + master gain (ctx.gains[0])
      engine.setVolume(0.5);
      TestBed.flushEffects();
      expect(ctx.gains[0].gain.value).toBe(0.5);
    });
  });

  describe('register', () => {
    it('plays a runtime-registered earcon', () => {
      const { engine } = setupEngine();
      engine.armAutoplay();
      engine.register('brand', { sequence: [{ freq: 500, duration: 60 }] });
      engine.play('brand');
      expect(engine.lastPlayed()).toBe('brand');
    });
  });
});
