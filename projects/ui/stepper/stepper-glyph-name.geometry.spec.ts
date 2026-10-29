import { Component, input } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { accessibleName } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target). The chips and
// breadcrumb skins draw the done status as an aria-hidden check icon beside
// the label, the classic disc draws it in the indicator, and the errored
// status is the aria-hidden alert badge icon. The breadcrumb separator is
// `::after` content of the step header, kept out of the name by CSS alt text.
// The status the icons carry is spoken by the header's status text instead.

@Component({
  selector: 'cngx-stepper-glyph-name-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  template: `
    <div [attr.dir]="dir()">
      <cngx-stepper aria-label="Wizard" [skin]="skin()" [activeStepIndex]="2">
        <div cngxStep label="Account" [completed]="true"></div>
        <div cngxStep label="Payment" [error]="true"></div>
        <div cngxStep label="Review"></div>
      </cngx-stepper>
    </div>
  `,
})
class GlyphNameHost {
  readonly skin = input<'classic' | 'path-chevron' | 'chips' | 'breadcrumb'>('chips');
  readonly dir = input<'ltr' | 'rtl'>('ltr');
}

let mountedRoot: HTMLElement | null = null;

function mount(
  skin: 'classic' | 'path-chevron' | 'chips' | 'breadcrumb',
  dir: 'ltr' | 'rtl' = 'ltr',
): void {
  const fixture = TestBed.createComponent(GlyphNameHost);
  fixture.componentRef.setInput('skin', skin);
  fixture.componentRef.setInput('dir', dir);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
}

function header(index: number): HTMLElement {
  return mountedRoot!.querySelectorAll<HTMLElement>('button.cngx-stepper__step')[index];
}

function label(index: number): Element {
  return header(index).querySelector('.cngx-stepper__label')!;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

/** Drawn box of an icon's path, widened by its stroke. */
function inkBox(svg: SVGSVGElement): { width: number; cx: number; cy: number } {
  const path = svg.querySelector('path')!.getBoundingClientRect();
  const stroke =
    (parseFloat(getComputedStyle(svg).strokeWidth) * svg.getBoundingClientRect().width) / 24;
  return {
    width: path.width + stroke,
    cx: path.left + path.width / 2,
    cy: path.top + path.height / 2,
  };
}

function doneIcon(index: number): HTMLElement | null {
  return header(index).querySelector<HTMLElement>('.cngx-stepper__done-icon');
}

describe('stepper status glyphs', () => {
  it('stay visible', () => {
    mount('chips');
    expect(getComputedStyle(doneIcon(0)!).display).not.toBe('none');
    expect(doneIcon(0)!.getAttribute('aria-hidden')).toBe('true');
    expect(doneIcon(1)).toBeNull();
    const badge = header(1).querySelector('.cngx-stepper__badge')!;
    expect(getComputedStyle(badge).display).not.toBe('none');
    expect(badge.getAttribute('aria-hidden')).toBe('true');
  });

  for (const dir of ['ltr', 'rtl'] as const) {
    it(`chips lead the label with the check, breadcrumb trails it (${dir})`, () => {
      const before = (a: DOMRect, b: DOMRect): boolean =>
        dir === 'ltr' ? a.right <= b.left : a.left >= b.right;
      mount('chips', dir);
      expect(before(doneIcon(0)!.getBoundingClientRect(), label(0).getBoundingClientRect())).toBe(
        true,
      );
      mountedRoot?.remove();
      mount('breadcrumb', dir);
      expect(before(label(0).getBoundingClientRect(), doneIcon(0)!.getBoundingClientRect())).toBe(
        true,
      );
    });
  }

  it('draws the label check as wide as the old text check (0.7em), centred on the label', () => {
    for (const skin of ['chips', 'breadcrumb'] as const) {
      mount(skin);
      const svg = doneIcon(0)!.querySelector('svg')!;
      const em = parseFloat(getComputedStyle(header(0)).fontSize);
      const ink = inkBox(svg);
      expect(ink.width).toBeCloseTo(0.7 * em, 0);
      const text = label(0).getBoundingClientRect();
      expect(Math.abs(ink.cy - (text.top + text.height / 2))).toBeLessThanOrEqual(1.5);
      mountedRoot?.remove();
    }
  });

  it('hides the label check in the disc skins', () => {
    mount('classic');
    expect(getComputedStyle(doneIcon(0)!).display).toBe('none');
  });

  it('draws the classic disc check centred, as wide as the old bold check (0.72em)', () => {
    mount('classic');
    const indicator = header(0).querySelector<HTMLElement>('.cngx-stepper__indicator')!;
    const svg = indicator.querySelector<SVGSVGElement>('svg.cngx-stepper__indicator-check')!;
    const glyph = indicator.querySelector<HTMLElement>('.cngx-stepper__indicator-glyph')!;
    expect(getComputedStyle(glyph).display).toBe('none');
    const em = parseFloat(getComputedStyle(indicator).fontSize);
    const ink = inkBox(svg);
    expect(ink.width).toBeCloseTo(0.72 * em, 0);
    const disc = indicator.getBoundingClientRect();
    expect(ink.cx).toBeCloseTo(disc.left + disc.width / 2, 0);
    expect(ink.cy).toBeCloseTo(disc.top + disc.height / 2, 0);
  });

  for (const skin of ['classic', 'path-chevron', 'chips', 'breadcrumb'] as const) {
    it(`keep the ${skin} glyphs out of the step names`, async () => {
      mount(skin);
      const done = await accessibleName(`#${header(0).id}`);
      const errored = await accessibleName(`#${header(1).id}`);
      expect(done).not.toMatch(/[✓!›]/);
      expect(errored).not.toMatch(/[✓!›]/);
      expect(done).toContain('Done');
      expect(errored).toContain('Errored');
    });
  }
});

describe('breadcrumb separator', () => {
  it('points in reading direction', () => {
    mount('breadcrumb');
    expect(getComputedStyle(header(0), '::after').content).toContain('›');
  });

  it('mirrors under dir="rtl"', () => {
    mount('breadcrumb', 'rtl');
    expect(getComputedStyle(header(0), '::after').content).toContain('‹');
  });
});
