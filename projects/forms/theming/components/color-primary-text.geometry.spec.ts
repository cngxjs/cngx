import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio, rasterise } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Rendered tier for the core `--cngx-color-primary-text` rung (core has no
// geometry target; this one already renders system-tokens.css). Primary as
// text clears 4.5:1 on the surface in both schemes, and the surface colour
// painted on a fill of the rung clears 4.5:1 too (filled current-state skins
// rely on that pairing). The source contract lives in core
// color-text-tokens.spec.ts.

const SCHEMES = ['light', 'dark'] as const;

// The rung's OKLCH lightness per scheme; hue and chroma come from primary.
const TEXT_LIGHTNESS: Record<(typeof SCHEMES)[number], string> = { light: '0.54', dark: '0.8' };

@Component({
  selector: 'cngx-primary-text-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface); color: var(--cngx-color-text)"
      >
        <span class="as-text" style="color: var(--cngx-color-primary-text)">Current</span>
        <span
          class="as-fill"
          style="background: var(--cngx-color-primary-text); color: var(--cngx-color-surface)"
          >Current</span
        >
        <span
          class="probe-derived"
          [style.color]="'oklch(from var(--cngx-color-primary) ' + lightness[scheme] + ' c h)'"
        ></span>
        <span class="probe-primary" style="color: var(--cngx-color-primary)"></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
  `,
})
class PrimaryTextHost {
  readonly schemes = SCHEMES;
  readonly lightness = TEXT_LIGHTNESS;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(PrimaryTextHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe.each(SCHEMES)('--cngx-color-primary-text, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it("resolves to primary at the scheme's text lightness", () => {
    const root = mount();
    const text = rasterise(computedValue(at(root, '.as-text'), 'color'));
    expect(text).toEqual(rasterise(computedValue(at(root, '.probe-derived'), 'color')));
    expect(text).not.toEqual(rasterise(computedValue(at(root, '.probe-primary'), 'color')));
  });

  it('reads at 4.5:1 or more as text on the surface', () => {
    const root = mount();
    const surface = computedValue(at(root, '.probe-surface'), 'color');
    expect(contrastRatio(computedValue(at(root, '.as-text'), 'color'), surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('carries surface-coloured text at 4.5:1 or more as a fill', () => {
    const root = mount();
    const fill = at(root, '.as-fill');
    const background = computedValue(fill, 'background-color');
    expect(rasterise(background)[3]).toBe(255);
    expect(contrastRatio(computedValue(fill, 'color'), background)).toBeGreaterThanOrEqual(4.5);
  });
});
