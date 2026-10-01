/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';
import { cdp } from 'vitest/browser';

// Runs in a real Chromium (the `test-geometry` target). A disabled listbox
// option or menu item fades by colour, never opacity: 38% text (the disabled
// field recipe), the menu shortcut and checked glyph included. Under forced
// colors both read GrayText, and a selected option opts out of forcing so its
// HighlightText label is not painted over by the text backplate.

const SCHEMES = ['light', 'dark'] as const;

@Component({
  selector: 'cngx-option-disabled-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-listbox.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    @for (scheme of schemes; track scheme) {
      <div [attr.data-color-scheme]="scheme" [class]="'scheme-' + scheme">
        <div cngxListbox>
          <div cngxOption class="cngx-option--selected opt-selected">Apple</div>
          <div cngxOption class="cngx-option--disabled opt-off">Banana</div>
          <div cngxOption class="cngx-option--disabled cngx-option--selected opt-off-selected">Cherry</div>
        </div>
        <ul cngxMenu>
          <li cngxMenuItem class="cngx-menu-item--disabled item-off">
            <span class="cngx-menu-item__label">Delete</span>
            <kbd class="cngx-menu-item__kbd">Del</kbd>
          </li>
          <li cngxMenuItemCheckbox class="cngx-menu-item--disabled cngx-menu-item--checked item-off-checked">
            <span class="cngx-menu-item__label">Pinned</span>
          </li>
          <li cngxMenuItem class="cngx-menu-item--disabled cngx-menu-item--highlighted item-off-cursor">
            <span class="cngx-menu-item__label">Archive</span>
          </li>
        </ul>
        <span
          class="probe-disabled"
          style="color: color-mix(in oklab, var(--cngx-color-text) 38%, transparent)"
        ></span>
      </div>
    }
    <span class="probe-gray" style="color: GrayText"></span>
  `,
})
class OptionHost {
  readonly schemes = SCHEMES;
}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(OptionHost);
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

describe.each(SCHEMES)('disabled option and menu item, %s', (scheme) => {
  const at = (root: HTMLElement, selector: string): HTMLElement =>
    one(root, `.scheme-${scheme} ${selector}`);
  const disabledColour = (root: HTMLElement): string =>
    computedValue(at(root, '.probe-disabled'), 'color');

  it('paints a disabled option by the field recipe, not opacity', () => {
    const root = mount();
    const option = at(root, '.opt-off');
    expect(effectiveOpacity(option)).toBe(1);
    expect(computedValue(option, 'color')).toBe(disabledColour(root));
  });

  it('paints a disabled menu item, its shortcut and its checked glyph by colour', () => {
    const root = mount();
    const colour = disabledColour(root);
    const item = at(root, '.item-off');
    expect(effectiveOpacity(item)).toBe(1);
    expect(computedValue(item, 'color')).toBe(colour);
    expect(computedValue(at(root, '.item-off .cngx-menu-item__kbd'), 'color')).toBe(colour);
    const checked = at(root, '.item-off-checked');
    expect(getComputedStyle(checked, '::before').color).toBe(colour);
  });

  it('reads GrayText under forced colors and keeps the selected label visible', async () => {
    await cdp().send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'forced-colors', value: 'active' },
        { name: 'prefers-color-scheme', value: scheme },
      ],
    });
    const root = mount();
    const gray = computedValue(one(root, '.probe-gray'), 'color');
    expect(computedValue(at(root, '.opt-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.opt-off-selected'), 'background-color')).toBe(gray);
    expect(computedValue(at(root, '.opt-selected'), 'forced-color-adjust')).toBe('none');
    expect(getComputedStyle(at(root, '.opt-selected')).getPropertyValue('--_cngx-forced-ink').trim()).toBe(
      'HighlightText',
    );
    expect(computedValue(at(root, '.item-off'), 'color')).toBe(gray);
    expect(computedValue(at(root, '.item-off-cursor'), 'color')).toBe(gray);
  });
});
