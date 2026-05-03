import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxAxis, type CngxAxisPosition, type CngxAxisType } from './axis.component';
import { CngxChart } from '../chart/chart.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis],
  template: `
    <cngx-chart [data]="data()" [width]="width()" [height]="height()">
      <svg:g
        cngxAxis
        [position]="position()"
        [type]="axisType()"
        [domain]="domain()"
        [ticks]="tickCount()"
        [format]="formatFn()"
      ></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  width = signal<number | undefined>(200);
  height = signal<number | undefined>(100);
  position = signal<CngxAxisPosition>('bottom');
  axisType = signal<CngxAxisType>('linear');
  domain = signal<readonly unknown[] | undefined>([0, 100]);
  tickCount = signal<number | undefined>(undefined);
  formatFn = signal<(v: unknown) => string>((v) => String(v));
}

describe('CngxAxis', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    axisGroup: SVGGElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const axisGroup = fixture.nativeElement.querySelector(
      '.cngx-axis',
    ) as SVGGElement;
    return { fixture, axisGroup };
  }

  it('renders a line and 5 ticks for a linear axis with default tickCount', () => {
    const { axisGroup } = setup();
    expect(axisGroup).not.toBeNull();
    expect(axisGroup.querySelector('.cngx-axis__line')).not.toBeNull();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(5);
  });

  it('respects an explicit [ticks] count', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.tickCount.set(3);
    fixture.detectChanges();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(3);
  });

  it('applies the [format] callback to tick labels', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.tickCount.set(2);
    fixture.componentInstance.formatFn.set((v) => `[${v}]`);
    fixture.detectChanges();
    const labels = Array.from(
      axisGroup.querySelectorAll<SVGTextElement>('.cngx-axis__tick-label'),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['[0]', '[100]']);
  });

  it.each<[CngxAxisPosition, string]>([
    ['top', 'translate(0,0)'],
    ['bottom', 'translate(0,100)'],
    ['left', 'translate(0,0)'],
    ['right', 'translate(200,0)'],
  ])('positions the axis group correctly for position=%s', (pos, expected) => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.position.set(pos);
    fixture.detectChanges();
    const group = fixture.nativeElement.querySelector('.cngx-axis') as SVGGElement;
    expect(group.getAttribute('transform')).toBe(expected);
    expect(group.classList.contains(`cngx-axis--${pos}`)).toBe(true);
    void axisGroup;
  });

  it('emits one tick per band value when type=band', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.axisType.set('band');
    fixture.componentInstance.domain.set(['Mon', 'Tue', 'Wed', 'Thu']);
    fixture.detectChanges();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(4);
    const labels = Array.from(
      axisGroup.querySelectorAll<SVGTextElement>('.cngx-axis__tick-label'),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['Mon', 'Tue', 'Wed', 'Thu']);
  });

  it('renders no ticks when [domain] is missing for linear/time axes', () => {
    const { fixture, axisGroup } = setup();
    fixture.componentInstance.domain.set(undefined);
    fixture.detectChanges();
    const ticks = axisGroup.querySelectorAll('.cngx-axis__tick');
    expect(ticks.length).toBe(0);
    // The axis line still renders.
    expect(axisGroup.querySelector('.cngx-axis__line')).not.toBeNull();
  });

  it('produces evenly spaced linear ticks across the domain', () => {
    const { fixture } = setup();
    fixture.componentInstance.tickCount.set(5);
    fixture.componentInstance.domain.set([0, 100]);
    fixture.detectChanges();
    const labels = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<SVGTextElement>(
        '.cngx-axis__tick-label',
      ),
    ).map((el) => el.textContent?.trim() ?? '');
    expect(labels).toEqual(['0', '25', '50', '75', '100']);
  });
});
