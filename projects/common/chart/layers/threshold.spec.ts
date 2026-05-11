import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxThreshold } from './threshold.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxThreshold],
  template: `
    <cngx-chart [data]="[1, 2, 3]" [width]="200" [height]="100">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
      <svg:g cngxThreshold [value]="value()" [label]="label()" [dashed]="dashed()"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  value = signal<number>(5);
  label = signal<string | null>(null);
  dashed = signal<boolean>(false);
}

describe('CngxThreshold', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('renders a horizontal line at y = yScale(value)', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.cngx-threshold__line') as SVGLineElement;
    expect(line).not.toBeNull();
    // y domain [0, 10] over height 100 (SVG-flipped) — value 5 -> y=50.
    expect(Number(line.getAttribute('y1'))).toBe(50);
    expect(Number(line.getAttribute('y2'))).toBe(50);
    expect(Number(line.getAttribute('x1'))).toBe(0);
    expect(Number(line.getAttribute('x2'))).toBe(200);
  });

  it('renders no <text> label when [label] is null', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.cngx-threshold__label');
    expect(label).toBeNull();
  });

  it('renders the label text when [label] is set', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.label.set('Budget cap');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector(
      '.cngx-threshold__label',
    ) as SVGTextElement;
    expect(label?.textContent?.trim()).toBe('Budget cap');
  });

  it('toggles stroke-dasharray when [dashed] is true', () => {
    const fixture = TestBed.createComponent(TestHost);
    fixture.componentInstance.dashed.set(true);
    fixture.detectChanges();
    const line = fixture.nativeElement.querySelector('.cngx-threshold__line') as SVGLineElement;
    expect(line.getAttribute('stroke-dasharray')).toBe('4 3');
  });
});
