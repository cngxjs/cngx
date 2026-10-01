/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The active-branch
// group chip keeps its primary border and tint as the accent, while its label
// reads in the neutral text colour: primary as text sat at 2.8:1 on the light
// tint. Under forced colors the border and tint are forced to the resting
// chip's outline, so the active chip draws an inset 2px Highlight edge that
// leaves its size untouched.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-stepper-group-chip-contrast-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './styles/stepper-base.css',
    './stepper.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface)"
      >
        <div class="cngx-stepper">
          <div
            class="cngx-stepper__group-header cngx-stepper__group-header--active chip-active"
            role="group"
            style="transition: none"
          >
            Account
          </div>
          <div class="cngx-stepper__group-header chip-rest" role="group" style="transition: none">
            Project
          </div>
        </div>
        <span class="probe-text" style="color: var(--cngx-color-text)"></span>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
  `,
})
class GroupChipHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(GroupChipHost);
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

// Paint the colours bottom-up into a 1px canvas and read the pixel back: this
// resolves oklch / color-mix to sRGB and composites the translucent chip tint
// over the page surface the way it renders.
function paint(...layers: string[]): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }
  for (const layer of layers) {
    ctx.fillStyle = layer;
    ctx.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return [r, g, b];
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('active group chip, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('reads its label in the neutral text colour at 4.5:1 on the tint', () => {
    const root = mount();
    const chip = at(root, '.chip-active');
    const page = computedValue(one(root, `.scheme-${scheme}`), 'background-color');
    const tint = paint('#fff', page, computedValue(chip, 'background-color'));
    expect(contrast(paint(computedValue(chip, 'color')), tint)).toBeGreaterThanOrEqual(4.5);
    expect(computedValue(chip, 'color')).toBe(computedValue(at(root, '.probe-text'), 'color'));
  });

  it('keeps the primary accent on the border, apart from the resting chip', () => {
    const root = mount();
    const chip = at(root, '.chip-active');
    const rest = at(root, '.chip-rest');
    const page = paint('#fff', computedValue(one(root, `.scheme-${scheme}`), 'background-color'));
    expect(computedValue(chip, 'border-top-color')).not.toBe(
      computedValue(rest, 'border-top-color'),
    );
    expect(contrast(paint(computedValue(chip, 'border-top-color')), page)).toBeGreaterThanOrEqual(
      3,
    );
  });

  it('draws an inset Highlight edge under forced colors without resizing', async () => {
    let root = mount();
    const size = (el: HTMLElement): [number, number] => [el.offsetWidth, el.offsetHeight];
    const before = size(at(root, '.chip-active'));
    mountedRoot?.remove();
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const highlight = computedValue(one(root, '.probe-highlight'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(highlight).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(canvasText);

    const chip = at(root, '.chip-active');
    const rest = at(root, '.chip-rest');
    // Without the edge both chips draw the same forced outline.
    expect(computedValue(chip, 'border-top-color')).toBe(computedValue(rest, 'border-top-color'));
    expect(computedValue(chip, 'outline-style')).toBe('solid');
    expect(computedValue(chip, 'outline-color')).toBe(highlight);
    expect(computedValue(chip, 'outline-width')).toBe('2px');
    expect(computedValue(chip, 'outline-offset')).toBe('-2px');
    expect(computedValue(rest, 'outline-style')).toBe('none');
    expect(size(chip)).toEqual(before);
  });
});
