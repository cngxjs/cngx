import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { CngxPopover } from '@cngx/common/popover';

import { CngxListboxTrigger } from './listbox-trigger.directive';
import { CngxListbox } from './listbox.directive';
import { CngxOption } from './option.directive';

@Component({
  template: `
    <button
      type="button"
      [cngxListboxTrigger]="lb"
      [popover]="pop"
      #trigger="cngxListboxTrigger"
    >
      Select
    </button>
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" tabindex="0" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
        <div cngxOption value="blue">Blue</div>
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxPopover],
})
class TriggerHost {
  readonly dummy = signal(0);
}

// jsdom does not implement the Popover API — polyfill minimally so CngxPopover
// can toggle state without throwing.
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

describe('CngxListboxTrigger', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [TriggerHost] });
  });

  function setup(): {
    fixture: ReturnType<typeof TestBed.createComponent<TriggerHost>>;
    trigger: CngxListboxTrigger;
    triggerEl: HTMLElement;
    popover: CngxPopover;
    listbox: CngxListbox;
    ad: CngxActiveDescendant;
  } {
    const fixture = TestBed.createComponent(TriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEntry = fixture.debugElement.query(By.directive(CngxListboxTrigger));
    const popoverEntry = fixture.debugElement.query(By.directive(CngxPopover));
    const listboxEntry = fixture.debugElement.query(By.directive(CngxListbox));
    return {
      fixture,
      trigger: triggerEntry.injector.get(CngxListboxTrigger),
      triggerEl: triggerEntry.nativeElement as HTMLElement,
      popover: popoverEntry.injector.get(CngxPopover),
      listbox: listboxEntry.injector.get(CngxListbox),
      ad: listboxEntry.injector.get(CngxActiveDescendant),
    };
  }

  it('sets aria-haspopup="listbox" on the trigger', () => {
    const { triggerEl } = setup();
    expect(triggerEl.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('ArrowDown opens popover and highlights first item when closed', () => {
    const { triggerEl, popover, ad } = setup();
    triggerEl.focus();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(ad.activeValue()).toBe('red');
  });

  it('ArrowUp opens popover and highlights last item when closed', () => {
    const { popover, triggerEl, ad } = setup();
    triggerEl.focus();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(ad.activeValue()).toBe('blue');
  });

  it('Escape closes popover', () => {
    const { popover, triggerEl } = setup();
    popover.show();
    TestBed.flushEffects();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });

  it('Enter while open activates current and closes when closeOnSelect=true (default)', () => {
    const { popover, triggerEl, listbox, ad } = setup();
    popover.show();
    TestBed.flushEffects();
    ad.highlightByValue('green');
    TestBed.flushEffects();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    expect(listbox.selected()).toEqual(['green']);
    expect(popover.isVisible()).toBe(false);
  });

  it('Arrow keys while open navigate without closing', () => {
    const { popover, triggerEl, ad } = setup();
    popover.show();
    TestBed.flushEffects();
    ad.highlightByValue('red');
    TestBed.flushEffects();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(ad.activeValue()).toBe('green');
    expect(popover.isVisible()).toBe(true);
  });
});
