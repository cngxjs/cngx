import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxDrawerSurface } from './drawer-surface.directive';

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
        [modal]="modal()"
        (dismiss)="dismissed()"
      >
        <button class="inside">Inside</button>
      </aside>
      <main class="sibling">Content</main>
      <div class="already-inert" inert>Inert</div>
    </section>
    <button class="controller" aria-controls="surface">Toggle</button>
    <button class="outside">Outside</button>
  `,
  imports: [CngxDrawerSurface],
})
class TestHost {
  readonly active = signal(false);
  readonly modal = signal(true);
  readonly scrolling = signal(false);
  dismissed = vi.fn();
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
      imports: [TestHost],
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

  describe('modal', () => {
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

  describe('non-modal', () => {
    it('keeps the page operable: no trap, no inert, no lock, complementary', () => {
      const { q, set, surface } = setup((h) => h.modal.set(false));
      set((h) => h.active.set(true));

      expect(mockTrap.enabled).toBe(false);
      expect(surface.getAttribute('role')).toBe('complementary');
      expect(surface.hasAttribute('aria-modal')).toBe(false);
      expect(q('.sibling').hasAttribute('inert')).toBe(false);
      expect(document.documentElement.style.overflow).not.toBe('hidden');
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

    it('asks on a press outside the host', () => {
      const { host, set, q } = setup();
      set((h) => h.active.set(true));
      press(q('.outside'));
      expect(host.dismissed).toHaveBeenCalledTimes(1);
    });

    it('ignores a press on the controller and inside the host', () => {
      const { host, set, q } = setup((h) => h.modal.set(false));
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
    const { q, set } = setup((h) => h.modal.set(false));
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
});
