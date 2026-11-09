import { Component, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CNGX_HOTKEY_SCOPE, CngxHotkeyScope, injectHotkey } from '@cngx/common/interactive';

import { type CngxDrawerModality, CngxDrawerSurface } from './drawer-surface.directive';

interface FakeWatcher {
  onclose: (() => void) | null;
  destroy: ReturnType<typeof vi.fn>;
}

let mockTrap: {
  enabled: boolean;
  hasAttached: () => boolean;
  attachAnchors: ReturnType<typeof vi.fn>;
  focusFirstTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

@Component({
  template: `
    <button class="opener">Open</button>
    <section class="scope" [style.overflow-y]="scrolling() ? 'auto' : null">
      <aside
        id="surface"
        cngxDrawerSurface
        [active]="active()"
        [modality]="modality()"
        [role]="role()"
        (dismiss)="dismissed()"
      >
        <button class="inside">Inside</button>
      </aside>
      <main class="sibling">Content</main>
      <div class="already-inert" inert>Inert</div>
      <div class="inner-bar">
        <button class="inner-controller" aria-controls="surface">Inner toggle</button>
        <span class="inner-text">Title</span>
      </div>
    </section>
    <button class="controller" aria-controls="surface">Toggle</button>
    <button class="outside">Outside</button>
  `,
  imports: [CngxDrawerSurface],
})
class TestHost {
  readonly active = signal(false);
  readonly modality = signal<CngxDrawerModality>('page');
  readonly scrolling = signal(false);
  readonly role = signal<string | null>('complementary');
  dismissed = vi.fn();
}

@Component({
  template: `
    <h2 id="surface-title">Filters</h2>
    <aside cngxDrawerSurface [active]="true" aria-labelledby="surface-title">
      <button>Inside</button>
    </aside>
    <aside cngxDrawerSurface [active]="true" aria-label="Static name" class="static-label">
      <button>Inside</button>
    </aside>
  `,
  imports: [CngxDrawerSurface],
})
class StaticNameHost {}

@Component({
  template: `
    <aside cngxDrawerSurface [active]="true" modality="none" (dismiss)="outer()">
      <button class="outer-inside">Outer</button>
      <div popover="manual" class="menu"><button class="menu-item">Item</button></div>
      <section cngxDrawerSurface [active]="true" modality="none" (dismiss)="inner()">
        <button class="inner-inside">Inner</button>
      </section>
    </aside>
  `,
  imports: [CngxDrawerSurface],
})
class LayeredHost {
  outer = vi.fn();
  inner = vi.fn();
}

describe('CngxDrawerSurface', () => {
  let watchers: FakeWatcher[];

  beforeEach(() => {
    watchers = [];
    vi.stubGlobal(
      'CloseWatcher',
      class {
        onclose: (() => void) | null = null;
        destroy = vi.fn();
        constructor() {
          watchers.push(this);
        }
      },
    );
    mockTrap = {
      enabled: false,
      hasAttached: () => true,
      attachAnchors: vi.fn(),
      focusFirstTabbableElementWhenReady: vi.fn(),
      destroy: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [TestHost, StaticNameHost, LayeredHost],
      providers: [{ provide: FocusTrapFactory, useValue: { create: vi.fn(() => mockTrap) } }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.overflow = '';
    document.documentElement.style.scrollbarGutter = '';
  });

  function setup(configure?: (host: TestHost) => void) {
    const fixture = TestBed.createComponent(TestHost);
    configure?.(fixture.componentInstance);
    fixture.detectChanges();
    TestBed.flushEffects();
    const root = fixture.nativeElement as HTMLElement;
    const q = (sel: string) => root.querySelector(sel) as HTMLElement;
    const set = (fn: (host: TestHost) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
      TestBed.flushEffects();
    };
    return { fixture, host: fixture.componentInstance, q, set, surface: q('aside') };
  }

  function press(target: Element) {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  }

  describe('page', () => {
    it('traps focus, renders a modal dialog and inerts the host siblings', () => {
      const { q, set, surface } = setup();
      set((h) => h.active.set(true));

      expect(mockTrap.enabled).toBe(true);
      expect(surface.getAttribute('role')).toBe('dialog');
      expect(surface.getAttribute('aria-modal')).toBe('true');
      expect(q('.sibling').hasAttribute('inert')).toBe(true);
      expect(surface.hasAttribute('inert')).toBe(false);
    });

    it('inerts everything outside the host up to body and releases it', () => {
      const bodyLevel = document.createElement('div');
      document.body.appendChild(bodyLevel);
      try {
        const { q, set, surface } = setup();
        set((h) => h.active.set(true));

        expect(q('.outside').hasAttribute('inert')).toBe(true);
        expect(q('.controller').hasAttribute('inert')).toBe(true);
        expect(q('.opener').hasAttribute('inert')).toBe(true);
        expect(q('.inner-bar').hasAttribute('inert')).toBe(true);
        expect(bodyLevel.hasAttribute('inert')).toBe(true);
        expect(q('.scope').hasAttribute('inert')).toBe(false);
        expect(surface.parentElement?.closest('[inert]')).toBeNull();

        set((h) => h.active.set(false));
        expect(q('.outside').hasAttribute('inert')).toBe(false);
        expect(bodyLevel.hasAttribute('inert')).toBe(false);
      } finally {
        bodyLevel.remove();
      }
    });

    it('releases inert when destroyed while engaged', () => {
      const { fixture, q, set } = setup();
      set((h) => h.active.set(true));
      const sibling = q('.sibling');
      const outside = q('.outside');
      fixture.destroy();

      expect(sibling.hasAttribute('inert')).toBe(false);
      expect(outside.hasAttribute('inert')).toBe(false);
    });

    it('locks the document root when no scroll container is above the host', () => {
      const { set } = setup();
      set((h) => h.active.set(true));
      expect(document.documentElement.style.overflow).toBe('hidden');

      set((h) => h.active.set(false));
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });

    it('locks the nearest scroll container instead of the document root', () => {
      const { q, set } = setup((h) => h.scrolling.set(true));
      set((h) => h.active.set(true));

      expect(q('.scope').style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });

    it('releases inert on deactivate and keeps a pre-existing inert', () => {
      const { q, set } = setup();
      set((h) => h.active.set(true));
      set((h) => h.active.set(false));

      expect(q('.sibling').hasAttribute('inert')).toBe(false);
      expect(q('.already-inert').hasAttribute('inert')).toBe(true);
      expect(mockTrap.enabled).toBe(false);
    });
  });

  describe('contained', () => {
    const contained = (h: TestHost) => h.modality.set('contained');

    it('keeps the landmark role: no dialog, no aria-modal, no trap', () => {
      const { set, surface } = setup(contained);
      set((h) => h.active.set(true));

      expect(surface.getAttribute('role')).toBe('complementary');
      expect(surface.hasAttribute('aria-modal')).toBe(false);
      expect(mockTrap.enabled).toBe(false);
    });

    it('moves focus into the host on activation', () => {
      const { set } = setup(contained);
      set((h) => h.active.set(true));
      expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalledTimes(1);
    });

    it('inerts the host siblings inside the boundary and nothing outside it', () => {
      const { q, set } = setup(contained);
      set((h) => h.active.set(true));

      expect(q('.sibling').hasAttribute('inert')).toBe(true);
      expect(q('.inner-text').hasAttribute('inert')).toBe(true);
      expect(q('.scope').hasAttribute('inert')).toBe(false);
      expect(q('.opener').hasAttribute('inert')).toBe(false);
      expect(q('.outside').hasAttribute('inert')).toBe(false);
      expect(q('.controller').hasAttribute('inert')).toBe(false);

      set((h) => h.active.set(false));
      expect(q('.sibling').hasAttribute('inert')).toBe(false);
      expect(q('.inner-text').hasAttribute('inert')).toBe(false);
      expect(q('.already-inert').hasAttribute('inert')).toBe(true);
    });

    it('never inerts the aria-controls owner inside the boundary', () => {
      const { q, set } = setup(contained);
      set((h) => h.active.set(true));

      expect(q('.inner-controller').hasAttribute('inert')).toBe(false);
      expect(q('.inner-bar').hasAttribute('inert')).toBe(false);
    });

    it('locks a scroll container inside the boundary, never the document root', () => {
      const { q, set } = setup((h) => {
        contained(h);
        h.scrolling.set(true);
      });
      set((h) => h.active.set(true));

      expect(q('.scope').style.overflow).toBe('hidden');
      expect(document.documentElement.style.overflow).not.toBe('hidden');

      set((h) => h.active.set(false));
      expect(q('.scope').style.overflow).not.toBe('hidden');
    });

    it('locks nothing when nothing between the host and the boundary scrolls', () => {
      const { q, set } = setup(contained);
      set((h) => h.active.set(true));

      expect(q('.scope').style.overflow).not.toBe('hidden');
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });

    it('asks for dismissal on Escape and on a press outside the boundary', () => {
      const { host, q, set } = setup(contained);
      set((h) => h.active.set(true));
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      press(q('.outside'));
      expect(host.dismissed).toHaveBeenCalledTimes(2);
    });

    it('restores focus to the opener on deactivate', () => {
      const { q, set } = setup(contained);
      q('.opener').focus();
      set((h) => h.active.set(true));
      q('.inside').focus();

      set((h) => h.active.set(false));

      expect(document.activeElement).toBe(q('.opener'));
    });
  });

  describe('none', () => {
    it('keeps the page operable: no trap, no inert, no lock, complementary', () => {
      const { q, set, surface } = setup((h) => h.modality.set('none'));
      set((h) => h.active.set(true));

      expect(mockTrap.enabled).toBe(false);
      expect(surface.getAttribute('role')).toBe('complementary');
      expect(surface.hasAttribute('aria-modal')).toBe(false);
      expect(q('.sibling').hasAttribute('inert')).toBe(false);
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });
  });

  describe('role', () => {
    it('renders a consumer role and drops it on null outside an engaged page modal', () => {
      const { surface, set } = setup((h) => h.role.set('navigation'));
      expect(surface.getAttribute('role')).toBe('navigation');

      set((h) => h.role.set(null));
      expect(surface.hasAttribute('role')).toBe(false);

      set((h) => h.active.set(true));
      expect(surface.getAttribute('role')).toBe('dialog');

      set((h) => h.modality.set('contained'));
      expect(surface.hasAttribute('role')).toBe(false);
    });
  });

  describe('focus host', () => {
    it('takes tabindex="-1" while engaged so a press inside keeps focus on the host', () => {
      const { surface, set } = setup((h) => h.modality.set('none'));
      expect(surface.hasAttribute('tabindex')).toBe(false);

      set((h) => h.active.set(true));
      expect(surface.getAttribute('tabindex')).toBe('-1');

      set((h) => h.active.set(false));
      expect(surface.hasAttribute('tabindex')).toBe(false);
    });
  });

  describe('name', () => {
    it('names an engaged page modal with the layout i18n fallback only', () => {
      const { surface, set } = setup();
      expect(surface.hasAttribute('aria-label')).toBe(false);

      set((h) => h.active.set(true));
      expect(surface.getAttribute('role')).toBe('dialog');
      expect(surface.getAttribute('aria-label')).toBe('Drawer');

      set((h) => h.modality.set('none'));
      expect(surface.hasAttribute('aria-label')).toBe(false);
    });

    it('keeps a static aria-labelledby and a static aria-label', () => {
      const fixture = TestBed.createComponent(StaticNameHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const root = fixture.nativeElement as HTMLElement;
      const labelledBy = root.querySelector('aside[aria-labelledby]') as HTMLElement;
      const labelled = root.querySelector('aside.static-label') as HTMLElement;

      expect(labelledBy.getAttribute('role')).toBe('dialog');
      expect(labelledBy.hasAttribute('aria-label')).toBe(false);
      expect(labelled.getAttribute('aria-label')).toBe('Static name');
    });
  });

  describe('Escape layers', () => {
    function layered() {
      const fixture = TestBed.createComponent(LayeredHost);
      fixture.detectChanges();
      TestBed.flushEffects();
      const root = fixture.nativeElement as HTMLElement;
      const escapeOn = (sel: string) =>
        (root.querySelector(sel) as HTMLElement).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
        );
      const menu = root.querySelector('.menu') as HTMLElement;
      return { host: fixture.componentInstance, escapeOn, menu };
    }

    it('dismisses only the innermost surface', () => {
      const { host, escapeOn } = layered();
      escapeOn('.inner-inside');
      expect(host.inner).toHaveBeenCalledTimes(1);
      expect(host.outer).not.toHaveBeenCalled();
    });

    it('leaves the Escape to an open popover inside the host', () => {
      const { host, escapeOn, menu } = layered();
      const open = vi
        .spyOn(menu, 'matches')
        .mockImplementation((selector) => selector === ':popover-open');

      escapeOn('.menu-item');
      expect(host.outer).not.toHaveBeenCalled();

      open.mockReturnValue(false);
      escapeOn('.outer-inside');
      expect(host.outer).toHaveBeenCalledTimes(1);
    });
  });

  describe('dismiss', () => {
    it('asks on Escape inside the host', () => {
      const { host, set, q } = setup();
      set((h) => h.active.set(true));
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(host.dismissed).toHaveBeenCalledTimes(1);
    });

    it('asks on the back gesture and re-arms while still engaged', () => {
      const { host, set } = setup();
      set((h) => h.active.set(true));
      expect(watchers).toHaveLength(1);

      watchers[0].onclose?.();
      expect(host.dismissed).toHaveBeenCalledTimes(1);
      expect(watchers).toHaveLength(2);
    });

    it('destroys the watcher on deactivate', () => {
      const { set } = setup();
      set((h) => h.active.set(true));
      set((h) => h.active.set(false));
      expect(watchers[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('drops the back close Chromium derives from the same Escape', () => {
      const { host, set, q } = setup();
      set((h) => h.active.set(true));
      const watcher = watchers[0];
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      watcher.onclose?.();
      expect(host.dismissed).toHaveBeenCalledTimes(1);
    });

    it('drops the close Chromium derives from an Escape outside the host', () => {
      const { host, set, q } = setup((h) => h.modality.set('none'));
      set((h) => h.active.set(true));
      q('.outside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      watchers[0].onclose?.();
      expect(host.dismissed).not.toHaveBeenCalled();
    });

    it('keeps a watcher armed for the back gesture after an Escape close', () => {
      vi.useFakeTimers();
      const { host, set, q } = setup();
      set((h) => h.active.set(true));
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      watchers[0].onclose?.();
      expect(watchers).toHaveLength(2);

      vi.runAllTimers();
      watchers[1].onclose?.();

      expect(host.dismissed).toHaveBeenCalledTimes(2);
    });

    it('clears the pending Escape flag and the listener when destroyed', () => {
      const { fixture, set, q } = setup();
      set((h) => h.active.set(true));
      const scheduled = vi.spyOn(globalThis, 'setTimeout');
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const ids = scheduled.mock.results.map((r) => r.value as unknown);
      scheduled.mockRestore();
      const cleared = vi.spyOn(globalThis, 'clearTimeout');
      const removed = vi.spyOn(document, 'removeEventListener');

      fixture.destroy();

      const clearedIds = cleared.mock.calls.map(([id]) => id as unknown);
      const removedKeydown = removed.mock.calls.some(([type]) => type === 'keydown');
      cleared.mockRestore();
      removed.mockRestore();
      expect(ids.some((id) => clearedIds.includes(id))).toBe(true);
      expect(removedKeydown).toBe(true);
      expect(watchers[0].destroy).toHaveBeenCalledTimes(1);
    });

    it('asks on a press outside the host', () => {
      const { host, set, q } = setup();
      set((h) => h.active.set(true));
      press(q('.outside'));
      expect(host.dismissed).toHaveBeenCalledTimes(1);
    });

    it('ignores a press on the controller and inside the host', () => {
      const { host, set, q } = setup((h) => h.modality.set('none'));
      set((h) => h.active.set(true));
      press(q('.controller'));
      press(q('.inside'));
      expect(host.dismissed).not.toHaveBeenCalled();
    });

    it('asks nothing while inactive', () => {
      const { host, q } = setup();
      press(q('.outside'));
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(host.dismissed).not.toHaveBeenCalled();
      expect(watchers).toHaveLength(0);
    });
  });

  it('restores focus to the opener on deactivate', () => {
    const { q, set } = setup((h) => h.modality.set('none'));
    q('.opener').focus();
    set((h) => h.active.set(true));
    q('.inside').focus();

    set((h) => h.active.set(false));

    expect(document.activeElement).toBe(q('.opener'));
  });

  it('restores focus to the opener after the modal scope is released', () => {
    const { q, set } = setup();
    const opener = q('.opener');
    opener.focus();
    set((h) => h.active.set(true));
    q('.inside').focus();
    // focus() on an inert element is a no-op in browsers; record the state
    // the restore sees.
    const inertAtFocus: boolean[] = [];
    const nativeFocus = HTMLElement.prototype.focus;
    vi.spyOn(opener, 'focus').mockImplementation((options?: FocusOptions) => {
      inertAtFocus.push(opener.closest('[inert]') !== null);
      nativeFocus.call(opener, options);
    });

    set((h) => h.active.set(false));

    expect(inertAtFocus).toEqual([false]);
    expect(document.activeElement).toBe(opener);
  });

  it('restores focus to the opener when a page scope is released by an Escape dismissal', () => {
    const { host, q, set } = setup();
    host.dismissed.mockImplementation(() => host.active.set(false));
    const opener = q('.opener');
    opener.focus();
    set((h) => h.active.set(true));
    q('.inside').focus();

    q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    set(() => undefined);

    expect(q('.sibling').hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });
});

// ── Hotkey scope ────────────────────────────────────────────────────────

@Component({
  selector: 'cngx-test-drawer-hotkey-body',
  template: `<button type="button" class="drawer-inside">Inside</button>`,
})
class DrawerHotkeyBody {
  readonly scope = inject(CNGX_HOTKEY_SCOPE);
  readonly fired = signal(0);
  readonly ref = injectHotkey({
    id: 'test.drawer.toggle',
    combo: 'ctrl+b',
    run: () => this.fired.update((n) => n + 1),
  });
}

@Component({
  selector: 'cngx-test-drawer-muted-body',
  template: `<button type="button" class="muted-inside">Muted</button>`,
})
class DrawerMutedBody {
  readonly fired = signal(0);
  readonly ref = injectHotkey({
    id: 'test.drawer.muted',
    combo: 'ctrl+m',
    run: () => this.fired.update((n) => n + 1),
  });
}

@Component({
  template: `
    <div cngxHotkeyScope #outer="cngxHotkeyScope">
      <button type="button" class="page-outside">Outside</button>
      <aside cngxDrawerSurface [active]="active()" [modality]="modality()">
        <cngx-test-drawer-hotkey-body />
        <div cngxHotkeyScope [cngxHotkeyScopeActive]="false">
          <cngx-test-drawer-muted-body />
        </div>
      </aside>
    </div>
  `,
  imports: [CngxDrawerSurface, CngxHotkeyScope, DrawerHotkeyBody, DrawerMutedBody],
})
class HotkeyDrawerHost {
  readonly active = signal(false);
  readonly modality = signal<CngxDrawerModality>('page');
  readonly outer = viewChild.required(CngxHotkeyScope);
  readonly surface = viewChild.required(CngxDrawerSurface);
  readonly body = viewChild.required(DrawerHotkeyBody);
  readonly muted = viewChild.required(DrawerMutedBody);
  readonly appFired = signal(0);
  readonly appRef = injectHotkey({
    id: 'test.app.save',
    combo: 'ctrl+s',
    run: () => this.appFired.update((n) => n + 1),
  });
}

describe('CngxDrawerSurface hotkey scope', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'CloseWatcher',
      class {
        onclose: (() => void) | null = null;
        destroy = vi.fn();
      },
    );
    mockTrap = {
      enabled: false,
      hasAttached: () => true,
      attachAnchors: vi.fn(),
      focusFirstTabbableElementWhenReady: vi.fn(),
      destroy: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: FocusTrapFactory, useValue: { create: vi.fn(() => mockTrap) } }],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.style.overflow = '';
    document.documentElement.style.scrollbarGutter = '';
  });

  function setupHotkeys() {
    const fixture = TestBed.createComponent(HotkeyDrawerHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const root = fixture.nativeElement as HTMLElement;
    const q = (sel: string) => root.querySelector(sel) as HTMLElement;
    const set = (fn: (host: HotkeyDrawerHost) => void) => {
      fn(fixture.componentInstance);
      fixture.detectChanges();
      TestBed.flushEffects();
    };
    return { host: fixture.componentInstance, q, set };
  }

  function pressCombo(target: Element, key: string): void {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, ctrlKey: true, bubbles: true, cancelable: true }),
    );
  }

  it('hands its children the surface scope, parented to the outer scope', () => {
    const { host } = setupHotkeys();
    const scope = host.body().scope;

    expect(scope).toBe(host.surface().hotkeyScope);
    expect(scope.parent).toBe(host.outer().node);
  });

  it('an engaged page surface blocks app bindings and fires its own inside', () => {
    const { host, q, set } = setupHotkeys();
    set((h) => h.active.set(true));

    pressCombo(q('.drawer-inside'), 's');
    expect(host.appFired()).toBe(0);
    pressCombo(q('.drawer-inside'), 'b');
    expect(host.body().fired()).toBe(1);
  });

  it('fires the drawer binding from outside while the modality is none', () => {
    const { host, q, set } = setupHotkeys();
    set((h) => h.modality.set('none'));

    pressCombo(q('.page-outside'), 'b');
    expect(host.body().fired()).toBe(1);

    set((h) => h.active.set(true));
    pressCombo(q('.page-outside'), 'b');
    pressCombo(q('.drawer-inside'), 's');
    expect(host.body().fired()).toBe(2);
    expect(host.appFired()).toBe(1);
  });

  it('mutes content in an inactive scope inside the surface', () => {
    const { host, q, set } = setupHotkeys();
    set((h) => h.active.set(true));

    expect(host.muted().ref.muted()).toBe(true);
    pressCombo(q('.muted-inside'), 'm');
    expect(host.muted().fired()).toBe(0);
  });
});
