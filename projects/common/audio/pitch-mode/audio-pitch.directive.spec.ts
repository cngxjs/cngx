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
    [pitchThrottleMs]="throttle()"
    [audioVolume]="vol"
    [audioDisabled]="disabled">
    x
  </div>`,
})
class Host {
  readonly value = signal(50);
  readonly throttle = signal(1000);
  domain: [number, number] = [0, 100];
  range: [number, number] = [200, 400];
  vol: number | undefined = undefined;
  disabled = false;
}

interface PitchConfig {
  value?: number;
  domain?: [number, number];
  range?: [number, number];
  throttle?: number;
  vol?: number;
  disabled?: boolean;
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
    host.throttle.set(config.throttle);
  }
  if (config?.vol !== undefined) {
    host.vol = config.vol;
  }
  if (config?.disabled !== undefined) {
    host.disabled = config.disabled;
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
  /** Drive a value change; the directive sonifies changes, not the mount value. */
  function sweep(
    host: Host,
    fixture: ReturnType<typeof TestBed.createComponent>,
    next: number,
  ): void {
    host.value.set(next);
    fixture.detectChanges();
  }

  it('does not sonify the initial value on mount', () => {
    const { handle } = setup({ value: 50, domain: [0, 100] });
    expect(handle.tone).not.toHaveBeenCalled();
  });

  it('linear-scales a mid-domain value into the range', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100], range: [200, 400] });
    sweep(host, fixture, 50);
    expect(handle.tone).toHaveBeenCalledTimes(1);
    expect(lastToneFreq(handle)).toBe(300);
  });

  it('clamps a below-domain value to the range low endpoint', () => {
    const { host, fixture, handle } = setup({ value: 50, domain: [0, 100], range: [200, 400] });
    sweep(host, fixture, -20);
    expect(lastToneFreq(handle)).toBe(200);
  });

  it('clamps an above-domain value to the range high endpoint', () => {
    const { host, fixture, handle } = setup({ value: 50, domain: [0, 100], range: [200, 400] });
    sweep(host, fixture, 999);
    expect(lastToneFreq(handle)).toBe(400);
  });

  it('passes the configured tone duration', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100] });
    sweep(host, fixture, 10);
    expect(handle.tone).toHaveBeenCalledWith(expect.any(Number), 120, undefined);
  });

  it('does not play while audioDisabled is true', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100], disabled: true });
    sweep(host, fixture, 50);
    expect(handle.tone).not.toHaveBeenCalled();
  });

  it('scales the tone gain by audioVolume', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100], vol: 0.5 });
    sweep(host, fixture, 50);
    expect(handle.tone).toHaveBeenCalledWith(expect.any(Number), 120, { gain: 0.1 });
  });

  it('throttles a rapid sweep to one tone per window', () => {
    const { host, fixture, handle } = setup({ value: 10, domain: [0, 100], throttle: 1000 });
    sweep(host, fixture, 40);
    expect(handle.tone).toHaveBeenCalledTimes(1);

    // The follow-up sweep lands inside the 1000 ms window -> suppressed.
    sweep(host, fixture, 80);
    expect(handle.tone).toHaveBeenCalledTimes(1);
  });

  it('re-reads pitchThrottleMs when it changes mid-flight', () => {
    const { host, fixture, handle } = setup({ value: 10, domain: [0, 100], throttle: 1000 });
    sweep(host, fixture, 40);
    expect(handle.tone).toHaveBeenCalledTimes(1);

    sweep(host, fixture, 60);
    expect(handle.tone).toHaveBeenCalledTimes(1);

    // Narrowing the window to 0 disables throttling; the next sweep must fire.
    host.throttle.set(0);
    fixture.detectChanges();
    sweep(host, fixture, 80);
    expect(handle.tone).toHaveBeenCalledTimes(2);
  });
});
