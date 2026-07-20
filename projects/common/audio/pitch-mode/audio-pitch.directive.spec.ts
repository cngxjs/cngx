import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_AUDIO_ENGINE, type CngxAudioHandle } from '../inject-audio';
import { CngxAudioPitch } from './audio-pitch.directive';

function createMockHandle(): CngxAudioHandle {
  return {
    play: vi.fn(),
    tone: vi.fn(),
    sequence: vi.fn(),
    register: vi.fn(),
    armAutoplay: vi.fn(),
    setMuted: vi.fn(),
    setVolume: vi.fn(),
    muted: signal(false),
    volume: signal(1),
    status: signal('idle'),
    lastPlayed: signal(null),
  };
}

@Component({
  standalone: true,
  imports: [CngxAudioPitch],
  template: `<div
    [cngxAudioPitch]="value()"
    [pitchDomain]="domain"
    [pitchRange]="range"
    [pitchThrottleMs]="throttle">
    x
  </div>`,
})
class Host {
  readonly value = signal(50);
  domain: [number, number] = [0, 100];
  range: [number, number] = [200, 400];
  throttle = 1000;
}

interface PitchConfig {
  value?: number;
  domain?: [number, number];
  range?: [number, number];
  throttle?: number;
}

function setup(config?: PitchConfig, handle: CngxAudioHandle = createMockHandle()) {
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [{ provide: CNGX_AUDIO_ENGINE, useValue: handle }],
  });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  if (config?.domain) {
    host.domain = config.domain;
  }
  if (config?.range) {
    host.range = config.range;
  }
  if (config?.throttle !== undefined) {
    host.throttle = config.throttle;
  }
  if (config?.value !== undefined) {
    host.value.set(config.value);
  }
  fixture.detectChanges();
  return { fixture, host, handle };
}

/** Frequency argument of the last tone() call. */
function lastToneFreq(handle: CngxAudioHandle): number {
  const calls = (handle.tone as unknown as { mock: { calls: number[][] } }).mock.calls;
  return calls[calls.length - 1][0];
}

afterEach(() => vi.restoreAllMocks());

describe('CngxAudioPitch directive', () => {
  it('linear-scales a mid-domain value into the range', () => {
    const { handle } = setup({ value: 50, domain: [0, 100], range: [200, 400] });
    expect(handle.tone).toHaveBeenCalledTimes(1);
    expect(lastToneFreq(handle)).toBe(300);
  });

  it('clamps a below-domain value to the range low endpoint', () => {
    const { handle } = setup({ value: -20, domain: [0, 100], range: [200, 400] });
    expect(lastToneFreq(handle)).toBe(200);
  });

  it('clamps an above-domain value to the range high endpoint', () => {
    const { handle } = setup({ value: 999, domain: [0, 100], range: [200, 400] });
    expect(lastToneFreq(handle)).toBe(400);
  });

  it('passes the configured tone duration', () => {
    const { handle } = setup({ value: 0, domain: [0, 100] });
    expect(handle.tone).toHaveBeenCalledWith(expect.any(Number), 120);
  });

  it('throttles a rapid sweep to one tone per window', () => {
    const { host, fixture, handle } = setup({ value: 10, domain: [0, 100], throttle: 1000 });
    expect(handle.tone).toHaveBeenCalledTimes(1);

    host.value.set(40);
    fixture.detectChanges();
    host.value.set(80);
    fixture.detectChanges();

    // Both follow-up sweeps land inside the 1000 ms window -> suppressed.
    expect(handle.tone).toHaveBeenCalledTimes(1);
  });
});
