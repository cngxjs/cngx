import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxSlider } from './slider.component';
import { CngxRangeSlider } from './range-slider.component';

describe('CngxSlider component', () => {
  @Component({
    template: `<cngx-slider
      aria-label="Vol"
      [(value)]="v"
      [min]="0"
      [max]="100"
      [step]="5"
      [showValue]="show()"
      [valueText]="fmt()"
    />`,
    imports: [CngxSlider],
  })
  class Host {
    v = signal(40);
    show = signal(false);
    fmt = signal<((value: number) => string) | undefined>(undefined);
  }

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxSlider)).nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('renders the skin and exposes role=slider on the host', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.querySelector('.cngx-slider__track')).toBeTruthy();
    expect(el.querySelector('.cngx-slider__thumb')).toBeTruthy();
    expect(el.getAttribute('aria-valuenow')).toBe('40');
  });

  it('moves on keyboard and two-way-syncs value', () => {
    const { fixture, host, el } = setup();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    fixture.detectChanges();
    expect(host.v()).toBe(45);
    expect(el.getAttribute('aria-valuenow')).toBe('45');
  });

  it('shows the formatted value only when showValue is set', () => {
    const { fixture, host, el } = setup();
    host.fmt.set((value) => `${value}%`);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-slider__value')).toBeNull();
    host.show.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-slider__value')?.textContent?.trim()).toBe('40%');
  });
});

describe('CngxSlider showTicks + thumbGlyph + vertical', () => {
  @Component({
    template: `
      <ng-template #glyph><span data-test="glyph">x</span></ng-template>
      <cngx-slider
        [(value)]="v"
        [min]="0"
        [max]="100"
        [step]="5"
        [showTicks]="ticks()"
        [showTickLabels]="labels()"
        [showValueBubble]="bubble()"
        [orientation]="orient()"
        [valueText]="fmt()"
        [thumbGlyph]="glyph"
      />
    `,
    imports: [CngxSlider],
  })
  class Host {
    v = signal(40);
    ticks = signal(false);
    labels = signal(false);
    bubble = signal(false);
    orient = signal<'horizontal' | 'vertical'>('horizontal');
    fmt = signal<((value: number) => string) | undefined>(undefined);
  }

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxSlider)).nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('projects thumbGlyph into the thumb', () => {
    const { el } = setup();
    expect(el.querySelector('.cngx-slider__thumb [data-test="glyph"]')?.textContent).toBe('x');
  });

  it('sets the tick-interval var + class only when showTicks is on', () => {
    const { fixture, host, el } = setup();
    expect(el.classList.contains('cngx-slider--ticks')).toBe(false);
    host.ticks.set(true);
    fixture.detectChanges();
    expect(el.classList.contains('cngx-slider--ticks')).toBe(true);
    // step 5 over span 100 -> 5% interval.
    expect(el.style.getPropertyValue('--cngx-slider-tick-interval')).toBe('5%');
  });

  it('renders a numeric label per tick only when showTickLabels is on', () => {
    const { fixture, host, el } = setup();
    host.ticks.set(true);
    fixture.detectChanges();
    // Marks without labels: showTicks alone renders no numbers.
    expect(el.querySelectorAll('.cngx-slider__tick-label').length).toBe(0);
    host.labels.set(true);
    fixture.detectChanges();
    const labels = Array.from(el.querySelectorAll('.cngx-slider__tick-label')).map((l) =>
      l.textContent?.trim(),
    );
    // step 5 over 0..100 -> 21 stops, 0 / 5 / ... / 100.
    expect(labels.length).toBe(21);
    expect(labels[0]).toBe('0');
    expect(labels.at(-1)).toBe('100');
  });

  it('formats tick labels through valueText', () => {
    const { fixture, host, el } = setup();
    host.labels.set(true);
    host.fmt.set((value) => `${value}%`);
    fixture.detectChanges();
    const labels = Array.from(el.querySelectorAll('.cngx-slider__tick-label')).map((l) =>
      l.textContent?.trim(),
    );
    expect(labels[0]).toBe('0%');
    expect(labels.at(-1)).toBe('100%');
  });

  it('renders the value bubble only when showValueBubble is set', () => {
    const { fixture, host, el } = setup();
    expect(el.querySelector('.cngx-slider__bubble')).toBeNull();
    host.bubble.set(true);
    fixture.detectChanges();
    expect(el.querySelector('.cngx-slider__bubble')?.textContent?.trim()).toBe('40');
  });

  it('reflects orientation on the host for the vertical skin', () => {
    const { fixture, host, el } = setup();
    expect(el.getAttribute('aria-orientation')).toBe('horizontal');
    host.orient.set('vertical');
    fixture.detectChanges();
    expect(el.getAttribute('aria-orientation')).toBe('vertical');
  });
});

describe('CngxRangeSlider component', () => {
  @Component({
    template: `<cngx-range-slider aria-label="Price" [(value)]="v" [min]="0" [max]="1000" [step]="10" />`,
    imports: [CngxRangeSlider],
  })
  class Host {
    v = signal<[number, number]>([200, 800]);
  }

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxRangeSlider))
      .nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, el };
  }

  it('renders two thumbs and the group role', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('group');
    const thumbs = el.querySelectorAll('[cngxSliderThumb]');
    expect(thumbs.length).toBe(2);
    expect(thumbs[0].getAttribute('aria-valuenow')).toBe('200');
    expect(thumbs[1].getAttribute('aria-valuenow')).toBe('800');
  });

  it('publishes start/end fractions on the host for the fill band', () => {
    const { el } = setup();
    expect(el.style.getPropertyValue('--cngx-slider-start-fraction')).toBe('0.2');
    expect(el.style.getPropertyValue('--cngx-slider-end-fraction')).toBe('0.8');
  });
});
