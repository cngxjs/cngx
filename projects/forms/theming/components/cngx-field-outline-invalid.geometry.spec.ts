/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The outline look of a
// lone control comes from cngx.base; an invalid one has to repaint its edge in
// the field error colour, the way an outline box does. Under forced colors the
// border colour is forced to a system colour, so a resting invalid outline
// control or box draws the inset 2px CanvasText ring the fill skin draws.

@Component({
  selector: 'cngx-field-outline-invalid-host',
  standalone: true,
  styleUrls: [
    '../../../core/theming/system-tokens.css',
    '../../../core/theming/reset.css',
    '../../../core/theming/base.css',
    './cngx-field-skin.css',
    './cngx-field-affix.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scope-' + scheme">
        <span class="page" style="display: block; background: var(--cngx-color-surface)"></span>
        <input class="lone-valid" type="text" value="Value" />
        <input class="lone-invalid" type="text" aria-invalid="true" value="Value" />
        <input class="lone-focus" type="text" aria-invalid="true" value="Value" />
        <span class="cngx-field-box cngx-field-affix-row box-data" data-skin="outline" data-invalid>
          <input type="text" data-skin="bare" value="Value" />
        </span>
        <span class="cngx-field-box cngx-field-affix-row box-aria" data-skin="outline">
          <input type="text" data-skin="bare" aria-invalid="true" value="Value" />
        </span>
        <span class="cngx-field-box cngx-field-affix-row box-valid" data-skin="outline">
          <input type="text" data-skin="bare" value="Value" />
        </span>
      </div>
    }
    <span class="plain" style="color: rgb(200, 0, 0)">plain</span>
    <span class="probe-canvastext" style="color: CanvasText"></span>
  `,
})
class OutlineInvalidHost {
  protected readonly schemes = ['light', 'dark'];
}

let mountedRoot: HTMLElement | null = null;

function one(root: ParentNode, selector: string): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) {
    throw new Error(`${selector} did not render`);
  }
  return el;
}

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OutlineInvalidHost);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  return mountedRoot;
}

function toRgb(color: string): [number, number, number] {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

function contrast(a: string, b: string): number {
  const lum = (rgb: [number, number, number]): number => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(toRgb(a)), lum(toRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const ring = (el: HTMLElement): string =>
  ['outline-style', 'outline-width', 'outline-color', 'outline-offset']
    .map((p) => computedValue(el, p))
    .join(' ');

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(['light', 'dark'])('invalid lone outline control, %s scheme', (scheme) => {
  it('repaints its edge in the outline box error colour, 3:1 on the page', () => {
    const scope = one(mount(), `.scope-${scheme}`);
    const lone = computedValue(one(scope, '.lone-invalid'), 'border-top-color');
    const box = computedValue(one(scope, '.box-aria'), 'border-top-color');
    const valid = computedValue(one(scope, '.lone-valid'), 'border-top-color');
    expect(lone).toBe(box);
    expect(lone).not.toBe(valid);
    const page = computedValue(one(scope, '.page'), 'background-color');
    expect(contrast(page, lone)).toBeGreaterThanOrEqual(3);
  });
});

describe('invalid outline field under forced colors', () => {
  async function mountForced(): Promise<HTMLElement> {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [{ name: 'forced-colors', value: 'active' }],
    });
    return mount();
  }

  it('forces a plain author colour (the emulation is live)', async () => {
    const root = await mountForced();
    expect(computedValue(one(root, '.plain'), 'color')).toBe(
      computedValue(one(root, '.probe-canvastext'), 'color'),
    );
  });

  it('rings a resting invalid lone control and box with an inset 2px CanvasText outline', async () => {
    const root = await mountForced();
    const expected = `solid 2px ${computedValue(one(root, '.probe-canvastext'), 'color')} -2px`;
    const scope = one(root, '.scope-light');
    for (const sel of ['.lone-invalid', '.box-data', '.box-aria']) {
      expect(ring(one(scope, sel)), sel).toBe(expected);
    }
  });

  it('leaves a valid outline field without a ring', async () => {
    const scope = one(await mountForced(), '.scope-light');
    for (const sel of ['.lone-valid', '.box-valid']) {
      expect(computedValue(one(scope, sel), 'outline-style'), sel).toBe('none');
    }
  });

  it('hands a focused invalid lone control to its focus ring', async () => {
    const root = await mountForced();
    const lone = one(one(root, '.scope-light'), '.lone-focus');
    lone.focus();
    expect(computedValue(lone, 'outline-offset')).not.toBe('-2px');
  });
});
