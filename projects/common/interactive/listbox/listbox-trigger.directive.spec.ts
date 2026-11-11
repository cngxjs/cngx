import { Component, Directive, computed, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { CngxPopover } from '@cngx/common/popover';

import { CNGX_HOST_INTERACTION_STATE } from '../async-click/host-interaction-state.token';

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

// A deferred-render listbox (the CngxSelect family, OD5): the option rows
// render only once the panel opens, so a pointer/programmatic open leaves the
// AD item space empty until the first render after that open.
@Component({
  template: `
    <button type="button" [cngxListboxTrigger]="lb" [popover]="pop" #trigger="cngxListboxTrigger">
      Select
    </button>
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" tabindex="0" #lb="cngxListbox">
        @if (pop.isVisible()) {
          <div cngxOption value="red">Red</div>
          <div cngxOption value="green">Green</div>
        }
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxPopover],
})
class DeferredTriggerHost {}

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

  it('writes neither aria-haspopup nor aria-expanded: CngxPopoverTrigger owns both', () => {
    const { triggerEl, popover } = setup();
    expect(triggerEl.hasAttribute('aria-haspopup')).toBe(false);
    expect(triggerEl.hasAttribute('aria-expanded')).toBe(false);
    popover.show();
    TestBed.flushEffects();
    expect(triggerEl.hasAttribute('aria-expanded')).toBe(false);
  });

  it('ignores Ctrl/Meta + ArrowDown (browser shortcuts pass through)', () => {
    const { popover, triggerEl, ad } = setup();
    triggerEl.focus();
    for (const modifier of [{ ctrlKey: true }, { metaKey: true }]) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, ...modifier });
      triggerEl.dispatchEvent(event);
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
      expect(ad.activeItem()).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    }
  });

  // Alt owns ArrowDown/ArrowUp (open/close); every other Alt combo is an app
  // shortcut and still passes through untouched.
  it('ignores Alt held on a non-navigation key', () => {
    const { popover, triggerEl } = setup();
    triggerEl.focus();
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, altKey: true });
    triggerEl.dispatchEvent(event);
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
    expect(event.defaultPrevented).toBe(false);
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

  it('sets the key highlight before the popover emits opened, so an opened handler can replace it', () => {
    const { triggerEl, popover, ad } = setup();
    let atOpen: unknown = 'unset';
    popover.opened.subscribe(() => {
      atOpen = ad.activeValue();
      ad.highlightByIndex(1);
    });
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    TestBed.flushEffects();
    expect(atOpen).toBe('blue');
    expect(ad.activeValue()).toBe('green');
  });

  it('applies a key-open highlight to a deferred-render panel once its rows render', async () => {
    TestBed.configureTestingModule({ imports: [DeferredTriggerHost] });
    const fixture = TestBed.createComponent(DeferredTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const ad = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxActiveDescendant);
    const triggerEl = fixture.debugElement.query(By.directive(CngxListboxTrigger))
      .nativeElement as HTMLElement;

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(ad.activeItem()).toBeNull();
    await fixture.whenStable();
    TestBed.flushEffects();
    expect(ad.activeValue()).toBe('green');
  });

  it('stores no highlight for an arrow key on an open panel whose rows have not rendered', async () => {
    TestBed.configureTestingModule({ imports: [DeferredTriggerHost] });
    const fixture = TestBed.createComponent(DeferredTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const listboxEntry = fixture.debugElement.query(By.directive(CngxListbox));
    const ad = listboxEntry.injector.get(CngxActiveDescendant);
    const triggerEl = fixture.debugElement.query(By.directive(CngxListboxTrigger))
      .nativeElement as HTMLElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);

    // An arrow key inside an open panel is a step, not an open gesture: with no
    // rows there is nothing to step to, and nothing is kept for later rows.
    popover.show();
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
    triggerEl.dispatchEvent(event);
    expect(ad.activeItem()).toBeNull();

    await fixture.whenStable();
    TestBed.flushEffects();
    expect(ad.activeItem()).toBeNull();
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

  for (const [label, init] of [
    ['isComposing', { isComposing: true }],
    ['keyCode 229', { keyCode: 229 }],
  ] as const) {
    it(`ignores an Enter that confirms an IME composition (${label})`, () => {
      const { popover, triggerEl, listbox, ad } = setup();
      popover.show();
      TestBed.flushEffects();
      ad.highlightByValue('green');
      TestBed.flushEffects();
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
        ...init,
      });
      triggerEl.dispatchEvent(event);
      TestBed.flushEffects();
      expect(event.defaultPrevented).toBe(false);
      expect(listbox.selected()).toEqual([]);
      expect(popover.isVisible()).toBe(true);
    });
  }

  it('does not open the panel on an ArrowDown inside an IME composition', () => {
    const { popover, triggerEl } = setup();
    triggerEl.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, isComposing: true }),
    );
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });

  it('prevents the page scroll of Space while open with no active option', () => {
    const { popover, triggerEl, listbox, ad } = setup();
    popover.show();
    TestBed.flushEffects();
    expect(ad.activeItem()).toBeFalsy();
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    triggerEl.dispatchEvent(space);
    TestBed.flushEffects();
    expect(space.defaultPrevented).toBe(true);
    expect(listbox.selected()).toEqual([]);
    expect(popover.isVisible()).toBe(true);

    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    triggerEl.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
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

  it('does not emit backspaceOnEmpty on an aria-disabled input', () => {
    const fixture = TestBed.createComponent(SearchInputHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxListboxTrigger));
    const trigger = de.injector.get(CngxListboxTrigger);
    const input = de.nativeElement as HTMLInputElement;
    input.setAttribute('aria-disabled', 'true');
    let emitted = 0;
    trigger.backspaceOnEmpty.subscribe(() => emitted++);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    expect(emitted).toBe(0);
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

@Component({
  template: `
    <input
      role="combobox"
      cngxListboxSearch
      #search="cngxListboxSearch"
      [debounceMs]="300"
      [cngxListboxTrigger]="lb"
      [popover]="pop"
      [closeOnSelect]="false"
    />
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" #lb="cngxListbox">
        @for (o of visible(); track o.value) {
          <div cngxOption [value]="o.value">{{ o.label }}</div>
        }
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxListboxSearch, CngxPopover],
})
class DebouncedSearchHost {
  private readonly search = viewChild.required(CngxListboxSearch);
  // Blue sits between Red and Green so a key that overtakes the deferred
  // first key (moving on the stale rows) lands on a different row.
  private readonly all = [
    { value: 'red', label: 'Red' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'grey', label: 'Grey' },
  ];
  protected readonly visible = computed(() => {
    const term = this.search().term().toLowerCase();
    return this.all.filter((o) => o.label.toLowerCase().includes(term));
  });
}

