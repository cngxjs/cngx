import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { CngxPopover } from '@cngx/common/popover';

import { CngxListboxTrigger } from './listbox-trigger.directive';
import { CngxListboxSearch } from './listbox-search.directive';
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
    <div cngxPopover #pop="cngxPopover" [closeOnEscape]="escape()">
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
  readonly escape = signal(true);
}

// jsdom does not implement the Popover API - polyfill minimally so CngxPopover
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

  it('ignores keys with ctrl/meta/alt held (browser shortcuts pass through)', () => {
    const { popover, triggerEl, ad } = setup();
    triggerEl.focus();
    for (const modifier of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, ...modifier });
      triggerEl.dispatchEvent(event);
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
      expect(ad.activeItem()).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    }
  });

  it('ignores navigation with modifiers while open', () => {
    const { popover, triggerEl, ad } = setup();
    popover.show();
    TestBed.flushEffects();
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, ctrlKey: true });
    triggerEl.dispatchEvent(event);
    TestBed.flushEffects();
    expect(ad.activeItem()).toBeNull();
    expect(event.defaultPrevented).toBe(false);
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

  it('leaves Escape alone while the popover reports closeOnEscape false', () => {
    const { fixture, popover, triggerEl } = setup();
    fixture.componentInstance.escape.set(false);
    fixture.detectChanges();
    popover.show();
    TestBed.flushEffects();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    triggerEl.dispatchEvent(escape);
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(escape.defaultPrevented).toBe(false);
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

  it('writes aria-activedescendant on the trigger only while open', () => {
    const { fixture, popover, triggerEl, ad } = setup();
    expect(triggerEl.hasAttribute('aria-activedescendant')).toBe(false);

    popover.show();
    TestBed.flushEffects();
    ad.highlightByValue('green');
    TestBed.flushEffects();
    fixture.detectChanges();
    const activeId = ad.activeId();
    expect(activeId).toBeTruthy();
    expect(triggerEl.getAttribute('aria-activedescendant')).toBe(activeId);
    expect(fixture.nativeElement.querySelector(`#${activeId}`)).not.toBeNull();

    popover.hide();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(triggerEl.hasAttribute('aria-activedescendant')).toBe(false);
  });
});

@Component({
  template: `
    <div role="combobox" tabindex="0" [cngxListboxTrigger]="lb" [popover]="pop">
      <span>Red</span>
      <button type="button" class="nested-remove" aria-label="Remove Red">x</button>
    </div>
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxPopover],
})
class NestedButtonHost {}

describe('CngxListboxTrigger - interactive descendants', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [NestedButtonHost] });
  });

  function setup(): {
    triggerEl: HTMLElement;
    nestedButton: HTMLButtonElement;
    popover: CngxPopover;
  } {
    const fixture = TestBed.createComponent(NestedButtonHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxListboxTrigger))
      .nativeElement as HTMLElement;
    return {
      triggerEl,
      nestedButton: triggerEl.querySelector('.nested-remove') as HTMLButtonElement,
      popover: fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover),
    };
  }

  for (const key of ['Enter', ' ']) {
    it(`leaves ${JSON.stringify(key)} on a nested button to the button`, () => {
      const { nestedButton, popover } = setup();
      nestedButton.focus();
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      nestedButton.dispatchEvent(event);
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
      expect(event.defaultPrevented).toBe(false);
    });
  }

  it('still opens on Enter dispatched on the trigger host', () => {
    const { triggerEl, popover } = setup();
    triggerEl.focus();
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    triggerEl.dispatchEvent(event);
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });
});

@Component({
  template: `
    <input
      role="combobox"
      cngxListboxSearch
      [debounceMs]="0"
      [cngxListboxTrigger]="lb"
      [popover]="pop"
      [closeOnSelect]="false"
    />
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxListboxSearch, CngxPopover],
})
class SearchInputHost {}

describe('CngxListboxTrigger - co-located search input', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [SearchInputHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(SearchInputHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const input = fixture.debugElement.query(By.directive(CngxListboxTrigger))
      .nativeElement as HTMLInputElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    const press = (key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
      input.dispatchEvent(event);
      TestBed.flushEffects();
      return event;
    };
    return { input, popover, listbox, press };
  }

  it('ignores an auto-repeated Backspace on the empty input', () => {
    const fixture = TestBed.createComponent(SearchInputHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxListboxTrigger));
    const trigger = de.injector.get(CngxListboxTrigger);
    const input = de.nativeElement as HTMLInputElement;
    let emitted = 0;
    trigger.backspaceOnEmpty.subscribe(() => emitted++);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    for (let i = 0; i < 3; i++) {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, repeat: true }),
      );
    }
    expect(emitted).toBe(1);
  });

  it('lets Space reach the closed input without opening the panel', () => {
    const { popover, press } = setup();
    const event = press(' ');
    expect(event.defaultPrevented).toBe(false);
    expect(popover.isVisible()).toBe(false);
  });

  it('lets Space, Home and End reach the open input without an activation', () => {
    const { popover, listbox, press } = setup();
    press('ArrowDown');
    expect(popover.isVisible()).toBe(true);
    const active = listbox.ad.activeValue();
    expect(active).not.toBeNull();
    const activated: unknown[] = [];
    const sub = listbox.ad.activated.subscribe((v: unknown) => activated.push(v));
    for (const key of [' ', 'Home', 'End']) {
      expect(press(key).defaultPrevented, key).toBe(false);
    }
    expect(activated).toEqual([]);
    expect(listbox.ad.activeValue()).toBe(active);
    expect(press('Enter').defaultPrevented).toBe(true);
    expect(activated).toEqual([active]);
    sub.unsubscribe();
  });
});
