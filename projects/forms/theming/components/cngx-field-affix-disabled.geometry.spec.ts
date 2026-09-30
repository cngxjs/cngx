/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled interactive
// affix fades by colour, never opacity: a lone disabled button (a clear or
// Apply button while the field is empty) takes the 38% text recipe of a
// disabled field, and inside a disabled box it inherits the box colour, so it
// fades once. Under forced colors it reads GrayText.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-field-affix-disabled-host',
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
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <span class="cngx-field-box cngx-field-affix-row" data-skin="outline">
          <input type="text" data-skin="bare" />
          <button
            type="button"
            class="cngx-field-suffix cngx-field-affix--interactive lone-off"
            disabled
          >
            Apply
          </button>
        </span>
        <span class="cngx-field-box cngx-field-affix-row box-off" data-skin="outline">
          <input type="text" data-skin="bare" disabled />
          <button
            type="button"
            class="cngx-field-suffix cngx-field-affix--interactive boxed-off"
            disabled
          >
            Apply
          </button>
        </span>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class AffixHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(AffixHost);
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

function effectiveOpacity(el: Element): number {
  let value = 1;
  for (let node: Element | null = el; node; node = node.parentElement) {
    value *= parseFloat(computedValue(node, 'opacity'));
  }
  return value;
}

afterEach(async () => {
  mountedRoot?.remove();
  mountedRoot = null;
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

describe.each(SCHEMES)('disabled interactive affix, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('fades a lone disabled affix button by the field recipe, not opacity', () => {
    const root = mount();
    const button = at(root, '.lone-off');
    expect(effectiveOpacity(button)).toBe(1);
    expect(computedValue(button, 'color')).toBe(
      computedValue(at(root, '.probe-disabled'), 'color'),
    );
  });

  it('fades a disabled affix button inside a disabled box once', () => {
    const root = mount();
    const button = at(root, '.boxed-off');
    expect(effectiveOpacity(button)).toBe(1);
    expect(computedValue(button, 'color')).toBe(computedValue(at(root, '.box-off'), 'color'));
  });

  it('reads GrayText under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    expect(computedValue(at(root, '.lone-off'), 'color')).toBe(
      computedValue(one(root, '.probe-gray'), 'color'),
    );
  });
});
