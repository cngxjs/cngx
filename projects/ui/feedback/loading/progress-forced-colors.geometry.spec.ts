/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxProgress } from './progress';

// Runs in a real Chromium (the `test-geometry` target) with the real
// CngxProgress. Under forced colors the linear track and fill are
// background-only and the whole bar vanished, determinate and indeterminate
// alike. The track now stays Canvas under an inset CanvasText ring overlay and
// the fill paints CanvasText. The circular variant draws with SVG strokes,
// which forcing maps to system colours on its own, so it needs no block.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-progress-forced-host',
  standalone: true,
  imports: [CngxProgress],
  styleUrls: ['../../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-progress class="det" [progress]="42" />
    <cngx-progress class="indet" />
    <cngx-progress class="circ" variant="circular" [progress]="42" />
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class ProgressHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(ProgressHost);
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

const ring = (el: Element): CSSStyleDeclaration => getComputedStyle(el, '::after');

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('progress under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string => computedValue(one(root, `.probe-${name}`), 'color');

  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(probe(root, 'canvastext'));
  });

  it('rings the linear track and paints the fill CanvasText, determinate and indeterminate', async () => {
    const root = await mountForced();
    for (const bar of ['.det', '.indet']) {
      const track = one(root, `${bar} .cngx-progress__track`);
      expect(computedValue(track, 'background-color')).toBe(probe(root, 'canvas'));
      expect(ring(track).getPropertyValue('position')).toBe('absolute');
      expect(ring(track).getPropertyValue('box-shadow')).toBe(`${probe(root, 'canvastext')} 0px 0px 0px 1px inset`);
      expect(computedValue(one(root, `${bar} .cngx-progress__fill`), 'background-color')).toBe(probe(root, 'canvastext'));
    }
  });

  it('keeps the circular strokes visible without a block (forced to system colours)', async () => {
    const root = await mountForced();
    const fill = one(root, '.circ .cngx-progress__circle-fill');
    const track = one(root, '.circ .cngx-progress__circle-track');
    expect(computedValue(fill, 'stroke')).not.toBe(probe(root, 'canvas'));
    expect(computedValue(fill, 'stroke')).not.toBe('none');
    expect(computedValue(track, 'stroke')).not.toBe('none');
  });
});

describe('progress without forced colors', () => {
  it('keeps the author paint: no ring overlay, currentColor fill', () => {
    const root = mount();
    expect(ring(one(root, '.det .cngx-progress__track')).getPropertyValue('content')).toBe('none');
    expect(computedValue(one(root, '.det .cngx-progress__fill'), 'background-color')).toBe(
      computedValue(one(root, '.det'), 'color'),
    );
  });
});
