import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenu } from './menu.directive';
import type { CngxMenuHost } from './menu-host.token';
import { CngxMenuItemSubmenu } from './menu-item-submenu.directive';
import { CngxMenuItem } from './menu-item.directive';
import { CNGX_MENU_SUBMENU_WIRING, type CngxMenuSubmenuWiring } from './menu-submenu.token';

const visible = signal(false);

function innerMenu(): CngxMenuHost {
  return {
    ad: {} as CngxMenuHost['ad'],
    submenuItems: signal([]),
    focus: () => {},
    registerSubmenuItem: () => () => {},
  };
}

const wiring: CngxMenuSubmenuWiring = {
  popover: () => ({
    isVisible: () => visible(),
    show: () => visible.set(true),
    hide: () => visible.set(false),
    anchorElement: { set: () => {} },
    id: () => 'wired',
    elementRef: { nativeElement: document.createElement('div') },
  }),
  menu: innerMenu,
};

// Bare `cngxMenuItemSubmenu` (empty-string transform -> undefined) with no
// `[submenuMenu]`: both sources come from CNGX_MENU_SUBMENU_WIRING.
@Component({
  template: `
    <ul cngxMenu [label]="'Menu'" tabindex="0">
      <li cngxMenuItem value="more" cngxMenuItemSubmenu #sub="cngxMenuItemSubmenu">More</li>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu],
  providers: [{ provide: CNGX_MENU_SUBMENU_WIRING, useValue: wiring }],
})
class WiredHost {}

// No wiring provider, no inputs: the brain stays inert.
@Component({
  template: `
    <ul cngxMenu [label]="'Menu'" tabindex="0">
      <li cngxMenuItem value="more" cngxMenuItemSubmenu>More</li>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu],
})
class InertHost {}

describe('CngxMenuItemSubmenu DI wiring fallback', () => {
  beforeEach(() => {
    visible.set(false);
  });

  it('resolves popover and inner menu from CNGX_MENU_SUBMENU_WIRING when inputs are omitted', () => {
    TestBed.configureTestingModule({ imports: [WiredHost] });
    const fixture = TestBed.createComponent(WiredHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const debugEl = fixture.debugElement.query(By.directive(CngxMenuItemSubmenu));
    const el = debugEl.nativeElement as HTMLElement;
    const directive = debugEl.injector.get(CngxMenuItemSubmenu);

    expect(el.getAttribute('aria-haspopup')).toBe('menu');

    directive.open();
    fixture.detectChanges();
    expect(visible()).toBe(true);
    expect(directive.isOpen()).toBe(true);
  });

  it('stays inert (no aria-haspopup / aria-expanded) while neither input nor wiring is present', () => {
    TestBed.configureTestingModule({ imports: [InertHost] });
    const fixture = TestBed.createComponent(InertHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const el = fixture.debugElement.query(By.directive(CngxMenuItemSubmenu))
      .nativeElement as HTMLElement;

    expect(el.getAttribute('aria-haspopup')).toBeNull();
    expect(el.getAttribute('aria-expanded')).toBeNull();
  });
});
