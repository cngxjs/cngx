import { Component, inject, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  CNGX_BUTTON_STATE,
  CngxButton,
  CngxButtonBrain,
  CngxIconButton,
  provideButtonHost,
} from '@cngx/common/button';
import {
  CngxAsyncClick,
  CngxMenu,
  CngxMenuItem,
  CngxMenuTrigger,
  type AsyncAction,
} from '@cngx/common/interactive';
import {
  CngxPopover,
  CngxPopoverAnchor,
  CngxPopoverSheet,
  CngxPopoverSheetTitle,
  CngxPopoverTrigger,
} from '@cngx/common/popover';
import { CNGX_LOADING_DEFAULTS } from '@cngx/core/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxIconMenuButton } from './icon-menu-button.component';
import { injectMenuToggle } from './internal/menu-toggle';
import { CngxSplitButton } from './split-button.directive';
import { CngxSplitCaret } from './split-caret.directive';

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
    <ul cngxMenu [label]="'Publish options'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="schedule">Schedule</li>
      <li cngxMenuItem value="draft">Save as draft</li>
    </ul>
  </div>
`;

@Component({
  template: `
    <div cngxSplitButton variant="outline" size="sm" aria-label="Publish">
      <button
        id="main"
        cngxButton
        [cngxAsyncClick]="publish"
        [disabled]="mainDisabled()"
        [disabledReason]="mainReason()"
      >
        Publish
      </button>
      <button
        id="caret"
        cngxIconMenuButton
        [menu]="menu"
        [popover]="pop"
        [disabled]="caretDisabled()"
        [disabledReason]="caretReason()"
      ></button>
    </div>
    ${MENU}
  `,
  imports: [
    CngxSplitButton,
    CngxButton,
    CngxAsyncClick,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
  ],
})
class SplitHost {
  readonly mainDisabled = signal(false);
  readonly mainReason = signal<string | undefined>(undefined);
  readonly caretDisabled = signal(false);
  readonly caretReason = signal<string | undefined>('Nothing else to publish');
  release: () => void = () => undefined;
  readonly publish: AsyncAction = () => new Promise<void>((resolve) => (this.release = resolve));
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button id="main" cngxButton>Publish</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
      <div cngxPopover #pop="cngxPopover">
        <ul cngxMenu [label]="'Publish options'" tabindex="0" #menu="cngxMenu">
          <li cngxMenuItem value="schedule">
            <button id="nested" cngxButton [cngxAsyncClick]="run">Schedule</button>
          </li>
        </ul>
      </div>
    </div>
  `,
  imports: [
    CngxSplitButton,
    CngxButton,
    CngxAsyncClick,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
  ],
})
class NestedAsyncHost {
  readonly run: AsyncAction = () => new Promise<void>(() => undefined);
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <span><button cngxButton>Publish</button></span>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class WrappedMainHost {}

@Component({
  template: `
    <div cngxSplitButton>
      <button cngxButton>Publish</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class UnnamedGroupHost {}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button id="main" cngxButton [disabled]="true">Publish</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
      <div class="panel">
        <button
          id="nested"
          cngxIconMenuButton
          aria-label="Row actions"
          [menu]="menu"
          [popover]="pop"
        >
          <span class="kebab">&#8942;</span>
        </button>
      </div>
    </div>
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class NestedCaretHost {}

@Component({
  template: `
    <div cngxSplitButton aria-label="Play">
      <button id="main" cngxIconButton aria-label="Play" [disabled]="disabled()">&#9654;</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    ${MENU}
  `,
  imports: [
    CngxSplitButton,
    CngxIconButton,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
  ],
})
class IconMainHost {
  readonly disabled = signal(false);
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
      <button id="main" cngxButton [disabled]="disabled()">Publish</button>
    </div>
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class CaretFirstHost {
  readonly disabled = signal(false);
}

// A caret written in the app on the public contract: brain, triggers, CngxSplitCaret.
@Component({
  selector: 'button[demoCaret]',
  hostDirectives: [
    { directive: CngxButtonBrain, inputs: ['variant: demoCaret', 'disabled', 'disabledReason'] },
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
    CngxSplitCaret,
  ],
  providers: [provideButtonHost('demoCaret', { defaultVariant: 'solid', iconOnly: true })],
  host: { '(click)': 'toggle.handleClick()' },
  template: `<span aria-hidden="true">v</span>
    @if (caret.isCaret()) {
      <span class="cngx-sr-only">{{ caret.label() }}</span>
      <span [id]="caret.busyNoteId" hidden>{{ caret.busyNote() }}</span>
    }`,
})
class DemoCaret {
  protected readonly caret = inject(CngxSplitCaret);
  protected readonly toggle = injectMenuToggle(inject(CngxButtonBrain).blocked);
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button
        id="main"
        cngxButton
        [cngxAsyncClick]="publish"
        [disabled]="mainDisabled()"
        [disabledReason]="mainReason()"
      >
        Publish
      </button>
      <button id="caret" demoCaret [menu]="menu" [popover]="pop"></button>
    </div>
    ${MENU}
  `,
  imports: [
    CngxSplitButton,
    CngxButton,
    CngxAsyncClick,
    DemoCaret,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
  ],
})
class CustomCaretHost {
  readonly mainDisabled = signal(false);
  readonly mainReason = signal<string | undefined>(undefined);
  release: () => void = () => undefined;
  readonly publish: AsyncAction = () => new Promise<void>((resolve) => (this.release = resolve));
}

@Component({
  template: `
    @if (shown()) {
      <div cngxSplitButton aria-label="Publish">
        <button id="main" cngxButton>Publish</button>
        <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
      </div>
    }
    ${MENU}
  `,
  imports: [CngxSplitButton, CngxButton, CngxIconMenuButton, CngxMenu, CngxMenuItem, CngxPopover],
})
class ToggleSplitHost {
  readonly shown = signal(true);
}

@Component({
  template: `
    @if (anchorFirst()) {
      <div id="box" [cngxPopoverAnchor]="pop"></div>
    }
    <div cngxSplitButton aria-label="Publish">
      <button id="main" cngxButton>Publish</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    @if (!anchorFirst()) {
      <div id="box" [cngxPopoverAnchor]="pop"></div>
    }
    ${MENU}
  `,
  imports: [
    CngxSplitButton,
    CngxButton,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
    CngxPopoverAnchor,
  ],
})
class ConsumerAnchorHost {
  readonly anchorFirst = signal(true);
}

@Component({
  template: `
    <div cngxSplitButton aria-label="Publish">
      <button id="main" cngxButton>Publish</button>
      <button id="caret" cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
    </div>
    <div cngxPopover cngxPopoverSheet="sheet" #pop="cngxPopover">
      <h2 cngxPopoverSheetTitle>Publish options</h2>
      <ul cngxMenu [label]="'Publish options'" tabindex="0" #menu="cngxMenu">
        <li cngxMenuItem value="schedule">Schedule</li>
      </ul>
    </div>
  `,
  imports: [
    CngxSplitButton,
    CngxButton,
    CngxIconMenuButton,
    CngxMenu,
    CngxMenuItem,
    CngxPopover,
    CngxPopoverSheet,
    CngxPopoverSheetTitle,
  ],
})
class SheetSplitHost {}

function setup<T>(type: Type<T>) {
  const fixture = TestBed.createComponent(type);
  fixture.detectChanges();
  TestBed.flushEffects();
  fixture.detectChanges();
  const flush = (): void => {
    TestBed.flushEffects();
    fixture.detectChanges();
  };
  const el = fixture.nativeElement as HTMLElement;
  const q = (sel: string) => el.querySelector(sel) as HTMLButtonElement;
  const popDe = fixture.debugElement.query(By.directive(CngxPopover));
  const splitDe = fixture.debugElement.query(By.directive(CngxSplitButton));
  return {
    fixture,
    host: fixture.componentInstance,
    q,
    flush,
    group: splitDe.nativeElement as HTMLElement,
    split: splitDe.injector.get(CngxSplitButton),
    popover: popDe.injector.get(CngxPopover),
  };
}

/** The id list of `aria-describedby`, empty without one. */
function describedIds(el: HTMLElement): string[] {
  return (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
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

// A failed assertion must not leave console.warn mocked for later spec files (isolate: false).
afterEach(() => {
  vi.restoreAllMocks();
});

describe('CngxSplitButton', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  afterEach(() => {
    document.body.querySelectorAll('.cngx-menu-announcer').forEach((el) => el.remove());
  });

  it('frames the buttons as a named group and hands variant and size down', () => {
    const { group, q } = setup(SplitHost);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.classList.contains('cngx-button-group')).toBe(true);
    for (const id of ['#main', '#caret']) {
      expect(q(id).dataset['variant']).toBe('outline');
      expect(q(id).dataset['size']).toBe('sm');
    }
  });

  it('opens the caret menu on Enter with focus in the menu, Escape returns to the caret', async () => {
    const { q, popover, flush } = setup(SplitHost);
    const caret = q('#caret');
    caret.focus();
    key(caret, 'Enter');
    flush();
    TestBed.flushEffects();
    await Promise.resolve();
    expect(popover.isVisible()).toBe(true);
    const focused = document.activeElement as HTMLElement;
    expect(focused.getAttribute('role')).toBe('menu');
    expect(focused.getAttribute('aria-activedescendant')).toBeTruthy();
    expect(caret.getAttribute('aria-controls')).toBe(focused.id);

    key(focused, 'Escape');
    flush();
    await Promise.resolve();
    expect(popover.isVisible()).toBe(false);
    expect(document.activeElement).toBe(caret);
  });

  describe('main action running', () => {
    it('blocks the caret and describes it as busy, without a reason of its own', () => {
      const { q, flush } = setup(SplitHost);
      const caret = q('#caret');
      expect(caret.hasAttribute('aria-disabled')).toBe(false);
      expect(caret.getAttribute('aria-describedby')).toBeNull();

      q('#main').click();
      flush();
      expect(caret.getAttribute('aria-disabled')).toBe('true');
      const ids = describedIds(caret);
      expect(ids).toHaveLength(1);
      const busy = document.getElementById(ids[0]);
      expect(busy?.textContent?.trim()).toBe('The main action is running');
      expect(caret.contains(busy)).toBe(true);
      expect(busy?.hasAttribute('hidden')).toBe(true);
    });

    it('keeps the caret name exactly "More options" while the main action is pending', () => {
      const { q, flush } = setup(SplitHost);
      const caret = q('#caret');
      expect(nameOf(caret)).toBe('More options');
      q('#main').click();
      flush();
      expect(caret.getAttribute('aria-disabled')).toBe('true');
      expect(nameOf(caret)).toBe('More options');
    });

    it('drops the busy description once the action settles', async () => {
      const { fixture, host, q, flush } = setup(SplitHost);
      q('#main').click();
      flush();
      expect(describedIds(q('#caret'))).toHaveLength(1);

      host.release();
      await fixture.whenStable();
      flush();
      expect(q('#caret').getAttribute('aria-describedby')).toBeNull();
    });

    it('swallows click and ArrowDown on the caret', () => {
      const { q, popover, flush } = setup(SplitHost);
      q('#main').click();
      flush();
      const caret = q('#caret');
      caret.click();
      flush();
      expect(popover.isVisible()).toBe(false);
      caret.focus();
      key(caret, 'ArrowDown');
      flush();
      expect(popover.isVisible()).toBe(false);
    });

    it('closes an open menu when the action starts', () => {
      const { q, popover, flush } = setup(SplitHost);
      q('#caret').click();
      flush();
      expect(popover.isVisible()).toBe(true);

      q('#main').click();
      flush();
      expect(popover.isVisible()).toBe(false);
    });

    it('unblocks the caret when the action settles', async () => {
      const { fixture, host, q, flush } = setup(SplitHost);
      q('#main').click();
      flush();
      expect(q('#caret').getAttribute('aria-disabled')).toBe('true');

      host.release();
      await fixture.whenStable();
      flush();
      expect(q('#caret').hasAttribute('aria-disabled')).toBe(false);
    });

    it('keeps the caret refusing through the main dwell and opens it after release (E4)', async () => {
      vi.useFakeTimers();
      const { host, q, popover, flush } = setup(SplitHost);
      const advance = async (ms: number): Promise<void> => {
        await vi.advanceTimersByTimeAsync(ms);
        flush();
      };
      const caret = q('#caret');

      q('#main').click();
      flush();
      await advance(CNGX_LOADING_DEFAULTS.showDelay);
      expect(caret.getAttribute('aria-disabled')).toBe('true');

      host.release();
      await advance(0);
      // The main action settled but still holds its busy visual: the caret
      // follows mainBlocked and refuses to open for the whole dwell.
      expect(caret.getAttribute('aria-disabled')).toBe('true');
      caret.click();
      flush();
      expect(popover.isVisible()).toBe(false);

      await advance(CNGX_LOADING_DEFAULTS.minDwell);
      expect(caret.hasAttribute('aria-disabled')).toBe(false);
      caret.click();
      flush();
      expect(popover.isVisible()).toBe(true);
      vi.useRealTimers();
    });

    it('closes a menu opened before the run and refuses to reopen until the dwell ends', async () => {
      vi.useFakeTimers();
      const { host, q, popover, flush } = setup(SplitHost);
      const advance = async (ms: number): Promise<void> => {
        await vi.advanceTimersByTimeAsync(ms);
        flush();
      };

      q('#caret').click();
      flush();
      expect(popover.isVisible()).toBe(true);

      q('#main').click();
      flush();
      expect(popover.isVisible()).toBe(false);

      await advance(CNGX_LOADING_DEFAULTS.showDelay);
      host.release();
      await advance(0);
      q('#caret').click();
      flush();
      expect(popover.isVisible()).toBe(false);

      await advance(CNGX_LOADING_DEFAULTS.minDwell);
      q('#caret').click();
      flush();
      expect(popover.isVisible()).toBe(true);
      vi.useRealTimers();
    });
  });

  it('blocks the caret while the main button is disabled', () => {
    const { host, q, split, flush } = setup(SplitHost);
    host.mainDisabled.set(true);
    flush();
    expect(split.mainBlocked()).toBe(true);
    expect(q('#caret').getAttribute('aria-disabled')).toBe('true');
    expect(q('#caret').getAttribute('aria-describedby')).toBeNull();
  });

  it("references the main's reason while the main is disabled with one", () => {
    const { fixture, host, q, flush } = setup(SplitHost);
    host.mainReason.set('Fix the errors first');
    host.mainDisabled.set(true);
    flush();
    const caret = q('#caret');
    const main = fixture.debugElement.query(By.css('#main')).injector.get(CNGX_BUTTON_STATE);
    const mainReasonId = main.activeReasonId();
    expect(mainReasonId).not.toBeNull();
    expect(caret.getAttribute('aria-disabled')).toBe('true');
    expect(describedIds(caret)).toEqual([mainReasonId]);
    expect(document.getElementById(mainReasonId ?? '')?.textContent).toBe('Fix the errors first');
    expect(nameOf(caret)).toBe('More options');

    host.mainDisabled.set(false);
    flush();
    expect(caret.hasAttribute('aria-disabled')).toBe(false);
    expect(caret.getAttribute('aria-describedby')).toBeNull();
  });

  it('gives a custom host on CngxSplitCaret the caret role, refusal and description', async () => {
    const { fixture, host, q, split, popover, flush } = setup(CustomCaretHost);
    const caret = q('#caret');
    const main = fixture.debugElement.query(By.css('#main')).injector.get(CNGX_BUTTON_STATE);
    expect(split.caret()).toBe(
      fixture.debugElement.query(By.css('#caret')).injector.get(CNGX_BUTTON_STATE),
    );
    expect(nameOf(caret)).toBe('More options');

    host.mainReason.set('Fix the errors first');
    host.mainDisabled.set(true);
    flush();
    expect(caret.getAttribute('aria-disabled')).toBe('true');
    expect(describedIds(caret)).toEqual([main.activeReasonId()]);
    caret.click();
    flush();
    expect(popover.isVisible()).toBe(false);

    host.mainDisabled.set(false);
    flush();
    q('#main').click();
    flush();
    await Promise.resolve();
    flush();
    const [busyId] = describedIds(caret);
    expect(document.getElementById(busyId)?.textContent).toBe('The main action is running');
    expect(nameOf(caret)).toBe('More options');

    host.release();
    await Promise.resolve();
    await Promise.resolve();
    flush();
    expect(caret.hasAttribute('aria-describedby')).toBe(false);
    expect(caret.hasAttribute('aria-disabled')).toBe(false);
  });

  it("references the caret's reason while its own disabled is set", () => {
    const { host, q, flush } = setup(SplitHost);
    host.caretDisabled.set(true);
    flush();
    const caret = q('#caret');
    expect(caret.getAttribute('aria-disabled')).toBe('true');
    const id = caret.getAttribute('aria-describedby') ?? '';
    expect(id).not.toBe('');
    expect(document.getElementById(id)?.textContent).toBe('Nothing else to publish');
  });

  it('ignores a cngxAsyncClick button inside the projected menu', () => {
    const { fixture, q, split, flush } = setup(NestedAsyncHost);
    const nested = fixture.debugElement.query(By.css('#nested')).injector.get(CNGX_BUTTON_STATE);
    q('#nested').click();
    flush();
    expect(nested.blocked()).toBe(true);
    expect(split.mainBlocked()).toBe(false);
    expect(q('#caret').hasAttribute('aria-disabled')).toBe(false);
  });

  it('gives the caret role only to the direct child icon menu button', () => {
    const { q, split } = setup(NestedCaretHost);
    const nested = q('#nested');
    expect(split.caret()).toBeDefined();
    expect(q('#caret').getAttribute('aria-disabled')).toBe('true');
    expect(q('#caret').querySelector('.cngx-sr-only')?.textContent?.trim()).toBe('More options');
    expect(nested.hasAttribute('aria-disabled')).toBe(false);
    expect(nested.getAttribute('aria-label')).toBe('Row actions');
    expect(nested.querySelector('.cngx-sr-only')).toBeNull();
    expect(nested.querySelector('.kebab')).not.toBeNull();
    expect(nested.querySelector('.cngx-menu-button__caret')).toBeNull();
  });

  it('accepts a cngxIconButton as the main action', () => {
    const { host, q, split, flush } = setup(IconMainHost);
    expect(split.mainBlocked()).toBe(false);
    host.disabled.set(true);
    flush();
    expect(split.mainBlocked()).toBe(true);
    expect(q('#caret').getAttribute('aria-disabled')).toBe('true');
  });

  it('resolves the main action when the caret comes first in the DOM', () => {
    const { fixture, host, q, split, flush } = setup(CaretFirstHost);
    const caretState = fixture.debugElement.query(By.css('#caret')).injector.get(CNGX_BUTTON_STATE);
    expect(split.caret()).toBe(caretState);
    expect(split.mainBlocked()).toBe(false);
    host.disabled.set(true);
    flush();
    expect(split.mainBlocked()).toBe(true);
    expect(q('#caret').getAttribute('aria-disabled')).toBe('true');
    expect(q('#caret').querySelector('.cngx-sr-only')?.textContent?.trim()).toBe('More options');
  });

  it('never takes the caret for the main action', async () => {
    // Silences the CNGX1073 this host raises; the spy is restored after each test.
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, split } = setup(WrappedMainHost);
    await fixture.whenStable();
    expect(split.caret()).toBeDefined();
    expect(split.mainBlocked()).toBe(false);
  });

  it('warns CNGX1073 when the main cngxButton is not a direct child', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, group, split } = setup(WrappedMainHost);
    await fixture.whenStable();
    const calls = warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1073'));
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toMatch(/^CNGX1073: \[cngxSplitButton\] has no main cngxButton\./);
    expect(calls[0]).toContain(group);
    expect(split.mainBlocked()).toBe(false);
  });

  it('stays silent about CNGX1073 with a main button', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = setup(SplitHost);
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1073'))).toEqual([]);
  });

  it('warns CNGX1072 through the button group without a group name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = setup(UnnamedGroupHost);
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1072'))).toHaveLength(1);
  });
  describe('menu anchor', () => {
    it('anchors the caret popover to the whole group', () => {
      const { group, popover } = setup(ToggleSplitHost);
      expect(popover.explicitAnchorElement()).toBe(group);
      expect(popover.anchorElement()).toBe(group);
    });

    it('releases the anchor when the split is destroyed', () => {
      const { host, popover, flush } = setup(ToggleSplitHost);
      host.shown.set(false);
      flush();
      expect(popover.explicitAnchorElement()).toBeNull();
    });

    it('still closes an open menu on a pointerdown on the main button', () => {
      const { q, popover, flush } = setup(ToggleSplitHost);
      q('#caret').click();
      flush();
      expect(popover.isVisible()).toBe(true);

      q('#main').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      flush();
      expect(popover.isVisible()).toBe(false);
    });

    it('restores sheet focus to the caret when the tap focused nothing', () => {
      const { q, popover, flush } = setup(SheetSplitHost);
      const caret = q('#caret');
      (document.activeElement as HTMLElement | null)?.blur();
      caret.click();
      flush();
      expect(popover.isVisible()).toBe(true);

      popover.hide();
      flush();
      expect(document.activeElement).toBe(caret);
    });

    for (const anchorFirst of [true, false]) {
      it(`yields to a consumer anchor rendered ${anchorFirst ? 'before' : 'after'} the split`, () => {
        const fixture = TestBed.createComponent(ConsumerAnchorHost);
        fixture.componentInstance.anchorFirst.set(anchorFirst);
        fixture.detectChanges();
        TestBed.flushEffects();
        fixture.detectChanges();
        const popover = fixture.debugElement
          .query(By.directive(CngxPopover))
          .injector.get(CngxPopover);
        const box = (fixture.nativeElement as HTMLElement).querySelector('#box');
        expect(popover.anchorElement()).toBe(box);
      });
    }
  });
});
