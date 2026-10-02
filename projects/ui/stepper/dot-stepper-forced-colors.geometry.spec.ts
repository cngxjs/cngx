/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxDotStepper } from './dot-stepper.component';

// Runs in a real Chromium (the `test-geometry` target) with the real
// CngxDotStepper. Under forced colors its dots are background-only circles and
// all vanished, the current one included. Each dot now carries an inset
// CanvasText ring, a completed dot fills CanvasText, the active dot fills
// Highlight, and the error glyph follows the ink each fill declares.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-dot-stepper-forced-host',
  standalone: true,
  imports: [CngxDotStepper, CngxStep],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-dot-stepper [activeStepIndex]="1" aria-label="Tour">
      <div cngxStep label="One"></div>
      <div cngxStep label="Two" [error]="true"></div>
      <div cngxStep label="Three" [error]="true"></div>
      <div cngxStep label="Four"></div>
    </cngx-dot-stepper>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-highlighttext" style="color: HighlightText"></span>
  `,
})
class DotStepperHost {}

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(DotStepperHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  for (const dot of dots(mountedRoot)) {
    dot.style.transition = 'none';
  }
  return mountedRoot;
}

function dots(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.cngx-dot-stepper__dot'));
}

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

const glyph = (el: Element): string => getComputedStyle(el, '::after').getPropertyValue('color').trim();

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('dot stepper under forced colors, %s', (scheme) => {
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

  it('renders the fixture states', async () => {
    const root = await mountForced();
    const [done, active, errored, upcoming] = dots(root);
    expect(done.classList).toContain('cngx-dot-stepper__dot--completed');
    expect(active.classList).toContain('cngx-dot-stepper__dot--active');
    expect(active.classList).toContain('cngx-dot-stepper__dot--error');
    expect(errored.classList).toContain('cngx-dot-stepper__dot--error');
    expect(upcoming.className).toBe('cngx-dot-stepper__dot');
  });

  it('rings an upcoming dot on Canvas, the errored one too (no author red)', async () => {
    const root = await mountForced();
    const [, , errored, upcoming] = dots(root);
    for (const dot of [errored, upcoming]) {
      expect(computedValue(dot, 'forced-color-adjust')).toBe('none');
      expect(computedValue(dot, 'background-color')).toBe(probe(root, 'canvas'));
      expect(computedValue(dot, 'box-shadow')).toBe(`${probe(root, 'canvastext')} 0px 0px 0px 1px inset`);
    }
    expect(glyph(errored)).toBe(probe(root, 'canvastext'));
  });

  it('fills a completed dot with CanvasText', async () => {
    const root = await mountForced();
    expect(computedValue(dots(root)[0], 'background-color')).toBe(probe(root, 'canvastext'));
  });

  it('fills the active dot with Highlight and draws its error glyph in HighlightText', async () => {
    const root = await mountForced();
    const active = dots(root)[1];
    expect(computedValue(active, 'background-color')).toBe(probe(root, 'highlight'));
    expect(computedValue(active, 'box-shadow')).toBe('none');
    expect(glyph(active)).toBe(probe(root, 'highlighttext'));
  });
});

describe('dot stepper without forced colors', () => {
  it('keeps the author paint: no ring, no opt-out', async () => {
    const root = await mount();
    for (const dot of dots(root)) {
      expect(computedValue(dot, 'box-shadow')).toBe('none');
      expect(computedValue(dot, 'forced-color-adjust')).toBe('auto');
    }
  });
});
