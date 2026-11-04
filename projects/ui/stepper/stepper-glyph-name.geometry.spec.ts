import { Component, input, ViewEncapsulation } from '@angular/core';
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
// The host loads the global icon sheet, as `cngx.css` does, so a glyph box in
// the 10 to 14px band paints its 12-grid micro drawing and one in the 15 to
// 19px band its 16-grid small drawing. The label done-check box sits in the
// small band, so it draws the small CHECK; Phase 3 retunes the box to land it
// at exactly 16px.

@Component({
  selector: 'cngx-stepper-glyph-name-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  styleUrls: [
    '../../core/theming/layers.css',
    '../../common/theming/components/cngx-icon-glyph.css',
  ],
  encapsulation: ViewEncapsulation.None,
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

/** The single path the tier rule leaves visible (24-grid, micro or small). */
function visiblePath(svg: SVGSVGElement): SVGPathElement {
  const painted = Array.from(svg.querySelectorAll('path')).filter(
    (path) => getComputedStyle(path).display !== 'none',
  );
  expect(painted).toHaveLength(1);
  return painted[0];
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

  it('draws the label done-check on the 16-grid small path, centred on the label', () => {
    for (const skin of ['chips', 'breadcrumb'] as const) {
      mount(skin);
      const svg = doneIcon(0)!.querySelector('svg')!;
      const painted = visiblePath(svg);
      expect(painted.classList.contains('cngx-icon-svg__small')).toBe(true);
      const ink = painted.getBoundingClientRect();
      expect(ink.width).toBeGreaterThan(0);
      const text = label(0).getBoundingClientRect();
      expect(Math.abs(ink.top + ink.height / 2 - (text.top + text.height / 2))).toBeLessThanOrEqual(
        1.5,
      );
      mountedRoot?.remove();
    }
  });

  it('hides the label check in the disc skins', () => {
    mount('classic');
    expect(getComputedStyle(doneIcon(0)!).display).toBe('none');
  });

  it('draws the classic disc check as the micro drawing on a 12px box, centred', () => {
    mount('classic');
    const indicator = header(0).querySelector<HTMLElement>('.cngx-stepper__indicator')!;
    const svg = indicator.querySelector<SVGSVGElement>('svg.cngx-stepper__indicator-check')!;
    const glyph = indicator.querySelector<HTMLElement>('.cngx-stepper__indicator-glyph')!;
    expect(getComputedStyle(glyph).display).toBe('none');
    const box = svg.getBoundingClientRect();
    expect(box.width).toBe(12);
    expect(box.height).toBe(12);
    const micro = svg.querySelector('.cngx-icon-svg__micro')!;
    expect(getComputedStyle(svg.querySelector('.cngx-icon-svg__path')!).display).toBe('none');
    expect(getComputedStyle(micro).display).not.toBe('none');
    // The micro check spans 10 units across (1 to 11).
    expect(micro.getBoundingClientRect().width).toBeCloseTo(10, 1);
    const disc = indicator.getBoundingClientRect();
    expect(box.left + box.width / 2).toBeCloseTo(disc.left + disc.width / 2, 0);
    expect(box.top + box.height / 2).toBeCloseTo(disc.top + disc.height / 2, 0);
  });

  // Without the floor the indicator font sizes the check again, below 12px too.
  it('sizes the classic disc check from the indicator font once the micro floor is lifted', () => {
    mount('classic');
    mountedRoot!.style.setProperty('--cngx-icon-svg-micro-floor', '0px');
    const indicator = header(0).querySelector<HTMLElement>('.cngx-stepper__indicator')!;
    // A rem value: an em value on this registered token is a font-size cycle.
    indicator.style.setProperty('--cngx-step-indicator-font-size', '0.5rem');
    const svg = indicator.querySelector<SVGSVGElement>('svg.cngx-stepper__indicator-check')!;
    const width = svg.getBoundingClientRect().width;
    expect(width).toBe(Math.round(0.85 * parseFloat(getComputedStyle(svg).fontSize)));
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThan(10);
    expect(getComputedStyle(svg.querySelector('.cngx-icon-svg__path')!).display).not.toBe('none');
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
