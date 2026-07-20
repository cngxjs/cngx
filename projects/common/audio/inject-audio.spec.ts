import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_AUDIO_CONFIG, withMuted, withVolume } from './config/audio-config';
import { type CngxAudioHandle, injectCngxAudio, provideCngxAudioAt } from './inject-audio';

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

function inject(config?: Record<string, unknown>): CngxAudioHandle {
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

// viewProviders reach the template children, not the host component itself,
// so the audio handle is read from a child directive/component in the view.
@Component({ selector: 'test-child', standalone: true, template: '' })
class ScopedChild {
  readonly audio = injectCngxAudio();
}

@Component({
  standalone: true,
  imports: [ScopedChild],
  template: '<test-child /><test-child />',
  viewProviders: [provideCngxAudioAt(withMuted(true), withVolume(0.3))],
})
class ScopedHost {}

@Component({ standalone: true, imports: [ScopedChild], template: '<test-child />' })
class RootHost {}

function children(fixture: ReturnType<typeof TestBed.createComponent>): ScopedChild[] {
  return fixture.debugElement.children.map((d) => d.componentInstance as ScopedChild);
}

describe('provideCngxAudioAt', () => {
  it('scopes an isolated engine reading the At config', () => {
    const scoped = TestBed.createComponent(ScopedHost);
    scoped.detectChanges();
    const [child] = children(scoped);

    expect(child.audio.muted()).toBe(true);
    expect(child.audio.volume()).toBe(0.3);
  });

  it('shares one scoped engine across the whole subtree', () => {
    const scoped = TestBed.createComponent(ScopedHost);
    scoped.detectChanges();
    const [a, b] = children(scoped);
    expect(a.audio).toBe(b.audio);
  });

  it('gives the scoped subtree a different engine than the root default', () => {
    const scoped = TestBed.createComponent(ScopedHost);
    scoped.detectChanges();
    const root = TestBed.createComponent(RootHost);
    root.detectChanges();
    const [scopedChild] = children(scoped);
    const [rootChild] = children(root);

    expect(scopedChild.audio).not.toBe(rootChild.audio);
    expect(rootChild.audio.muted()).toBe(false);
    expect(rootChild.audio.volume()).toBe(1);
  });

  it('layers over an ancestor config: scalars override, earcons merge', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_AUDIO_CONFIG,
          useValue: { volume: 0.6, earcons: { send: { sequence: [{ freq: 880, duration: 60 }] } } },
        },
      ],
    });
    const scoped = TestBed.createComponent(ScopedHost);
    scoped.detectChanges();
    const [child] = children(scoped);
    const merged = scoped.debugElement.children[0].injector.get(CNGX_AUDIO_CONFIG);

    // Scalars: the At features win over the ancestor.
    expect(merged.muted).toBe(true);
    expect(merged.volume).toBe(0.3);
    expect(child.audio.muted()).toBe(true);
    expect(child.audio.volume()).toBe(0.3);

    // Earcons: the ancestor's registry survives into the scope rather than
    // being replaced wholesale.
    expect(merged.earcons).toHaveProperty('send');
  });

  it('folds features into the scoped config when no ancestor config is set', () => {
    const scoped = TestBed.createComponent(ScopedHost);
    scoped.detectChanges();
    const merged = scoped.debugElement.children[0].injector.get(CNGX_AUDIO_CONFIG);
    expect(merged).toEqual({ muted: true, volume: 0.3, earcons: {} });
  });
});
