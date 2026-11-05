import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CNGX_BUTTON_STATE, CngxButton, CngxButtonBrain } from '@cngx/common/button';
import {
  CNGX_HOST_INTERACTION_STATE,
  CngxAsyncClick,
  CngxMenu,
  CngxMenuItem,
  type AsyncAction,
} from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import {
  provideCngxI18n,
  withDocumentLanguage,
  withPartialPack,
  type CngxActiveLanguagePack,
} from '@cngx/core/i18n';
import { CNGX_LOADING_DEFAULTS } from '@cngx/core/utils';
import { CNGX_ICON_CHEVRON_DOWN } from '@cngx/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideButtonCaretIcon } from './caret-icon.token';
import { CngxIconMenuButton } from './icon-menu-button.component';
import { CngxSplitButton } from './split-button.directive';

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
    <ul cngxMenu [label]="'Row actions'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="edit">Edit</li>
      <li cngxMenuItem value="delete">Delete</li>
    </ul>
  </div>
`;

@Component({
  template: `
    <button
      cngxIconMenuButton
      aria-label="Row actions"
      [menu]="menu"
      [popover]="pop"
      [disabled]="disabled()"
    >
      <span class="kebab">&#8942;</span>
    </button>
    ${MENU}
  `,
  imports: [CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class KebabHost {
  readonly disabled = signal(false);
}

@Component({
  template: `
    <button cngxIconMenuButton [menu]="menu" [popover]="pop">
      <span class="kebab">&#8942;</span>
    </button>
    ${MENU}
  `,
  imports: [CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class UnnamedHost {}

@Component({
  template: `
    <button cngxIconMenuButton [attr.aria-label]="label()" [menu]="menu" [popover]="pop">
      <span class="kebab">&#8942;</span>
    </button>
    ${MENU}
  `,
  imports: [CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class BoundLabelHost {
  readonly label = signal<string | null>('Row actions');
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button cngxButton>Publish</button>
      <button cngxIconMenuButton [attr.aria-label]="label()" [menu]="menu" [popover]="pop">
        <span class="kebab">&#8942;</span>
      </button>
    </div>
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class SplitHost {
  readonly label = signal<string | null>(null);
}

@Component({
  template: `
    <button
      cngxIconMenuButton
      aria-label="Run"
      [menu]="menu"
      [popover]="pop"
      [cngxAsyncClick]="action"
    >
      &#8942;
    </button>
    ${MENU}
  `,
  imports: [CngxIconMenuButton, CngxAsyncClick, CngxMenu, CngxMenuItem, CngxPopover],
})
class AsyncAfterHost {
  readonly action: AsyncAction = () => new Promise<void>(() => undefined);
}

@Component({
  template: `
    <button
      [cngxAsyncClick]="action"
      cngxIconMenuButton
      aria-label="Run"
      [menu]="menu"
      [popover]="pop"
    >
      &#8942;
    </button>
    ${MENU}
  `,
  imports: [CngxAsyncClick, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class AsyncBeforeHost {
  readonly action: AsyncAction = () => new Promise<void>(() => undefined);
}

@Component({
  selector: 'test-caret',
  template: `<span class="custom-caret">v</span>`,
})
class CustomCaret {}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button cngxButton>Publish</button>
      <button cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
  providers: [provideButtonCaretIcon(CustomCaret)],
})
class CustomCaretSplitHost {}

function setup<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const flush = (): void => {
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  const button = fixture.nativeElement.querySelector('.cngx-icon-menu-button') as HTMLButtonElement;
  const popDe = fixture.debugElement.query(By.directive(CngxPopover));
  return {
    fixture,
    host: fixture.componentInstance,
    button,
    flush,
    popover: popDe.injector.get(CngxPopover),
  };
}

/**
 * The name a button gets from its attributes or, without one, from its
 * content: text outside every `aria-hidden="true"` and `hidden` subtree.
 */
function nameOf(el: Element): string {
  const label = el.getAttribute('aria-label')?.trim();
  if (label) {
    return label;
  }
  const walk = (node: Node): string =>
    Array.from(node.childNodes)
      .map((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          return child.textContent ?? '';
        }
        if (child.nodeType !== Node.ELEMENT_NODE) {
          return '';
        }
        const element = child as Element;
        const hidden =
          element.getAttribute('aria-hidden') === 'true' || element.hasAttribute('hidden');
        return hidden ? '' : walk(element);
      })
      .join('');
  return walk(el).replace(/\s+/g, ' ').trim();
}

function key(el: HTMLElement, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

/** Lets the open-time focus move (and a close-time restore) run. */
async function settle(): Promise<void> {
  TestBed.flushEffects();
  await Promise.resolve();
  await Promise.resolve();
}

describe('CngxIconMenuButton', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  describe('construction', () => {
    it('builds with both host directives on the icon-button skin', () => {
      const { button } = setup(KebabHost);
      expect(button.classList.contains('cngx-button')).toBe(true);
      expect(button.classList.contains('cngx-icon-button')).toBe(true);
      expect(button.dataset['variant']).toBe('ghost');
      expect(button.getAttribute('aria-haspopup')).toBe('menu');
      expect(button.getAttribute('type')).toBe('button');
    });

    it('publishes one blocked state to the trigger guard and to CNGX_BUTTON_STATE', () => {
      const { fixture, host, flush } = setup(KebabHost);
      const de = fixture.debugElement.query(By.directive(CngxIconMenuButton));
      const interaction = de.injector.get(CNGX_HOST_INTERACTION_STATE);
      const state = de.injector.get(CNGX_BUTTON_STATE);
      expect(state).toBe(de.injector.get(CngxButtonBrain));
      expect(interaction).toBe(de.injector.get(CngxButtonBrain).interaction);
      expect([interaction.disabled(), state.blocked()]).toEqual([false, false]);
      host.disabled.set(true);
      flush();
      expect([interaction.disabled(), state.blocked()]).toEqual([true, true]);
    });

    it.each([
      ['after', AsyncAfterHost],
      ['before', AsyncBeforeHost],
    ] as const)('builds with a co-hosted cngxAsyncClick written %s the selector', (_, type) => {
      vi.useFakeTimers();
      const { button, flush } = setup(type as Type<unknown>);
      button.click();
      flush();
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('data-pending')).toBe('true');
      expect(button.hasAttribute('data-busy')).toBe(false);

      vi.advanceTimersByTime(CNGX_LOADING_DEFAULTS.showDelay);
      flush();
      expect(button.getAttribute('data-busy')).toBe('true');
      expect(button.querySelector('.cngx-button__busy')).not.toBeNull();
    });

    it.each([
      ['after', AsyncAfterHost],
      ['before', AsyncBeforeHost],
    ] as const)(
      'refuses the menu click while a cngxAsyncClick written %s the selector is pending',
      (_, type) => {
        const { button, popover, flush } = setup(type as Type<unknown>);
        button.click();
        flush();
        // The first click opens the menu and starts the run.
        expect(popover.isVisible()).toBe(true);
        popover.hide();
        flush();
        expect(button.getAttribute('aria-disabled')).toBe('true');

        button.click();
        flush();
        expect(popover.isVisible()).toBe(false);
        expect(button.getAttribute('aria-disabled')).toBe('true');
      },
    );

    it.each([
      ['after', AsyncAfterHost],
      ['before', AsyncBeforeHost],
    ] as const)(
      'still closes the open menu on click while a cngxAsyncClick written %s the selector is pending',
      (_, type) => {
        const { button, popover, flush } = setup(type as Type<unknown>);
        button.click();
        flush();
        expect(popover.isVisible()).toBe(true);
        expect(button.getAttribute('aria-disabled')).toBe('true');

        button.click();
        flush();
        expect(popover.isVisible()).toBe(false);
      },
    );
  });

  describe('outside a split button', () => {
    it('renders the projected glyph, hidden from assistive technology, and no caret', () => {
      const { button } = setup(KebabHost);
      const glyph = button.querySelector('.cngx-icon-button__glyph');
      expect(glyph?.getAttribute('aria-hidden')).toBe('true');
      expect(glyph?.querySelector('.kebab')).not.toBeNull();
      expect(button.querySelector('.cngx-menu-button__caret')).toBeNull();
    });

    it('carries the consumer name and no default name', () => {
      expect(setup(KebabHost).button.getAttribute('aria-label')).toBe('Row actions');
      expect(setup(UnnamedHost).button.hasAttribute('aria-label')).toBe(false);
    });

    it('keeps a consumer [attr.aria-label] through change detection', () => {
      const { button, host, flush } = setup(BoundLabelHost);
      expect(button.getAttribute('aria-label')).toBe('Row actions');

      host.label.set('Order actions');
      flush();
      expect(button.getAttribute('aria-label')).toBe('Order actions');
    });

    it('toggles the popover on click and mirrors it in aria-expanded and data-expanded', () => {
      const { button, popover, flush } = setup(KebabHost);
      button.click();
      flush();
      expect(popover.isVisible()).toBe(true);
      expect(button.getAttribute('aria-expanded')).toBe('true');
      expect(button.dataset['expanded']).toBe('true');
      expect(popover.anchorElement()).toBe(button);

      button.click();
      flush();
      expect(popover.isVisible()).toBe(false);
      expect(button.dataset['expanded']).toBe('false');
    });

    it('opens on ArrowDown with focus in the menu and closes on Escape back to the button', async () => {
      const { button, popover, flush } = setup(KebabHost);
      button.focus();
      key(button, 'ArrowDown');
      flush();
      await settle();
      expect(popover.isVisible()).toBe(true);
      const focused = document.activeElement as HTMLElement;
      expect(focused.getAttribute('role')).toBe('menu');
      expect(focused.getAttribute('aria-activedescendant')).toBeTruthy();
      expect(button.getAttribute('aria-controls')).toBe(focused.id);
      key(focused, 'Escape');
      flush();
      await settle();
      expect(popover.isVisible()).toBe(false);
      expect(document.activeElement).toBe(button);
    });

    it('opens on nothing while disabled', () => {
      const { button, host, popover, flush } = setup(KebabHost);
      host.disabled.set(true);
      flush();
      expect(button.getAttribute('aria-disabled')).toBe('true');
      button.click();
      button.focus();
      key(button, 'ArrowDown');
      flush();
      expect(popover.isVisible()).toBe(false);
    });

    it('warns CNGX1071 without an accessible name', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { fixture, button } = setup(UnnamedHost);
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
      const calls = warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1071'));
      expect(calls).toHaveLength(1);
      expect(calls[0][0]).toMatch(/^CNGX1071: \[cngxIconMenuButton\] has no accessible name\./);
      expect(calls[0]).toContain(button);
      warn.mockRestore();
    });

    it('stays silent with an aria-label', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { fixture } = setup(KebabHost);
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
      expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1071'))).toEqual([]);
      warn.mockRestore();
    });
  });

  describe('inside a split button', () => {
    it('renders the caret instead of the projected content', () => {
      const { button } = setup(SplitHost);
      const caret = button.querySelector('.cngx-menu-button__caret');
      expect(caret?.querySelector('svg')).not.toBeNull();
      expect(button.querySelector('.kebab')).toBeNull();
      expect(caret?.closest('[aria-hidden="true"]')).not.toBeNull();
    });

    it('draws the default caret from CNGX_ICON_CHEVRON_DOWN', () => {
      const { button } = setup(SplitHost);
      const svg = button.querySelector('.cngx-menu-button__caret svg.cngx-icon-svg');
      expect(svg?.querySelector('.cngx-icon-svg__path')?.getAttribute('d')).toBe(
        CNGX_ICON_CHEVRON_DOWN.d,
      );
    });

    it('renders the provideButtonCaretIcon component', () => {
      const { button } = setup(CustomCaretSplitHost);
      expect(button.querySelector('.cngx-menu-button__caret .custom-caret')).not.toBeNull();
    });

    it('is named by content from the language pack, with no aria-label of its own', () => {
      const { button } = setup(SplitHost);
      expect(button.hasAttribute('aria-label')).toBe(false);
      const label = button.querySelector('.cngx-sr-only');
      expect(label?.textContent?.trim()).toBe('More options');
      expect(label?.closest('[aria-hidden="true"]')).toBeNull();
      expect(nameOf(button)).toBe('More options');
    });

    it('lets a consumer aria-label win over the content name', () => {
      const { button, host, flush } = setup(SplitHost);
      host.label.set('Publish options');
      flush();
      expect(button.getAttribute('aria-label')).toBe('Publish options');
      expect(nameOf(button)).toBe('Publish options');

      host.label.set(null);
      flush();
      expect(button.hasAttribute('aria-label')).toBe(false);
      expect(nameOf(button)).toBe('More options');
    });

    it('relabels when the active pack flips', () => {
      const pack = signal<CngxActiveLanguagePack | undefined>(undefined);
      TestBed.configureTestingModule({
        providers: [provideCngxI18n(withPartialPack(pack), withDocumentLanguage('off'))],
      });
      const { button, flush } = setup(SplitHost);
      expect(nameOf(button)).toBe('More options');

      pack.set({ locale: 'de', menuButton: { splitToggle: 'Weitere Optionen' } });
      flush();
      expect(nameOf(button)).toBe('Weitere Optionen');
    });

    it('does not warn CNGX1071 for the unnamed caret', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { fixture } = setup(CustomCaretSplitHost);
      await fixture.whenStable();
      await new Promise((resolve) => setTimeout(resolve));
      expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1071'))).toEqual([]);
      warn.mockRestore();
    });
  });
});
