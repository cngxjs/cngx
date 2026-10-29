import { Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxButton, CngxIconButton } from '@cngx/common/button';
import { CngxAsyncClick, CngxMenu, CngxMenuItem, type AsyncAction } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    <ul cngxMenu [label]="'Publish options'" tabindex="0" #menu="cngxMenu">
      <li cngxMenuItem value="schedule">Schedule</li>
      <li cngxMenuItem value="draft">Save as draft</li>
    </ul>
  </div>
`;

@Component({
  template: `
    <div cngxSplitButton variant="outline" size="sm" aria-label="Publish">
      <button id="main" cngxButton [cngxAsyncClick]="publish" [disabled]="mainDisabled()">
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

function key(el: HTMLElement, k: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
}

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

  describe('main action running', () => {
    it('blocks the caret without a reason of its own', () => {
      const { q, flush } = setup(SplitHost);
      const caret = q('#caret');
      expect(caret.hasAttribute('aria-disabled')).toBe(false);

      q('#main').click();
      flush();
      expect(caret.getAttribute('aria-disabled')).toBe('true');
      expect(caret.getAttribute('aria-describedby')).toBeNull();
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
  });

  it('blocks the caret while the main button is disabled', () => {
    const { host, q, split, flush } = setup(SplitHost);
    host.mainDisabled.set(true);
    flush();
    expect(split.mainBlocked()).toBe(true);
    expect(q('#caret').getAttribute('aria-disabled')).toBe('true');
    expect(q('#caret').getAttribute('aria-describedby')).toBeNull();
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
    const nested = fixture.debugElement.query(By.css('#nested')).injector.get(CngxButton);
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
    expect(q('#caret').getAttribute('aria-label')).toBe('More options');
    expect(nested.hasAttribute('aria-disabled')).toBe(false);
    expect(nested.getAttribute('aria-label')).toBe('Row actions');
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

  it('never takes the caret for the main action', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, split } = setup(WrappedMainHost);
    await fixture.whenStable();
    expect(split.caret()).toBeDefined();
    expect(split.mainBlocked()).toBe(false);
    warn.mockRestore();
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
    warn.mockRestore();
  });

  it('stays silent about CNGX1073 with a main button', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = setup(SplitHost);
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1073'))).toEqual([]);
    warn.mockRestore();
  });

  it('warns CNGX1072 through the button group without a group name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture } = setup(UnnamedGroupHost);
    await fixture.whenStable();
    expect(warn.mock.calls.filter(([msg]) => String(msg).startsWith('CNGX1072'))).toHaveLength(1);
    warn.mockRestore();
  });
});
