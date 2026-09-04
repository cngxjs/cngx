import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxThreshold } from './threshold.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxChart } from '../chart/chart.component';
import { provideChartRenderer, withChartRendererThreshold } from '../renderer/renderer-factory';

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
    // Gutters plus label overhang put the plot at x 31..189 by y 9..74.
    // y domain [0, 10] over that height (SVG-flipped): value 5 -> y=41.5.
    expect(Number(line.getAttribute('y1'))).toBeCloseTo(41.5, 5);
    expect(Number(line.getAttribute('y2'))).toBeCloseTo(41.5, 5);
    // Spans the plot, not the box - a line running through the axis
    // gutter reads as a stray rule rather than as a level.
    expect(Number(line.getAttribute('x1'))).toBe(31);
    expect(Number(line.getAttribute('x2'))).toBe(189);
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
    const label = fixture.nativeElement.querySelector('.cngx-threshold__label') as SVGTextElement;
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

describe('CngxThreshold - label survives the canvas auto-switch', () => {
  @Component({
    standalone: true,
    imports: [CngxChart, CngxAxis, CngxThreshold],
    template: `
      <cngx-chart [data]="data()" [width]="200" [height]="100">
        <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 10]"></svg:g>
        <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
        <svg:g cngxThreshold [value]="5" label="alert"></svg:g>
      </cngx-chart>
    `,
  })
  class SwitchHost {
    readonly data = signal<readonly number[]>([1, 2, 3]);
  }

  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  function mount(points: number): HTMLElement {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SwitchHost],
      providers: [provideChartRenderer(withChartRendererThreshold(50))],
    });
    const fixture = TestBed.createComponent(SwitchHost);
    fixture.componentInstance.data.set(Array.from({ length: points }, (_, i) => i % 10));
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('keeps the label in SVG once the marks move to canvas', () => {
    const svgMode = mount(10);
    expect(svgMode.querySelector('canvas')).toBeNull();
    expect(svgMode.querySelector('.cngx-threshold__line')).not.toBeNull();
    expect(svgMode.querySelector('.cngx-threshold__label')?.textContent?.trim()).toBe('alert');

    const canvasMode = mount(51);
    // The line is the canvas renderer's job now...
    expect(canvasMode.querySelector('canvas')).not.toBeNull();
    expect(canvasMode.querySelector('.cngx-threshold__line')).toBeNull();
    // ...but the canvas backend paints no text, so the label has to
    // stay in SVG or it disappears at the crossover.
    expect(canvasMode.querySelector('.cngx-threshold__label')?.textContent?.trim()).toBe('alert');
  });
});

describe('CngxThreshold [color] parity', () => {
  beforeEach(() => vi.stubGlobal('ResizeObserver', ResizeObserverMock));
  afterEach(() => vi.unstubAllGlobals());

  it('binds [color] onto the SVG mark like CngxLine does', () => {
    @Component({
      standalone: true,
      imports: [CngxChart, CngxAxis, CngxThreshold],
      template: `
        <cngx-chart [data]="data" [width]="200" [height]="100">
          <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 2]"></svg:g>
          <svg:g cngxAxis position="left" type="linear" [domain]="[0, 10]"></svg:g>
          <svg:g cngxThreshold [value]="5" [color]="'rebeccapurple'"></svg:g>
        </cngx-chart>
      `,
    })
    class ColorHost {
      protected readonly data = [1, 2, 3];
    }
    TestBed.configureTestingModule({ imports: [ColorHost] });
    const fixture = TestBed.createComponent(ColorHost);
    fixture.detectChanges();
    const mark = fixture.nativeElement.querySelector('.cngx-threshold__line') as SVGElement;
    expect(mark).not.toBeNull();
    expect(mark.getAttribute('stroke')).toBe('rebeccapurple');
  });
});
