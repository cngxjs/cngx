/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxRating } from './rating.component';

// Runs in a real Chromium (the `test-geometry` target). The rating is the real
// component, so its stylesheet runs under emulated encapsulation: the disabled
// class sits on the host, and only a :host() selector reaches the stars. A
// disabled rating paints filled, empty and checked stars by the 38% text
// recipe of a disabled field, never by opacity; under forced colors the stars
// read GrayText.

const SCHEMES = ['light', 'dark'] as const;

// The star tokens carry a non-system author colour, so a disabled rule that
// does not win over the idle and checked colours shows up as red, and an
// unforced star under forced colors cannot pass for GrayText by accident.
@Component({
  selector: 'cngx-rating-disabled-colour-host',
  standalone: true,
  imports: [CngxRating],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="--cngx-rating-color: rgb(200, 0, 0); --cngx-rating-color-active: rgb(0, 0, 200)"
      >
        <cngx-rating class="on" ariaLabel="Enabled" [value]="3" />
        <cngx-rating class="off" ariaLabel="Disabled" [value]="3" [disabled]="true" />
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
class RatingHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(RatingHost);
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

function stars(root: ParentNode, selector: string): HTMLElement[] {
  const items = Array.from(one(root, selector).querySelectorAll<HTMLElement>('.cngx-rating__item'));
  expect(items).toHaveLength(5);
  return items;
}

// Opacity of the element and every ancestor multiplied: the value a user
// actually sees, whichever element carries it.
function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

async function forceColors(scheme: string): Promise<void> {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'forced-colors', value: 'active' },
      { name: 'prefers-color-scheme', value: scheme },
    ],
  });
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled rating, %s', (scheme) => {
  const at = (selector: string): string => `.scheme-${scheme} ${selector}`;

  it('marks the real host disabled', () => {
    const root = mount();
    const host = one(root, at('.off'));
    expect(host.classList).toContain('cngx-rating--disabled');
    expect(host.getAttribute('aria-disabled')).toBe('true');
  });

  it('paints filled, checked and empty stars by the field recipe, not opacity', () => {
    const root = mount();
    const disabled = computedValue(one(root, at('.probe-disabled')), 'color');
    const items = stars(root, at('.off'));
    expect(items[2].getAttribute('aria-checked')).toBe('true');
    for (const item of items) {
      expect(effectiveOpacity(item)).toBe(1);
      expect(computedValue(item, 'color')).toBe(disabled);
    }
  });

  it('leaves the enabled stars on their idle and checked colours', () => {
    const root = mount();
    const items = stars(root, at('.on'));
    expect(computedValue(items[0], 'color')).toBe('rgb(200, 0, 0)');
    expect(computedValue(items[2], 'color')).toBe('rgb(0, 0, 200)');
    expect(computedValue(items[4], 'color')).toBe('rgb(200, 0, 0)');
  });

  it('reads GrayText for every disabled star under forced colors', async () => {
    await forceColors(scheme);
    const root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(gray).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(one(root, at('.plain')), 'color')).toBe(canvasText);
    for (const item of stars(root, at('.on'))) {
      expect(computedValue(item, 'color')).toBe(canvasText);
    }
    for (const item of stars(root, at('.off'))) {
      expect(computedValue(item, 'color')).toBe(gray);
    }
  });
});
