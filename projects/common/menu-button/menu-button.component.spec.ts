import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  CngxButton,
  CngxButtonEnd,
  CngxButtonGroup,
  provideButtonConfigAt,
  withButtonSize,
  withButtonTone,
  withButtonVariant,
} from '@cngx/common/button';
import { CngxAsyncClick, CngxMenu, CngxMenuItem, type AsyncAction } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverSheet } from '@cngx/common/popover';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { CngxMenuButton } from './menu-button.component';

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

const MENU = `
  <div cngxPopover #pop="cngxPopover">
    <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="pdf">PDF</li>
      <li cngxMenuItem value="csv">CSV</li>
      <li cngxMenuItem value="xlsx">Excel</li>
    </ul>
  </div>
`;

@Component({
  template: `
    <button
      cngxMenuButton="outline"
      [menu]="menu"
      [popover]="pop"
      [disabled]="disabled()"
      [disabledReason]="reason()"
    >
      Export
    </button>
    ${MENU}
  `,
  imports: [CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class BasicHost {
  readonly disabled = signal(false);
  readonly reason = signal<string | undefined>(undefined);
}

@Component({
  template: `
    <button cngxMenuButton [menu]="menu" [popover]="pop" [cngxAsyncClick]="action">Run</button>
    ${MENU}
  `,
  imports: [CngxMenuButton, CngxAsyncClick, CngxMenu, CngxMenuItem, CngxPopover],
})
class AsyncAfterHost {
  readonly action: AsyncAction = () => new Promise<void>(() => undefined);
}

@Component({
  template: `
    <button [cngxAsyncClick]="action" cngxMenuButton [menu]="menu" [popover]="pop">Run</button>
    ${MENU}
  `,
  imports: [CngxAsyncClick, CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class AsyncBeforeHost {
  readonly action: AsyncAction = () => new Promise<void>(() => undefined);
}

@Component({
  template: `
    <button cngxMenuButton [menu]="menu" [popover]="pop">Export</button>
    <div cngxPopover cngxPopoverSheet="sheet" #pop="cngxPopover">
      <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
  `,
  imports: [CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover, CngxPopoverSheet],
})
class SheetHost {}

@Component({
  template: `
    @if (shown()) {
      <button cngxMenuButton [menu]="menu" [popover]="active() === 'a' ? popA : popB">
        Export
      </button>
    }
    <div cngxPopover #popA="cngxPopover">
      <ul cngxMenu [label]="'Export format'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
      </ul>
    </div>
    <div cngxPopover #popB="cngxPopover"></div>
  `,
  imports: [CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class LifecycleHost {
  readonly shown = signal(true);
  readonly active = signal<'a' | 'b'>('a');
}

@Component({
  template: `
    <button cngxMenuButton [menu]="menu" [popover]="pop">
      Export <span cngxButtonEnd class="own-end">E</span>
    </button>
    ${MENU}
  `,
  imports: [CngxMenuButton, CngxButtonEnd, CngxMenu, CngxMenuItem, CngxPopover],
})
class EndSlotHost {}

@Component({
  selector: 'test-caret',
  template: `<span class="custom-caret">v</span>`,
})
class CustomCaret {}

@Component({
  template: `
    <button cngxMenuButton [menu]="menu" [popover]="pop">Export</button>
    ${MENU}
  `,
  imports: [CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
  providers: [{ provide: CNGX_BUTTON_CARET_ICON, useValue: CustomCaret }],
})
class CustomCaretHost {}

@Component({
  template: `
    <div cngxButtonGroup variant="ghost" size="sm" aria-label="Export">
      <button id="plain-grouped" cngxButton>A</button>
      <button id="menu-grouped" cngxMenuButton [menu]="menu" [popover]="pop">B</button>
    </div>
    <button id="plain" cngxButton>C</button>
    <button id="menu" cngxMenuButton [menu]="menu" [popover]="pop">D</button>
    <button id="plain-own" cngxButton="link" tone="danger" size="lg">E</button>
    <button
      id="menu-own"
      cngxMenuButton="link"
      tone="danger"
      size="lg"
      [menu]="menu"
      [popover]="pop"
    >
      F
    </button>
    ${MENU}
  `,
  imports: [CngxButton, CngxButtonGroup, CngxMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
  viewProviders: [
    provideButtonConfigAt(
      withButtonVariant('secondary'),
      withButtonTone('primary'),
      withButtonSize('xs'),
    ),
  ],
})
class AxisHost {}

function setup<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const flush = (): void => {
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  const button = fixture.nativeElement.querySelector('.cngx-menu-button') as HTMLButtonElement;
  const popDe = fixture.debugElement.query(By.directive(CngxPopover));
  const menuDe = fixture.debugElement.query(By.directive(CngxMenu));
  return {
    fixture,
    host: fixture.componentInstance,
    button,
    flush,
    popover: popDe.injector.get(CngxPopover),
    menu: menuDe?.injector.get(CngxMenu),
  };
}

function key(el: HTMLElement, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

describe('CngxMenuButton', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  describe('construction', () => {
    it('builds with both host directives and provides the interaction state', () => {
      const { button } = setup(BasicHost);
      expect(button.classList.contains('cngx-button')).toBe(true);
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
    });

    it.each([
      ['after', AsyncAfterHost],
      ['before', AsyncBeforeHost],
    ] as const)('builds with a co-hosted cngxAsyncClick written %s the selector', (_, type) => {
      const { button, flush } = setup(type as Type<unknown>);
      button.click();
      flush();
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('aria-haspopup hint', () => {
    it('reads menu in the anchored presentation without a [haspopup]', () => {
      const { button, popover } = setup(BasicHost);
      expect(popover.haspopup()).toBe('menu');
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
    });

    it('reads dialog when the popover lays out as a sheet', () => {
      const { button } = setup(SheetHost);
      expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('releases the hint on popover swap and on destroy', () => {
      const { fixture, host, flush } = setup(LifecycleHost);
      const pops = fixture.debugElement
        .queryAll(By.directive(CngxPopover))
        .map((de) => de.injector.get(CngxPopover));
      const [popA, popB] = pops;
      expect(popA.haspopup()).toBe('menu');
      expect(popB.haspopup()).toBeUndefined();

      host.active.set('b');
      flush();
      expect(popA.haspopup()).toBeUndefined();
      expect(popB.haspopup()).toBe('menu');

      host.shown.set(false);
      flush();
      expect(popB.haspopup()).toBeUndefined();
    });
  });

  describe('popover wiring', () => {
    it('anchors the popover and points aria-controls at it', () => {
      const { button, popover } = setup(BasicHost);
      expect(popover.anchorElement()).toBe(button);
      expect(button.getAttribute('aria-controls')).toBe(popover.id());
    });

    it('toggles the popover on click and mirrors it in aria-expanded and data-expanded', () => {
      const { button, popover, flush } = setup(BasicHost);
      expect(button.getAttribute('aria-expanded')).toBe('false');
      expect(button.getAttribute('data-expanded')).toBe('false');

      button.click();
      flush();
      expect(popover.isVisible()).toBe(true);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(button.getAttribute('data-expanded')).toBe('true');

      button.click();
      flush();
      expect(popover.isVisible()).toBe(false);
      expect(button.getAttribute('data-expanded')).toBe('false');
    });
  });

  describe('keyboard', () => {
    it('ArrowDown opens and highlights the first item', () => {
      const { button, popover, menu, flush } = setup(BasicHost);
      button.focus();
      key(button, 'ArrowDown');
      flush();
      expect(popover.isVisible()).toBe(true);
      expect(menu?.ad.activeValue()).toBe('pdf');
    });

    it('ArrowUp opens and highlights the last item', () => {
      const { button, popover, menu, flush } = setup(BasicHost);
      button.focus();
      key(button, 'ArrowUp');
      flush();
      expect(popover.isVisible()).toBe(true);
      expect(menu?.ad.activeValue()).toBe('xlsx');
    });

    it('Escape closes and focus stays on the button', () => {
      const { button, popover, flush } = setup(BasicHost);
      button.focus();
      key(button, 'ArrowDown');
      flush();
      key(button, 'Escape');
      flush();
      expect(popover.isVisible()).toBe(false);
      expect(document.activeElement).toBe(button);
    });
  });

  describe('disabled', () => {
    it('opens on neither click nor key and stays focusable', () => {
      const { button, host, popover, flush } = setup(BasicHost);
      host.disabled.set(true);
      flush();
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);

      button.click();
      flush();
      expect(popover.isVisible()).toBe(false);

      button.focus();
      for (const k of ['ArrowDown', 'ArrowUp', 'Enter', ' ']) {
        key(button, k);
        flush();
        expect(popover.isVisible()).toBe(false);
      }
      expect(document.activeElement).toBe(button);
    });

    it('closes an open menu when it becomes disabled', () => {
      const { button, host, popover, flush } = setup(BasicHost);
      button.click();
      flush();
      expect(popover.isVisible()).toBe(true);

      host.disabled.set(true);
      flush();
      expect(popover.isVisible()).toBe(false);
    });

    it('references the reason only while disabled', () => {
      const { button, host, flush } = setup(BasicHost);
      host.reason.set('No data to export');
      flush();
      expect(button.getAttribute('aria-describedby')).toBeNull();

      host.disabled.set(true);
      flush();
      const id = button.getAttribute('aria-describedby') ?? '';
      expect(id).not.toBe('');
      expect(document.getElementById(id)?.textContent).toBe('No data to export');
    });
  });

  describe('caret', () => {
    it('renders the default chevron in the end slot, hidden from assistive technology', () => {
      const { button } = setup(BasicHost);
      const caret = button.querySelector('.cngx-menu-button__caret');
      expect(caret).not.toBeNull();
      expect(caret?.getAttribute('aria-hidden')).toBe('true');
      expect(caret?.querySelector('svg')).not.toBeNull();
      expect(button.hasAttribute('data-end')).toBe(true);
    });

    it('gives way to projected cngxButtonEnd content', () => {
      const { button } = setup(EndSlotHost);
      expect(button.querySelector('.cngx-menu-button__caret')).toBeNull();
      expect(button.querySelector('.own-end')).not.toBeNull();
      expect(button.hasAttribute('data-end')).toBe(true);
    });

    it('renders the CNGX_BUTTON_CARET_ICON component instead of the chevron', () => {
      const { button } = setup(CustomCaretHost);
      const caret = button.querySelector('.cngx-menu-button__caret');
      expect(caret?.querySelector('.custom-caret')).not.toBeNull();
      expect(caret?.querySelector('svg')).toBeNull();
    });
  });

  describe('axes', () => {
    it('resolves variant, tone and size exactly like cngxButton', () => {
      const { fixture } = setup(AxisHost);
      const el = fixture.nativeElement as HTMLElement;
      const axes = (id: string) => {
        const b = el.querySelector(`#${id}`) as HTMLElement;
        return [b.dataset['variant'], b.dataset['tone'], b.dataset['size']];
      };
      expect(axes('menu-grouped')).toEqual(axes('plain-grouped'));
      expect(axes('menu-grouped')).toEqual(['ghost', 'primary', 'sm']);
      expect(axes('menu')).toEqual(axes('plain'));
      expect(axes('menu')).toEqual(['secondary', 'primary', 'xs']);
      expect(axes('menu-own')).toEqual(axes('plain-own'));
      expect(axes('menu-own')).toEqual(['link', 'danger', 'lg']);
    });

    it('defaults the native type to button', () => {
      const { button } = setup(BasicHost);
      expect(button.getAttribute('type')).toBe('button');
    });
  });
});
