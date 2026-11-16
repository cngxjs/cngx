/// <reference types="@vitest/browser-playwright" />

import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { computedValue } from '@cngx/testing/geometry';
import { afterEach, describe, expect, it } from 'vitest';

// Runs in a real Chromium (the `test-geometry` target). A host that paints its
// own surface around a menu zeroes the menu surface tokens on that menu. The
// tokens are registered `inherits: false`, so a menu nested inside it keeps the
// default floating surface instead of inheriting the zeroed one.

@Component({
  selector: 'cngx-menu-surface-tokens-host',
  standalone: true,
  styleUrls: ['../../../core/theming/system-tokens.css', './cngx-menu.css'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ul
      cngxMenu
      class="stripped"
      style="--cngx-menu-bg: transparent; --cngx-menu-border: 0; --cngx-menu-radius: 0; --cngx-menu-shadow: none"
    >
      <li cngxMenuItem>
        <ul cngxMenu class="nested">
          <li cngxMenuItem>Nested</li>
        </ul>
      </li>
    </ul>
    <span class="probe-surface" style="background: var(--cngx-color-surface)"></span>
  `,
})
class MenuSurfaceTokensHost {}

let mountedRoot: HTMLElement | null = null;

function mount(): HTMLElement {
  const fixture = TestBed.createComponent(MenuSurfaceTokensHost);
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

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('menu surface tokens', () => {
  it('strip the surface on the menu that sets them', () => {
    const menu = one(mount(), '.stripped');
    expect(computedValue(menu, 'background-color')).toBe('rgba(0, 0, 0, 0)');
    expect(computedValue(menu, 'border-top-width')).toBe('0px');
    expect(computedValue(menu, 'box-shadow')).toBe('none');
  });

  it('do not leak into a nested menu', () => {
    const root = mount();
    const nested = one(root, '.nested');
    expect(computedValue(nested, 'background-color')).toBe(
      computedValue(one(root, '.probe-surface'), 'background-color'),
    );
    expect(computedValue(nested, 'border-top-width')).toBe('1px');
    expect(computedValue(nested, 'box-shadow')).not.toBe('none');
  });
});
