import {
  Component,
  effect,
  EnvironmentInjector,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxChart } from '../chart/chart.component';
import { CngxAxis } from '../axis/axis.component';
import { CngxLine } from './line.component';

import { ResizeObserverMock } from '../testing/resize-observer-mock';

@Component({
  standalone: true,
  imports: [CngxChart, CngxAxis, CngxLine],
  template: `
    <cngx-chart [data]="data()" [width]="200" [height]="100">
      <svg:g cngxAxis position="bottom" type="linear" [domain]="xDomain()"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="yDomain()"></svg:g>
      <svg:g cngxLine [accessor]="acc()"></svg:g>
    </cngx-chart>
  `,
})
class TestHost {
  data = signal<readonly number[]>([1, 2, 3, 4, 5]);
  xDomain = signal<readonly unknown[]>([0, 4]);
  yDomain = signal<readonly unknown[]>([0, 5]);
  acc = signal<(d: number) => number>((d) => d);
}

@Component({
  standalone: true,
  imports: [CngxLine],
  template: `<div cngxLine [data]="data"></div>`,
})
class OrphanLineHost {
  data: readonly number[] = [1, 2, 3];
}

describe('CngxLine', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
    pathEl: SVGPathElement;
  } {
    TestBed.configureTestingModule({ imports: [TestHost] });
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const pathEl = fixture.nativeElement.querySelector('.cngx-line') as SVGPathElement;
    return { fixture, pathEl };
  }

  it('renders an svg <path> with a non-empty d attribute', () => {
    const { pathEl } = setup();
    expect(pathEl).not.toBeNull();
    const d = pathEl.getAttribute('d') ?? '';
    expect(d.length).toBeGreaterThan(0);
    expect(d.startsWith('M ')).toBe(true);
  });

  it('reactively updates the d attribute when the data signal changes', () => {
    const { fixture, pathEl } = setup();
    const before = pathEl.getAttribute('d');
    fixture.componentInstance.data.set([5, 4, 3, 2, 1]);
    fixture.detectChanges();
    const after = pathEl.getAttribute('d');
    expect(after).not.toBe(before);
  });

  it('throws a clear error when mounted without a <cngx-chart> parent (missing CNGX_CHART_CONTEXT)', () => {
    TestBed.configureTestingModule({ imports: [OrphanLineHost] });
    expect(() => {
      const f = TestBed.createComponent(OrphanLineHost);
      f.detectChanges();
    }).toThrow(/missing CNGX_CHART_CONTEXT/);
  });

  it('cascade guard — a downstream effect on the line component does NOT re-fire when the d string is unchanged', () => {
    const { fixture } = setup();
    const lineEl = fixture.debugElement.query(
      (el) => el.componentInstance instanceof CngxLine,
    );
    const line = lineEl.componentInstance as CngxLine<number>;
    // Reach the protected `d` signal through the runtime instance — the spec
    // is the spec, not consumer surface; testing the cascade guard
    // requires reading the value the template binds to.
    const dSignal = (line as unknown as { d: () => string }).d;

    let runs = 0;
    const env = TestBed.inject(EnvironmentInjector);
    runInInjectionContext(env, () => {
      effect(() => {
        dSignal();
        runs++;
      });
    });
    TestBed.tick();
    const baselineRuns = runs;

    // Swap the data array to a fresh-reference copy with the same coordinates
    // AND keep the scales constant (yDomain and xDomain unchanged). The
    // path-builder rebuilds (data ref changed) but the resulting d string
    // is identical — the cascade guard must short-circuit.
    fixture.componentInstance.data.set([1, 2, 3, 4, 5]);
    fixture.detectChanges();
    TestBed.tick();

    expect(runs).toBe(baselineRuns);
    void inject; // keep import to satisfy lint when not directly used
  });
});
