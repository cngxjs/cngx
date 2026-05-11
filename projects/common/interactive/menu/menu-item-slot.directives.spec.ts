import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxMenuItem } from './menu-item.directive';
import {
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
  CngxMenuItemSuffix,
} from './menu-item-slot.directives';
import { CngxMenu } from './menu.directive';

@Component({
  template: `
    <ul cngxMenu [label]="'File'" tabindex="0">
      <li cngxMenuItem value="cut">
        <span cngxMenuItemIcon>✂</span>
        <span cngxMenuItemLabel>Cut</span>
        <span cngxMenuItemSuffix>secondary</span>
        <kbd cngxMenuItemKbd>⌘X</kbd>
      </li>
    </ul>
  `,
  imports: [
    CngxMenu,
    CngxMenuItem,
    CngxMenuItemIcon,
    CngxMenuItemLabel,
    CngxMenuItemSuffix,
    CngxMenuItemKbd,
  ],
})
class SlotHost {}

describe('Menu item slot marker directives', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [SlotHost] }));

  function setup() {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    return fixture;
  }

  it('CngxMenuItemIcon applies cngx-menu-item__icon to host', () => {
    const el = setup().debugElement.query(By.directive(CngxMenuItemIcon))
      .nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-menu-item__icon')).toBe(true);
  });

  it('CngxMenuItemLabel applies cngx-menu-item__label to host', () => {
    const el = setup().debugElement.query(By.directive(CngxMenuItemLabel))
      .nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-menu-item__label')).toBe(true);
  });

  it('CngxMenuItemSuffix applies cngx-menu-item__suffix to host', () => {
    const el = setup().debugElement.query(By.directive(CngxMenuItemSuffix))
      .nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-menu-item__suffix')).toBe(true);
  });

  it('CngxMenuItemKbd applies cngx-menu-item__kbd to host', () => {
    const el = setup().debugElement.query(By.directive(CngxMenuItemKbd))
      .nativeElement as HTMLElement;
    expect(el.classList.contains('cngx-menu-item__kbd')).toBe(true);
  });

  it('all four can co-exist on the same menu item without conflict', () => {
    const fixture = setup();
    const item = fixture.debugElement.query(By.directive(CngxMenuItem)).nativeElement as HTMLElement;
    expect(item.querySelector('.cngx-menu-item__icon')).not.toBeNull();
    expect(item.querySelector('.cngx-menu-item__label')).not.toBeNull();
    expect(item.querySelector('.cngx-menu-item__suffix')).not.toBeNull();
    expect(item.querySelector('.cngx-menu-item__kbd')).not.toBeNull();
  });
});
