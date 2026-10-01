/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled overflow item
// fades like a disabled tab: by colour (the disabled field recipe), never
// opacity, and reads GrayText under forced colors.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-tab-overflow-disabled-host',
  standalone: true,
  styleUrls: ['../../core/theming/system-tokens.css', './tab-overflow.component.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div class="cngx-tab-overflow">
          <div class="cngx-tab-overflow__item item-off" aria-disabled="true">Hidden tab</div>
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
class OverflowHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OverflowHost);
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

describe.each(SCHEMES)('disabled tab overflow item, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);

  it('paints a disabled item by the field recipe, not opacity', () => {
    const root = mount();
    const item = at(root, '.item-off');
    expect(effectiveOpacity(item)).toBe(1);
    expect(computedValue(item, 'color')).toBe(computedValue(at(root, '.probe-disabled'), 'color'));
  });

  it('reads GrayText under forced colors', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    expect(computedValue(at(root, '.item-off'), 'color')).toBe(
      computedValue(one(root, '.probe-gray'), 'color'),
    );
  });
});
