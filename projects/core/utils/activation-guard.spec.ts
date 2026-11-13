import { Component, Directive, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import { injectActivationGuard } from './activation-guard';

@Directive({ selector: '[guarded]' })
class Guarded {
  readonly refuses = input(false, { alias: 'guarded' });

  constructor() {
    injectActivationGuard(() => this.refuses());
  }
}

@Component({
  imports: [Guarded],
  template: `
    @if (shown()) {
      <button type="button" [guarded]="refuses()" (click)="onClick()">Go</button>
    }
  `,
})
class Host {
  readonly refuses = signal(false);
  readonly shown = signal(true);
  readonly clicks = vi.fn();

  onClick(): void {
    this.clicks();
  }
}

function setup(refuses: boolean) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.refuses.set(refuses);
  fixture.detectChanges();
  const button = () =>
    fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
  const listener = vi.fn();
  button().addEventListener('click', listener);
  button().addEventListener('auxclick', listener);
  return { fixture, button, listener, host: fixture.componentInstance };
}

function dispatch(el: HTMLElement, type: 'click' | 'auxclick'): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

describe('injectActivationGuard', () => {
  for (const type of ['click', 'auxclick'] as const) {
    it(`swallows ${type} on a refusing host`, () => {
      const { button, listener, host } = setup(true);

      const event = dispatch(button(), type);

      expect(event.defaultPrevented).toBe(true);
      expect(listener).not.toHaveBeenCalled();
      expect(host.clicks).not.toHaveBeenCalled();
    });

    it(`lets ${type} through on a host that does not refuse`, () => {
      const { button, listener } = setup(false);

      const event = dispatch(button(), type);

      expect(event.defaultPrevented).toBe(false);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  }

  it('runs the host (click) binding when the host does not refuse', () => {
    const { button, host } = setup(false);

    button().click();

    expect(host.clicks).toHaveBeenCalledTimes(1);
  });

  it('reads the predicate at event time', () => {
    const { fixture, button, listener, host } = setup(true);

    button().click();
    host.refuses.set(false);
    fixture.detectChanges();
    button().click();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(host.clicks).toHaveBeenCalledTimes(1);
  });

  it('removes its listeners when the host is destroyed', () => {
    const { fixture, button, host } = setup(true);
    const el = button();
    const removed = vi.spyOn(el, 'removeEventListener');

    host.shown.set(false);
    fixture.detectChanges();

    const removedTypes = removed.mock.calls
      .filter(([, , options]) => (options as AddEventListenerOptions | undefined)?.capture)
      .map(([type]) => type);
    expect(removedTypes).toEqual(expect.arrayContaining(['click', 'auxclick']));
    const listener = vi.fn();
    el.addEventListener('click', listener);
    el.click();
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
