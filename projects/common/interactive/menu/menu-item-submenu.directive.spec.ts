import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from '@cngx/common/popover';

import { CngxMenuItem } from './menu-item.directive';
import { CngxMenuItemSubmenu } from './menu-item-submenu.directive';
import { CngxMenuTrigger } from './menu-trigger.directive';
import { CngxMenu } from './menu.directive';

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

@Component({
  template: `
    <button
      type="button"
      [cngxMenuTrigger]="outer"
      [popover]="outerPop"
      #trigger="cngxMenuTrigger"
    >
      Actions
    </button>
    <div cngxPopover #outerPop="cngxPopover">
      <ul cngxMenu [label]="'Outer'" tabindex="0" #outer="cngxMenu" (itemActivated)="outerActivated.set($any($event))">
        <li cngxMenuItem value="cut">Cut</li>
        <li
          cngxMenuItem
          [cngxMenuItemSubmenu]="innerPop"
          [submenuMenu]="inner"
          value="recent"
          #recent="cngxMenuItemSubmenu"
        >
          Open Recent
        </li>
        <li cngxMenuItem value="paste">Paste</li>
      </ul>
    </div>
    <div cngxPopover #innerPop="cngxPopover" [exclusive]="false">
      <ul cngxMenu [label]="'Recent'" tabindex="0" #inner="cngxMenu" (itemActivated)="innerActivated.set($any($event))">
        <li cngxMenuItem value="file1">file1.ts</li>
        <li cngxMenuItem value="file2">file2.ts</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxMenuTrigger, CngxPopover],
})
class SubmenuHost {
  readonly outerActivated = signal<string | null>(null);
  readonly innerActivated = signal<string | null>(null);
}

describe('CngxMenuItemSubmenu', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [SubmenuHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(SubmenuHost);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLElement;
    const outerMenu = fixture.debugElement.query(By.directive(CngxMenu)).injector.get(CngxMenu);
    const popovers = fixture.debugElement.queryAll(By.directive(CngxPopover));
    const outerPop = popovers[0].injector.get(CngxPopover);
    const innerPop = popovers[1].injector.get(CngxPopover);
    const submenuDe = fixture.debugElement.query(By.directive(CngxMenuItemSubmenu));
    const submenu = submenuDe.injector.get(CngxMenuItemSubmenu);
    const submenuEl = submenuDe.nativeElement as HTMLElement;
    const innerMenuDe = fixture.debugElement.queryAll(By.directive(CngxMenu))[1];
    const innerMenu = innerMenuDe.injector.get(CngxMenu);
    return { fixture, triggerEl, outerMenu, innerMenu, outerPop, innerPop, submenu, submenuEl };
  }

  it('aria-haspopup=menu on the submenu host', () => {
    const { submenuEl } = setup();
    expect(submenuEl.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('aria-expanded reflects the inner popover state', () => {
    const { submenuEl, innerPop, fixture } = setup();
    expect(submenuEl.getAttribute('aria-expanded')).toBe('false');
    innerPop.show();
    TestBed.tick();
    fixture.detectChanges();
    expect(submenuEl.getAttribute('aria-expanded')).toBe('true');
  });

  it('outer menu exposes the submenu via submenuItems()', () => {
    const { outerMenu, submenu } = setup();
    const items = outerMenu.submenuItems();
    expect(items).toHaveLength(1);
    expect(items[0]).toBe(submenu);
  });

  it('ArrowRight on a submenu parent opens the inner popover and highlights its first item', () => {
    const { triggerEl, outerMenu, innerMenu, innerPop } = setup();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    outerMenu.ad.highlightByValue('recent');
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    TestBed.tick();
    expect(innerPop.isVisible()).toBe(true);
    expect(innerMenu.ad.activeValue()).toBe('file1');
  });

  it('ArrowDown after submenu opens navigates inside the submenu', () => {
    const { triggerEl, outerMenu, innerMenu } = setup();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    outerMenu.ad.highlightByValue('recent');
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    expect(innerMenu.ad.activeValue()).toBe('file2');
  });

  it('ArrowLeft inside an open submenu closes it, outer popover stays open', () => {
    const { triggerEl, outerMenu, innerPop, outerPop } = setup();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    outerMenu.ad.highlightByValue('recent');
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    TestBed.tick();
    expect(innerPop.isVisible()).toBe(true);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    TestBed.tick();
    expect(innerPop.isVisible()).toBe(false);
    expect(outerPop.isVisible()).toBe(true);
  });

  it('Enter on a leaf inside the submenu fires the inner menu activation and closes everything', () => {
    const { fixture, triggerEl, outerMenu, innerPop, outerPop } = setup();
    const innerSpy = vi.fn<(v: unknown) => void>();
    fixture.componentInstance.innerActivated.set(null);
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    outerMenu.ad.highlightByValue('recent');
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.tick();
    expect(fixture.componentInstance.innerActivated()).toBe('file1');
    expect(innerPop.isVisible()).toBe(false);
    expect(outerPop.isVisible()).toBe(false);
    void innerSpy;
  });

  it('Escape inside an open submenu closes only the top, outer popover stays open', () => {
    const { triggerEl, outerMenu, innerPop, outerPop } = setup();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    outerMenu.ad.highlightByValue('recent');
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    TestBed.tick();

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    TestBed.tick();
    expect(innerPop.isVisible()).toBe(false);
    expect(outerPop.isVisible()).toBe(true);
  });

  it('Enter on a submenu parent opens it without firing the outer menu activation', () => {
    const { fixture, triggerEl, outerMenu, innerPop } = setup();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.tick();
    outerMenu.ad.highlightByValue('recent');
    TestBed.tick();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.tick();
    expect(innerPop.isVisible()).toBe(true);
    expect(fixture.componentInstance.outerActivated()).toBeNull();
  });

  it('submenu directive id mirrors the sibling [cngxMenuItem] id when co-located', () => {
    const { submenu, submenuEl } = setup();
    const menuItemDe = (submenuEl as unknown as { id: string }).id;
    expect(submenu.id).toBe(menuItemDe);
    expect(submenu.id).toMatch(/^cngx-menu-item-/);
  });
});

@Component({
  template: `
    <ul cngxMenu [label]="'Outer'" tabindex="0">
      <li [cngxMenuItemSubmenu]="pop" [submenuMenu]="inner" #s="cngxMenuItemSubmenu">Recent</li>
    </ul>
    <div cngxPopover #pop="cngxPopover" [exclusive]="false">
      <ul cngxMenu [label]="'Recent'" tabindex="0" #inner="cngxMenu">
        <li cngxMenuItem value="x">file1.ts</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxPopover],
})
class StandaloneSubmenuHost {}

describe('CngxMenuItemSubmenu — applied without a sibling [cngxMenuItem]', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [StandaloneSubmenuHost] });
  });

  it('falls back to a fresh nextUid id and warns in dev mode', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const fixture = TestBed.createComponent(StandaloneSubmenuHost);
      fixture.detectChanges();
      TestBed.tick();
      const submenuDe = fixture.debugElement.query(By.directive(CngxMenuItemSubmenu));
      const submenu = submenuDe.injector.get(CngxMenuItemSubmenu);
      expect(submenu.id).toMatch(/^cngx-menu-submenu-/);
      expect(warnSpy).toHaveBeenCalledOnce();
      expect(warnSpy.mock.calls[0][0]).toContain('cngxMenuItemSubmenu');
      expect(warnSpy.mock.calls[0][0]).toContain('cngxMenuItem');
    } finally {
      warnSpy.mockRestore();
    }
  });
});
