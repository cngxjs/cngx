/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep } from '@cngx/common/stepper';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target) with the real stepper.
// The error badge sits inside the indicator. On the current step the indicator
// opts out of forcing (for its Highlight fill), the opt-out is inherited, and
// the badge painted its unforced author red under forced colors. The badge now
// opts out itself and paints CanvasText with a Canvas glyph, which stands out
// on the Highlight disc and on a Canvas one alike.

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

  it('paints every badge CanvasText with a Canvas glyph, on the current step too', async () => {
    const root = await mountForced();
    const all = badges(root);
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((badge) => badge.closest('[aria-current="step"]'))).toBe(true);
    for (const badge of all) {
      expect(computedValue(badge, 'background-color')).toBe(probe(root, 'canvastext'));
      expect(computedValue(badge, 'color')).toBe(probe(root, 'canvas'));
    }
  });
});

describe('stepper error badge without forced colors', () => {
  it('keeps the author danger paint', async () => {
    const root = await mount();
    const [badge] = badges(root);
    expect(computedValue(badge, 'forced-color-adjust')).toBe('auto');
    expect(computedValue(badge, 'background-color')).not.toBe(
      computedValue(one(root, '.probe-canvastext'), 'color'),
    );
  });
});
