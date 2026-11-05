import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { provideLayoutI18n, withLayoutI18nLabels } from '../i18n/layout-i18n';
import { CngxPanelTrigger } from '../panel-trigger/panel-trigger.directive';
import { CngxSidebar, type CngxSidebarCollapsedAs } from './sidebar.directive';

@Component({
  template: `
    <button type="button" class="trigger" [cngxPanelTrigger]="sidebar"></button>
    <aside
      cngxSidebar
      #sidebar="cngxSidebar"
      [(collapsed)]="collapsed"
      [collapsedAs]="collapsedAs()"
      [expandOnHover]="expandOnHover()"
      [label]="label()"
      [expandDelay]="50"
    >
      <a href="#a" class="inside">Inbox</a>
    </aside>
    <button type="button" class="outside">Outside</button>
  `,
  imports: [CngxSidebar, CngxPanelTrigger],
})
class Host {
  readonly collapsed = signal(false);
  readonly collapsedAs = signal<CngxSidebarCollapsedAs>('rail');
  readonly expandOnHover = signal(true);
  readonly label = signal<string | undefined>(undefined);
}

@Component({
  template: `<nav id="main-nav" cngxSidebar [role]="null"></nav>`,
  imports: [CngxSidebar],
})
class StaticIdHost {}

function setup(providers: unknown[] = []) {
  TestBed.configureTestingModule({ imports: [Host], providers: providers as never[] });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const root = fixture.nativeElement as HTMLElement;
  const q = (sel: string) => root.querySelector(sel) as HTMLElement;
  const el = q('aside');
  const sidebar = fixture.debugElement.children[1].injector.get(CngxSidebar);
  const set = (fn: (host: Host) => void) => {
    fn(fixture.componentInstance);
    fixture.detectChanges();
  };
  return { fixture, host: fixture.componentInstance, q, el, sidebar, set };
}

