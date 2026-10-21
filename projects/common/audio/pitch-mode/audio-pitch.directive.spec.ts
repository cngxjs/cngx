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
    [pitchDomain]="domain()"
    [pitchRange]="range"
    [pitchThrottleMs]="throttle()"
    [audioVolume]="vol"
    [audioDisabled]="disabled"
  >
    x
  </div>`,
})
class Host {
  readonly value = signal(50);
  readonly throttle = signal(1000);
  readonly domain = signal<[number, number]>([0, 100]);
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
    host.domain.set(config.domain);
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

  it('maps an inverted domain', () => {
    const { host, fixture, handle } = setup({ value: 50, domain: [100, 0], range: [220, 880] });
    sweep(host, fixture, 100);
    expect(lastToneFreq(handle)).toBe(220);
    host.throttle.set(0);
    sweep(host, fixture, 0);
    expect(lastToneFreq(handle)).toBe(880);
  });

  it('clamps against an inverted domain', () => {
    const { host, fixture, handle } = setup({
      value: 50,
      domain: [100, 0],
      range: [220, 880],
      throttle: 0,
    });
    sweep(host, fixture, 150);
    expect(lastToneFreq(handle)).toBe(220);
    sweep(host, fixture, -50);
    expect(lastToneFreq(handle)).toBe(880);
  });

  describe('empty domain', () => {
    const CNGX1069 = /^CNGX1069: \[cngxAudioPitch\]/;

    function warnSpy() {
      return vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    }

    function warnCount(warn: ReturnType<typeof warnSpy>): number {
      return warn.mock.calls.filter(([msg]) => CNGX1069.test(String(msg))).length;
    }

    function setDomain(host: Host, fixture: ReturnType<typeof TestBed.createComponent>, d: [number, number]) {
      host.domain.set(d);
      fixture.detectChanges();
    }

    it('warns CNGX1069 when the domain becomes empty and plays range low', () => {
      const warn = warnSpy();
      const { host, fixture, handle } = setup({ value: 0, domain: [0, 100], range: [220, 880] });
      expect(warnCount(warn)).toBe(0);

      setDomain(host, fixture, [5, 5]);
      expect(warnCount(warn)).toBe(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(/^CNGX1069: \[cngxAudioPitch\] \[pitchDomain\] \[5, 5\] is empty; every value plays 220 Hz/),
      );

      sweep(host, fixture, 70);
      expect(lastToneFreq(handle)).toBe(220);
    });

    it('stays silent for a re-bound identical empty tuple', () => {
      const warn = warnSpy();
      const { host, fixture } = setup({ value: 0, domain: [5, 5] });
      expect(warnCount(warn)).toBe(1);

      setDomain(host, fixture, [5, 5]);
      expect(warnCount(warn)).toBe(1);
    });

    it('warns again after the domain left the empty state and re-entered the identical empty tuple', () => {
      const warn = warnSpy();
      const { host, fixture } = setup({ value: 0, domain: [5, 5] });
      setDomain(host, fixture, [0, 10]);
      setDomain(host, fixture, [5, 5]);
      expect(warnCount(warn)).toBe(2);
    });
  });

  it('passes the configured tone duration', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100] });
    sweep(host, fixture, 10);
    expect(handle.tone).toHaveBeenCalledWith(expect.any(Number), 120, undefined, undefined);
  });

  it('does not play while audioDisabled is true', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100], disabled: true });
    sweep(host, fixture, 50);
    expect(handle.tone).not.toHaveBeenCalled();
  });

  it('forwards audioVolume to the engine as the per-call scale', () => {
    const { host, fixture, handle } = setup({ value: 0, domain: [0, 100], vol: 0.5 });
    sweep(host, fixture, 50);
    // The engine owns the multiply and the clamp; the directive passes the raw scale.
    expect(handle.tone).toHaveBeenCalledWith(expect.any(Number), 120, undefined, 0.5);
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
