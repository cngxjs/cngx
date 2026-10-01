/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). Under forced colors the
// highlighted menu item opts out of forcing to paint the Highlight pair, so its
// children see the unforced author colours. The shortcut and the checked glyph
// carry their own colours (primary glyph, muted kbd); they must follow the
// item's ink (HighlightText, GrayText on a disabled cursor) instead.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-menu-forced-ink-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <ul cngxMenu>
          <li cngxMenuItemCheckbox class="cngx-menu-item--highlighted cngx-menu-item--checked item-check">
            <span class="cngx-menu-item__label">Bold</span>
            <kbd class="cngx-menu-item__kbd">Ctrl+B</kbd>
          </li>
          <li cngxMenuItemRadio class="cngx-menu-item--highlighted cngx-menu-item--checked item-radio">
            <span class="cngx-menu-item__label">Left</span>
          </li>
          <li cngxMenuItem class="cngx-menu-item--highlighted item-kbd">
            <span class="cngx-menu-item__label">Copy</span>
            <kbd class="cngx-menu-item__kbd">Ctrl+C</kbd>
          </li>
          <li
            cngxMenuItemCheckbox
            class="cngx-menu-item--highlighted cngx-menu-item--checked cngx-menu-item--disabled item-off"
          >
            <span class="cngx-menu-item__label">Pinned</span>
            <kbd class="cngx-menu-item__kbd">Ctrl+P</kbd>
          </li>
          <li cngxMenuItemCheckbox class="cngx-menu-item--checked item-rest">
            <span class="cngx-menu-item__label">Italic</span>
            <kbd class="cngx-menu-item__kbd">Ctrl+I</kbd>
          </li>
        </ul>
        <span class="plain" style="color: rgb(200, 0, 0)">Plain</span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
    <span class="probe-canvas-text" style="color: CanvasText"></span>
    <span class="probe-highlight-text" style="color: HighlightText"></span>
  `,
})
class MenuForcedInkHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MenuForcedInkHost);
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

function glyphColour(el: Element): string {
  return getComputedStyle(el, '::before').color;
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

describe.each(SCHEMES)('menu item ink under forced colors, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints the shortcut and the checked glyph of the cursor item in HighlightText', async () => {
    await forceColors(scheme);
    const root = mount();
    const ink = computedValue(one(root, '.probe-highlight-text'), 'color');
    // The author colour is forced away, so the palette is really active.
    expect(computedValue(at(root, '.plain'), 'color')).toBe(
      computedValue(one(root, '.probe-canvas-text'), 'color'),
    );
    expect(computedValue(at(root, '.item-check'), 'color')).toBe(ink);
    expect(computedValue(at(root, '.item-check .cngx-menu-item__kbd'), 'color')).toBe(ink);
    expect(glyphColour(at(root, '.item-check'))).toBe(ink);
    expect(glyphColour(at(root, '.item-radio'))).toBe(ink);
    expect(computedValue(at(root, '.item-kbd .cngx-menu-item__kbd'), 'color')).toBe(ink);
  });

  it('paints the shortcut and the checked glyph of a disabled cursor item in GrayText', async () => {
    await forceColors(scheme);
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(at(root, '.item-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.item-off .cngx-menu-item__kbd'), 'color')).toBe(gray);
    expect(glyphColour(at(root, '.item-off'))).toBe(gray);
  });

  it('leaves an item off the cursor to the forced palette', async () => {
    await forceColors(scheme);
    const root = mount();
    const canvasText = computedValue(one(root, '.probe-canvas-text'), 'color');
    expect(computedValue(at(root, '.item-rest .cngx-menu-item__kbd'), 'color')).toBe(canvasText);
    expect(glyphColour(at(root, '.item-rest'))).toBe(canvasText);
  });

  it('keeps the author shortcut and glyph colours without forced colors', () => {
    const root = mount();
    const ink = computedValue(one(root, '.probe-highlight-text'), 'color');
    expect(computedValue(at(root, '.item-check .cngx-menu-item__kbd'), 'color')).not.toBe(ink);
    expect(glyphColour(at(root, '.item-check'))).not.toBe(
      computedValue(at(root, '.item-check .cngx-menu-item__label'), 'color'),
    );
  });
});
