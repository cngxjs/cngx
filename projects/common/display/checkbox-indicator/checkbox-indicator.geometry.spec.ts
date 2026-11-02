import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCheckboxIndicator } from './checkbox-indicator.component';

// Runs in a real Chromium (the `test-geometry` target). The check and dash
// glyphs of the sm and md boxes both land on a 12px box, where the global
// micro sheet (loaded here as `cngx.css` does) paints the 12-grid drawings:
// md is 0.75 of its 16px box, sm 6/7 of its 14px box. The lg glyph (15px)
// leaves the band and keeps the 24-grid path.

@Component({
  selector: 'cngx-checkbox-indicator-glyph-host',
  standalone: true,
  imports: [CngxCheckboxIndicator],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px">
      <cngx-checkbox-indicator
        [size]="size()"
        [checked]="!indeterminate()"
        [indeterminate]="indeterminate()"
      />
    </div>
  `,
})
class CheckboxGlyphHost {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly indeterminate = input(false);
}

let mountedRoot: HTMLElement | null = null;

function mountGlyph(size: 'sm' | 'md' | 'lg', indeterminate: boolean): SVGSVGElement {
  const fixture = TestBed.createComponent(CheckboxGlyphHost);
  fixture.componentRef.setInput('size', size);
  fixture.componentRef.setInput('indeterminate', indeterminate);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const svg = mountedRoot.querySelector<SVGSVGElement>('.cngx-checkbox-indicator__box svg');
  if (!svg) {
    throw new Error(`cngx-checkbox-indicator ${size} renders no glyph`);
  }
  return svg;
}

function paintedPath(svg: SVGSVGElement): SVGPathElement {
  const painted = Array.from(svg.querySelectorAll('path')).filter(
    (path) => computedValue(path, 'display') !== 'none',
  );
  expect(painted).toHaveLength(1);
  return painted[0];
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxCheckboxIndicator glyph geometry', () => {
  for (const size of ['sm', 'md'] as const) {
    for (const [state, indeterminate] of [
      ['check', false],
      ['dash', true],
    ] as const) {
      it(`draws the ${size} ${state} as the micro drawing on a 12px box`, () => {
        const svg = mountGlyph(size, indeterminate);
        const box = svg.getBoundingClientRect();
        expect(box.width).toBe(12);
        expect(box.height).toBe(12);
        expect(paintedPath(svg).classList.contains('cngx-icon-svg__micro')).toBe(true);
      });
    }
  }

  it('centres the sm micro check in the box', () => {
    const svg = mountGlyph('sm', false);
    const glyph = svg.getBoundingClientRect();
    const box = mountedRoot!.querySelector('.cngx-checkbox-indicator__box')!.getBoundingClientRect();
    expect(glyph.left + glyph.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
    expect(glyph.top + glyph.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
  });

  it('keeps the lg check on the 24-grid path, outside the band', () => {
    const svg = mountGlyph('lg', false);
    expect(svg.getBoundingClientRect().width).toBe(15);
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__path')).toBe(true);
  });
});
