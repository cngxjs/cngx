import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxSlider } from './slider.directive';

@Component({
  template: `<div
    cngxSlider
    [(value)]="v"
    [min]="min()"
    [max]="max()"
    [step]="step()"
    [disabled]="off()"
    [valueText]="fmt()"
  ></div>`,
  imports: [CngxSlider],
})
class Host {
  v = signal(50);
  min = signal(0);
  max = signal(100);
  step = signal(1);
  off = signal(false);
  fmt = signal<((value: number) => string) | undefined>(undefined);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const de = fixture.debugElement.query(By.directive(CngxSlider));
  return { fixture, host: fixture.componentInstance, el: de.nativeElement as HTMLElement };
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

describe('CngxSlider', () => {
  it('exposes role=slider and reflects min/max/now in the value ARIA surface', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
    expect(el.getAttribute('aria-valuenow')).toBe('50');
    expect(el.getAttribute('tabindex')).toBe('0');
  });

  it('Arrow keys move by one step and update aria-valuenow', () => {
    const { fixture, host, el } = setup();
    const right = press(el, 'ArrowRight');
    fixture.detectChanges();
    expect(host.v()).toBe(51);
    expect(el.getAttribute('aria-valuenow')).toBe('51');
    expect(right.defaultPrevented).toBe(true);

    press(el, 'ArrowDown');
    fixture.detectChanges();
    expect(host.v()).toBe(50);
  });

  it('Home/End jump to min/max', () => {
    const { fixture, host, el } = setup();
    press(el, 'Home');
    fixture.detectChanges();
    expect(host.v()).toBe(0);
    press(el, 'End');
    fixture.detectChanges();
    expect(host.v()).toBe(100);
  });

  it('PageUp/PageDown jump by the default large step (a tenth of the range)', () => {
    const { fixture, host, el } = setup();
    press(el, 'PageUp');
    fixture.detectChanges();
    expect(host.v()).toBe(60);
    press(el, 'PageDown');
    fixture.detectChanges();
    expect(host.v()).toBe(50);
  });

  it('clamps to min and max and never overshoots', () => {
    const { fixture, host, el } = setup();
    host.v.set(99);
    fixture.detectChanges();
    press(el, 'PageUp');
    fixture.detectChanges();
    expect(host.v()).toBe(100);
    press(el, 'ArrowUp');
    fixture.detectChanges();
    expect(host.v()).toBe(100);
  });

  it('aria-valuetext reflects the formatter reactively', () => {
    const { fixture, host, el } = setup();
    expect(el.getAttribute('aria-valuetext')).toBe('50');
    host.fmt.set((value) => `${value}%`);
    fixture.detectChanges();
    expect(el.getAttribute('aria-valuetext')).toBe('50%');
  });

  it('blocks keyboard and reflects aria-disabled + tabindex=-1 when disabled', () => {
    const { fixture, host, el } = setup();
    host.off.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.getAttribute('tabindex')).toBe('-1');
    const event = press(el, 'ArrowRight');
    fixture.detectChanges();
    expect(host.v()).toBe(50);
    expect(event.defaultPrevented).toBe(false);
  });

  it('snaps pointer drags to the step grid using the track geometry', () => {
    const { fixture, host, el } = setup();
    el.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 200, height: 10, right: 200, bottom: 10 }) as DOMRect;
    el.setPointerCapture = () => undefined;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 150, clientY: 5, pointerId: 1, cancelable: true }),
    );
    fixture.detectChanges();
    expect(host.v()).toBe(75);
  });
});
