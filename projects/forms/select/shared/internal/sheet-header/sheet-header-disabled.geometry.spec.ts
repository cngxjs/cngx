/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxButton, CngxCloseButton } from '@cngx/common/button';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). The sheet header's
// Done (`cngxButton`) and X (`cngxCloseButton`) take their disabled state from
// the button family: the 38% text recipe and `not-allowed` cursor, GrayText
// under forced colors. The header sheet adds no disabled rule of its own.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-sheet-header-disabled-host',
  standalone: true,
  imports: [CngxButton, CngxCloseButton],
  styleUrls: [
    '../../../../../core/theming/layers.css',
    '../../../../../core/theming/system-tokens.css',
    '../../../../../core/theming/reset.css',
    '../../../../../core/theming/base.css',
    './sheet-header.component.css',
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-select-sheet-header__bar">
          <button
            cngxButton="ghost"
            class="cngx-select-sheet-header__done"
            [disabled]="true"
            disabledReason="Saving"
          >
            Done
          </button>
          <button
            cngxCloseButton
            class="cngx-select-sheet-header__close"
            aria-label="Close"
            [disabled]="true"
            disabledReason="Saving"
          ></button>
        </div>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class SheetHeaderHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(SheetHeaderHost);
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

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('sheet header disabled buttons, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a disabled Done and X by the button family recipe', () => {
    const root = mount();
    const colour = computedValue(at(root, '.probe-disabled'), 'color');
    for (const selector of ['.cngx-select-sheet-header__done', '.cngx-select-sheet-header__close']) {
      const button = at(root, selector);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(computedValue(button, 'color')).toBe(colour);
      expect(computedValue(button, 'cursor')).toBe('not-allowed');
      expect(computedValue(button, 'opacity')).toBe('1');
    }
  });

  it('reads GrayText under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(at(root, '.cngx-select-sheet-header__done'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.cngx-select-sheet-header__close'), 'color')).toBe(gray);
  });
});
