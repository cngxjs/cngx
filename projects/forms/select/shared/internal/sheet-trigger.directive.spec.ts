import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

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
});
