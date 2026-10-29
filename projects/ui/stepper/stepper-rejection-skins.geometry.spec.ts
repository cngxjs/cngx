/// <reference types="@vitest/browser-playwright" />

import { Component, input, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxStep, type CngxStepperCommitAction, type CngxStepperSkin } from '@cngx/common/stepper';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxStepper } from './stepper.component';

// Runs in a real Chromium (the `test-geometry` target) with the real stepper
// CSS. Covers the per-skin error and rejection treatment: the alert badge
// after (path-chevron: before) the label, the rejected step drawn as a tinted
// surface, a line or a label colour per skin, and the forced-colors outline.

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

@Component({
  selector: 'cngx-stepper-rejection-skin-host',
  standalone: true,
  imports: [CngxStepper, CngxStep],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-stepper
      aria-label="Checkout"
      [skin]="skin()"
      [orientation]="orientation()"
      [commitAction]="action()"
      commitMode="optimistic"
    >
      <div cngxStep label="Address"></div>
      <div cngxStep label="Payment"></div>
      <div cngxStep label="Review" [error]="true"></div>
    </cngx-stepper>
  `,
})
class RejectionHost {
  readonly skin = input<CngxStepperSkin>('classic');
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly action = input<CngxStepperCommitAction | null>(null);
}

const refuse: CngxStepperCommitAction = () => false;
const fail: CngxStepperCommitAction = () => {
  throw new Error('save failed');
};

let mountedRoot: HTMLElement | null = null;

interface Mounted {
  readonly root: HTMLElement;
  readonly steps: HTMLElement[];
}

async function mount(
  skin: CngxStepperSkin,
  action?: CngxStepperCommitAction,
  orientation: 'horizontal' | 'vertical' = 'horizontal',
): Promise<Mounted> {
  const fixture = TestBed.createComponent(RejectionHost);
  fixture.componentRef.setInput('skin', skin);
  fixture.componentRef.setInput('orientation', orientation);
  fixture.componentRef.setInput('action', action ?? null);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  await fixture.whenStable();
  const steps = Array.from(mountedRoot.querySelectorAll<HTMLElement>('button.cngx-stepper__step'));
  if (action) {
    steps[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }
  // Let the 150ms colour transitions settle before reading paint.
  await new Promise((resolve) => setTimeout(resolve, 250));
  return { root: mountedRoot, steps };
}

function part(step: HTMLElement, name: string): HTMLElement {
  const el = step.querySelector<HTMLElement>(`.cngx-stepper__${name}`);
  if (!el) {
    throw new Error(`.cngx-stepper__${name} did not render`);
  }
  return el;
}

function centre(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe('stepper error badge per skin', () => {
  it('path-chevron: the badge leads the label and both stay centred in the tile', async () => {
    const { steps } = await mount('path-chevron');
    const step = steps[2];
    const badge = part(step, 'badge');
    const label = part(step, 'label');
    expect(computedValue(badge, 'display')).not.toBe('none');
    const icon = badge.getBoundingClientRect();
    const text = label.getBoundingClientRect();
    expect(icon.right).toBeLessThanOrEqual(text.left);
    const tile = step.getBoundingClientRect();
    const groupCentre = (icon.left + text.right) / 2;
    expect(groupCentre).toBeCloseTo(centre(tile).x, 0);
    expect(centre(icon).y).toBeCloseTo(centre(tile).y, 0);
    // On the red tile the badge takes the tile text colour, not red on red.
    expect(computedValue(badge, 'color')).toBe(computedValue(step, 'color'));
  });

  it('chips: the badge follows the label in the chip text colour', async () => {
    const { steps } = await mount('chips');
    const step = steps[2];
    const badge = part(step, 'badge');
    expect(badge.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      part(step, 'label').getBoundingClientRect().right,
    );
    expect(computedValue(badge, 'color')).toBe(computedValue(step, 'color'));
  });

  it('breadcrumb: the badge follows the label', async () => {
    const { steps } = await mount('breadcrumb');
    const badge = part(steps[2], 'badge');
    expect(computedValue(badge, 'display')).not.toBe('none');
    expect(badge.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      part(steps[2], 'label').getBoundingClientRect().right,
    );
  });

  it('stripe-status-rich: the status pill carries the error, the badge is hidden', async () => {
    const { steps } = await mount('stripe-status-rich');
    expect(computedValue(part(steps[2], 'badge'), 'display')).toBe('none');
    expect(part(steps[2], 'status-pill').textContent?.trim()).toBe('Errored');
  });
});

describe('rejected step per skin', () => {
  it('classic: a rounded tinted surface and no outline', async () => {
    const { steps } = await mount('classic', fail);
    const step = steps[1];
    expect(step.classList.contains('cngx-stepper__step--rejected')).toBe(true);
    expect(computedValue(step, 'background-color')).not.toBe(TRANSPARENT);
    expect(computedValue(step, 'border-radius')).toBe('8px');
    expect(computedValue(step, 'outline-style')).toBe('none');
  });

  it('classic: a refusal tints amber, a failure red', async () => {
    const failed = computedValue((await mount('classic', fail)).steps[1], 'background-color');
    mountedRoot?.remove();
    const refused = computedValue((await mount('classic', refuse)).steps[1], 'background-color');
    expect(refused).not.toBe(TRANSPARENT);
    expect(refused).not.toBe(failed);
  });

  it('classic: the rejection icon is a bare 1.15em glyph at stroke 2', async () => {
    const { steps } = await mount('classic', refuse);
    const icon = part(steps[1], 'rejection-icon');
    expect(computedValue(icon, 'background-color')).toBe(TRANSPARENT);
    const svg = icon.querySelector('svg')!;
    const em = parseFloat(computedValue(part(steps[1], 'label'), 'font-size'));
    expect(svg.getBoundingClientRect().width).toBeCloseTo(1.15 * em, 0);
    expect(getComputedStyle(svg).strokeWidth).toBe('2px');
  });

  for (const skin of ['path-chevron', 'pill-segment', 'chips'] as const) {
    it(`${skin}: the tint replaces the step background, shaped by the skin`, async () => {
      const resting = (await mount(skin)).steps[1];
      const restingRadius = computedValue(resting, 'border-radius');
      const restingBg = computedValue(resting, 'background-color');
      mountedRoot?.remove();
      const { steps } = await mount(skin, fail);
      const bg = computedValue(steps[1], 'background-color');
      expect(bg).not.toBe(TRANSPARENT);
      expect(bg).not.toBe(restingBg);
      expect(computedValue(steps[1], 'border-radius')).toBe(restingRadius);
      expect(computedValue(steps[1], 'outline-style')).toBe('none');
    });
  }

  it('path-chevron: the rejection icon leads the label', async () => {
    const { steps } = await mount('path-chevron', fail);
    expect(part(steps[1], 'rejection-icon').getBoundingClientRect().right).toBeLessThanOrEqual(
      part(steps[1], 'label').getBoundingClientRect().left,
    );
  });

  it('chips: the rejection icon follows the label', async () => {
    const { steps } = await mount('chips', fail);
    expect(part(steps[1], 'rejection-icon').getBoundingClientRect().left).toBeGreaterThanOrEqual(
      part(steps[1], 'label').getBoundingClientRect().right,
    );
  });

  it('linear-minimal: no surface, a 2px underline', async () => {
    const { steps } = await mount('linear-minimal', fail);
    expect(computedValue(steps[1], 'background-color')).toBe(TRANSPARENT);
    expect(computedValue(steps[1], 'box-shadow')).toMatch(/0px -2px 0px 0px inset$/);
  });

  it('linear-minimal vertical: a 2px inline-start line', async () => {
    const { steps } = await mount('linear-minimal', fail, 'vertical');
    expect(computedValue(steps[1], 'box-shadow')).toMatch(/2px 0px 0px 0px inset$/);
  });

  it('breadcrumb: colour only, the label turns the reason colour', async () => {
    const { steps } = await mount('breadcrumb', fail);
    expect(computedValue(steps[1], 'background-color')).toBe(TRANSPARENT);
    expect(computedValue(steps[1], 'box-shadow')).toBe('none');
    const icon = part(steps[1], 'rejection-icon');
    expect(computedValue(part(steps[1], 'label'), 'color')).toBe(computedValue(icon, 'color'));
  });

  it('stripe-status-rich: the pill names the rejection, the icon is hidden, the tint stays', async () => {
    const { steps } = await mount('stripe-status-rich', refuse);
    expect(part(steps[1], 'status-pill').textContent?.trim()).toBe('Not allowed');
    expect(computedValue(part(steps[1], 'rejection-icon'), 'display')).toBe('none');
    expect(computedValue(steps[1], 'background-color')).not.toBe(TRANSPARENT);
  });

  it('forced colors: an outline keeps the rejected step distinguishable', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    const { steps } = await mount('classic', fail);
    expect(computedValue(steps[1], 'outline-style')).toBe('solid');
    expect(computedValue(steps[1], 'outline-width')).toBe('2px');
    expect(computedValue(steps[0], 'outline-style')).not.toBe('solid');
  });
});
