/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled accordion
// header paints the 38% text recipe of a disabled field (it was a fixed grey
// that never swapped for dark), a theme can still set its own colour through
// the token, and under forced colors the header reads GrayText instead of the
// CanvasText of an enabled one.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-accordion-disabled-colour-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './accordion-item.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <button type="button" class="cngx-accordion-item__header header-on">Shipping</button>
        <button type="button" class="cngx-accordion-item__header header-off" aria-disabled="true">
          Billing
        </button>
        <div style="--cngx-accordion-header-disabled-color: rgb(0, 0, 200)">
          <button
            type="button"
            class="cngx-accordion-item__header header-themed"
            aria-disabled="true"
          >
            Returns
          </button>
        </div>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
  `,
})
class AccordionHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AccordionHost);
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

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled accordion header, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints the disabled field recipe by default', () => {
    const root = mount();
    expect(computedValue(at(root, '.header-off'), 'color')).toBe(
      computedValue(at(root, '.probe-disabled'), 'color'),
    );
    expect(computedValue(at(root, '.header-on'), 'color')).not.toBe(
      computedValue(at(root, '.header-off'), 'color'),
    );
  });

  it('still takes a themed disabled colour from the token', () => {
    const root = mount();
    expect(computedValue(at(root, '.header-themed'), 'color')).toBe('rgb(0, 0, 200)');
  });

  it('reads GrayText under forced colors, apart from an enabled header', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(gray).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(canvasText);
    expect(computedValue(at(root, '.header-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.header-themed'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.header-on'), 'color')).not.toBe(gray);
  });
});
