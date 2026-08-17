import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxMenu } from './menu.directive';
import type { CngxMenuHost } from './menu-host.token';
import { CngxMenuItemSubmenu } from './menu-item-submenu.directive';
import { CngxMenuItem } from './menu-item.directive';
import {
  CNGX_MENU_SUBMENU_WIRING,
  type CngxMenuSubmenuPopoverRef,
  type CngxMenuSubmenuWiring,
} from './menu-submenu.token';

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

// A shell provides the wiring token but resolves nothing (the composing
// component carries the brain on every item and wires it only when a submenu
// is bound). The brain is inert, but the shell owns the wiring intent, so the
// "no popover/menu source" warning must not fire.
const nullWiring: CngxMenuSubmenuWiring = {
  popover: () => null as unknown as CngxMenuSubmenuPopoverRef,
  menu: () => null as unknown as CngxMenuHost,
};

@Component({
  template: `
    <ul cngxMenu [label]="'Menu'" tabindex="0">
      <li cngxMenuItem value="more" cngxMenuItemSubmenu>More</li>
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu],
  providers: [{ provide: CNGX_MENU_SUBMENU_WIRING, useValue: nullWiring }],
})
class ShellInertHost {}

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

  describe('inert-brain warning scope', () => {
    let warn: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warn.mockRestore();
    });

    function inertWarnings(): unknown[] {
      return warn.mock.calls.filter((call: unknown[]) =>
        String(call[0]).includes('no popover/menu source'),
      );
    }

    it('warns when the brain is inert and no wiring token is present', () => {
      TestBed.configureTestingModule({ imports: [InertHost] });
      const fixture = TestBed.createComponent(InertHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(inertWarnings().length).toBeGreaterThan(0);
    });

    it('stays silent when a shell provides the wiring token even though the brain is inert', () => {
      TestBed.configureTestingModule({ imports: [ShellInertHost] });
      const fixture = TestBed.createComponent(ShellInertHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();

      const el = fixture.debugElement.query(By.directive(CngxMenuItemSubmenu))
        .nativeElement as HTMLElement;
      expect(el.getAttribute('aria-haspopup')).toBeNull();
      expect(inertWarnings()).toHaveLength(0);
    });
  });
});
