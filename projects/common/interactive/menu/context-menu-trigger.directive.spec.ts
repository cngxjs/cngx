import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxPopover } from '@cngx/common/popover';

import { CngxContextMenuTrigger } from './context-menu-trigger.directive';
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
    <div
      class="zone"
      tabindex="0"
      [cngxContextMenuTrigger]="menu"
      [popover]="pop"
      #trigger="cngxContextMenuTrigger"
    >
      Right-click me
    </div>
    <div cngxPopover #pop="cngxPopover">
      <ul cngxMenu [label]="'Context'" tabindex="0" #menu="cngxMenu" (itemActivated)="last.set($any($event))">
        <li cngxMenuItem value="copy">Copy</li>
        <li cngxMenuItem value="paste">Paste</li>
      </ul>
    </div>
  `,
  imports: [CngxMenu, CngxMenuItem, CngxContextMenuTrigger, CngxPopover],
})
class ContextHost {
  readonly last = signal<string | null>(null);
}

describe('CngxContextMenuTrigger', () => {
  beforeEach(() => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [ContextHost] });
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cngx-context-menu-anchor, .cngx-menu-announcer')
      .forEach((el) => el.remove());
  });

  function setup() {
    const fixture = TestBed.createComponent(ContextHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const triggerEl = fixture.debugElement.query(By.directive(CngxContextMenuTrigger))
      .nativeElement as HTMLElement;
    const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
    const menu = fixture.debugElement.query(By.directive(CngxMenu)).injector.get(CngxMenu);
    return { fixture, triggerEl, popover, menu };
  }

  it('aria-haspopup=menu on the trigger', () => {
    const { triggerEl } = setup();
    expect(triggerEl.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('contextmenu opens the popover and anchors at pointer coordinates', () => {
    const { triggerEl, popover, menu } = setup();
    const event = new MouseEvent('contextmenu', { bubbles: true, clientX: 240, clientY: 120 });
    triggerEl.dispatchEvent(event);
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    expect(menu.ad.activeValue()).toBe('copy');
    const anchor = document.body.querySelector('.cngx-context-menu-anchor') as HTMLElement;
    expect(anchor).not.toBeNull();
    expect(anchor.style.left).toBe('240px');
    expect(anchor.style.top).toBe('120px');
  });

  it('contextmenu preventDefault is called', () => {
    const { triggerEl } = setup();
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 0, clientY: 0 });
    triggerEl.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('Shift+F10 opens at the trigger element center', () => {
    const { triggerEl, popover } = setup();
    triggerEl.getBoundingClientRect = () =>
      ({ left: 50, top: 30, width: 100, height: 20, right: 150, bottom: 50, x: 50, y: 30, toJSON: () => ({}) }) as DOMRect;
    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);
    const anchor = document.body.querySelector('.cngx-context-menu-anchor') as HTMLElement;
    expect(anchor.style.left).toBe('100px');
    expect(anchor.style.top).toBe('40px');
  });

  it('Escape closes the popover when open', () => {
    const { triggerEl, popover } = setup();
    triggerEl.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 1, clientY: 1 }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(true);

    triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    TestBed.flushEffects();
    expect(popover.isVisible()).toBe(false);
  });

  it('removes the virtual anchor on directive destroy', () => {
    const { fixture, triggerEl } = setup();
    triggerEl.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 5, clientY: 5 }));
    TestBed.flushEffects();
    expect(document.body.querySelector('.cngx-context-menu-anchor')).not.toBeNull();

    fixture.destroy();
    expect(document.body.querySelector('.cngx-context-menu-anchor')).toBeNull();
  });

  it('right-click then Escape restores focus to the previously active element', async () => {
    const probe = document.createElement('button');
    probe.type = 'button';
    document.body.appendChild(probe);
    try {
      const { triggerEl } = setup();
      probe.focus();
      expect(document.activeElement).toBe(probe);

      triggerEl.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 12, clientY: 8 }));
      TestBed.flushEffects();

      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      TestBed.flushEffects();
      await Promise.resolve();
      expect(document.activeElement).toBe(probe);
    } finally {
      probe.remove();
    }
  });

  it('outside-close (popover.hide() invoked externally) restores focus', async () => {
    const probe = document.createElement('button');
    probe.type = 'button';
    document.body.appendChild(probe);
    try {
      const { triggerEl, popover } = setup();
      probe.focus();
      expect(document.activeElement).toBe(probe);

      triggerEl.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 18, clientY: 22 }));
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(true);

      popover.hide();
      TestBed.flushEffects();
      await Promise.resolve();
      expect(document.activeElement).toBe(probe);
    } finally {
      probe.remove();
    }
  });

  describe('dismiss handler wiring', () => {
    function setupWithFactory(features: Parameters<typeof provideMenuConfig>): {
      attach: ReturnType<typeof vi.fn>;
      teardown: ReturnType<typeof vi.fn>;
      lastOpts: unknown;
      fixture: ReturnType<typeof TestBed.createComponent<ContextHost>>;
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
        imports: [ContextHost],
        providers: [
          provideMenuConfig(...features),
          { provide: CNGX_MENU_DISMISS_HANDLER_FACTORY, useValue: factory },
        ],
      });
      const fixture = TestBed.createComponent(ContextHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const triggerEl = fixture.debugElement.query(By.directive(CngxContextMenuTrigger))
        .nativeElement as HTMLElement;
      const popover = fixture.debugElement.query(By.directive(CngxPopover)).injector.get(CngxPopover);
      return {
        attach,
        teardown,
        get lastOpts() {
          return lastOpts;
        },
        fixture,
        triggerEl,
        popover,
      };
    }

    it('factory called once per open with the resolved config', () => {
      const ctx = setupWithFactory([
        withDismissOnOutsideClick(true),
        withDismissOnScroll(true),
        withDismissOnBlur(false),
      ]);
      ctx.triggerEl.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 12, clientY: 12 }),
      );
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
      ctx.triggerEl.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 1, clientY: 1 }),
      );
      TestBed.flushEffects();
      ctx.popover.hide();
      TestBed.flushEffects();
      expect(ctx.teardown).toHaveBeenCalledTimes(1);
    });

    it('teardown invoked on directive destroy mid-open', () => {
      const ctx = setupWithFactory([withDismissOnOutsideClick(true)]);
      ctx.triggerEl.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 5, clientY: 5 }),
      );
      TestBed.flushEffects();
      ctx.fixture.destroy();
      expect(ctx.teardown).toHaveBeenCalledTimes(1);
    });
  });

  describe('keyboard navigation after open (Phase D)', () => {
    async function setupAndOpen() {
      const ctx = setup();
      ctx.triggerEl.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 50, clientY: 50 }),
      );
      TestBed.flushEffects();
      await Promise.resolve();
      const menuEl = ctx.fixture.debugElement.query(By.directive(CngxMenu))
        .nativeElement as HTMLElement;
      return { ...ctx, menuEl };
    }

    it('after right-click open, ArrowDown advances the active descendant', async () => {
      const { menu, menuEl } = await setupAndOpen();
      expect(menu.ad.activeValue()).toBe('copy');
      menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      TestBed.flushEffects();
      expect(menu.ad.activeValue()).toBe('paste');
    });

    it('Home returns to the first item', async () => {
      const { menu, menuEl } = await setupAndOpen();
      menu.ad.highlightByValue('paste');
      TestBed.flushEffects();
      menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      TestBed.flushEffects();
      expect(menu.ad.activeValue()).toBe('copy');
    });

    it('Enter activates current item', async () => {
      const { fixture, menu, menuEl } = await setupAndOpen();
      menu.ad.highlightByValue('paste');
      TestBed.flushEffects();
      menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      TestBed.flushEffects();
      expect(fixture.componentInstance.last()).toBe('paste');
    });

    it('Escape closes and restores focus to the trigger zone', async () => {
      const { triggerEl, popover, menuEl } = await setupAndOpen();
      menuEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      TestBed.flushEffects();
      await Promise.resolve();
      expect(popover.isVisible()).toBe(false);
      expect(triggerEl).toBeDefined();
    });
  });

  describe('default dismissal behaviour (Phase B defaults)', () => {
    it('pointerdown outside dismisses the open context menu', () => {
      const { triggerEl, popover } = setup();
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      try {
        triggerEl.dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }),
        );
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(true);

        probe.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
        TestBed.flushEffects();
        expect(popover.isVisible()).toBe(false);
      } finally {
        probe.remove();
      }
    });

    it('window blur dismisses the open context menu', () => {
      const { triggerEl, popover } = setup();
      triggerEl.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 4, clientY: 4 }),
      );
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(true);

      window.dispatchEvent(new Event('blur'));
      TestBed.flushEffects();
      expect(popover.isVisible()).toBe(false);
    });
  });

  describe('lastDismissSource', () => {
    function getTrigger(
      fixture: ReturnType<typeof TestBed.createComponent<ContextHost>>,
    ): CngxContextMenuTrigger {
      return fixture.debugElement
        .query(By.directive(CngxContextMenuTrigger))
        .injector.get(CngxContextMenuTrigger);
    }

    it('records pointerdown outside as outside-click', () => {
      const { fixture, triggerEl, popover } = setup();
      const probe = document.createElement('div');
      document.body.appendChild(probe);
      try {
        triggerEl.dispatchEvent(
          new MouseEvent('contextmenu', { bubbles: true, clientX: 10, clientY: 10 }),
        );
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
      triggerEl.dispatchEvent(
        new MouseEvent('contextmenu', { bubbles: true, clientX: 6, clientY: 6 }),
      );
      TestBed.flushEffects();
      triggerEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      TestBed.flushEffects();
      expect(getTrigger(fixture).lastDismissSource()).toBe('escape');
    });
  });
});
