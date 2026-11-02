/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxInput } from '@cngx/forms/input';
import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxFieldBox } from '../../field/field-box.directive';

// Runs in a real Chromium (the `test-geometry` target). A bare <input>, the
// outline field-box frame and a select trigger draw their resting edge in the
// strong-border rung: one colour at the edge, and 3:1 against the surface
// (WCAG 1.4.11) in the light and the dark scheme. The scheme is emulated at
// the root so every token resolves in it.

const OPTIONS: CngxSelectOptionDef<string>[] = [
  { value: 'chf', label: 'CHF' },
  { value: 'eur', label: 'EUR' },
];

@Component({
  selector: 'cngx-control-edge-contrast-host',
  standalone: true,
  imports: [CngxFieldBox, CngxInput, CngxSelect],
  styleUrls: [
    '../../../core/theming/layers.css',
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    './cngx-field-affix.css',
    './cngx-field-skin.css',
    '../../select/shared/select-base.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="page" style="background: var(--cngx-color-surface); padding: 1rem">
      <input class="bare-input" aria-label="Bare" />
      <span cngxFieldBox class="outline-box" skin="outline">
        <input cngxInput aria-label="Boxed" />
      </span>
      <cngx-select class="lone-select" [label]="'Currency'" [options]="options" />
    </div>
  `,
})
class EdgeHost {
  readonly options = OPTIONS;
}

let mountedRoot: HTMLElement | null = null;

function one(selector: string): HTMLElement {
  const el = mountedRoot?.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

// Paints `layers` in order onto a 1px sRGB canvas and returns the WCAG
// relative luminance of the result.
function luminance(...layers: string[]): number {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext('2d')!;
  for (const layer of layers) {
    context.fillStyle = layer;
    context.fillRect(0, 0, 1, 1);
  }
  const [r, g, b] = Array.from(context.getImageData(0, 0, 1, 1).data.slice(0, 3)).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(['light', 'dark'] as const)('control edge contrast (%s scheme)', (scheme) => {
  async function mount(): Promise<void> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: scheme }],
    });
    const fixture = TestBed.createComponent(EdgeHost);
    mountedRoot = fixture.nativeElement as HTMLElement;
    document.body.appendChild(mountedRoot);
    fixture.detectChanges();
    expect(matchMedia(`(prefers-color-scheme: ${scheme})`).matches).toBe(true);
  }

  it('draws the bare input edge at 3:1 against the surface', async () => {
    await mount();
    const surface = computedValue(one('.page'), 'background-color');
    const edge = computedValue(one('.bare-input'), 'border-top-color');
    expect(contrast(luminance(surface, edge), luminance(surface))).toBeGreaterThanOrEqual(3);
  });

  it('draws the outline field-box frame at 3:1 against the surface', async () => {
    await mount();
    const surface = computedValue(one('.page'), 'background-color');
    const edge = computedValue(one('.outline-box'), 'border-top-color');
    expect(contrast(luminance(surface, edge), luminance(surface))).toBeGreaterThanOrEqual(3);
  });

  it('gives the bare input, the outline frame and the select trigger one edge colour', async () => {
    await mount();
    const input = computedValue(one('.bare-input'), 'border-top-color');
    expect(computedValue(one('.outline-box'), 'border-top-color')).toBe(input);
    expect(computedValue(one('.lone-select .cngx-field-trigger'), 'border-top-color')).toBe(input);
  });
});
