import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordion } from './accordion.directive';
import type { CngxAccordionHeaderHandle } from './accordion-keyboard-nav';
import { CngxAccordionPanel } from './accordion-panel.directive';

@Component({
  template: `<div cngxAccordion [multi]="multi()" #acc="cngxAccordion">
    <button cngxAccordionPanel panelId="a" controls="r-a">A</button>
    <button cngxAccordionPanel panelId="b" controls="r-b">B</button>
    <button cngxAccordionPanel panelId="c" controls="r-c">C</button>
  </div>`,
  imports: [CngxAccordion, CngxAccordionPanel],
})
class Host {
  readonly multi = signal(false);
}

describe('CngxAccordion', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [Host] }));

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.directive(CngxAccordion));
    const buttons = fixture.debugElement
      .queryAll(By.directive(CngxAccordionPanel))
      .map((de) => de.nativeElement as HTMLElement);
    return { fixture, host: fixture.componentInstance, container, buttons };
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
    const { container } = setup();
    const accordion = container.injector.get(CngxAccordion);

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
    const { container } = setup();
    const accordion = container.injector.get(CngxAccordion);
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
});