describe('CngxListboxTrigger - keys inside the search debounce window', () => {
  beforeEach(() => {
    polyfillPopover();
    vi.useFakeTimers();
    TestBed.configureTestingModule({ imports: [DebouncedSearchHost] });
  });

  // Keys are dispatched back to back with no tick between them: a tick runs
  // the afterNextRender callback of the first deferred key.
  function setup() {
    const fixture = TestBed.createComponent(DebouncedSearchHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const input = fixture.debugElement.query(By.directive(CngxListboxTrigger))
      .nativeElement as HTMLInputElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    const key = (k: string): void => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
    };
    const settle = (): void => {
      TestBed.flushEffects();
      fixture.detectChanges();
      TestBed.flushEffects();
    };
    const type = (term: string): void => {
      input.value = term;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    // Opened without a highlight, so no active row has to survive the filter.
    popover.show();
    settle();
    return { popover, listbox, key, settle, type };
  }

  it('runs a second ArrowDown after the deferred first one, on the filtered rows', () => {
    const { popover, listbox, key, settle, type } = setup();
    expect(popover.isVisible()).toBe(true);
    type('gr');
    key('ArrowDown');
    key('ArrowDown');
    settle();
    expect(listbox.ad.activeValue()).toBe('grey');
  });

  it('runs an Enter after the deferred ArrowDown, on the filtered row it highlighted', () => {
    const { listbox, key, settle, type } = setup();
    type('gr');
    key('ArrowDown');
    key('Enter');
    settle();
    expect(listbox.ad.activeValue()).toBe('green');
    expect(listbox.value()).toBe('green');
  });

  it('drops the deferred key when Escape closes the panel inside the window', () => {
    const { popover, listbox, key, settle, type } = setup();
    type('gr');
    key('ArrowDown');
    key('Escape');
    settle();
    expect(popover.isVisible()).toBe(false);
    expect(listbox.ad.activeValue()).toBeNull();
  });
});

// Stands in for a co-hosted cngxButton: publishes its disabled state the way
// the button family does, without pulling @cngx/common/button into this lib.
const stateDisabled = signal(false);

@Directive({
  selector: '[probeHostState]',
  providers: [{ provide: CNGX_HOST_INTERACTION_STATE, useValue: { disabled: stateDisabled } }],
})
class ProbeHostState {}

@Component({
  template: `
    <button type="button" id="stated" probeHostState [cngxListboxTrigger]="lb" [popover]="pop">A</button>
    <button type="button" id="native" disabled [cngxListboxTrigger]="lb" [popover]="pop">B</button>
    <button type="button" id="aria" aria-disabled="true" [cngxListboxTrigger]="lb" [popover]="pop">C</button>
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" tabindex="0" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxPopover, ProbeHostState],
})
class BlockedTriggerHost {}

describe('CngxListboxTrigger on a blocked host', () => {
  beforeEach(() => {
    polyfillPopover();
    stateDisabled.set(false);
    TestBed.configureTestingModule({ imports: [BlockedTriggerHost] });
  });

  afterEach(() => {
    stateDisabled.set(false);
  });

  function setup() {
    const fixture = TestBed.createComponent(BlockedTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = (id: string) => fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    return { el, popover };
  }

  const OPEN_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

  for (const id of ['native', 'aria']) {
    it(`${id}: no opening key opens the listbox`, () => {
      const { el, popover } = setup();
      for (const key of OPEN_KEYS) {
        el(id).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(false);
      }
    });
  }

  it('interaction state disabled: no opening key opens the listbox, enabled again opens', () => {
    const { el, popover } = setup();
    stateDisabled.set(true);
    TestBed.flushEffects();
    for (const key of OPEN_KEYS) {
      el('stated').dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
    }
    stateDisabled.set(false);
    TestBed.flushEffects();
    el('stated').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
  });

  it('closes an open listbox when the host becomes disabled', () => {
    const { el, popover } = setup();
    el('stated').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);

    stateDisabled.set(true);
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });
});

// ── Review 2 (commit 6) verify-first: editable-combobox Enter, Alt open/close,
// and aria-activedescendant clearing. Red cases flip in a later phase. ────────
@Component({
  template: `
    <form (submit)="submitted.set(true)">
      <input
        type="text"
        [cngxListboxTrigger]="lb"
        cngxListboxSearch
        [popover]="pop"
        #inputTrigger="cngxListboxTrigger"
      />
    </form>
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" tabindex="0" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
        <div cngxOption value="blue">Blue</div>
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxListboxSearch, CngxPopover],
})
class InputComboHost {
  readonly submitted = signal(false);
}

