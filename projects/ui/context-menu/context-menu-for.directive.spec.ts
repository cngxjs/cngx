import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CngxContextMenu } from './context-menu.component';
import { CngxContextMenuFor } from './context-menu-for.directive';

function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
  }
}

interface Row {
  readonly id: number;
  readonly name: string;
}

@Component({
  template: `
    <div
      class="target"
      tabindex="0"
      [cngxContextMenuFor]="menu"
      [cngxContextMenuData]="data()"
      #trigger="cngxContextMenuFor"
    >
      Right-click
    </div>
    <cngx-context-menu ariaLabel="Actions" #menu="cngxContextMenu">
      <button type="button">Copy</button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor],
})
class DataHost {
  readonly data = signal<Row>({ id: 1, name: 'Alpha' });
}

@Component({
  template: `
    <div
      class="target"
      tabindex="0"
      [cngxContextMenuFor]="menu"
      [cngxContextMenuData]="data()"
      [cngxContextMenuResolve]="resolver()"
      [cngxContextMenuKeyboardResolve]="keyboardResolver()"
    >
      Right-click
    </div>
    <cngx-context-menu ariaLabel="Actions" #menu="cngxContextMenu">
      <button type="button">Copy</button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor],
})
class ResolverHost {
  readonly data = signal<Row>({ id: 1, name: 'FromData' });
  readonly resolver = signal<(event: MouseEvent) => Row | null>(() => ({ id: 9, name: 'FromResolver' }));
  readonly keyboardResolver = signal<((event: KeyboardEvent) => Row | null) | undefined>(undefined);
}

@Component({
  template: `
    <div class="target-a" tabindex="0" [cngxContextMenuFor]="menu" [cngxContextMenuData]="rowA">
      Alpha
    </div>
    <div class="target-b" tabindex="0" [cngxContextMenuFor]="menu" [cngxContextMenuData]="rowB">
      Beta
    </div>
    <cngx-context-menu ariaLabel="Shared actions" #menu="cngxContextMenu">
      <button type="button">Copy</button>
    </cngx-context-menu>
  `,
  imports: [CngxContextMenu, CngxContextMenuFor],
})
class SharedPanelHost {
  readonly rowA: Row = { id: 1, name: 'Alpha' };
  readonly rowB: Row = { id: 2, name: 'Beta' };
}

function rightClick(el: HTMLElement): MouseEvent {
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: 100,
    clientY: 80,
  });
  el.dispatchEvent(event);
  return event;
}

