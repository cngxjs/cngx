/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The active TOC link is
// marked by its primary rail (a non-text indicator, 3:1), so its label paints
// in the neutral text colour at 4.5:1 instead of primary-as-text (3.3:1 on
// light). Under forced colors the UA forces the rest links' transparent rail to
// the link colour, so the rest rail is pinned to Canvas and only the active
// link draws a Highlight rail.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-toc-active-link-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './toc.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div
        [attr.data-color-scheme]="scheme"
        [class]="'scheme-' + scheme"
        style="background: var(--cngx-color-surface)"
      >
        <nav class="cngx-toc__nav">
          <ul class="cngx-toc__list">
            <li class="cngx-toc__item">
              <a class="cngx-toc__link link-active" aria-current="location" href="#intro"
                >Introduction</a
              >
            </li>
            <li class="cngx-toc__item">
              <a class="cngx-toc__link link-rest" href="#usage">Usage</a>
            </li>
          </ul>
        </nav>
        <a
          class="plain-rail"
          href="#plain"
          style="border-inline-start: 2px solid rgb(200, 0, 0); color: rgb(200, 0, 0)"
          >Plain</a
        >
        <span class="probe-text" style="color: var(--cngx-color-text)"></span>
        <span class="probe-primary" style="color: var(--cngx-color-primary)"></span>
        <span class="probe-surface" style="color: var(--cngx-color-surface)"></span>
        <span class="probe-highlight" style="color: Highlight"></span>
        <span class="probe-canvas" style="color: Canvas"></span>
      </div>
    }
  `,
})
class TocHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(TocHost);
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

function paint(color: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('no 2d context');
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
  return [r, g, b];
}

function luminance(color: string): number {
  const [r, g, b] = paint(color).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('toc active link, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints the active label in the text colour at 4.5:1 or more', () => {
    const root = mount();
    const active = at(root, '.link-active');
    const surface = computedValue(at(root, '.probe-surface'), 'color');
    expect(computedValue(active, 'color')).toBe(computedValue(at(root, '.probe-text'), 'color'));
    expect(contrast(computedValue(active, 'color'), surface)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the primary rail as the 3:1 marker', () => {
    const root = mount();
    const rail = computedValue(at(root, '.link-active'), 'border-inline-start-color');
    expect(rail).toBe(computedValue(at(root, '.probe-primary'), 'color'));
    expect(
      contrast(rail, computedValue(at(root, '.probe-surface'), 'color')),
    ).toBeGreaterThanOrEqual(3);
  });
});

describe.each(SCHEMES)('toc rail under forced colors, %s', (scheme) => {
  it('draws only the active rail, in Highlight', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const at = (selector: string): HTMLElement => one(root, `.scheme-${scheme} ${selector}`);
    // A plain author-coloured rail is forced, so the emulation is live.
    expect(computedValue(at('.plain-rail'), 'border-inline-start-color')).not.toBe(
      'rgb(200, 0, 0)',
    );
    expect(computedValue(at('.link-active'), 'border-inline-start-color')).toBe(
      computedValue(at('.probe-highlight'), 'color'),
    );
    expect(computedValue(at('.link-rest'), 'border-inline-start-color')).toBe(
      computedValue(at('.probe-canvas'), 'color'),
    );
  });
});
