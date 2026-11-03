import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideDirection } from '@cngx/core';

import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import { CNGX_HOST_INTERACTION_STATE } from '../async-click/host-interaction-state.token';

import {
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  type CngxMenuDismissHandler,
} from './dismiss-handler';
import {
  CNGX_MENU_FOCUS_STACK_FACTORY,
  createMenuFocusStack,
  type CngxMenuFocusStack,
} from './menu-focus-stack';
import { provideMenuConfig } from './menu-config';
import {
  withDismissOnBlur,
  withDismissOnFocusOut,
  withDismissOnOutsideClick,
  withDismissOnScroll,
} from './menu-config-features';
import { CngxMenuTrigger } from './menu-trigger.directive';
import { CngxMenuItem } from './menu-item.directive';
import { CngxMenuItemSubmenu } from './menu-item-submenu.directive';
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
      [cngxPopoverTrigger]="pop"
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
  imports: [CngxMenu, CngxMenuItem, CngxMenuTrigger, CngxPopover, CngxPopoverTrigger],
})
class TriggerHost {}

@Component({
  template: `
    <button type="button" [cngxMenuTrigger]="menu" [popover]="pop">Actions</button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Actions'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="cut">Cut</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuTrigger, CngxPopover],
})
class BareTriggerHost {}

/** Lets the open-time focus microtask (and a close-time restore) run. */
async function settle(): Promise<void> {
  TestBed.flushEffects();
  await Promise.resolve();
  await Promise.resolve();
}

function press(el: Element | null, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  el?.dispatchEvent(event);
  return event;
}

describe('CngxMenuTrigger', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [TriggerHost] });
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cngx-menu-announcer')
      .forEach((el) => el.remove());
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

  it('aria-controls names the role=menu element, not the popover wrapper', () => {
    const { triggerEl, menu, popover } = setup();
    const menuEl = document.querySelector('[role="menu"]');
    expect(menuEl?.id).toBe(menu.id());
    expect(triggerEl.getAttribute('aria-controls')).toBe(menu.id());
    expect(triggerEl.getAttribute('aria-controls')).not.toBe(popover.id());
  });

  it.each(['ArrowDown', 'Enter'])('%s moves focus to the menu after open', async (key) => {
    const { triggerEl, menu, popover } = setup();
    triggerEl.focus();
    press(triggerEl, key);
    await settle();
    expect(popover.isVisible()).toBe(true);
    const menuEl = document.activeElement as HTMLElement;
    expect(menuEl.getAttribute('role')).toBe('menu');
    expect(menuEl.getAttribute('aria-activedescendant')).toBe(menu.ad.activeId());
    expect(menu.ad.activeValue()).toBe('cut');
  });

  it('a pointer open also moves focus to the menu, with no highlight', async () => {
    const { triggerEl, menu, popover } = setup();
    triggerEl.focus();
    popover.show();
    await settle();
    expect(document.activeElement?.getAttribute('role')).toBe('menu');
    expect(menu.ad.activeValue()).toBeNull();
  });

  it('ArrowDown on the focused menu moves the highlight through the menu', async () => {
    const { triggerEl, menu } = setup();
    triggerEl.focus();
    press(triggerEl, 'ArrowDown');
    await settle();
    press(document.activeElement, 'ArrowDown');
    TestBed.flushEffects();
    expect(menu.ad.activeValue()).toBe('copy');
    expect(document.activeElement?.getAttribute('aria-activedescendant')).toBe(menu.ad.activeId());
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

  it('a click on a leaf item activates it and closes the menu', () => {
    const { fixture, menu, popover } = setup();
    const picked: unknown[] = [];
    menu.itemActivated.subscribe((v) => picked.push(v));
    popover.show();
    TestBed.flushEffects();
    const items = fixture.debugElement
      .queryAll(By.directive(CngxMenuItem))
      .map((d) => d.nativeElement as HTMLElement);
    items[1].click();
    TestBed.flushEffects();
    expect(picked).toEqual(['copy']);
    expect(popover.isVisible()).toBe(false);
  });

  it('Enter on a leaf closes the menu once and activates once', () => {
    const { triggerEl, menu, popover } = setup();
    const picked: unknown[] = [];
    menu.itemActivated.subscribe((v) => picked.push(v));
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    TestBed.flushEffects();
    expect(picked).toEqual(['cut']);
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

  it('Enter on the focused menu activates the highlighted item, closes and restores focus', async () => {
    const { triggerEl, menu, popover } = setup();
    const picked: unknown[] = [];
    menu.itemActivated.subscribe((v) => picked.push(v));
    triggerEl.focus();
    press(triggerEl, 'ArrowDown');
    await settle();
    press(document.activeElement, 'Enter');
    await settle();
    expect(picked).toEqual(['cut']);
    expect(popover.isVisible()).toBe(false);
    expect(document.activeElement).toBe(triggerEl);
  });

  it('Escape on the focused menu closes and restores focus to the trigger', async () => {
    const { triggerEl, popover } = setup();
    triggerEl.focus();
    press(triggerEl, 'ArrowDown');
    await settle();
    expect(document.activeElement?.getAttribute('role')).toBe('menu');
    press(document.activeElement, 'Escape');
    await settle();
    expect(popover.isVisible()).toBe(false);
    expect(document.activeElement).toBe(triggerEl);
  });

  it('Ctrl/Cmd/Alt+ArrowDown on a closed trigger neither opens nor swallows the event', () => {
    const { triggerEl, popover } = setup();
    for (const modifier of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true, ...modifier });
      const prevented = !triggerEl.dispatchEvent(event);
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
      expect(prevented).toBe(false);
    }
  });

  it('Ctrl+ArrowDown on an open menu neither navigates nor swallows the event', () => {
    const { triggerEl, menu, popover } = setup();
    popover.show();
    TestBed.flushEffects();
    menu.ad.highlightByValue('cut');
    TestBed.flushEffects();

    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true, ctrlKey: true });
    const prevented = !triggerEl.dispatchEvent(event);
    TestBed.flushEffects();

    expect(menu.ad.activeValue()).toBe('cut');
    expect(prevented).toBe(false);
  });

  it('keyboard-opening then Escape restores focus to the trigger', async () => {
    const { triggerEl, popover } = setup();
    triggerEl.focus();
    expect(document.activeElement).toBe(triggerEl);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await settle();
    expect(popover.isVisible()).toBe(true);
    expect(document.activeElement).not.toBe(triggerEl);

    (document.activeElement as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle();
    expect(popover.isVisible()).toBe(false);
    expect(document.activeElement).toBe(triggerEl);
  });

  describe('dismiss handler wiring', () => {
    function setupWithFactory(features: Parameters<typeof provideMenuConfig>): {
      attach: ReturnType<typeof vi.fn>;
      teardown: ReturnType<typeof vi.fn>;
      lastOpts: unknown;
      fixture: ReturnType<typeof TestBed.createComponent<TriggerHost>>;
      triggerEl: HTMLElement;
      popover: CngxPopover;
    } {
      const teardown = vi.fn();
      const attach = vi.fn(() => teardown);
      let lastOpts: unknown = null;
      const handler: CngxMenuDismissHandler = { attach };
      const factory = vi.fn((opts: unknown) => {
        lastOpts = opts;
        return handler;
      });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TriggerHost],
        providers: [
          provideMenuConfig(...features),
          { provide: CNGX_MENU_DISMISS_HANDLER_FACTORY, useValue: factory },
        ],
      });
      const fixture = TestBed.createComponent(TriggerHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const trigger = fixture.debugElement.query(By.directive(CngxMenuTrigger));
      const popDe = fixture.debugElement.query(By.directive(CngxPopover));
      return {
        attach,
        teardown,
        get lastOpts() {
          return lastOpts;
        },
        fixture,
        triggerEl: trigger.nativeElement as HTMLElement,
        popover: popDe.injector.get(CngxPopover),
      };
    }

    it('factory called once per open with the resolved config', () => {
      const ctx = setupWithFactory([
        withDismissOnOutsideClick(true),
        withDismissOnScroll(true),
        withDismissOnBlur(false),
      ]);
      ctx.popover.show();
      TestBed.flushEffects();
      expect(ctx.attach).toHaveBeenCalledTimes(1);
      expect(ctx.lastOpts).toMatchObject({
        dismissOnOutsideClick: true,
        dismissOnScroll: true,
        dismissOnBlur: false,
      });
    });

    it('teardown invoked on close', () => {
      const ctx = setupWithFactory([withDismissOnOutsideClick(true)]);
      ctx.popover.show();
      TestBed.flushEffects();
      ctx.popover.hide();
      TestBed.flushEffects();
      expect(ctx.teardown).toHaveBeenCalledTimes(1);
    });

    it('teardown invoked on directive destroy mid-open', () => {
      const ctx = setupWithFactory([withDismissOnOutsideClick(true)]);
      ctx.popover.show();
      TestBed.flushEffects();
      ctx.fixture.destroy();
      expect(ctx.teardown).toHaveBeenCalledTimes(1);
    });

    it('opens with all three booleans false still attaches (factory decides)', () => {
      const ctx = setupWithFactory([
        withDismissOnOutsideClick(false),
        withDismissOnScroll(false),
        withDismissOnBlur(false),
      ]);
      ctx.popover.show();
      TestBed.flushEffects();
      expect(ctx.attach).toHaveBeenCalledTimes(1);
      expect(ctx.lastOpts).toMatchObject({
        dismissOnOutsideClick: false,
        dismissOnScroll: false,
        dismissOnBlur: false,
      });
    });
  });

  describe('default dismissal behaviour (Phase B defaults)', () => {
    it('pointerdown outside dismisses the open menu', () => {
      const { triggerEl, popover } = setup();
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      try {
        triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(true);

        probe.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(false);
      } finally {
        probe.remove();
      }
    });

    it('window blur dismisses the open menu', () => {
      const { triggerEl, popover } = setup();
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(true);

      window.dispatchEvent(new Event('blur'));
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
    });
  });

  describe('focus-out dismissal', () => {
    function outsideButton(): HTMLButtonElement {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = 'Next';
      document.body.appendChild(el);
      return el;
    }

    function getTrigger(
      fixture: ReturnType<typeof TestBed.createComponent<TriggerHost>>,
    ): CngxMenuTrigger {
      return fixture.debugElement.query(By.directive(CngxMenuTrigger)).injector.get(CngxMenuTrigger);
    }

    it('Tab out of the menu closes it without pulling focus back', async () => {
      const { fixture, triggerEl, popover } = setup();
      const next = outsideButton();
      try {
        triggerEl.focus();
        press(triggerEl, 'ArrowDown');
        await settle();
        press(document.activeElement, 'Tab');
        next.focus();
        await settle();
        fixture.detectChanges();
        expect(popover.isVisible()).toBe(false);
        expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(next);
        expect(getTrigger(fixture).lastDismissSource()).toBe('focus-out');
      } finally {
        next.remove();
      }
    });

    it('Shift+Tab out of the menu onto the trigger closes it', async () => {
      const { fixture, triggerEl, popover } = setup();
      triggerEl.focus();
      press(triggerEl, 'ArrowDown');
      await settle();
      press(document.activeElement, 'Tab', { shiftKey: true });
      triggerEl.focus();
      await settle();
      fixture.detectChanges();
      expect(popover.isVisible()).toBe(false);
      expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(triggerEl);
    });

    it('focusing an element outside closes without restoring focus', async () => {
      const { triggerEl, popover } = setup();
      const next = outsideButton();
      try {
        triggerEl.focus();
        press(triggerEl, 'ArrowDown');
        await settle();
        next.focus();
        await settle();
        expect(popover.isVisible()).toBe(false);
        expect(document.activeElement).toBe(next);
      } finally {
        next.remove();
      }
    });

    it('withDismissOnFocusOut(false) keeps the menu open', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TriggerHost],
        providers: [provideMenuConfig(withDismissOnFocusOut(false))],
      });
      const { triggerEl, popover } = setup();
      const next = outsideButton();
      try {
        triggerEl.focus();
        press(triggerEl, 'ArrowDown');
        await settle();
        next.focus();
        await settle();
        expect(popover.isVisible()).toBe(true);
      } finally {
        next.remove();
      }
    });
  });

  describe('lastDismissSource', () => {
    function getTrigger(
      fixture: ReturnType<typeof TestBed.createComponent<TriggerHost>>,
    ): CngxMenuTrigger {
      return fixture.debugElement.query(By.directive(CngxMenuTrigger)).injector.get(CngxMenuTrigger);
    }

    it('records pointerdown outside as outside-click', () => {
      const { fixture, triggerEl, popover } = setup();
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      try {
        triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        TestBed.flushEffects();
        probe.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(false);
        expect(getTrigger(fixture).lastDismissSource()).toBe('outside-click');
      } finally {
        probe.remove();
      }
    });

    it('records keyboard Escape as escape', () => {
      const { fixture, triggerEl } = setup();
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      TestBed.flushEffects();
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      TestBed.flushEffects();
      expect(getTrigger(fixture).lastDismissSource()).toBe('escape');
    });
  });
});

describe('CngxMenuTrigger submenu arrows under dir', () => {
  // Spy the REAL focus stack (via the factory token) so every directive path
  // the effect touches still works, while we assert the physical->logical
  // routing at the trigger dispatch: under `rtl` a physical ArrowLeft must
  // reach handleArrowRight (open), ArrowRight must reach handleArrowLeft (pop).
  function configure(dir: 'ltr' | 'rtl') {
    polyfillPopover();
    let stack: CngxMenuFocusStack | undefined;
    TestBed.configureTestingModule({
      imports: [TriggerHost],
      providers: [
        provideDirection(dir),
        {
          provide: CNGX_MENU_FOCUS_STACK_FACTORY,
          useValue: (deps: Parameters<typeof createMenuFocusStack>[0]) => {
            const real = createMenuFocusStack(deps);
            vi.spyOn(real, 'handleArrowRight');
            vi.spyOn(real, 'handleArrowLeft');
            stack = real;
            return real;
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(TriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLElement;
    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    popover.show();
    TestBed.flushEffects();
    return { triggerEl, stack: stack as CngxMenuFocusStack };
  }

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('ltr: physical ArrowRight opens the submenu, physical ArrowLeft pops it', () => {
    const { triggerEl, stack } = configure('ltr');
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(stack.handleArrowRight).toHaveBeenCalledOnce();
    expect(stack.handleArrowLeft).not.toHaveBeenCalled();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(stack.handleArrowLeft).toHaveBeenCalledOnce();
  });

  it('rtl: physical ArrowLeft opens the submenu, physical ArrowRight pops it', () => {
    const { triggerEl, stack } = configure('rtl');
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(stack.handleArrowRight).toHaveBeenCalledOnce();
    expect(stack.handleArrowLeft).not.toHaveBeenCalled();
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(stack.handleArrowLeft).toHaveBeenCalledOnce();
  });
});

describe('CngxMenuTrigger focus settle per open cycle', () => {
  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('does not settle focus at mount and settles exactly once per real close', () => {
    polyfillPopover();
    let stack: CngxMenuFocusStack | undefined;
    TestBed.configureTestingModule({
      imports: [TriggerHost],
      providers: [
        {
          provide: CNGX_MENU_FOCUS_STACK_FACTORY,
          useValue: (deps: Parameters<typeof createMenuFocusStack>[0]) => {
            const real = createMenuFocusStack(deps);
            vi.spyOn(real, 'settleFocus');
            stack = real;
            return real;
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(TriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const settleFocus = (stack as CngxMenuFocusStack).settleFocus;
    expect(settleFocus).not.toHaveBeenCalled();

    const popover = fixture.debugElement
      .query(By.directive(CngxPopover))
      .injector.get(CngxPopover);
    popover.show();
    TestBed.flushEffects();
    expect(settleFocus).not.toHaveBeenCalled();
    popover.hide();
    TestBed.flushEffects();
    expect(settleFocus).toHaveBeenCalledOnce();

    popover.show();
    TestBed.flushEffects();
    popover.hide();
    TestBed.flushEffects();
    expect(settleFocus).toHaveBeenCalledTimes(2);
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
    <button
      type="button"
      id="stated"
      probeHostState
      [cngxMenuTrigger]="menu"
      [popover]="pop"
      [cngxPopoverTrigger]="pop"
    >
      A
    </button>
    <button
      type="button"
      id="native"
      disabled
      [cngxMenuTrigger]="menu"
      [popover]="pop"
      [cngxPopoverTrigger]="pop"
    >
      B
    </button>
    <button
      type="button"
      id="aria"
      aria-disabled="true"
      [cngxMenuTrigger]="menu"
      [popover]="pop"
      [cngxPopoverTrigger]="pop"
    >
      C
    </button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Actions'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="cut">Cut</li>
        <li cngxMenuItem value="copy">Copy</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuTrigger, CngxPopover, CngxPopoverTrigger, ProbeHostState],
})
class BlockedTriggerHost {}

describe('CngxMenuTrigger on a blocked host', () => {
  beforeEach(() => {
    polyfillPopover();
    stateDisabled.set(false);
    TestBed.configureTestingModule({ imports: [BlockedTriggerHost] });
  });

  afterEach(() => {
    stateDisabled.set(false);
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  function setup() {
    const fixture = TestBed.createComponent(BlockedTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const el = (id: string) =>
      fixture.debugElement.query(By.css(`#${id}`)).nativeElement as HTMLElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    return { el, popover };
  }

  const OPEN_KEYS = ['ArrowDown', 'ArrowUp', 'Enter', ' '];

  for (const id of ['native', 'aria']) {
    it(`${id}: no opening key opens the menu`, () => {
      const { el, popover } = setup();
      for (const key of OPEN_KEYS) {
        el(id).dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
        );
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(false);
      }
    });
  }

  it('interaction state disabled: no opening key opens the menu, enabled again opens', () => {
    const { el, popover } = setup();
    stateDisabled.set(true);
    TestBed.flushEffects();
    for (const key of OPEN_KEYS) {
      el('stated').dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
    }
    stateDisabled.set(false);
    TestBed.flushEffects();
    el('stated').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
  });

  it('closes an open menu when the host becomes disabled and keeps focus on the trigger', async () => {
    const { el, popover } = setup();
    const trigger = el('stated');
    trigger.focus();
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);

    stateDisabled.set(true);
    TestBed.flushEffects();
    await Promise.resolve();
    expect(popover.isVisible()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });
});

