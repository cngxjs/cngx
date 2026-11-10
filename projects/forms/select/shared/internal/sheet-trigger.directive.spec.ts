import { Component, computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { CngxSelectSheetTriggerEvents } from './select-sheet-wiring';
import { CngxSelectSheetTrigger } from './sheet-trigger.directive';

@Component({
  template: `
    <div class="trigger" [cngxSelectSheetTrigger]="events">
      <input class="field" (keydown)="seenAtKeydown = lead()" (focus)="seenAtFocus = lead()" />
      <button type="button" class="chip">x</button>
    </div>
    <button type="button" class="outside">outside</button>
  `,
  imports: [CngxSelectSheetTrigger],
})
class TriggerHost {
  readonly lead = signal(false);
  readonly focusOuts = signal(0);
  readonly log: string[] = [];
  seenAtKeydown: boolean | null = null;
  seenAtFocus: boolean | null = null;
  readonly events: CngxSelectSheetTriggerEvents = {
    handlePointerDown: () => {
      this.log.push('pointerdown');
      this.lead.set(false);
    },
    handleKey: () => {
      this.log.push('key');
      this.lead.set(true);
    },
    handleFocus: () => {
      this.log.push('focus');
      this.lead.set(true);
    },
    handleFocusOut: (_event, leftTrigger) => {
      this.log.push(leftTrigger ? 'left' : 'moved');
      this.focusOuts.update((count) => count + 1);
    },
  };
}

function setup() {
  const fixture = TestBed.createComponent(TriggerHost);
  fixture.detectChanges();
  document.body.appendChild(fixture.nativeElement);
  const root = fixture.nativeElement as HTMLElement;
  const q = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  return { host: fixture.componentInstance, q };
}

describe('CngxSelectSheetTrigger', () => {
  it("forwards a keydown before the trigger input's own handler runs", () => {
    const { host, q } = setup();
    q('.field').dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    expect(host.seenAtKeydown).toBe(true);
  });

  it("forwards a focus before the trigger input's own focus handler runs", () => {
    const { host, q } = setup();
    q<HTMLInputElement>('.field').focus();
    expect(host.seenAtFocus).toBe(true);
  });

  it('forwards pointer down and typed text', () => {
    const { host, q } = setup();
    q('.field').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    q('.field').dispatchEvent(new Event('input', { bubbles: true }));
    expect(host.log).toEqual(['pointerdown', 'key']);
  });

  it('tells a move inside the trigger from focus leaving it', () => {
    const { host, q } = setup();
    q<HTMLInputElement>('.field').focus();
    q<HTMLButtonElement>('.chip').focus();
    q<HTMLButtonElement>('.outside').focus();
    expect(host.log.filter((entry) => entry === 'moved' || entry === 'left')).toEqual([
      'moved',
      'left',
    ]);
  });

  describe('events dispatched inside a render pass', () => {
    // A listener's exception never reaches dispatchEvent's caller; the DOM
    // reports it on window instead, so that is where NG0600 would surface.
    const listenerErrors: unknown[] = [];
    const captureError = (e: ErrorEvent): void => {
      e.preventDefault();
      listenerErrors.push(e.error);
    };

    beforeEach(() => {
      listenerErrors.length = 0;
      window.addEventListener('error', captureError);
    });

    afterEach(() => {
      window.removeEventListener('error', captureError);
    });

    // A computed forbids signal writes the same way a template pass does.
    function dispatchInRenderPass(target: HTMLElement, event: Event): void {
      computed(() => target.dispatchEvent(event))();
    }

    it.each([
      ['focus', () => new FocusEvent('focus')],
      ['keydown', () => new KeyboardEvent('keydown', { key: 'r', bubbles: true })],
      ['input', () => new Event('input', { bubbles: true })],
      ['pointerdown', () => new Event('pointerdown', { bubbles: true })],
    ])('lets the wiring write a signal on %s', (_type, createEvent) => {
      const { host, q } = setup();

      dispatchInRenderPass(q('.field'), createEvent());

      expect(listenerErrors).toEqual([]);
      expect(host.log).toHaveLength(1);
    });

    it('lets the wiring write a signal on focusout', () => {
      const { host, q } = setup();

      dispatchInRenderPass(q('.field'), new FocusEvent('focusout', { bubbles: true }));

      expect(listenerErrors).toEqual([]);
      expect(host.focusOuts()).toBe(1);
    });
  });
});