describe('CngxListboxTrigger - review 2 editable combobox and Alt shortcuts', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [TriggerHost, InputComboHost] });
  });

  function setupButton(): { triggerEl: HTMLElement; popover: CngxPopover; ad: CngxActiveDescendant } {
    const fixture = TestBed.createComponent(TriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEntry = fixture.debugElement.query(By.directive(CngxListboxTrigger));
    const popoverEntry = fixture.debugElement.query(By.directive(CngxPopover));
    const listboxEntry = fixture.debugElement.query(By.directive(CngxListbox));
    return {
      triggerEl: triggerEntry.nativeElement as HTMLElement,
      popover: popoverEntry.injector.get(CngxPopover),
      ad: listboxEntry.injector.get(CngxActiveDescendant),
    };
  }

  // A closed editable combobox inside a form must leave Enter to the form so
  // the native submit still runs; opening belongs to Alt+ArrowDown.
  it('Enter on a closed editable combobox does not preventDefault', () => {
    const fixture = TestBed.createComponent(InputComboHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(enter);
    TestBed.flushEffects();
    expect(enter.defaultPrevented).toBe(false);
  });

  // ARIA combobox: Alt+ArrowDown opens the popup without moving the highlight.
  it('Alt+ArrowDown opens the panel without moving the highlight', () => {
    const { triggerEl, popover, ad } = setupButton();
    triggerEl.focus();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, altKey: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(ad.activeItem()).toBeNull();
  });

  // ARIA combobox: Alt+ArrowUp closes an open popup.
  it('Alt+ArrowUp closes an open panel', () => {
    const { triggerEl, popover } = setupButton();
    popover.show();
    TestBed.flushEffects();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true, altKey: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });

  // I10 (verify first): closing clears aria-activedescendant.
  it('clears aria-activedescendant when the panel closes', () => {
    const { triggerEl, popover } = setupButton();
    triggerEl.focus();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(triggerEl.getAttribute('aria-activedescendant')).toBeTruthy();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
    expect(triggerEl.hasAttribute('aria-activedescendant')).toBe(false);
  });
});