@Component({
  template: `
    <button
      type="button"
      [attr.aria-disabled]="disabled() ? 'true' : null"
      [cngxMenuTrigger]="menu"
      [popover]="pop"
      [cngxPopoverTrigger]="pop"
      (click)="disabled() || pop.toggle()"
    >
      A
    </button>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Actions'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="cut">Cut</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuTrigger, CngxPopover, CngxPopoverTrigger],
})
class GuardedClickHost {
  readonly disabled = signal(true);
}

describe('CngxMenuTrigger on a plain aria-disabled button with a click toggle', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [GuardedClickHost] });
  });

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  // Enter / Space on a <button> also fire a native click. The trigger leaves
  // that activation alone (keyboard and mouse stay symmetric), so the
  // consumer's click toggle carries the guard.
  it('stays closed on Enter followed by the native click when the toggle checks the blocked state', () => {
    const fixture = TestBed.createComponent(GuardedClickHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const button = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLButtonElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);

    const keydown = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    button.dispatchEvent(keydown);
    button.click();
    TestBed.flushEffects();
    expect(keydown.defaultPrevented).toBe(false);
    expect(popover.isVisible()).toBe(false);

    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    button.click();
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
  });
});

describe('CngxMenuTrigger without a co-hosted popover trigger', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [BareTriggerHost] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('writes no aria-expanded / aria-haspopup and warns CNGX1074 once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(BareTriggerHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const triggerEl = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLElement;
    expect(triggerEl.hasAttribute('aria-expanded')).toBe(false);
    expect(triggerEl.hasAttribute('aria-haspopup')).toBe(false);
    const coded = warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1074'));
    expect(coded).toHaveLength(1);
    expect(coded[0][0]).toMatch(/^CNGX1074: \[cngxMenuTrigger\] has no aria-expanded writer\./);
    expect(coded[0]).toContain(triggerEl);
  });

  it('stays silent with a co-hosted popover trigger', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [TriggerHost] });
    const fixture = TestBed.createComponent(TriggerHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1074'))).toHaveLength(0);
  });
});

@Component({
  template: `
    <button type="button" [cngxMenuTrigger]="outer" [popover]="outerPop" [cngxPopoverTrigger]="outerPop">
      Actions
    </button>
    <div cngxPopover #outerPop="cngxPopover">
      <ul cngxMenu [label]="'Outer'" tabindex="0" #outer="cngxMenu">
        <li cngxMenuItem value="cut">Cut</li>
        <li cngxMenuItem [cngxMenuItemSubmenu]="innerPop" [submenuMenu]="inner" value="recent">
          Open Recent
        </li>
        <li cngxMenuItem value="paste">Paste</li>
      </ul>
    </div>
    <div cngxPopover #innerPop="cngxPopover" [exclusive]="false">
      <ul cngxMenu [label]="'Recent'" tabindex="0" #inner="cngxMenu">
        <li cngxMenuItem value="file1">file1.ts</li>
        <li cngxMenuItem value="file2">file2.ts</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxMenuItemSubmenu, CngxMenuTrigger, CngxPopover, CngxPopoverTrigger],
})
class SubmenuTriggerHost {}

