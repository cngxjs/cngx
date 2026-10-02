/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

import { CngxPasswordStrengthMeter } from './password-strength-meter/password-strength-meter.component';
import { CngxStatus } from './status/status.component';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors a
// bare status dot and every password-strength segment are painted with
// background only and used to flatten into Canvas. The bare dot is now a
// CanvasText disc (the label carries the tone), and each meter segment is an
// inset CanvasText ring, filled with CanvasText when it counts.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-status-meter-forced-host',
  standalone: true,
  imports: [CngxStatus, CngxPasswordStrengthMeter],
  styleUrls: ['../../core/theming/system-tokens.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <cngx-status class="st-bare" tone="danger" label="Down" [glyph]="false" />
    <cngx-status class="st-glyph" tone="danger" label="Down" />
    <cngx-password-strength-meter class="pw-weak" [score]="1" />
    <cngx-password-strength-meter class="pw-strong" [score]="4" />
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span
      class="probe-danger"
      style="color: var(--cngx-status-danger-color, var(--cngx-color-danger, oklch(0.65 0.22 25)))"
    ></span>
    <span class="probe-weak" style="color: var(--cngx-password-strength-meter-weak-color, #b3261e)"></span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-canvas" style="color: Canvas"></span>
  `,
})
class StatusMeterHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(StatusMeterHost);
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

function segments(root: ParentNode, meter: string): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(`${meter} .cngx-password-strength-meter__segment`));
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('status dot and password meter under forced colors, %s', (scheme) => {
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

  it('keeps a bare status dot as a CanvasText disc', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.st-bare .cngx-status__dot'), 'background-color')).toBe(probe(root, 'canvastext'));
  });

  it('leaves a glyph dot to its glyph (no ink fill behind CanvasText text)', async () => {
    const root = await mountForced();
    const glyphDot = one(root, '.st-glyph .cngx-status__dot');
    expect(computedValue(glyphDot, 'background-color')).not.toBe(probe(root, 'canvastext'));
    expect(computedValue(glyphDot, 'color')).toBe(probe(root, 'canvastext'));
  });

  it('rings every meter segment and fills the counted ones with CanvasText', async () => {
    const root = await mountForced();
    const ink = probe(root, 'canvastext');
    for (const meter of ['.pw-weak', '.pw-strong']) {
      for (const seg of segments(root, meter)) {
        expect(computedValue(seg, 'outline-style')).toBe('solid');
        expect(computedValue(seg, 'outline-color')).toBe(ink);
        expect(Number.parseFloat(computedValue(seg, 'outline-offset'))).toBe(-1);
      }
    }
    const weak = segments(root, '.pw-weak').map((seg) => computedValue(seg, 'background-color'));
    expect(weak).toEqual([ink, probe(root, 'canvas'), probe(root, 'canvas'), probe(root, 'canvas')]);
    const strong = segments(root, '.pw-strong').map((seg) => computedValue(seg, 'background-color'));
    expect(strong).toEqual([ink, ink, ink, ink]);
  });
});

describe('status dot and password meter without forced colors', () => {
  it('keeps the author paint', () => {
    const root = mount();
    expect(computedValue(one(root, '.st-bare .cngx-status__dot'), 'background-color')).toBe(
      computedValue(one(root, '.probe-danger'), 'color'),
    );
    const [first, second] = segments(root, '.pw-weak');
    expect(computedValue(first, 'background-color')).toBe(computedValue(one(root, '.probe-weak'), 'color'));
    expect(computedValue(second, 'outline-style')).toBe('none');
  });
});
