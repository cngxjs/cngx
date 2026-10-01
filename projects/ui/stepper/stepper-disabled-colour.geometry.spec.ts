/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled step fades
// by colour (the 38% text recipe of a disabled field), never opacity, in the
// default strip and in a skin that paints its own step colour; the indicator
// number follows. Under forced colors it reads GrayText with no ring on the
// indicator. In dots mode a disabled dot is a hollow ring; under forced colors
// every dot draws an inset outline, the current dot keeps a Highlight fill.
// The collapsed group header and the progress-bar caption de-emphasise with
// the muted text colour instead of opacity.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-stepper-disabled-colour-host',
  standalone: true,
  styleUrls: [
    '../../core/theming/system-tokens.css',
    './styles/stepper-base.css',
    './stepper.component.css',
    './progress-bar-stepper.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-stepper strip-default">
          <div class="cngx-stepper__strip">
            <button type="button" class="cngx-stepper__step step-on" aria-current="step">
              <span class="cngx-stepper__indicator" data-state="idle">1</span>
              <span class="cngx-stepper__label">Profile</span>
            </button>
            <button type="button" class="cngx-stepper__step step-idle">
              <span class="cngx-stepper__indicator" data-state="idle">2</span>
              <span class="cngx-stepper__label">Address</span>
            </button>
            <button type="button" class="cngx-stepper__step step-off" aria-disabled="true">
              <span class="cngx-stepper__indicator" data-state="disabled">3</span>
              <span class="cngx-stepper__label">Locked</span>
            </button>
          </div>
          <div class="cngx-stepper__mobile-dots">
            <button
              type="button"
              class="cngx-stepper__mobile-dot cngx-stepper__mobile-dot--active cngx-stepper__mobile-dot--error dot-active"
              aria-current="step"
              data-state="error"
            ></button>
            <button type="button" class="cngx-stepper__mobile-dot dot-up"></button>
            <button
              type="button"
              class="cngx-stepper__mobile-dot dot-off"
              aria-disabled="true"
              data-state="disabled"
            ></button>
          </div>
          <div
            class="cngx-stepper__group-header cngx-stepper__group-header--collapsed group-folded"
            style="transition: none"
          >
            Billing
          </div>
        </div>
        <div class="cngx-stepper strip-chips" data-skin="chips">
          <div class="cngx-stepper__strip">
            <button type="button" class="cngx-stepper__step chips-idle">
              <span class="cngx-stepper__label">Address</span>
            </button>
            <button type="button" class="cngx-stepper__step chips-off" aria-disabled="true">
              <span class="cngx-stepper__label">Locked</span>
            </button>
          </div>
        </div>
        <div class="cngx-progress-bar-stepper">
          <span class="cngx-progress-bar-stepper__caption pbs-caption">Step 1 of 3</span>
        </div>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span
          class="probe-ring"
          style="box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
        <span class="probe-muted" style="color: var(--cngx-color-text-muted)"></span>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
    <span class="probe-highlight-text" style="color: HighlightText"></span>
  `,
})
class StepperHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(StepperHost);
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

// Opacity of the element and every ancestor multiplied: the value a user
// actually sees, whichever element carries it.
function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

function size(el: Element): string {
  const rect = el.getBoundingClientRect();
  return `${rect.width}x${rect.height}`;
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

describe.each(SCHEMES)('disabled stepper, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a disabled step, its label and number by the field recipe, not opacity', () => {
    const root = mount();
    const disabled = computedValue(at(root, '.probe-disabled'), 'color');
    for (const sel of [
      '.step-off',
      '.step-off .cngx-stepper__label',
      '.step-off .cngx-stepper__indicator',
      '.chips-off',
    ]) {
      expect(effectiveOpacity(at(root, sel)), sel).toBe(1);
      expect(computedValue(at(root, sel), 'color'), sel).toBe(disabled);
    }
    // An enabled step in the same strip and skin keeps its own colour.
    expect(computedValue(at(root, '.step-idle'), 'color')).not.toBe(disabled);
    expect(computedValue(at(root, '.chips-idle'), 'color')).not.toBe(disabled);
  });

  it('draws a disabled dot as a hollow ring without changing its box', () => {
    const root = mount();
    const dot = at(root, '.dot-off');
    expect(effectiveOpacity(dot)).toBe(1);
    expect(computedValue(dot, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(dot, 'box-shadow')).toBe(
      computedValue(at(root, '.probe-ring'), 'box-shadow'),
    );
    expect(size(dot)).toBe(size(at(root, '.dot-up')));
  });

  it('mutes the collapsed group header and the progress caption by colour', () => {
    const root = mount();
    const muted = computedValue(at(root, '.probe-muted'), 'color');
    for (const sel of ['.group-folded', '.pbs-caption']) {
      expect(effectiveOpacity(at(root, sel)), sel).toBe(1);
      expect(computedValue(at(root, sel), 'color'), sel).toBe(muted);
    }
  });

  it('reads GrayText for a disabled step under forced colors, with no ring', async () => {
    await forceColors(scheme);
    const root = mount();
    expect(matchMedia('(forced-colors: active)').matches).toBe(true);
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(gray).not.toBe(canvasText);
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(canvasText);
    for (const sel of [
      '.step-off',
      '.step-off .cngx-stepper__label',
      '.step-off .cngx-stepper__indicator',
      '.chips-off',
    ]) {
      expect(effectiveOpacity(at(root, sel)), sel).toBe(1);
      expect(computedValue(at(root, sel), 'color'), sel).toBe(gray);
    }
    expect(computedValue(at(root, '.step-off .cngx-stepper__indicator'), 'outline-style')).toBe(
      'none',
    );
    expect(computedValue(at(root, '.step-idle'), 'color')).toBe(canvasText);
  });

  it('outlines every dot under forced colors and fills the current one', async () => {
    const sizes = (r: HTMLElement): string[] =>
      ['.dot-active', '.dot-up', '.dot-off'].map((sel) => size(at(r, sel)));
    const before = sizes(mount());
    mountedRoot?.remove();
    await forceColors(scheme);
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    const highlight = computedValue(one(root, '.probe-highlight'), 'color');
    for (const sel of ['.dot-active', '.dot-up', '.dot-off']) {
      const dot = at(root, sel);
      expect(computedValue(dot, 'outline-style'), sel).toBe('solid');
      expect(computedValue(dot, 'outline-width'), sel).toBe('1px');
      expect(computedValue(dot, 'outline-offset'), sel).toBe('-1px');
    }
    expect(computedValue(at(root, '.dot-up'), 'outline-color')).toBe(canvasText);
    expect(computedValue(at(root, '.dot-off'), 'outline-color')).toBe(gray);
    const active = at(root, '.dot-active');
    expect(computedValue(active, 'forced-color-adjust')).toBe('none');
    expect(computedValue(active, 'background-color')).toBe(highlight);
    expect(computedValue(active, '--_cngx-forced-ink')).toBe('HighlightText');
    // The error glyph follows the declared ink instead of its unforced white.
    expect(getComputedStyle(active, '::after').color).toBe(
      computedValue(one(root, '.probe-highlight-text'), 'color'),
    );
    // The outline is inset, so no dot grows or shifts.
    expect(sizes(root)).toEqual(before);
  });
});
