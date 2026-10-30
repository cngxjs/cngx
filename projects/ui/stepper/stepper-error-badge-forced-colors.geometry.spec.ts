/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target) with the real stepper.
// The error badge is a standalone alert icon after the step label (no disc).
// Under forced colors it must paint a system colour via currentColor, also on
// the current step whose indicator opts out of forcing for its Highlight fill.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-stepper-error-badge-forced-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-stepper [activeStepIndex]="0" aria-label="Checkout">
      <div cngxStep label="Address" [error]="true"></div>
      <div cngxStep label="Payment" [error]="true"></div>
      <div cngxStep label="Review"></div>
    </cngx-stepper>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class ErrorBadgeHost {}

let mountedRoot: HTMLElement | null = null;

async function mount(): Promise<HTMLElement> {
  const fixture = TestBed.createComponent(ErrorBadgeHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return mountedRoot;
}

function badges(root: ParentNode): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.cngx-stepper__badge'));
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

describe.each(SCHEMES)('stepper error badge under forced colors, %s', (scheme) => {
  const probe = (root: HTMLElement, name: string): string =>
    computedValue(one(root, `.probe-${name}`), 'color');

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

  it('paints every badge glyph CanvasText with no disc, on the current step too', async () => {
    const root = await mountForced();
    const all = badges(root);
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((badge) => badge.closest('[aria-current="step"]'))).toBe(true);
    for (const badge of all) {
      expect(badge.closest('.cngx-stepper__indicator')).toBeNull();
      // Fully transparent (forced colors may rewrite the channels, never alpha).
      expect(computedValue(badge, 'background-color')).toMatch(/, 0\)$/);
      expect(computedValue(badge, 'color')).toBe(probe(root, 'canvastext'));
      const glyph = badge.querySelector('svg path');
      expect(glyph).not.toBeNull();
      expect(computedValue(glyph!, 'stroke')).toBe(probe(root, 'canvastext'));
    }
  });
});

describe('stepper error badge without forced colors', () => {
  it('keeps the author danger paint on the bare glyph', async () => {
    const root = await mount();
    const [badge] = badges(root);
    expect(computedValue(badge, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(badge, 'border-radius')).toBe('0px');
    expect(computedValue(badge, 'color')).not.toBe(
      computedValue(one(root, '.probe-canvastext'), 'color'),
    );
    const glyph = badge.querySelector('svg path')!;
    expect(computedValue(glyph, 'stroke')).toBe(computedValue(badge, 'color'));
  });

  // Standalone icon: 1.15em of the label font, stroke width 2, after the
  // label and vertically centred on it.
  it('draws the alert icon 1.15em wide at stroke 2 after the label', async () => {
    const root = await mount();
    const [badge] = badges(root);
    const step = badge.closest('.cngx-stepper__step') as HTMLElement;
    const label = step.querySelector('.cngx-stepper__label') as HTMLElement;
    const svg = badge.querySelector('svg')!;
    const box = svg.getBoundingClientRect();
    const em = parseFloat(getComputedStyle(label).fontSize);
    expect(box.width).toBeCloseTo(1.15 * em, 0);
    expect(box.height).toBeCloseTo(1.15 * em, 0);
    expect(getComputedStyle(svg).strokeWidth).toBe('2px');
    const text = label.getBoundingClientRect();
    expect(box.left).toBeGreaterThanOrEqual(text.right);
    expect(box.top + box.height / 2).toBeCloseTo(text.top + text.height / 2, 0);
  });
});
