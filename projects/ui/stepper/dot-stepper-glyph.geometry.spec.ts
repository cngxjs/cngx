import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxDotStepper } from './dot-stepper.component';
import { STEPPER_OUTCOME_SEAM, stepperOutcome } from './__test-helpers/stepper-outcome-seam';

// Runs in a real Chromium (the `test-geometry` target). The error and refused
// marks of `<cngx-dot-stepper>` are icons stacked over the dot in a one-cell
// grid: centred on the dot, painted over it, sized from the 0.75rem glyph font
// (exclamation mark 0.75em tall, ban ring 0.8em, each with its stroke), and a
// marked dot grows from 10px to 16px so the mark stays legible.

@Component({
  selector: 'cngx-dot-stepper-glyph-host',
  standalone: true,
  imports: [CngxDotStepper, CngxStep],
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

/** Drawn box of the icon path, widened by its stroke. */
function ink(svg: SVGSVGElement): { height: number; cx: number; cy: number } {
  const path = svg.querySelector('path')!.getBoundingClientRect();
  const stroke =
    (parseFloat(getComputedStyle(svg).strokeWidth) * svg.getBoundingClientRect().width) / 24;
  return {
    height: path.height + stroke,
    cx: path.left + path.width / 2,
    cy: path.top + path.height / 2,
  };
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

  it('draws the exclamation mark 0.75em and the ban ring 0.8em of the 12px glyph font', async () => {
    const dots = await mount();
    expect(ink(icon(dots[3])).height).toBeCloseTo(0.75 * 12, 0);
    expect(ink(icon(dots[1])).height).toBeCloseTo(0.8 * 12, 0);
    // The active dot grows by 1.25, its mark with it.
    expect(ink(icon(dots[2])).height).toBeCloseTo(0.75 * 12 * 1.25, 0);
  });

  it('paints the mark over the dot in the on-danger colour', async () => {
    const dots = await mount();
    const mark = icon(dots[3]);
    const centre = ink(mark);
    // The mark ignores pointers; lift that to see what paints on top.
    mark.style.pointerEvents = 'auto';
    const hit = document.elementFromPoint(centre.cx, centre.cy);
    expect(hit === mark || mark.contains(hit)).toBe(true);
    expect(getComputedStyle(mark).stroke).toBe('rgb(255, 255, 255)');
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