describe('CngxMenuTrigger submenu keys on the focused menu', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [SubmenuTriggerHost] });
  });

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('routes ArrowRight / ArrowDown / ArrowLeft through the popover listener, root highlight unchanged', async () => {
    const fixture = TestBed.createComponent(SubmenuTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLElement;
    const [outer, inner] = fixture.debugElement
      .queryAll(By.directive(CngxMenu))
      .map((de) => de.injector.get(CngxMenu));
    const [, innerPop] = fixture.debugElement
      .queryAll(By.directive(CngxPopover))
      .map((de) => de.injector.get(CngxPopover));

    triggerEl.focus();
    press(triggerEl, 'ArrowDown');
    await settle();
    const rootMenuEl = document.activeElement as HTMLElement;
    expect(rootMenuEl.getAttribute('role')).toBe('menu');

    press(rootMenuEl, 'ArrowDown');
    TestBed.flushEffects();
    expect(outer.ad.activeValue()).toBe('recent');

    press(rootMenuEl, 'ArrowRight');
    TestBed.flushEffects();
    expect(innerPop.isVisible()).toBe(true);
    expect(inner.ad.activeValue()).toBe('file1');

    press(rootMenuEl, 'ArrowDown');
    TestBed.flushEffects();
    expect(inner.ad.activeValue()).toBe('file2');
    expect(outer.ad.activeValue()).toBe('recent');

    press(rootMenuEl, 'ArrowLeft');
    TestBed.flushEffects();
    expect(innerPop.isVisible()).toBe(false);
    expect(outer.ad.activeValue()).toBe('recent');
  });

  it('a consumer keydown on the root menu sees horizontal arrows with no submenu open, not nav keys while one is open', async () => {
    const fixture = TestBed.createComponent(SubmenuTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLElement;
    const [, inner] = fixture.debugElement
      .queryAll(By.directive(CngxMenu))
      .map((de) => de.injector.get(CngxMenu));
    const [, innerPop] = fixture.debugElement
      .queryAll(By.directive(CngxPopover))
      .map((de) => de.injector.get(CngxPopover));

    triggerEl.focus();
    press(triggerEl, 'ArrowDown');
    await settle();
    const rootMenuEl = document.activeElement as HTMLElement;
    const seen: string[] = [];
    rootMenuEl.addEventListener('keydown', (event) => seen.push(event.key));

    // Highlight sits on the leaf "cut": no submenu opens, nothing to stop.
    press(rootMenuEl, 'ArrowRight');
    press(rootMenuEl, 'ArrowLeft');
    TestBed.flushEffects();
    expect(innerPop.isVisible()).toBe(false);
    expect(seen).toEqual(['ArrowRight', 'ArrowLeft']);

    press(rootMenuEl, 'ArrowDown');
    press(rootMenuEl, 'ArrowRight');
    TestBed.flushEffects();
    expect(innerPop.isVisible()).toBe(true);
    seen.length = 0;

    press(rootMenuEl, 'ArrowDown');
    TestBed.flushEffects();
    expect(inner.ad.activeValue()).toBe('file2');
    expect(seen).toEqual([]);
  });

  it('focus moving into the open submenu popover does not close the menu', async () => {
    const fixture = TestBed.createComponent(SubmenuTriggerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxMenuTrigger))
      .nativeElement as HTMLElement;
    const [outerPop, innerPop] = fixture.debugElement
      .queryAll(By.directive(CngxPopover))
      .map((de) => de.injector.get(CngxPopover));
    triggerEl.focus();
    press(triggerEl, 'ArrowDown');
    await settle();
    const rootMenuEl = document.activeElement as HTMLElement;
    press(rootMenuEl, 'ArrowDown');
    press(rootMenuEl, 'ArrowRight');
    TestBed.flushEffects();
    expect(innerPop.isVisible()).toBe(true);

    (innerPop.elementRef.nativeElement.querySelector('[role="menu"]') as HTMLElement).focus();
    await settle();
    expect(outerPop.isVisible()).toBe(true);
  });
});
