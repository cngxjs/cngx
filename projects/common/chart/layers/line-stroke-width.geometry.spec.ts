import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxChart } from '../chart/chart.component';
import { CngxLine } from './line.component';

// Runs in a real Chromium (the `test-geometry` target). The line's class rule
// sets `stroke-width` from `--cngx-line-stroke-width`; a presentation attribute
// loses to any class declaration, so `[strokeWidth]` has to reach the path as
// an inline style to take effect. jsdom resolves no cascade, so only a real
// browser proves which declaration wins.

@Component({
  standalone: true,
  imports: [CngxChart, CngxLine],
  template: `
    <cngx-chart [data]="[1, 3, 2, 4]" [width]="200" [height]="100" aria-label="line">
      <svg:g cngxLine [strokeWidth]="strokeWidth()" [style]="layerStyle()"></svg:g>
    </cngx-chart>
  `,
})
class LineHost {
  strokeWidth = signal<number | string | null>(null);
  layerStyle = signal<string>('');
}

let mountedRoot: HTMLElement | null = null;

function render(strokeWidth: number | string | null, layerStyle = ''): string {
  const fixture = TestBed.createComponent(LineHost);
  fixture.componentInstance.strokeWidth.set(strokeWidth);
  fixture.componentInstance.layerStyle.set(layerStyle);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const path = mountedRoot.querySelector('.cngx-line');
  if (!path) {
    throw new Error('cngx-line path did not render');
  }
  return getComputedStyle(path).strokeWidth;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxLine [strokeWidth] in SVG mode', () => {
  it('applies a numeric strokeWidth as px', () => {
    expect(render(4)).toBe('4px');
  });

  it('applies a string strokeWidth verbatim', () => {
    expect(render('3px')).toBe('3px');
  });

  it('falls back to the --cngx-line-stroke-width default when unset', () => {
    expect(render(null)).toBe('1.5px');
  });

  it('takes a per-layer --cngx-line-stroke-width override when unset', () => {
    expect(render(null, '--cngx-line-stroke-width: 2px')).toBe('2px');
  });
});
