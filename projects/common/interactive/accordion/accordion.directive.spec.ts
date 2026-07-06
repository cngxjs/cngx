import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordion } from './accordion.directive';
import type { CngxAccordionHeaderHandle } from './accordion-keyboard-nav';
import { CngxAccordionPanel } from './accordion-panel.directive';

@Component({
  template: `<div cngxAccordion [multi]="multi()" [(openIds)]="open" #acc="cngxAccordion">
    <button cngxAccordionPanel panelId="a" controls="r-a">A</button>
    <button cngxAccordionPanel panelId="b" controls="r-b" [disabled]="bDisabled()">B</button>
    <button cngxAccordionPanel panelId="c" controls="r-c">C</button>
  </div>`,
  imports: [CngxAccordion, CngxAccordionPanel],
})
class Host {
  readonly multi = signal(false);
  readonly bDisabled = signal(false);
  readonly open = signal<ReadonlySet<string>>(new Set());
}

@Component({
  template: `<div cngxAccordion></div>`,
  imports: [CngxAccordion],
})
class BareHost {}

describe('CngxAccordion', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host, BareHost] }));

  function setupBare() {
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const accordion = fixture.debugElement.query(By.directive(CngxAccordion)).injector.get(CngxAccordion);
    return { fixture, accordion };
  }

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxAccordion));
    const accordion = container.injector.get(CngxAccordion);
    const buttons = fixture.debugElement
      .queryAll(By.directive(CngxAccordionPanel))
      .map((de) => de.nativeElement as HTMLElement);
    return { fixture, host: fixture.componentInstance, container, accordion, buttons };
  }

  function tabindex(el: HTMLElement): string {
    return el.getAttribute('tabindex') ?? '';
  }

  function keydown(el: HTMLElement, key: string): void {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  }

  it('wires aria-controls and starts collapsed', () => {
    const { buttons } = setup();
    expect(buttons[0].getAttribute('aria-controls')).toBe('r-a');
    expect(buttons.every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
  });

  it('single-open mode closes the previous panel when another opens', () => {
    const { fixture, buttons } = setup();
    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');

    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('single-open mode toggles the same panel shut on a second click', () => {
    const { fixture, buttons } = setup();
    buttons[0].click();
    fixture.detectChanges();
    buttons[0].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
  });

  it('multi-open mode keeps panels independently open', () => {
    const { fixture, host, buttons } = setup();
    host.multi.set(true);
    fixture.detectChanges();
    buttons[0].click();
    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('carries no aria-multiselectable (inert on a bare container role)', () => {
    const { fixture, host, container } = setup();
    expect(container.nativeElement.getAttribute('aria-multiselectable')).toBeNull();
    host.multi.set(true);
    fixture.detectChanges();
    expect(container.nativeElement.getAttribute('aria-multiselectable')).toBeNull();
  });

  it('derives the roving stop preserve-then-default over the header registry', () => {
    const { accordion } = setupBare();

    const makeHandle = (id: string, disabled = false): CngxAccordionHeaderHandle => ({
      id,
      element: document.createElement('button'),
      disabled: signal(disabled),
    });
    const a = makeHandle('a');
    const b = makeHandle('b');

    accordion.registerHeader(a);
    accordion.registerHeader(b);
    // First enabled header is the default stop.
    expect(accordion.rovingActiveId()).toBe('a');
    expect(accordion.nav.headerTabindex(a)).toBe(0);
    expect(accordion.nav.headerTabindex(b)).toBe(-1);

    // Keyboard movement records the stop; an unrelated registration preserves it.
    accordion.setRovingActive('b');
    accordion.registerHeader(makeHandle('c'));
    expect(accordion.rovingActiveId()).toBe('b');

    // Removing the active header falls back to the first enabled one.
    accordion.unregisterHeader(b);
    expect(accordion.rovingActiveId()).toBe('a');
  });

  it('defaults the roving stop past a disabled first header', () => {
    const { accordion } = setupBare();
    accordion.registerHeader({
      id: 'a',
      element: document.createElement('button'),
      disabled: signal(true),
    });
    accordion.registerHeader({
      id: 'b',
      element: document.createElement('button'),
      disabled: signal(false),
    });
    expect(accordion.rovingActiveId()).toBe('b');
  });

  it('starts with only the first header a tab stop', () => {
    const { buttons } = setup();
    expect(tabindex(buttons[0])).toBe('0');
    expect(tabindex(buttons[1])).toBe('-1');
    expect(tabindex(buttons[2])).toBe('-1');
  });

  it('ArrowDown on a header button roves focus and the tab stop to the sibling', () => {
    const { fixture, buttons } = setup();
    buttons[0].focus();

    keydown(buttons[0], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons[1]);
    expect(tabindex(buttons[0])).toBe('-1');
    expect(tabindex(buttons[1])).toBe('0');

    keydown(buttons[1], 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(buttons[0]);
    expect(tabindex(buttons[0])).toBe('0');
  });

  it('skips a disabled header during ArrowDown and marks it aria-disabled + non-stop', () => {
    const { fixture, host, buttons } = setup();
    host.bDisabled.set(true);
    fixture.detectChanges();

    expect(buttons[1].getAttribute('aria-disabled')).toBe('true');
    expect(tabindex(buttons[1])).toBe('-1');

    buttons[0].focus();
    keydown(buttons[0], 'ArrowDown');
    fixture.detectChanges();
    // 'b' is disabled -> ArrowDown lands on 'c'.
    expect(document.activeElement).toBe(buttons[2]);
    expect(tabindex(buttons[2])).toBe('0');
  });

  it('does not toggle a disabled header on click', () => {
    const { fixture, host, buttons } = setup();
    host.bDisabled.set(true);
    fixture.detectChanges();

    buttons[1].click();
    fixture.detectChanges();
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
  });

  it('seeds initially-open panels from the controlled openIds model', () => {
    const { fixture, host, buttons } = setup();
    host.multi.set(true);
    host.open.set(new Set(['a', 'c']));
    fixture.detectChanges();

    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(buttons[1].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true');
  });

  it('clamps a multi-id seed to one open panel in single-open mode', () => {
    const { fixture, host, buttons } = setup();
    host.open.set(new Set(['a', 'c']));
    fixture.detectChanges();

    // Single mode projects the last seeded id valid without writing back.
    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(buttons[2].getAttribute('aria-expanded')).toBe('true');
  });

  it('two-way writes the model back to the host on toggle', () => {
    const { fixture, host, buttons } = setup();
    buttons[0].click();
    fixture.detectChanges();
    expect([...host.open()]).toEqual(['a']);

    buttons[0].click();
    fixture.detectChanges();
    expect(host.open().size).toBe(0);
  });

  it('clamps a single-mode seed via a derivation without writing back the model', () => {
    const { accordion } = setupBare();
    accordion.openIds.set(new Set(['a', 'b']));

    // Single mode (multi defaults false): isOpen projects only the last id...
    expect(accordion.isOpen('a')).toBe(false);
    expect(accordion.isOpen('b')).toBe(true);
    // ...while the consumer's set is left untouched (controlled-wins, no write-back).
    expect([...accordion.openIds()]).toEqual(['a', 'b']);
  });
});
