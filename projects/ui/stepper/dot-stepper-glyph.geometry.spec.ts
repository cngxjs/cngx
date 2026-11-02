import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxDotStepper } from './dot-stepper.component';
import { STEPPER_OUTCOME_SEAM, stepperOutcome } from './__test-helpers/stepper-outcome-seam';

// Runs in a real Chromium (the `test-geometry` target). The error and refused
// marks of `<cngx-dot-stepper>` are icons stacked over the dot in a one-cell
// grid: centred on the dot, painted over it, sized from the 0.75rem glyph font
// to a 12px box that selects the 12-grid micro drawings (exclamation mark 9
// units tall, ban disc 12 units), and a marked dot grows from 10px to 16px so
// the mark stays legible. The host loads the global micro sheet, as `cngx.css`
// does.

@Component({
  selector: 'cngx-dot-stepper-glyph-host',
  standalone: true,
  imports: [CngxDotStepper, CngxStep],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../common/theming/components/cngx-icon-glyph.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-dot-stepper aria-label="Tour" [activeStepIndex]="2">
      <div cngxStep label="One"></div>
      <div cngxStep label="Two"></div>
      <div cngxStep label="Three" [error]="true"></div>
      <div cngxStep label="Four" [error]="true"></div>
    </cngx-dot-stepper>
  `,
})
class GlyphHost {}

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement[]> {
  TestBed.overrideComponent(CngxDotStepper, { add: { providers: [STEPPER_OUTCOME_SEAM] } });
  const fixture = TestBed.createComponent(GlyphHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  stepperOutcome.set({ kind: 'refused', index: 1, sequence: 1 });
  fixture.detectChanges();
  await fixture.whenStable();
  const dots = Array.from(mountedRoot.querySelectorAll<HTMLElement>('.cngx-dot-stepper__dot'));
  for (const el of Array.from(
    mountedRoot.querySelectorAll<HTMLElement | SVGElement>(
      '.cngx-dot-stepper__dot, .cngx-dot-stepper__dot-glyph',
    ),
  )) {
    el.style.transition = 'none';
  }
  return dots;
}

function icon(dot: HTMLElement): SVGSVGElement {
  return dot.nextElementSibling as SVGSVGElement;
}

/** The path the band rule paints: the micro drawing in a 10 to 14px box. */
function visiblePath(svg: SVGSVGElement): SVGPathElement {
  const painted = Array.from(svg.querySelectorAll('path')).filter(
    (path) => getComputedStyle(path).display !== 'none',
  );
  expect(painted).toHaveLength(1);
  return painted[0];
}

/** Drawn box of the painted micro path, a fill outline. */
function ink(svg: SVGSVGElement): { height: number; cx: number; cy: number } {
  const path = visiblePath(svg);
  expect(path.classList.contains('cngx-icon-svg__micro')).toBe(true);
  const box = path.getBoundingClientRect();
  return { height: box.height, cx: box.left + box.width / 2, cy: box.top + box.height / 2 };
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
  stepperOutcome.set(undefined);
});

describe('dot stepper error marks', () => {
  it('centres each mark on its dot', async () => {
    const dots = await mount();
    for (const dot of [dots[1], dots[2], dots[3]]) {
      const box = dot.getBoundingClientRect();
      const mark = icon(dot).getBoundingClientRect();
      expect(mark.left + mark.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
      expect(mark.top + mark.height / 2).toBeCloseTo(box.top + box.height / 2, 0);
    }
  });

  it('draws both marks as the micro drawing on a 12px box: exclamation 9 units, ban disc 12', async () => {
    const dots = await mount();
    for (const dot of [dots[1], dots[3]]) {
      const box = icon(dot).getBoundingClientRect();
      expect(box.width).toBe(12);
      expect(box.height).toBe(12);
    }
    expect(ink(icon(dots[3])).height).toBeCloseTo(9, 1);
    expect(ink(icon(dots[1])).height).toBeCloseTo(12, 1);
    // The active dot grows by 1.25, its mark with it.
    expect(ink(icon(dots[2])).height).toBeCloseTo(9 * 1.25, 1);
  });

  it('draws the error line glyph as the micro drawing on a 12px box', async () => {
    await mount();
    const svg = mountedRoot!.querySelector<SVGSVGElement>('.cngx-dot-stepper__error svg')!;
    const box = svg.getBoundingClientRect();
    expect(box.width).toBe(12);
    expect(box.height).toBe(12);
    expect(visiblePath(svg).classList.contains('cngx-icon-svg__micro')).toBe(true);
  });

  it('paints the mark over the dot in the on-danger colour', async () => {
    const dots = await mount();
    const mark = icon(dots[3]);
    const centre = ink(mark);
    // The mark ignores pointers; lift that to see what paints on top.
    mark.style.pointerEvents = 'auto';
    const hit = document.elementFromPoint(centre.cx, centre.cy);
    expect(hit === mark || mark.contains(hit)).toBe(true);
    expect(getComputedStyle(mark).fill).toBe('rgb(255, 255, 255)');
  });

  it('grows a marked dot to 16px and leaves the plain dot at 10px', async () => {
    const dots = await mount();
    const plain = dots[0].getBoundingClientRect();
    const marked = dots[3].getBoundingClientRect();
    expect(plain.width).toBe(10);
    expect(marked.width).toBe(16);
    expect(marked.height).toBe(16);
  });
});
