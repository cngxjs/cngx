/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The command palette
// match <mark> fills with --cngx-color-highlight and keeps the row text colour.
// The core token swaps per scheme, so the matched text clears 4.5:1 on its fill
// in light and dark (a pale yellow under light dark-mode text sat at 1:1), and
// the dark fill stays apart from the dark surface. Under forced colors the mark
// keeps the system Mark pair.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-command-mark-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './panel/command-panel.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="color: var(--cngx-color-text); background: var(--cngx-color-surface)"
      >
        <div class="cngx-command-row row-on">
          <span class="cngx-command-row-label">Open <mark>file</mark></span>
        </div>
        <span class="probe-highlight" style="background: var(--cngx-color-highlight)"></span>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-mark" style="background: Mark; color: MarkText"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
  `,
})
class CommandMarkHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(CommandMarkHost);
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

// Resolve any CSS colour (oklch, oklab, rgb) to sRGB through a 1px canvas.
function toRgb(colour: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }
  ctx.fillStyle = colour;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return [r, g, b];
}

function luminance(colour: string): number {
  const [r, g, b] = toRgb(colour).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
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

describe.each(SCHEMES)('command palette match highlight, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('fills the mark with the scheme highlight colour', () => {
    const root = mount();
    expect(computedValue(at(root, '.row-on mark'), 'background-color')).toBe(
      computedValue(at(root, '.probe-highlight'), 'background-color'),
    );
  });

  it('keeps the matched text at 4.5:1 on its fill', () => {
    const root = mount();
    const mark = at(root, '.row-on mark');
    expect(
      contrast(computedValue(mark, 'color'), computedValue(mark, 'background-color')),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the fill apart from the surface', () => {
    const root = mount();
    const surface = computedValue(one(root, `.scheme-${scheme}`), 'background-color');
    const fill = computedValue(at(root, '.row-on mark'), 'background-color');
    expect(contrast(fill, surface)).toBeGreaterThan(1.2);
  });

  it('keeps the system Mark pair under forced colors', async () => {
    await forceColors(scheme);
    const root = mount();
    const probe = one(root, '.probe-mark');
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(
      computedValue(one(root, '.probe-canvas-text'), 'color'),
    );
    const mark = at(root, '.row-on mark');
    expect(computedValue(mark, 'background-color')).toBe(computedValue(probe, 'background-color'));
  });
});