@Component({
  template: `
    <input
      role="combobox"
      cngxListboxSearch
      #search="cngxListboxSearch"
      [debounceMs]="300"
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
class DebouncedSearchInputHost {}

// Dispatches without a tick, so a key can land before the next render.
function keydownRaw(target: HTMLElement, key: string): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('CngxListboxTrigger - settles a pending search term before listbox keys', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [DebouncedSearchInputHost] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(DebouncedSearchInputHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxListboxTrigger));
    const input = de.nativeElement as HTMLInputElement;
    const search = fixture.debugElement
      .query(By.directive(CngxListboxSearch))
      .injector.get(CngxListboxSearch);
    const type = (value: string): void => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const press = (key: string): void => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
      TestBed.flushEffects();
    };
    return { fixture, input, search, type, press };
  }

  it('flushes the pending term on an ArrowDown inside the debounce window', () => {
    const { type, press, search } = setup();
    press('ArrowDown');
    type('gr');
    expect(search.term()).toBe('');
    press('ArrowDown');
    expect(search.term()).toBe('gr');
  });

  it('runs no deferred key into a panel closed inside the debounce window', () => {
    const { fixture, input, type, press } = setup();
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    const listbox = fixture.debugElement.query(By.directive(CngxListbox)).injector.get(CngxListbox);
    press('ArrowDown');
    type('gr');
    // Both keys land before the next render.
    keydownRaw(input, 'ArrowDown');
    keydownRaw(input, 'Escape');
    TestBed.tick();

    expect(popover.isVisible()).toBe(false);
    expect(listbox.ad.activeIndex()).toBe(-1);
  });

  it('flushes the pending term on blur', () => {
    const { input, type, search } = setup();
    type('gr');
    expect(search.term()).toBe('');
    input.dispatchEvent(new FocusEvent('blur'));
    expect(search.term()).toBe('gr');
  });
});

const hostBuffer = signal('');

@Component({
  template: `
    <button type="button" id="bound" [cngxListboxTrigger]="lb" [popover]="pop" [typeaheadBuffer]="buffer">
      A
    </button>
    <button type="button" id="unbound" [cngxListboxTrigger]="lb" [popover]="pop">B</button>
    <div cngxPopover #pop="cngxPopover">
      <div cngxListbox [label]="'Colors'" tabindex="0" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
      </div>
    </div>
  `,
  imports: [CngxListbox, CngxOption, CngxListboxTrigger, CngxPopover],
})
class TypeaheadBufferHost {
  readonly buffer = hostBuffer;
}

describe('CngxListboxTrigger - a host typeahead buffer on a closed panel', () => {
  beforeEach(() => {
    polyfillPopover();
    hostBuffer.set('');
    TestBed.configureTestingModule({ imports: [TypeaheadBufferHost] });
  });

  function setup() {
    const fixture = TestBed.createComponent(TypeaheadBufferHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const root = fixture.nativeElement as HTMLElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    const space = (id: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      root.querySelector<HTMLElement>(`#${id}`)!.dispatchEvent(event);
      return event;
    };
    return { popover, space };
  }

  it('leaves a closed Space to the host while its buffer holds a term', () => {
    const { popover, space } = setup();
    // Written and read without a change detection pass in between.
    hostBuffer.set('new');
    const event = space('bound');
    expect(event.defaultPrevented).toBe(false);
    expect(popover.isVisible()).toBe(false);
  });

  it('opens on a closed Space while the bound buffer is empty', () => {
    const { popover, space } = setup();
    expect(space('bound').defaultPrevented).toBe(true);
    expect(popover.isVisible()).toBe(true);
  });

  it('opens on a closed Space when no buffer is bound', () => {
    const { popover, space } = setup();
    hostBuffer.set('new');
    expect(space('unbound').defaultPrevented).toBe(true);
    expect(popover.isVisible()).toBe(true);
  });
});

