import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxChart } from './chart.component';

class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

@Component({
  standalone: true,
  imports: [CngxChart],
  template: `
    <cngx-chart
      [data]="data()"
      [width]="100"
      [height]="100"
      [accessibleTable]="mode()"
      data-testid="chart"
    />
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3]);
  mode = signal<'auto' | 'off'>('auto');
}

describe('CngxChart — aria-describedby always-in-DOM invariant', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    chart: HTMLElement;
    table(): HTMLElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const chart = fixture.nativeElement.querySelector('[data-testid="chart"]') as HTMLElement;
    return {
      fixture,
      chart,
      table: () =>
        fixture.nativeElement.querySelector('cngx-chart-data-table') as HTMLElement,
    };
  }

  it('mode=off + data.length=3 — host carries aria-describedby pointing at the data-table id; table is aria-hidden=true', () => {
    const { chart, table, fixture } = setup();
    fixture.componentInstance.mode.set('off');
    fixture.detectChanges();
    const id = chart.getAttribute('aria-describedby');
    expect(id).not.toBeNull();
    expect(id).not.toBe('');
    expect(table().getAttribute('id')).toBe(id);
    expect(table().getAttribute('aria-hidden')).toBe('true');
  });

  it('mode=auto + data.length>1 — aria-describedby UNCHANGED (same id); table is aria-hidden=false', () => {
    const { chart, table, fixture } = setup();
    fixture.componentInstance.mode.set('off');
    fixture.detectChanges();
    const idBefore = chart.getAttribute('aria-describedby');

    fixture.componentInstance.mode.set('auto');
    fixture.detectChanges();
    const idAfter = chart.getAttribute('aria-describedby');
    expect(idAfter).toBe(idBefore);
    expect(table().getAttribute('aria-hidden')).toBe('false');
  });

  it('mode=auto + data.length<=1 — aria-describedby STILL present (id unchanged); table is aria-hidden=true', () => {
    const { chart, table, fixture } = setup();
    fixture.componentInstance.mode.set('auto');
    fixture.detectChanges();
    const idAtMulti = chart.getAttribute('aria-describedby');

    fixture.componentInstance.data.set([42]);
    fixture.detectChanges();
    const idAtSingle = chart.getAttribute('aria-describedby');
    expect(idAtSingle).toBe(idAtMulti);
    expect(idAtSingle).not.toBeNull();
    expect(table().getAttribute('aria-hidden')).toBe('true');
  });

  it('mode=off (after auto) — aria-describedby STILL present (id unchanged); table is aria-hidden=true', () => {
    const { chart, table, fixture } = setup();
    fixture.componentInstance.mode.set('auto');
    fixture.detectChanges();
    const idAuto = chart.getAttribute('aria-describedby');

    fixture.componentInstance.mode.set('off');
    fixture.detectChanges();
    const idOff = chart.getAttribute('aria-describedby');
    expect(idOff).toBe(idAuto);
    expect(idOff).not.toBeNull();
    expect(table().getAttribute('aria-hidden')).toBe('true');
  });

  it('combined sweep — aria-describedby id is invariant across all four (mode, data.length) combinations', () => {
    const { chart, fixture } = setup();
    const seen = new Set<string>();
    const combos: readonly [('auto' | 'off'), readonly number[]][] = [
      ['auto', [1, 2, 3]],
      ['auto', [42]],
      ['off', [1, 2, 3]],
      ['off', [42]],
    ];
    for (const [mode, data] of combos) {
      fixture.componentInstance.mode.set(mode);
      fixture.componentInstance.data.set(data);
      fixture.detectChanges();
      const id = chart.getAttribute('aria-describedby');
      expect(id).not.toBeNull();
      expect(id).not.toBe('');
      seen.add(id ?? '');
    }
    // The invariant: same chart instance => exactly one id across all
    // four combinations. Any change in this number is a regression on
    // the always-in-DOM rule.
    expect(seen.size).toBe(1);
  });
});
