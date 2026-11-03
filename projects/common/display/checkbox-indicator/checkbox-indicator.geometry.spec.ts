import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxCheckboxIndicator } from './checkbox-indicator.component';

// Runs in a real Chromium (the `test-geometry` target). The glyph box derives
// from the resolved box size, not the size class: 0.75 of it, never below the
// 12px micro floor. The 14px sm and 16px md boxes both land on 12px, where the
// global micro sheet (loaded here as `cngx.css` does) paints the 12-grid
// drawings; the 20px lg box lands on 15px and keeps the 24-grid path. The bare
// checkmark variant fills its box once the box leaves the band (md 16px, lg
// 20px) and takes the 12px micro glyph below it (sm).

@Component({
  selector: 'cngx-checkbox-indicator-glyph-host',
  standalone: true,
  imports: [CngxCheckboxIndicator],
  styleUrls: ['../../../core/theming/layers.css', '../../theming/components/cngx-icon-glyph.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div style="font-size: 16px">
      <cngx-checkbox-indicator
        [variant]="variant()"
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
  readonly variant = input<'checkbox' | 'checkmark'>('checkbox');
}

let mountedRoot: HTMLElement | null = null;

function mountGlyph(
  size: 'sm' | 'md' | 'lg',
  indeterminate: boolean,
  variant: 'checkbox' | 'checkmark' = 'checkbox',
  smSize?: string,
): SVGSVGElement {
  const fixture = TestBed.createComponent(CheckboxGlyphHost);
  if (smSize) {
    (fixture.nativeElement as HTMLElement).style.setProperty('--cngx-checkbox-size-sm', smSize);
  }
  fixture.componentRef.setInput('variant', variant);
  fixture.componentRef.setInput('size', size);
  fixture.componentRef.setInput('indeterminate', indeterminate);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  const svg = mountedRoot.querySelector<SVGSVGElement>(
    '.cngx-checkbox-indicator__check svg, .cngx-checkbox-indicator__dash svg',
  );
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

  for (const [state, indeterminate] of [
    ['check', false],
    ['dash', true],
  ] as const) {
    it(`draws the sm checkmark ${state} as the micro drawing on a 12px box`, () => {
      const svg = mountGlyph('sm', indeterminate, 'checkmark');
      const box = svg.getBoundingClientRect();
      expect(box.width).toBe(12);
      expect(box.height).toBe(12);
      expect(paintedPath(svg).classList.contains('cngx-icon-svg__micro')).toBe(true);
    });
  }

  it('keeps the md checkmark at 1em, outside the band', () => {
    const svg = mountGlyph('md', false, 'checkmark');
    expect(svg.getBoundingClientRect().width).toBe(16);
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__path')).toBe(true);
  });

  it('keeps the lg check on the 24-grid path, outside the band', () => {
    const svg = mountGlyph('lg', false);
    expect(svg.getBoundingClientRect().width).toBe(15);
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__path')).toBe(true);
  });

  it('keeps the lg checkmark at 1em on the 24-grid path', () => {
    const svg = mountGlyph('lg', false, 'checkmark');
    expect(svg.getBoundingClientRect().width).toBe(20);
    expect(paintedPath(svg).classList.contains('cngx-icon-svg__path')).toBe(true);
  });

  // The micro ink stays inside the box border (1.5px), the 11px inner area of
  // the sm box included.
  for (const size of ['sm', 'md'] as const) {
    for (const [state, indeterminate] of [
      ['check', false],
      ['dash', true],
    ] as const) {
      it(`fits the ${size} ${state} ink inside the box border`, () => {
        const ink = paintedPath(mountGlyph(size, indeterminate)).getBoundingClientRect();
        const box = mountedRoot!.querySelector('.cngx-checkbox-indicator__box')!.getBoundingClientRect();
        expect(ink.width).toBeGreaterThan(0);
        expect(ink.left).toBeGreaterThanOrEqual(box.left + 1.5);
        expect(ink.right).toBeLessThanOrEqual(box.right - 1.5);
        expect(ink.top).toBeGreaterThanOrEqual(box.top + 1.5);
        expect(ink.bottom).toBeLessThanOrEqual(box.bottom - 1.5);
      });
    }
  }

  // The glyph follows the resolved box size, not the size class: sm retuned to
  // the 16px md size renders the md glyph in both variants.
  for (const variant of ['checkbox', 'checkmark'] as const) {
    for (const [state, indeterminate] of [
      ['check', false],
      ['dash', true],
    ] as const) {
      it(`renders a ${variant} ${state} with sm retuned to 16px like md`, () => {
        const md = mountGlyph('md', indeterminate, variant);
        const mdBox = md.getBoundingClientRect();
        const mdPath = paintedPath(md).getAttribute('class');
        mountedRoot?.remove();
        const sm = mountGlyph('sm', indeterminate, variant, '1em');
        expect(mountedRoot!.querySelector('.cngx-checkbox-indicator')!.getBoundingClientRect().width).toBe(16);
        const smBox = sm.getBoundingClientRect();
        expect(smBox.width).toBe(mdBox.width);
        expect(smBox.height).toBe(mdBox.height);
        expect(paintedPath(sm).getAttribute('class')).toBe(mdPath);
      });
    }
  }
});
