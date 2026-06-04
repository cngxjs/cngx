import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from '@cngx/common/popover';

import {
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  type CngxMenuDismissHandler,
} from './dismiss-handler';
import { provideMenuConfig } from './menu-config';
import {
  withDismissOnBlur,
  withDismissOnOutsideClick,
  withDismissOnScroll,
} from './menu-config-features';
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

  it('keyboard-opening then Escape restores focus to the trigger', async () => {
    const { triggerEl, popover } = setup();
    const probe = document.createElement('button');
    probe.type = 'button';
    document.body.appendChild(probe);
    try {
      triggerEl.focus();
      expect(document.activeElement).toBe(triggerEl);

      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(true);

      probe.focus();
      expect(document.activeElement).toBe(probe);

      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      TestBed.flushEffects();
      await Promise.resolve();
      expect(popover.isVisible()).toBe(false);
      expect(document.activeElement).toBe(triggerEl);
    } finally {
      probe.remove();
    }
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
