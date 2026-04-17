import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxMenuItem } from './menu-item.directive';
import { CngxMenu } from './menu.directive';

@Component({
  template: `
    <ul cngxMenu [label]="label()" tabindex="0" #menu="cngxMenu" (itemActivated)="lastActivated.set($any($event))">
      @for (action of actions(); track action.value) {
        <li cngxMenuItem [value]="action.value" [disabled]="action.disabled ?? false">{{ action.label }}</li>
      }
    </ul>
  `,
  imports: [CngxMenu, CngxMenuItem],
})
class MenuHost {
  readonly label = signal('Actions');
  readonly actions = signal<Array<{ value: string; label: string; disabled?: boolean }>>([
    { value: 'new', label: 'New' },
    { value: 'open', label: 'Open' },
    { value: 'save', label: 'Save', disabled: true },
    { value: 'close', label: 'Close' },
  ]);
  readonly lastActivated = signal<string | null>(null);
}

describe('CngxMenu', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [MenuHost] }));

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<MenuHost>>;
    menu: CngxMenu;
    hostEl: HTMLElement;
  } {
    const fixture = TestBed.createComponent(MenuHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxMenu));
    return {
      fixture,
      menu: el.injector.get(CngxMenu),
      hostEl: el.nativeElement as HTMLElement,
    };
  }

  it('sets role="menu" and aria-label', () => {
    const { hostEl } = setup();
    expect(hostEl.getAttribute('role')).toBe('menu');
    expect(hostEl.getAttribute('aria-label')).toBe('Actions');
  });

  it('menu items get role="menuitem" and stable ids', () => {
    const { fixture } = setup();
    const items = fixture.debugElement
      .queryAll(By.directive(CngxMenuItem))
      .map((d) => d.nativeElement as HTMLElement);
    expect(items).toHaveLength(4);
    items.forEach((el) => {
      expect(el.getAttribute('role')).toBe('menuitem');
      expect(el.id).toMatch(/^cngx-menu-item-/);
    });
  });

  it('ArrowDown highlights next non-disabled item', () => {
    const { fixture, menu, hostEl } = setup();
    menu.ad.highlightFirst();
    TestBed.flushEffects();
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(menu.ad.activeValue()).toBe('open');
    // 'save' is disabled -> next ArrowDown should skip to 'close'
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(menu.ad.activeValue()).toBe('close');
  });

  it('Enter on highlighted item emits itemActivated', () => {
    const { fixture, menu, hostEl } = setup();
    const spy = vi.fn<(v: unknown) => void>();
    menu.itemActivated.subscribe(spy);
    menu.ad.highlightByValue('open');
    TestBed.flushEffects();
    fixture.detectChanges();
    hostEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    expect(spy).toHaveBeenCalledWith('open');
    expect(fixture.componentInstance.lastActivated()).toBe('open');
  });

  it('click on menu item activates and emits', () => {
    const { fixture, menu } = setup();
    const items = fixture.debugElement
      .queryAll(By.directive(CngxMenuItem))
      .map((d) => d.nativeElement as HTMLElement);
    items[1].click();
    TestBed.flushEffects();
    expect(menu.ad.activeValue()).toBe('open');
    expect(fixture.componentInstance.lastActivated()).toBe('open');
  });

  it('click on disabled item does nothing', () => {
    const { fixture } = setup();
    const items = fixture.debugElement
      .queryAll(By.directive(CngxMenuItem))
      .map((d) => d.nativeElement as HTMLElement);
    items[2].click();
    TestBed.flushEffects();
    expect(fixture.componentInstance.lastActivated()).toBeNull();
  });
});
