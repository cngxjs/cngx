import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxRangeSlider } from './range-slider.directive';
import { CngxSliderThumb } from './slider-thumb.directive';

@Component({
  template: `<div cngxRangeSlider [(value)]="v" [min]="0" [max]="100" [step]="1">
    <span cngxSliderThumb="start"></span>
    <span cngxSliderThumb="end"></span>
  </div>`,
  imports: [CngxRangeSlider, CngxSliderThumb],
})
class Host {
  v = signal<[number, number]>([20, 80]);
}

function setup() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const thumbs = fixture.debugElement
    .queryAll(By.directive(CngxSliderThumb))
    .map((de) => de.nativeElement as HTMLElement);
  return { fixture, host: fixture.componentInstance, start: thumbs[0], end: thumbs[1] };
}

function press(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }));
}

describe('CngxRangeSlider + CngxSliderThumb', () => {
  it('renders two role=slider thumbs reflecting each tuple end', () => {
    const { start, end } = setup();
    expect(start.getAttribute('role')).toBe('slider');
    expect(end.getAttribute('role')).toBe('slider');
    expect(start.getAttribute('aria-valuenow')).toBe('20');
    expect(end.getAttribute('aria-valuenow')).toBe('80');
  });

  it('bounds each thumb by its sibling (start max = end value, end min = start value)', () => {
    const { start, end } = setup();
    expect(start.getAttribute('aria-valuemin')).toBe('0');
    expect(start.getAttribute('aria-valuemax')).toBe('80');
    expect(end.getAttribute('aria-valuemin')).toBe('20');
    expect(end.getAttribute('aria-valuemax')).toBe('100');
  });

  it('moves a thumb with the keyboard and writes back into the tuple', () => {
    const { fixture, host, start } = setup();
    press(start, 'ArrowRight');
    fixture.detectChanges();
    expect(host.v()).toEqual([21, 80]);
  });

  it('prevents the start thumb from crossing the end thumb', () => {
    const { fixture, host, start } = setup();
    press(start, 'End');
    fixture.detectChanges();
    expect(host.v()).toEqual([80, 80]);
    press(start, 'ArrowRight');
    fixture.detectChanges();
    expect(host.v()).toEqual([80, 80]);
  });

  it('prevents the end thumb from crossing the start thumb', () => {
    const { fixture, host, end } = setup();
    press(end, 'Home');
    fixture.detectChanges();
    expect(host.v()).toEqual([20, 20]);
    press(end, 'ArrowLeft');
    fixture.detectChanges();
    expect(host.v()).toEqual([20, 20]);
  });

  it('keeps the sibling bound reactive after a move', () => {
    const { fixture, host, start, end } = setup();
    press(start, 'ArrowRight');
    fixture.detectChanges();
    expect(host.v()).toEqual([21, 80]);
    expect(end.getAttribute('aria-valuemin')).toBe('21');
  });
});
