/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target) with forced colors
// emulated over CDP. An invalid fill field signals with a danger underline
// (box-shadow, forced to none) and a danger text tint (forced to CanvasText),
// so under forced colors it read exactly like a valid one. A resting invalid
// fill field, lone control or box, now draws an inset 2px CanvasText ring; a
// focused one keeps the 2px Highlight focus ring offset outside the box.

@Component({
  selector: 'cngx-field-fill-invalid-forced-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/base.css',
    './cngx-field-skin.css',
    './cngx-field-affix.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <input class="lone-valid" type="text" data-skin="fill" value="Value" />
    <input class="lone-invalid" type="text" data-skin="fill" aria-invalid="true" value="Value" />
    <input class="lone-focus" type="text" data-skin="fill" aria-invalid="true" value="Value" />
    <span class="cngx-field-box cngx-field-affix-row box-data" data-skin="fill" data-invalid>
      <input type="text" data-skin="bare" value="Value" />
    </span>
    <span class="cngx-field-box cngx-field-affix-row box-aria" data-skin="fill">
      <input type="text" data-skin="bare" aria-invalid="true" value="Value" />
    </span>
    <span class="cngx-field-box cngx-field-affix-row box-valid" data-skin="fill">
      <input type="text" data-skin="bare" value="Value" />
    </span>
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
    <span class="probe-highlight" style="color: Highlight"></span>
  `,
})
class FillInvalidHost {}

let mountedRoot: HTMLElement | null = null;

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(FillInvalidHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

const ring = (el: HTMLElement): string =>
  ['outline-style', 'outline-width', 'outline-color', 'outline-offset'].map((p) => computedValue(el, p)).join(' ');

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(['light', 'dark'] as const)('invalid fill field under forced colors, %s', (scheme) => {
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

  it('rings a resting invalid lone control and box with an inset 2px CanvasText outline', async () => {
    const root = await mountForced();
    const expected = `solid 2px ${probe(root, 'canvastext')} -2px`;
    for (const sel of ['.lone-invalid', '.box-data', '.box-aria']) {
      expect(ring(one(root, sel)), sel).toBe(expected);
    }
  });

  it('leaves a valid fill field without a ring', async () => {
    const root = await mountForced();
    for (const sel of ['.lone-valid', '.box-valid']) {
      expect(computedValue(one(root, sel), 'outline-style'), sel).toBe('none');
    }
  });

  it('hands a focused invalid field to the Highlight focus ring outside the box', async () => {
    const root = await mountForced();
    const lone = one(root, '.lone-focus');
    lone.focus();
    expect(ring(lone)).toBe(`solid 2px ${probe(root, 'highlight')} 3px`);
    one(root, '.box-aria input').focus();
    expect(ring(one(root, '.box-aria'))).toBe(`solid 2px ${probe(root, 'highlight')} 3px`);
  });
});

describe('invalid fill field without forced colors', () => {
  it('draws no ring on a resting invalid field', () => {
    const root = mount();
    expect(computedValue(one(root, '.lone-invalid'), 'outline-style')).toBe('none');
    expect(computedValue(one(root, '.box-data'), 'outline-style')).toBe('none');
  });
});
