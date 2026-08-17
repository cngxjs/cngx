import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenu } from './menu.directive';
import type { CngxMenuHost } from './menu-host.token';
import { CngxMenuItemSubmenu } from './menu-item-submenu.directive';
import { CngxMenuItem } from './menu-item.directive';

function mockPopover() {
  return {
    isVisible: () => false,
    show: () => {},
    hide: () => {},
    anchorElement: { set: () => {} },
    id: () => 'vb',
    elementRef: { nativeElement: document.createElement('div') },
  };
}

function mockInner(): CngxMenuHost {
  return {
    ad: {} as CngxMenuHost['ad'],
    submenuItems: signal([]),
    focus: () => {},
    registerSubmenuItem: () => () => {},
  };
}

// The submenu companion is declared inside THIS wrapper component's own
// template. A `contentChildren(CNGX_MENU_SUBMENU_ITEM)` on the surrounding
// menu cannot see across the view boundary; DI registration can.
@Component({
  selector: 'vb-section',
  template: `
    <li cngxMenuItem value="more" [cngxMenuItemSubmenu]="pop" [submenuMenu]="inner">More</li>
  `,
  imports: [CngxMenuItem, CngxMenuItemSubmenu],
})
class Section {
  readonly pop = mockPopover();
  readonly inner = mockInner();
}

@Component({
  template: `
    <ul cngxMenu [label]="'Menu'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="a">A</li>
      @if (showSection()) {
        <vb-section />
      }
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItem, Section],
})
class Host {
  readonly showSection = signal(true);
}

describe('CngxMenu submenu discovery across a component view boundary', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Host] });
  });

  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const menu = fixture.debugElement.query(By.directive(CngxMenu)).injector.get(CngxMenu);
    return { fixture, menu };
  }

  it('discovers a [cngxMenuItemSubmenu] declared inside a wrapper component template', () => {
    const { menu } = setup();
    expect(menu.submenuItems().length).toBe(1);
    expect(menu.submenuItems()[0].inner).toBeTruthy();
  });

  it('deregisters the submenu when the wrapper component is destroyed', () => {
    const { fixture, menu } = setup();
    expect(menu.submenuItems().length).toBe(1);

    fixture.componentInstance.showSection.set(false);
    fixture.detectChanges();

    expect(menu.submenuItems().length).toBe(0);
  });
});
