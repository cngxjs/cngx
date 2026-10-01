/// <reference types="@vitest/browser-playwright" />

import { CUSTOM_ELEMENTS_SCHEMA, Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Disabled checkbox,
// radio, toggle, button toggle and slider fade by colour, never opacity: labels
// and fills take the 38% text recipe of a disabled field, quiet surfaces a faint
// text tint. Under forced colors they read GrayText, and the toggle thumb stays
// centred in its track (the forced outline no longer shifts it).

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-interactive-disabled-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './checkbox/checkbox.component.css',
    './radio/radio.component.css',
    './toggle/toggle.component.css',
    './slider/slider.component.css',
    './slider/range-slider.component.css',
    '../theming/components/cngx-button-toggle.css',
    '../theming/components/cngx-slider.css',
  ],
  encapsulation: ViewEncapsulation.None,
  // Bare cngx-slider / cngx-range-slider tags carry only the shipped classes;
  // the components themselves are not under test here.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span class="cngx-checkbox cngx-checkbox--disabled cb-off">
          <span class="cngx-checkbox__label">Checkbox</span>
        </span>
        <span class="cngx-radio cngx-radio--disabled radio-off">
          <span class="cngx-radio__label">Radio</span>
        </span>
        <span class="cngx-toggle cngx-toggle--checked cngx-toggle--disabled tg-on-off">
          <span class="cngx-toggle__track"><span class="cngx-toggle__thumb"></span></span>
          <span class="cngx-toggle__label">On</span>
        </span>
        <span class="cngx-toggle cngx-toggle--disabled tg-off-off">
          <span class="cngx-toggle__track"><span class="cngx-toggle__thumb"></span></span>
          <span class="cngx-toggle__label">Off</span>
        </span>
        <span class="cngx-toggle tg-enabled">
          <span class="cngx-toggle__track"><span class="cngx-toggle__thumb"></span></span>
          <span class="cngx-toggle__label">Enabled</span>
        </span>
        <span>
          <button type="button" class="cngx-button-toggle cngx-button-toggle--disabled bt-off" aria-disabled="true">
            List
          </button>
          <button
            type="button"
            class="cngx-button-toggle cngx-button-toggle--checked cngx-button-toggle--disabled bt-checked-off"
            aria-disabled="true"
          >
            Grid
          </button>
        </span>
        <cngx-slider class="sl-off" aria-disabled="true" style="--cngx-slider-fraction: 0.4">
          <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
          <span class="cngx-slider__thumb"></span>
          <span class="cngx-slider__value">40</span>
        </cngx-slider>
        <cngx-range-slider class="rs-off" aria-disabled="true">
          <span class="cngx-slider__track"></span>
          <span cngxSliderThumb class="rs-thumb"></span>
        </cngx-range-slider>
        <span cngxSliderTrack class="track-off" aria-disabled="true"></span>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span
          class="probe-tint-12"
          style="background: color-mix(in oklab, var(--cngx-color-text) 12%, transparent)"
        ></span>
        <span
          class="probe-tint-4"
          style="background: color-mix(in oklab, var(--cngx-color-text) 4%, var(--cngx-color-surface))"
        ></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class InteractiveHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(InteractiveHost);
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

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

function thumbInsets(toggle: HTMLElement): number[] {
  const track = one(toggle, '.cngx-toggle__track').getBoundingClientRect();
  const thumb = one(toggle, '.cngx-toggle__thumb').getBoundingClientRect();
  return [thumb.top - track.top, track.bottom - thumb.bottom].map((v) => Math.round(v * 100) / 100);
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

describe.each(SCHEMES)('disabled interactive controls, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);
  const disabledColour = (root: HTMLElement): string =>
    computedValue(at(root, '.probe-disabled'), 'color');

  it('keeps every disabled control at full opacity', () => {
    const root = mount();
    for (const sel of [
      '.cb-off .cngx-checkbox__label',
      '.radio-off .cngx-radio__label',
      '.tg-on-off .cngx-toggle__thumb',
      '.bt-off',
      '.sl-off .cngx-slider__fill',
      '.rs-thumb',
      '.track-off',
    ]) {
      expect(effectiveOpacity(at(root, sel)), sel).toBe(1);
    }
  });

  it('paints checkbox, radio and toggle labels with the disabled colour', () => {
    const root = mount();
    const colour = disabledColour(root);
    expect(computedValue(at(root, '.cb-off .cngx-checkbox__label'), 'color')).toBe(colour);
    expect(computedValue(at(root, '.radio-off .cngx-radio__label'), 'color')).toBe(colour);
    expect(computedValue(at(root, '.tg-off-off .cngx-toggle__label'), 'color')).toBe(colour);
  });

  it('fades the toggle track by colour and drops the thumb lift', () => {
    const root = mount();
    expect(computedValue(at(root, '.tg-on-off .cngx-toggle__track'), 'background-color')).toBe(
      disabledColour(root),
    );
    expect(computedValue(at(root, '.tg-off-off .cngx-toggle__track'), 'background-color')).toBe(
      computedValue(at(root, '.probe-tint-12'), 'background-color'),
    );
    expect(computedValue(at(root, '.tg-on-off .cngx-toggle__thumb'), 'box-shadow')).toBe('none');
  });

  it('paints a disabled button toggle on a faint tint and fills a checked one', () => {
    const root = mount();
    const off = at(root, '.bt-off');
    expect(computedValue(off, 'color')).toBe(disabledColour(root));
    expect(computedValue(off, 'background-color')).toBe(
      computedValue(at(root, '.probe-tint-4'), 'background-color'),
    );
    const checked = at(root, '.bt-checked-off');
    expect(computedValue(checked, 'background-color')).toBe(disabledColour(root));
    expect(computedValue(checked, 'color')).toBe(computedValue(at(root, '.probe-surface'), 'color'));
  });

  it('paints the slider fill, thumb ring, track and value by colour', () => {
    const root = mount();
    const colour = disabledColour(root);
    expect(computedValue(at(root, '.sl-off .cngx-slider__fill'), 'background-color')).toBe(colour);
    expect(computedValue(at(root, '.sl-off .cngx-slider__thumb'), 'border-top-color')).toBe(colour);
    expect(computedValue(at(root, '.sl-off .cngx-slider__track'), 'background-color')).toBe(
      computedValue(at(root, '.probe-tint-12'), 'background-color'),
    );
    expect(computedValue(at(root, '.sl-off .cngx-slider__value'), 'color')).toBe(colour);
    expect(computedValue(at(root, '.rs-thumb'), 'border-top-color')).toBe(colour);
  });

  it('reads GrayText under forced colors', async () => {
    await forceColors(scheme);
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(at(root, '.cb-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.radio-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.tg-off-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.tg-on-off .cngx-toggle__track'), 'background-color')).toBe(gray);
    expect(computedValue(at(root, '.bt-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.bt-checked-off'), 'background-color')).toBe(gray);
  });

  it('keeps the toggle thumb centred under forced colors', async () => {
    const before = thumbInsets(at(mount(), '.tg-enabled'));
    mountedRoot?.remove();
    await forceColors(scheme);
    const forced = thumbInsets(at(mount(), '.tg-enabled'));
    expect(forced[0]).toBe(forced[1]);
    expect(forced).toEqual(before);
  });
});
