import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CNGX_AUDIO_ENGINE, type CngxAudioHandle } from '../inject-audio';
import { CngxAudio } from './audio.directive';

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
  imports: [CngxAudio],
  template: `<button [cngxAudio]="spec" [audioDisabled]="disabled" [audioVolume]="vol">x</button>`,
})
class Host {
  spec = 'click:tap';
  disabled = false;
  vol: number | undefined = undefined;
}

function setup(
  config?: { spec?: string; disabled?: boolean; vol?: number },
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
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { fixture, host, button, handle };
}

afterEach(() => vi.restoreAllMocks());

describe('CngxAudio directive', () => {
  it('plays the mapped earcon on the bound DOM event', () => {
    const { button, handle } = setup();
    button.click();
    expect(handle.play).toHaveBeenCalledWith('tap', undefined);
  });

  it('treats a bare audioDisabled attribute as true', () => {
    @Component({
      standalone: true,
      imports: [CngxAudio],
      template: `<button [cngxAudio]="'click:tap'" audioDisabled>x</button>`,
    })
    class BareHost {}

    const handle = createMockHandle();
    TestBed.configureTestingModule({
      imports: [BareHost],
      providers: [{ provide: CNGX_AUDIO_ENGINE, useValue: handle }],
    });
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('does not play when audioDisabled is true', () => {
    const { button, handle } = setup({ disabled: true });
    button.click();
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('passes the per-element volume to play', () => {
    const { button, handle } = setup({ vol: 0.5 });
    button.click();
    expect(handle.play).toHaveBeenCalledWith('tap', 0.5);
  });

  it('ignores DOM events with no mapped earcon', () => {
    const { button, handle } = setup({ spec: 'focus:tap' });
    button.click();
    expect(handle.play).not.toHaveBeenCalled();
  });

  it('dev-warns (error) when a lifecycle key is bound', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { fixture } = setup({ spec: 'pending:tap' });
    await fixture.whenStable();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('[cngxAudioStatus]'));
  });
});
