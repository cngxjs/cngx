import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CngxPopover } from '@cngx/common/popover';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { __resetSubmenuFallbackWarnings, CngxMenuItemSubmenu } from './menu-item-submenu.directive';
import { CngxMenuItem } from './menu-item.directive';
import { CngxMenu } from './menu.directive';
import { CNGX_SUBMENU_TRY_FALLBACKS } from './submenu-defaults';

// Runs in a real Chromium (the `test-geometry` target), where the computed
// `position-try-fallbacks` of an unset popover is `none`, not the `''` jsdom
// reports. CNGX1026 must fire there and stay silent once the chain is bound.

let mountedRoot: HTMLElement | null = null;

@Component({
  template: `
    <ul cngxMenu [label]="'Outer'">
      <li cngxMenuItem [cngxMenuItemSubmenu]="innerPop" [submenuMenu]="inner" value="recent">
        Open Recent
      </li>
    </ul>
    <div cngxPopover #innerPop="cngxPopover" [exclusive]="false">
      <ul cngxMenu [label]="'Recent'" #inner="cngxMenu">
        <li cngxMenuItem value="file1">file1.ts</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxPopover],
})
class UnsetFallbacksHost {}

@Component({
  template: `
    <ul cngxMenu [label]="'Outer'">
      <li cngxMenuItem [cngxMenuItemSubmenu]="innerPop" [submenuMenu]="inner" value="recent">
        Open Recent
      </li>
    </ul>
    <div cngxPopover #innerPop="cngxPopover" [exclusive]="false" [positionTryFallbacks]="fallbacks">
      <ul cngxMenu [label]="'Recent'" #inner="cngxMenu">
        <li cngxMenuItem value="file1">file1.ts</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxPopover],
})
class BoundFallbacksHost {
  protected readonly fallbacks = CNGX_SUBMENU_TRY_FALLBACKS;
}

function render<T>(type: new () => T): void {
  __resetSubmenuFallbackWarnings(document);
  const fixture = TestBed.createComponent(type);
  mountedRoot = fixture.nativeElement as HTMLElement;
  document.body.appendChild(mountedRoot);
  fixture.detectChanges();
  TestBed.tick();
}

afterEach(() => {
  mountedRoot?.remove();
  mountedRoot = null;
});

describe('CngxMenuItemSubmenu try-fallbacks warning in Chromium', () => {
  it('runs in a browser that implements position-try-fallbacks', () => {
    expect(CSS.supports('position-try-fallbacks', 'flip-block')).toBe(true);
  });

  it('warns CNGX1026 for a submenu popover without a fallback chain', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(UnsetFallbacksHost);
    const calls = warn.mock.calls.filter(([m]) => /^CNGX1026: /.test(String(m)));
    expect(calls).toHaveLength(1);
    warn.mockRestore();
  });

  it('stays silent once the recommended chain is bound', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(BoundFallbacksHost);
    expect(warn.mock.calls.some(([m]) => /^CNGX1026: /.test(String(m)))).toBe(false);
    warn.mockRestore();
  });
});
