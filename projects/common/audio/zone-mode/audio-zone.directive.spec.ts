import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_AUDIO_ENGINE, type CngxAudioHandle } from '../inject-audio';
import { CngxAudioZone, type CngxAudioZoneBinding } from './audio-zone.directive';

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
  imports: [CngxAudioZone],
  template: `<div [cngxAudioZone]="zone" [audioDisabled]="disabled" [audioVolume]="vol">x</div>`,
})
class Host {
  zone: CngxAudioZoneBinding = { enter: 'notification', leave: 'tap', focus: 'tap', blur: 'tap' };
  disabled = false;
  vol: number | undefined = undefined;
}

function setup(
  config?: { zone?: CngxAudioZoneBinding; disabled?: boolean; vol?: number },
  handle: CngxAudioHandle = createMockHandle(),
) {
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [{ provide: CNGX_AUDIO_ENGINE, useValue: handle }],
  });
  const fixture = TestBed.createComponent(Host);
  const host = fixture.componentInstance;
  Object.assign(host, config);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('div') as HTMLElement;
  return { fixture, host, el, handle };
}

afterEach(() => vi.restoreAllMocks());

describe('CngxAudioZone directive', () => {
  it('plays the enter earcon on pointerenter', () => {
    const { el, handle } = setup();
    el.dispatchEvent(new Event('pointerenter'));
    expect(handle.play).toHaveBeenCalledWith('notification', undefined);
  });

  it('plays the leave earcon on pointerleave', () => {
    const { el, handle } = setup();
    el.dispatchEvent(new Event('pointerleave'));
    expect(handle.play).toHaveBeenCalledWith('tap', undefined);
  });

  it('plays the focus earcon on focusin and blur earcon on focusout', () => {
    const { el, handle } = setup({ zone: { focus: 'notification', blur: 'complete' } });
    el.dispatchEvent(new Event('focusin'));
    el.dispatchEvent(new Event('focusout'));
    expect(handle.play).toHaveBeenNthCalledWith(1, 'notification', undefined);
    expect(handle.play).toHaveBeenNthCalledWith(2, 'complete', undefined);
  });

  it('plays nothing for an omitted zone key', () => {
    const { el, handle } = setup({ zone: { enter: 'notification' } });
    el.dispatchEvent(new Event('pointerleave'));
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('does not play when audioDisabled is true', () => {
    const { el, handle } = setup({ disabled: true });
    el.dispatchEvent(new Event('pointerenter'));
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('passes the per-element volume to play', () => {
    const { el, handle } = setup({ vol: 0.4 });
    el.dispatchEvent(new Event('pointerenter'));
    expect(handle.play).toHaveBeenCalledWith('notification', 0.4);
  });
});