describe('CngxSidebar', () => {
  describe('ARIA', () => {
    it('renders a named complementary landmark with a generated id', () => {
      const { el } = setup();
      expect(el.getAttribute('role')).toBe('complementary');
      expect(el.getAttribute('aria-label')).toBe('Sidebar');
      expect(el.id).toMatch(/^cngx-sidebar/);
    });

    it('lets a bound label win over the i18n copy', () => {
      const { el, set } = setup();
      set((h) => h.label.set('Filters'));
      expect(el.getAttribute('aria-label')).toBe('Filters');
    });

    it('reads overridden layout copy', () => {
      const { el } = setup([
        provideLayoutI18n(withLayoutI18nLabels({ sidebarRegion: 'Seitenleiste' })),
      ]);
      expect(el.getAttribute('aria-label')).toBe('Seitenleiste');
    });

    it('keeps a static id and drops the role for null', () => {
      TestBed.configureTestingModule({ imports: [StaticIdHost] });
      const fixture = TestBed.createComponent(StaticIdHost);
      fixture.detectChanges();
      const nav = (fixture.nativeElement as HTMLElement).querySelector('nav') as HTMLElement;
      expect(nav.id).toBe('main-nav');
      expect(nav.hasAttribute('role')).toBe(false);
    });

    it('keeps a collapsed rail operable', () => {
      const { el, set } = setup();
      set((h) => h.collapsed.set(true));
      expect(el.getAttribute('data-sidebar-state')).toBe('rail');
      expect(el.hasAttribute('inert')).toBe(false);
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });

    it('conceals the hidden variant with inert and aria-hidden', () => {
      const { el, set } = setup();
      set((h) => {
        h.collapsedAs.set('hidden');
        h.collapsed.set(true);
      });
      expect(el.getAttribute('data-sidebar-state')).toBe('hidden');
      expect(el.hasAttribute('inert')).toBe(true);
      expect(el.getAttribute('aria-hidden')).toBe('true');

      set((h) => h.collapsed.set(false));
      expect(el.hasAttribute('inert')).toBe(false);
      expect(el.hasAttribute('aria-hidden')).toBe(false);
    });
  });

  describe('reserved size', () => {
    it('sizes the host from the state tokens', () => {
      const { el, set } = setup();
      expect(el.style.inlineSize).toBe('var(--cngx-sidebar-size, 16rem)');
      set((h) => h.collapsed.set(true));
      expect(el.style.inlineSize).toBe('var(--cngx-sidebar-rail-size, 3.5rem)');
      set((h) => h.collapsedAs.set('hidden'));
      expect(el.style.inlineSize).toBe('0px');
    });
  });

  describe('panel target', () => {
    it('wires a panel trigger through the exported instance', () => {
      const { el, q, host, fixture } = setup();
      const trigger = q('.trigger');
      expect(trigger.getAttribute('aria-controls')).toBe(el.id);
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      trigger.click();
      fixture.detectChanges();
      expect(host.collapsed()).toBe(true);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('toggles, pins and peeks through the methods', () => {
      const { sidebar, host, fixture } = setup();
      sidebar.toggle();
      fixture.detectChanges();
      expect(host.collapsed()).toBe(true);
      expect(sidebar.expanded()).toBe(false);

      sidebar.peek();
      expect(sidebar.peeked()).toBe(true);
      expect(sidebar.expanded()).toBe(true);
      expect(sidebar.state()).toBe('peek');

      sidebar.pin();
      fixture.detectChanges();
      expect(host.collapsed()).toBe(false);
      expect(sidebar.peeked()).toBe(false);
    });

    it('ignores peek() while expanded', () => {
      const { sidebar } = setup();
      sidebar.peek();
      expect(sidebar.peeked()).toBe(false);
    });
  });

  describe('peek', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    function hover(el: HTMLElement, enter: boolean) {
      el.dispatchEvent(new PointerEvent(enter ? 'pointerenter' : 'pointerleave'));
    }

    it('peeks a collapsed sidebar after the hover dwell and overlays without reflow', () => {
      const { el, sidebar, set, fixture } = setup();
      set((h) => h.collapsed.set(true));

      hover(el, true);
      vi.advanceTimersByTime(49);
      expect(sidebar.peeked()).toBe(false);
      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(sidebar.peeked()).toBe(true);
      expect(el.getAttribute('data-sidebar-state')).toBe('peek');
      expect(el.style.inlineSize).toBe('var(--cngx-sidebar-size, 16rem)');
      expect(el.style.marginInlineEnd).toBe(
        'calc(var(--cngx-sidebar-rail-size, 3.5rem) - var(--cngx-sidebar-size, 16rem))',
      );

      hover(el, false);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(sidebar.peeked()).toBe(false);
      expect(el.style.marginInlineEnd).toBe('');
    });

    it('does not hover-peek with expandOnHover off or while expanded', () => {
      const { el, sidebar, set } = setup();
      hover(el, true);
      vi.advanceTimersByTime(50);
      expect(sidebar.peeked()).toBe(false);

      set((h) => {
        h.collapsed.set(true);
        h.expandOnHover.set(false);
      });
      expect(sidebar.peeked()).toBe(false);
    });

    it('ends a hover peek on Escape until the next hover', () => {
      const { el, q, sidebar, set } = setup();
      set((h) => h.collapsed.set(true));
      hover(el, true);
      vi.advanceTimersByTime(50);
      expect(sidebar.peeked()).toBe(true);

      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(sidebar.peeked()).toBe(false);

      hover(el, false);
      vi.advanceTimersByTime(0);
      hover(el, true);
      vi.advanceTimersByTime(50);
      expect(sidebar.peeked()).toBe(true);
    });

    it('ends an explicit peek on Escape', () => {
      const { q, sidebar, set } = setup();
      set((h) => h.collapsed.set(true));
      sidebar.peek();
      q('.inside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(sidebar.peeked()).toBe(false);
    });

    it('ends a hover peek on Escape while focus sits outside the host', () => {
      const { el, q, sidebar, set, fixture } = setup();
      set((h) => h.collapsed.set(true));
      q('.outside').focus();
      hover(el, true);
      vi.advanceTimersByTime(50);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(sidebar.peeked()).toBe(true);

      q('.outside').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

      expect(sidebar.peeked()).toBe(false);
    });

    it('listens on the document only while peeked', () => {
      const { sidebar, set, fixture } = setup();
      const added = vi.spyOn(document, 'addEventListener');
      const removed = vi.spyOn(document, 'removeEventListener');
      const keydownCalls = (spy: typeof added) =>
        spy.mock.calls.filter(([type]) => type === 'keydown').length;
      set((h) => h.collapsed.set(true));
      TestBed.flushEffects();
      expect(keydownCalls(added)).toBe(0);

      sidebar.peek();
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(keydownCalls(added)).toBe(1);

      document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(sidebar.peeked()).toBe(false);
      expect(keydownCalls(removed)).toBe(1);
      added.mockRestore();
      removed.mockRestore();
    });

    it('ends an explicit peek when focus leaves the host, not when it moves inside', () => {
      const { q, sidebar, set } = setup();
      set((h) => h.collapsed.set(true));
      sidebar.peek();
      const inside = q('.inside');

      inside.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: q('aside') }),
      );
      expect(sidebar.peeked()).toBe(true);

      inside.dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: q('.outside') }),
      );
      expect(sidebar.peeked()).toBe(false);
    });
  });
});