describe('CngxContextMenuFor', () => {
  beforeEach(() => {
    polyfillPopover();
  });

  afterEach(() => {
    document.body
      .querySelectorAll('.cngx-context-menu-anchor, .cngx-menu-announcer')
      .forEach((el) => el.remove());
  });

  function setupData() {
    TestBed.configureTestingModule({ imports: [DataHost] });
    const fixture = TestBed.createComponent(DataHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    const panel = fixture.debugElement.query(By.directive(CngxContextMenu))
      .componentInstance as CngxContextMenu<Row>;
    return { fixture, target, panel };
  }

  function setupResolver() {
    TestBed.configureTestingModule({ imports: [ResolverHost] });
    const fixture = TestBed.createComponent(ResolverHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    const host = fixture.componentInstance;
    const panel = fixture.debugElement.query(By.directive(CngxContextMenu))
      .componentInstance as CngxContextMenu<Row>;
    return { fixture, target, host, panel };
  }

  it('data mode: opens with the fixed datum and prevents the native menu', () => {
    const { fixture, target, panel } = setupData();
    const event = rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(panel.popover.isVisible()).toBe(true);
    expect(panel.context()).toEqual({ id: 1, name: 'Alpha' });
  });

  it('resolver wins over data', () => {
    const { fixture, target, panel } = setupResolver();
    rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(panel.context()).toEqual({ id: 9, name: 'FromResolver' });
  });

  it('resolver null result leaves the native menu untouched', () => {
    const { fixture, target, host, panel } = setupResolver();
    host.resolver.set(() => null);
    fixture.detectChanges();
    const event = rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(false);
    expect(panel.popover.isVisible()).toBe(false);
  });

  describe('shared panel ownership', () => {
    function setupShared() {
      TestBed.configureTestingModule({ imports: [SharedPanelHost] });
      const fixture = TestBed.createComponent(SharedPanelHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      const targetA = fixture.nativeElement.querySelector('.target-a') as HTMLElement;
      const targetB = fixture.nativeElement.querySelector('.target-b') as HTMLElement;
      const triggers = fixture.debugElement
        .queryAll(By.directive(CngxContextMenuFor))
        .map((de) => de.injector.get(CngxContextMenuFor) as CngxContextMenuFor<Row>);
      const panel = fixture.debugElement.query(By.directive(CngxContextMenu))
        .componentInstance as CngxContextMenu<Row>;
      return { fixture, targetA, targetB, triggerA: triggers[0], triggerB: triggers[1], panel };
    }

    function flush(fixture: { detectChanges(): void }): void {
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('the opening trigger claims the panel; only it reports aria-expanded', () => {
      const { fixture, targetA, targetB, triggerA, panel } = setupShared();

      rightClick(targetA);
      flush(fixture);

      expect(panel.openOwner()).toBe(triggerA);
      expect(panel.context()).toEqual({ id: 1, name: 'Alpha' });
      expect(targetA.getAttribute('aria-expanded')).toBe('true');
      expect(targetB.getAttribute('aria-expanded')).toBe('false');
    });

    it('a later open by the sibling takes over the claim', () => {
      const { fixture, targetA, targetB, triggerB, panel } = setupShared();

      rightClick(targetA);
      flush(fixture);
      panel.popover.hide();
      flush(fixture);

      rightClick(targetB);
      flush(fixture);

      expect(panel.openOwner()).toBe(triggerB);
      expect(panel.context()).toEqual({ id: 2, name: 'Beta' });
      expect(targetA.getAttribute('aria-expanded')).toBe('false');
      expect(targetB.getAttribute('aria-expanded')).toBe('true');
    });

    it('registers the panel forwarders on open and clears them on close', () => {
      const { fixture, targetA, panel } = setupShared();
      const keydownSpy = vi.spyOn(panel, 'setKeydownHandler');
      const activationSpy = vi.spyOn(panel, 'setActivationHandler');

      rightClick(targetA);
      flush(fixture);
      expect(keydownSpy).toHaveBeenLastCalledWith(expect.any(Function));
      expect(activationSpy).toHaveBeenLastCalledWith(expect.any(Function));

      panel.popover.hide();
      flush(fixture);
      expect(keydownSpy).toHaveBeenLastCalledWith(null);
      expect(activationSpy).toHaveBeenLastCalledWith(null);
      expect(panel.openOwner()).toBeNull();
    });

    it('Shift+F10 claims ownership and commits the keyboard opener datum', () => {
      const { fixture, targetA, targetB, triggerB, panel } = setupShared();

      // Seed a foreign datum via a pointer open on A, then close - the
      // keyboard open on B must not serve this stale context.
      rightClick(targetA);
      flush(fixture);
      panel.popover.hide();
      flush(fixture);

      targetB.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
      );
      flush(fixture);

      expect(panel.popover.isVisible()).toBe(true);
      expect(panel.openOwner()).toBe(triggerB);
      expect(panel.context()).toEqual({ id: 2, name: 'Beta' });
      expect(targetB.getAttribute('aria-expanded')).toBe('true');
      expect(targetA.getAttribute('aria-expanded')).toBe('false');
    });

    it('a takeover while the panel stays visible transfers ownership and datum', () => {
      const { fixture, targetA, targetB, triggerB, panel } = setupShared();

      rightClick(targetA);
      flush(fixture);
      expect(panel.context()).toEqual({ id: 1, name: 'Alpha' });

      // No dismissal in between (outside-pointerdown never fired): B claims
      // the still-visible panel. A must stand down without clobbering B's
      // handlers or ownership, and the menu keeps serving B's datum.
      rightClick(targetB);
      flush(fixture);

      expect(panel.popover.isVisible()).toBe(true);
      expect(panel.openOwner()).toBe(triggerB);
      expect(panel.context()).toEqual({ id: 2, name: 'Beta' });
      expect(targetA.getAttribute('aria-expanded')).toBe('false');
      expect(targetB.getAttribute('aria-expanded')).toBe('true');
    });

    it('a modified Shift+F10 (Ctrl held) neither claims nor opens', () => {
      const { fixture, targetA, panel } = setupShared();

      targetA.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'F10',
          shiftKey: true,
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      );
      flush(fixture);

      expect(panel.popover.isVisible()).toBe(false);
      expect(panel.openOwner()).toBeNull();
    });

    it('a direct open (openAsSubmenu) claims no trigger ownership', () => {
      const { fixture, targetA, targetB, panel } = setupShared();

      panel.openAsSubmenu({ id: 7, name: 'Direct' });
      flush(fixture);

      expect(panel.popover.isVisible()).toBe(true);
      expect(panel.openOwner()).toBeNull();
      expect(targetA.getAttribute('aria-expanded')).toBe('false');
      expect(targetB.getAttribute('aria-expanded')).toBe('false');
    });
  });

  it('keyboard resolver derives the datum from the Shift+F10 target', () => {
    const { fixture, target, host, panel } = setupResolver();
    host.keyboardResolver.set((event) => {
      const el = event.target as HTMLElement;
      return el.classList.contains('target') ? { id: 5, name: 'FromKeyboard' } : null;
    });
    fixture.detectChanges();

    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
    );
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(panel.popover.isVisible()).toBe(true);
    expect(panel.context()).toEqual({ id: 5, name: 'FromKeyboard' });
  });

  it('keyboard resolver null result skips the open entirely', () => {
    const { fixture, target, host, panel } = setupResolver();
    host.keyboardResolver.set(() => null);
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', {
      key: 'F10',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(event.defaultPrevented).toBe(false);
    expect(panel.popover.isVisible()).toBe(false);
  });

  it('without a keyboard resolver Shift+F10 falls back to the fixed datum', () => {
    const { fixture, target, panel } = setupResolver();

    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true }),
    );
    TestBed.flushEffects();
    fixture.detectChanges();

    expect(panel.popover.isVisible()).toBe(true);
    // The pointer resolver is bound but never runs for keyboard opens; the
    // fixed datum wins over stale pointer context.
    expect(panel.context()).toEqual({ id: 1, name: 'FromData' });
  });

  it('aria-haspopup=menu and aria-expanded track the owned open as computeds', () => {
    const { fixture, target, panel } = setupData();
    expect(target.getAttribute('aria-haspopup')).toBe('menu');
    expect(target.getAttribute('aria-expanded')).toBe('false');

    rightClick(target);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(target.getAttribute('aria-expanded')).toBe('true');

    panel.popover.hide();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(target.getAttribute('aria-expanded')).toBe('false');
  });
});
