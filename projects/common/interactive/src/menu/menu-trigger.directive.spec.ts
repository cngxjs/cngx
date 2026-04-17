import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxPopover } from '@cngx/common/popover';

import { CngxMenuTrigger } from './menu-trigger.directive';
import { CngxMenuItem } from './menu-item.directive';
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
      [cngxMenuTrigger]="menu"
      [popover]="pop"
      #trigger="cngxMenuTrigger"
    >
      Actions
    </button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Actions'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="cut">Cut</li>
        <li cngxMenuItem value="copy">Copy</li>
        <li cngxMenuItem value="paste">Paste</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuTrigger, CngxPopover],
})
class TriggerHost {}

describe('CngxMenuTrigger', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [TriggerHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TriggerHost>>;
    triggerEl: HTMLElement;
    menu: CngxMenu;
    popover: CngxPopover;
  } {
    const fixture = TestBed.createComponent(TriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const trigger = fixture.debugElement.query(By.directive(CngxMenuTrigger));
    const menuDe = fixture.debugElement.query(By.directive(CngxMenu));
    const popDe = fixture.debugElement.query(By.directive(CngxPopover));
    return {
      fixture,
      triggerEl: trigger.nativeElement as HTMLElement,
      menu: menuDe.injector.get(CngxMenu),
      popover: popDe.injector.get(CngxPopover),
    };
  }

  it('aria-haspopup=menu on trigger', () => {
    const { triggerEl } = setup();
    expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('ArrowDown opens popover and highlights first', () => {
    const { triggerEl, menu, popover } = setup();
    triggerEl.focus();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(menu.ad.activeValue()).toBe('cut');
  });

  it('Enter activates and always closes (closeOnSelect is implicit)', () => {
    const { triggerEl, menu, popover } = setup();
    popover.show();
    TestBed.flushEffects();
    menu.ad.highlightByValue('copy');
    TestBed.flushEffects();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });

  it('Escape closes popover', () => {
    const { triggerEl, popover } = setup();
    popover.show();
    TestBed.flushEffects();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });
});