describe('CngxListboxTrigger - reset on a popover close event', () => {
  function createController(withClosed: boolean) {
    const open = signal(false);
    const listeners = new Set<() => void>();
    const closed = {
      subscribe: (cb: () => void) => {
        listeners.add(cb);
        return { unsubscribe: () => listeners.delete(cb) };
      },
    };
    return {
      controller: {
        isVisible: () => open(),
        show: () => open.set(true),
        hide: () => open.set(false),
        ...(withClosed ? { closed } : {}),
      },
      // A close the trigger did not start (an outside click, a light dismiss).
      closeFromOutside(): void {
        open.set(false);
        listeners.forEach((cb) => cb());
      },
      listenerCount: () => listeners.size,
    };
  }

  @Component({
    template: `
      <button type="button" [cngxListboxTrigger]="lb" [popover]="ctrl">Select</button>
      <div cngxListbox [label]="'Colors'" tabindex="0" #lb="cngxListbox">
        <div cngxOption value="red">Red</div>
        <div cngxOption value="green">Green</div>
      </div>
    `,
    imports: [CngxListbox, CngxOption, CngxListboxTrigger],
  })
  class MockControllerHost {
    ctrl: ReturnType<typeof createController>['controller'] = createController(false).controller;
  }

  function setup(mock: ReturnType<typeof createController>) {
    TestBed.configureTestingModule({ imports: [MockControllerHost] });
    const fixture = TestBed.createComponent(MockControllerHost);
    fixture.componentInstance.ctrl = mock.controller;
    fixture.detectChanges();
    TestBed.flushEffects();
    const listboxEntry = fixture.debugElement.query(By.directive(CngxListbox));
    const triggerEl = fixture.debugElement.query(By.directive(CngxListboxTrigger))
      .nativeElement as HTMLElement;
    return { fixture, triggerEl, ad: listboxEntry.injector.get(CngxActiveDescendant) };
  }

  it('resets the highlight on a close the trigger did not start', () => {
    const mock = createController(true);
    const { triggerEl, ad } = setup(mock);
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(ad.activeValue()).toBe('red');

    mock.closeFromOutside();
    expect(ad.activeIndex()).toBe(-1);
  });

  it('unsubscribes from the close event when the trigger is destroyed', () => {
    const mock = createController(true);
    const { fixture } = setup(mock);
    expect(mock.listenerCount()).toBe(1);
    fixture.destroy();
    expect(mock.listenerCount()).toBe(0);
  });

  it('keeps the highlight of a controller without a close event, as before', () => {
    const mock = createController(false);
    const { triggerEl, ad } = setup(mock);
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(ad.activeValue()).toBe('red');

    mock.closeFromOutside();
    expect(ad.activeValue()).toBe('red');
  });
});
