import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxAccordion } from './accordion.directive';
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

  function tabindex(el: HTMLElement): string {
    return el.getAttribute('tabindex') ?? '';
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

  it('reflects aria-multiselectable from the multi input', () => {
    const { fixture, host, container } = setup();
    expect(container.nativeElement.getAttribute('aria-multiselectable')).toBeNull();
    host.multi.set(true);
    fixture.detectChanges();
    expect(container.nativeElement.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('roves header focus vertically with ArrowDown / ArrowUp', () => {
    const { fixture, container, buttons } = setup();
    expect(tabindex(buttons[0])).toBe('0');

    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('-1');
    expect(tabindex(buttons[1])).toBe('0');

    container.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(tabindex(buttons[0])).toBe('0');
  });
});
