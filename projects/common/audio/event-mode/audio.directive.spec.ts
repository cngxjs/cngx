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
  template: `<button [cngxAudio]="spec()" [audioDisabled]="disabled()" [audioVolume]="vol()">x</button>`,
})
class Host {
  readonly spec = signal('click:tap');
  readonly disabled = signal(false);
  readonly vol = signal<number | undefined>(undefined);
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
  if (config?.spec !== undefined) {
    host.spec.set(config.spec);
  }
  if (config?.disabled !== undefined) {
    host.disabled.set(config.disabled);
  }
  if (config?.vol !== undefined) {
    host.vol.set(config.vol);
  }
  fixture.detectChanges();
  const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  return { fixture, host, button, handle };
}

interface ListenerCall {
  readonly target: EventTarget;
  readonly type: string;
}

/**
 * Record every add/removeEventListener call on HTMLElement while still calling
 * through, so the directive keeps working and the spec can assert what it
 * registered. Install before createComponent — the effect binds on first CD.
 */
function trackListenerCalls(): { added: ListenerCall[]; removed: ListenerCall[] } {
  const added: ListenerCall[] = [];
  const removed: ListenerCall[] = [];
  const realAdd = HTMLElement.prototype.addEventListener;
  const realRemove = HTMLElement.prototype.removeEventListener;

  vi.spyOn(HTMLElement.prototype, 'addEventListener').mockImplementation(function (
    this: HTMLElement,
    ...args: Parameters<HTMLElement['addEventListener']>
  ) {
    added.push({ target: this, type: String(args[0]) });
    realAdd.apply(this, args);
  });
  vi.spyOn(HTMLElement.prototype, 'removeEventListener').mockImplementation(function (
    this: HTMLElement,
    ...args: Parameters<HTMLElement['removeEventListener']>
  ) {
    removed.push({ target: this, type: String(args[0]) });
    realRemove.apply(this, args);
  });

  return { added, removed };
}

const typesOn = (calls: readonly ListenerCall[], target: EventTarget): string[] =>
  calls.filter((c) => c.target === target).map((c) => c.type);

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

  it('binds only the DOM events the spec declares', () => {
    const calls = trackListenerCalls();
    const { button } = setup({ spec: 'click:tap' });

    expect(typesOn(calls.added, button)).toEqual(['click']);
  });

  it('does not play an event type the spec never named', () => {
    const { button, handle } = setup({ spec: 'click:tap' });

    button.dispatchEvent(new Event('input'));
    button.dispatchEvent(new Event('change'));

    expect(handle.play).not.toHaveBeenCalled();
  });

  it('rebinds on a spec change and leaves unchanged types bound', () => {
    const calls = trackListenerCalls();
    const { fixture, host, button, handle } = setup({ spec: 'click:tap, focus:notification' });

    host.spec.set('focus:notification, input:complete');
    fixture.detectChanges();

    expect(typesOn(calls.added, button)).toEqual(['click', 'focus', 'input']);
    expect(typesOn(calls.removed, button)).toEqual(['click']);

    button.click();
    expect(handle.play).not.toHaveBeenCalled();

    button.dispatchEvent(new Event('input'));
    expect(handle.play).toHaveBeenCalledWith('complete', undefined);
  });

  it('removes every listener it added when the host is destroyed', () => {
    const calls = trackListenerCalls();
    const { fixture, button, handle } = setup({ spec: 'click:tap, focus:notification' });

    fixture.destroy();

    expect(typesOn(calls.removed, button)).toEqual(['click', 'focus']);

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
