import { Component, CUSTOM_ELEMENTS_SCHEMA, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue, contrastRatio } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). The value bubble of
// both sliders paints from the strong primary pair, so its digits clear 4.5:1
// in both default schemes with no theme bridge loaded.

const SCHEMES = ['light', 'dark'] as const;

const BUBBLES = [
  { name: 'slider', selector: 'cngx-slider .cngx-slider__bubble' },
  { name: 'range slider', selector: 'cngx-range-slider .cngx-slider__bubble' },
] as const;

@Component({
  selector: 'cngx-slider-bubble-contrast-host',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    './slider.component.css',
    './range-slider.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span class="probe-strong" style="color: var(--cngx-color-primary-strong)"></span>
        <span class="probe-on-strong" style="color: var(--cngx-color-on-primary-strong)"></span>
        <cngx-slider><span class="cngx-slider__bubble">40</span></cngx-slider>
        <cngx-range-slider>
          <span class="cngx-slider__value--range cngx-slider__bubble">20 - 40</span>
        </cngx-range-slider>
      </div>
    }
  `,
})
class BubbleHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(BubbleHost);
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

describe.each(SCHEMES)('slider value bubble, %s', (scheme) => {
  it.each(BUBBLES)('$name paints the strong pair at 4.5:1', ({ selector }) => {
    const root = mount();
    const scope = one(root, `.scheme-${scheme}`);
    const bubble = one(scope, selector);
    const fill = computedValue(bubble, 'background-color');
    const label = computedValue(bubble, 'color');
    expect(contrastRatio(label, fill)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(fill, computedValue(one(scope, '.probe-strong'), 'color'))).toBe(1);
    expect(contrastRatio(label, computedValue(one(scope, '.probe-on-strong'), 'color'))).toBe(1);
  });
});
