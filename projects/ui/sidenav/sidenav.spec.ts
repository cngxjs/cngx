import { Component, signal, type DebugElement, type Signal, type Type } from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import { CngxPanelTrigger } from '@cngx/common/layout';
import {
  CNGX_HOTKEY_REGISTRY,
  type CngxHotkeyBinding,
  type CngxHotkeyScopeNode,
  createHotkeyRegistry,
  injectHotkeyRegistryDeps,
} from '@cngx/common/interactive';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createMatchMediaMock,
  stripBidiIsolates,
  createResizeObserverMock,
  type MatchMediaMock,
  type ResizeObserverMock,
} from '@cngx/testing';
import type { SidenavMode } from './sidenav';
import { CngxSidenav } from './sidenav';
import { CngxSidenavLayout } from './sidenav-layout';
import { CngxSidenavContent } from './sidenav-content';
import { CNGX_SIDENAV_ANNOUNCER_FACTORY } from './sidenav-announcer';
import { provideSidenavConfig } from './config/provide-sidenav-config';
import { withSidenavShortcut } from './config/features';
import {
  withSidenavDimensions,
  withSidenavHoverDwell,
  withSidenavLabels,
  withSidenavPersistence,
} from './config/features';
import { CNGX_SIDENAV_STORAGE } from './config/sidenav.config.defaults';
import type { CngxSidenavLabels } from './config/sidenav.config';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav
        position="start"
        [(opened)]="leftOpen"
        [mode]="mode()"
        [width]="width()"
        [resizable]="resizable()"
        [ariaLabel]="ariaLabel()"
        [miniWidth]="miniWidth()"
        [expandOnHover]="expandOnHover()"
        [(collapsed)]="leftCollapsed"
        [collapsedAs]="collapsedAs()"
      >
        Left content
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
      <cngx-sidenav position="end" mode="over" [(opened)]="rightOpen"> Right content </cngx-sidenav>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class DualHost {
  leftOpen = signal(false);
  rightOpen = signal(false);
  mode = signal<SidenavMode>('over');
  width = signal('240px');
  resizable = signal(false);
  ariaLabel = signal<string | undefined>(undefined);
  miniWidth = signal('56px');
  expandOnHover = signal(true);
  leftCollapsed = signal(false);
  collapsedAs = signal<'rail' | 'hidden'>('rail');
}

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" [(opened)]="open" [mode]="mode()">
        <button type="button" class="nav-item">Nav</button>
      </cngx-sidenav>
      <cngx-sidenav-content><button type="button" class="content-item">Content</button></cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class AutoModeHost {
  open = signal(false);
  mode = signal<SidenavMode>('auto');
}

@Component({
  template: `<cngx-sidenav id="main-nav">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class StaticIdHost {}

@Component({
  template: `<cngx-sidenav position="start" [(opened)]="open">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class StandaloneRailHost {
  open = signal(false);
}

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="end" [resizable]="true" [(opened)]="open">End</cngx-sidenav>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav],
})
class EndResizableHost {
  open = signal(true);
}

@Component({
  template: `<cngx-sidenav [shortcut]="shortcut()" [mode]="mode()" [(opened)]="open"
    >Nav</cngx-sidenav
  >`,
  imports: [CngxSidenav],
})
class ShortcutHost {
  open = signal(false);
  shortcut = signal<string | undefined>('mod+b');
  mode = signal<SidenavMode>('over');
}

@Component({
  template: `<cngx-sidenav>Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class UnboundHost {}

@Component({
  template: `<cngx-sidenav [width]="'500px'">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class BoundWidthHost {}

@Component({
  template: `<cngx-sidenav mode="side" [collapsed]="true" [expandDelay]="expandDelay()"
    >Nav</cngx-sidenav
  >`,
  imports: [CngxSidenav],
})
class RailDwellHost {
  expandDelay = signal(200);
}

@Component({
  template: `<cngx-sidenav mode="side" [collapsed]="true">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class RailUnboundHost {}

describe('CngxSidenav', () => {
  afterEach(() => vi.restoreAllMocks());

  function setupDual() {
    const fixture = TestBed.createComponent(DualHost);
    fixture.detectChanges();
    const layout = fixture.debugElement
      .query(By.directive(CngxSidenavLayout))
      .injector.get(CngxSidenavLayout);
    const sidenavs = fixture.debugElement.queryAll(By.directive(CngxSidenav));
    const left = sidenavs
      .find((d) => d.injector.get(CngxSidenav).position() === 'start')!
      .injector.get(CngxSidenav);
    const right = sidenavs
      .find((d) => d.injector.get(CngxSidenav).position() === 'end')!
      .injector.get(CngxSidenav);
    const content = fixture.debugElement
      .query(By.directive(CngxSidenavContent))
      .injector.get(CngxSidenavContent);
    return { fixture, layout, left, right, content, host: fixture.componentInstance };
  }

  it('starts closed', () => {
    const { left, right } = setupDual();
    expect(left.opened()).toBe(false);
    expect(right.opened()).toBe(false);
  });

  it('opens via model two-way binding', () => {
    const { fixture, left, host } = setupDual();
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(left.opened()).toBe(true);
  });

  it('keeps at most one overlay open per layout: opening one closes the other', () => {
    const { fixture, left, right, host } = setupDual();
    left.open();
    fixture.detectChanges();
    expect(host.leftOpen()).toBe(true);

    right.toggle();
    fixture.detectChanges();
    expect(host.rightOpen()).toBe(true);
    expect(host.leftOpen()).toBe(false);

    left.open();
    fixture.detectChanges();
    expect(host.leftOpen()).toBe(true);
    expect(host.rightOpen()).toBe(false);
  });

  it('leaves a docked rail alone when the other rail opens its overlay', () => {
    const { fixture, left, right, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    right.open();
    fixture.detectChanges();
    expect(host.rightOpen()).toBe(true);
    expect(host.leftCollapsed()).toBe(false);
    expect(left.expanded()).toBe(true);
  });

  it('renders the backdrop always and shows it only for a modal overlay', () => {
    const { fixture, left, host } = setupDual();
    const layoutEl = fixture.nativeElement.querySelector('cngx-sidenav-layout') as HTMLElement;
    expect(layoutEl.querySelector('.cngx-sidenav-backdrop')).not.toBeNull();
    expect(layoutEl.classList.contains('cngx-sidenav-layout--has-overlay')).toBe(false);

    left.open();
    fixture.detectChanges();
    expect(host.leftOpen()).toBe(true);
    expect(layoutEl.classList.contains('cngx-sidenav-layout--has-overlay')).toBe(true);
    expect(layoutEl.querySelector('.cngx-sidenav-backdrop')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('layout finds start and end sidenavs', () => {
    const { layout } = setupDual();
    expect(layout.startSidenav()).not.toBeNull();
    expect(layout.endSidenav()).not.toBeNull();
  });

  it('hasOverlay is true when overlay sidenav is open', () => {
    const { fixture, layout, host } = setupDual();
    expect(layout.hasOverlay()).toBe(false);
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(layout.hasOverlay()).toBe(true);
  });

  it('open/close/toggle methods work', () => {
    const { left } = setupDual();
    left.open();
    expect(left.opened()).toBe(true);
    left.close();
    expect(left.opened()).toBe(false);
    left.toggle();
    expect(left.opened()).toBe(true);
  });

  it('close() collapses a docked rail instead of no-op-ing (F2)', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    left.close();
    fixture.detectChanges();
    expect(host.leftCollapsed()).toBe(true);
    expect(left.expanded()).toBe(false);
    left.open();
    fixture.detectChanges();
    expect(host.leftCollapsed()).toBe(false);
  });

  it('toggle() flips collapsed on a docked rail and leaves opened alone', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    left.toggle();
    fixture.detectChanges();
    expect(host.leftCollapsed()).toBe(true);
    expect(host.leftOpen()).toBe(false);
    left.toggle();
    fixture.detectChanges();
    expect(host.leftCollapsed()).toBe(false);
  });

  it('content never applies margins (flex handles layout)', () => {
    const { fixture, content, host } = setupDual();
    host.mode.set('side');
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(content.marginStart).toBe('0');
    expect(content.marginEnd).toBe('0');

    host.mode.set('over');
    fixture.detectChanges();
    expect(content.marginStart).toBe('0');
  });

  it('adds position classes', () => {
    const { fixture, host } = setupDual();
    host.leftOpen.set(true);
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.classList.contains('cngx-sidenav--start')).toBe(true);
    expect(leftEl.classList.contains('cngx-sidenav--open')).toBe(true);
  });

  it('adds mode classes', () => {
    const { fixture, host } = setupDual();
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.classList.contains('cngx-sidenav--over')).toBe(true);
    host.mode.set('side');
    fixture.detectChanges();
    expect(leftEl.classList.contains('cngx-sidenav--side')).toBe(true);
    expect(leftEl.classList.contains('cngx-sidenav--over')).toBe(false);
  });

  it('closeAllOverlays closes all open overlay sidenavs', () => {
    const { fixture, layout, host } = setupDual();
    host.leftOpen.set(true);
    host.rightOpen.set(true);
    fixture.detectChanges();
    layout.closeAllOverlays();
    expect(host.leftOpen()).toBe(false);
    expect(host.rightOpen()).toBe(false);
  });

  it('Escape closes overlay sidenav', () => {
    const { fixture, host } = setupDual();
    host.leftOpen.set(true);
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    leftEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.leftOpen()).toBe(false);
  });

  it('outside dismiss listens on pointerdown, not click (open-race guard)', () => {
    const { fixture, host } = setupDual();
    const external = document.createElement('button');
    external.type = 'button';
    document.body.appendChild(external);

    host.leftOpen.set(true);
    fixture.detectChanges();

    // A click on an external element must NOT close the overlay - otherwise the
    // same click that opened it would bubble to the document and self-close it.
    external.dispatchEvent(new Event('click', { bubbles: true }));
    expect(host.leftOpen()).toBe(true);

    // A pointerdown outside the rail still dismisses (outside-click behaviour).
    external.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(host.leftOpen()).toBe(false);

    external.remove();
  });

  it('a toggle whose aria-controls names the rail closes the open overlay in one gesture', () => {
    const { fixture, host, left } = setupDual();
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', `other-panel ${left.id()}`);
    const icon = document.createElement('span');
    toggle.appendChild(icon);
    toggle.addEventListener('click', () => host.leftOpen.update((v) => !v));
    document.body.appendChild(toggle);

    host.leftOpen.set(true);
    fixture.detectChanges();

    icon.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(host.leftOpen()).toBe(true);
    icon.dispatchEvent(new Event('click', { bubbles: true }));
    expect(host.leftOpen()).toBe(false);

    toggle.remove();
  });

  it('a toggle for one rail still dismisses the other open overlay', () => {
    const { fixture, host, left } = setupDual();
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', left.id());
    document.body.appendChild(toggle);

    host.leftOpen.set(true);
    host.rightOpen.set(true);
    fixture.detectChanges();

    toggle.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(host.leftOpen()).toBe(true);
    expect(host.rightOpen()).toBe(false);

    toggle.remove();
  });

  it('a plain outside button without aria-controls still dismisses', () => {
    const { fixture, host } = setupDual();
    const plain = document.createElement('button');
    plain.type = 'button';
    document.body.appendChild(plain);

    host.leftOpen.set(true);
    fixture.detectChanges();

    plain.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(host.leftOpen()).toBe(false);

    plain.remove();
  });

  it('renders a generated id on each rail and keeps them distinct', () => {
    const { fixture, left, right } = setupDual();
    const [leftEl, rightEl] = fixture.debugElement
      .queryAll(By.directive(CngxSidenav))
      .map((d) => d.nativeElement as HTMLElement);
    expect(left.id()).toMatch(/^cngx-sidebar/);
    expect(leftEl.id).toBe(left.id());
    expect(rightEl.id).toBe(right.id());
    expect(left.id()).not.toBe(right.id());
  });

  it('keeps a static id attribute', () => {
    const fixture = TestBed.createComponent(StaticIdHost);
    fixture.detectChanges();
    const de = fixture.debugElement.query(By.directive(CngxSidenav));
    expect(de.injector.get(CngxSidenav).id()).toBe('main-nav');
    expect((de.nativeElement as HTMLElement).id).toBe('main-nav');
  });

  it('conceals a closed overlay sidenav (aria-hidden + inert)', () => {
    const { fixture, host } = setupDual();
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.getAttribute('aria-hidden')).toBe('true');
    expect(leftEl.hasAttribute('inert')).toBe(true);
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(leftEl.getAttribute('aria-hidden')).toBeNull();
    expect(leftEl.hasAttribute('inert')).toBe(false);
  });

  it('blurs focus held inside an overlay rail on close, before it flips to aria-hidden', () => {
    const { fixture, host } = setupDual();
    document.body.appendChild(fixture.nativeElement);
    try {
      const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
        .nativeElement as HTMLElement;
      host.leftOpen.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      // Simulate a keyboard user's focus landing on a control inside the rail.
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Reports';
      leftEl.appendChild(link);
      link.focus();
      expect(leftEl.contains(document.activeElement)).toBe(true);

      host.leftOpen.set(false);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(leftEl.getAttribute('aria-hidden')).toBe('true');
      expect(leftEl.contains(document.activeElement)).toBe(false);
    } finally {
      fixture.nativeElement.remove();
    }
  });

  it('does not set aria-hidden in side mode', () => {
    const { fixture, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.getAttribute('aria-hidden')).toBeNull();
  });

  it('runs the former push as side with collapsedAs="hidden"', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    host.collapsedAs.set('hidden');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.getAttribute('data-sidebar-state')).toBe('expanded');

    left.toggle();
    fixture.detectChanges();
    expect(host.leftCollapsed()).toBe(true);
    expect(leftEl.getAttribute('data-sidebar-state')).toBe('hidden');
    expect(leftEl.style.inlineSize).toBe('0px');
    expect(left.expanded()).toBe(false);

    left.toggle();
    fixture.detectChanges();
    expect(host.leftCollapsed()).toBe(false);
    expect(leftEl.getAttribute('data-sidebar-state')).toBe('expanded');
    expect(left.expanded()).toBe(true);
  });

  it('leaves opened alone when a pinned mode switches from side to over', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    host.leftOpen.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('side');

    host.mode.set('over');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('over');
    expect(host.leftOpen()).toBe(false);
  });
});

describe('CngxSidenav collapsed rail', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // The hover peek routes through the composed CngxSidebar's CngxHoverIntent,
  // whose pointerenter/pointerleave listeners settle `active` after
  // expandDelay (120ms) / collapseDelay (0ms).
  const ENTER_DELAY = 120;

  function enter(el: HTMLElement): void {
    el.dispatchEvent(new PointerEvent('pointerenter'));
  }
  function leave(el: HTMLElement): void {
    el.dispatchEvent(new PointerEvent('pointerleave'));
  }

  function setupRail() {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.mode.set('side');
    fixture.componentInstance.leftCollapsed.set(true);
    fixture.detectChanges();
    const de = fixture.debugElement
      .queryAll(By.directive(CngxSidenav))
      .find((d) => d.injector.get(CngxSidenav).position() === 'start')!;
    const left = de.injector.get(CngxSidenav);
    const el = de.nativeElement as HTMLElement;
    return { fixture, left, el, host: fixture.componentInstance };
  }

  it('rests as a rail with the miniWidth reserved', () => {
    const { el, left } = setupRail();
    expect(el.getAttribute('data-sidebar-state')).toBe('rail');
    expect(el.style.inlineSize).toBe('var(--cngx-sidebar-rail-size, 3.5rem)');
    expect(el.style.getPropertyValue('--cngx-sidebar-rail-size')).toBe('56px');
    expect(left.expanded()).toBe(false);
  });

  it('peeks only after a deliberate hover dwell', () => {
    const { fixture, left, el } = setupRail();
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY - 1);
    expect(left.expanded()).toBe(false);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(left.expanded()).toBe(true);
    expect(el.getAttribute('data-sidebar-state')).toBe('peek');
  });

  it('ends the peek on a debounced pointer leave', () => {
    const { left, el } = setupRail();
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY);
    expect(left.expanded()).toBe(true);
    leave(el);
    vi.advanceTimersByTime(1);
    expect(left.expanded()).toBe(false);
  });

  it('does not peek on a sweep-through (leave before expandDelay)', () => {
    const { left, el } = setupRail();
    enter(el);
    vi.advanceTimersByTime(80);
    leave(el);
    vi.advanceTimersByTime(500);
    expect(left.expanded()).toBe(false);
  });

  it('ignores hover when expandOnHover=false', () => {
    const { fixture, left, el, host } = setupRail();
    host.expandOnHover.set(false);
    fixture.detectChanges();
    enter(el);
    vi.advanceTimersByTime(500);
    expect(left.expanded()).toBe(false);
  });

  it('clears the pending hover timer on destroy (no late peek)', () => {
    const { fixture, left, el } = setupRail();
    enter(el);
    vi.advanceTimersByTime(80);
    fixture.destroy();
    vi.advanceTimersByTime(500);
    expect(left.expanded()).toBe(false);
  });

  it('close() ends a peek on a collapsed rail and keeps it collapsed', () => {
    const { left, el, host } = setupRail();
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY);
    expect(left.expanded()).toBe(true);
    left.close();
    expect(left.expanded()).toBe(false);
    expect(host.leftCollapsed()).toBe(true);
  });

  it('a hidden rest reserves nothing and is concealed', () => {
    const { fixture, el, host } = setupRail();
    host.collapsedAs.set('hidden');
    fixture.detectChanges();
    expect(el.getAttribute('data-sidebar-state')).toBe('hidden');
    expect(el.style.inlineSize).toBe('0px');
    expect(el.hasAttribute('inert')).toBe(true);
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not set aria-hidden on a rail', () => {
    const { el } = setupRail();
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('renders no collapsed rail in over mode, whatever collapsed holds', () => {
    const { fixture, el, host } = setupRail();
    host.mode.set('over');
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(el.getAttribute('data-sidebar-state')).toBe('expanded');
    expect(host.leftCollapsed()).toBe(true);
  });
});

describe('CngxSidenav ariaLabel', () => {
  afterEach(() => vi.restoreAllMocks());

  function setupDual() {
    const fixture = TestBed.createComponent(DualHost);
    fixture.detectChanges();
    const sidenavs = fixture.debugElement.queryAll(By.directive(CngxSidenav));
    const left = sidenavs.find((d) => d.injector.get(CngxSidenav).position() === 'start')!;
    return { fixture, leftEl: left.nativeElement as HTMLElement, host: fixture.componentInstance };
  }

  it('sets aria-label attribute when ariaLabel input is set', () => {
    const { fixture, leftEl, host } = setupDual();
    host.ariaLabel.set('Main navigation');
    fixture.detectChanges();
    expect(leftEl.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('falls back to the start-rail default name when undefined', () => {
    const { leftEl } = setupDual();
    expect(leftEl.getAttribute('aria-label')).toBe('Navigation');
  });
});

describe('CngxSidenav resizable', () => {
  afterEach(() => vi.restoreAllMocks());

  it('renames an unbound resize handle on a language switch', () => {
    const labels = signal<Partial<CngxSidenavLabels>>({});
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavLabels(labels))],
    });
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.detectChanges();
    const leftDe = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0];
    const handle = (leftDe.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.cngx-sidenav__resize-handle',
    )!;
    const before = handle.getAttribute('aria-label');

    labels.set({ resizeHandle: 'Navigation anpassen' });
    fixture.detectChanges();
    expect(handle.getAttribute('aria-label')).toBe('Navigation anpassen');
    expect(before).not.toBe('Navigation anpassen');
  });

  function resizeHandle(fixture: { debugElement: DebugElement }): HTMLElement {
    return (
      fixture.debugElement.queryAll(By.directive(CngxSidenav))[0].nativeElement as HTMLElement
    ).querySelector<HTMLElement>('.cngx-sidenav__resize-handle')!;
  }

  it('speaks the separator position as a percent of its range through the sidenav section', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', sidenav: { resizeValueText: '{value} der Breite' } }),
          withDocumentLanguage('off'),
        ),
      ],
    });
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.width.set('360px');
    fixture.detectChanges();
    const handle = resizeHandle(fixture);
    expect(handle.getAttribute('aria-valuenow')).toBe('360');
    expect(stripBidiIsolates(handle.getAttribute('aria-valuetext'))).toBe('50\u00a0% der Breite');
    expect(handle.getAttribute('aria-label')).toBe('Resize navigation');
  });

  it('clamps the spoken percent to the range', () => {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.width.set('1200px');
    fixture.detectChanges();
    expect(stripBidiIsolates(resizeHandle(fixture).getAttribute('aria-valuetext'))).toBe('100%');
  });

  it('falls back to the 600px bound while maxWidth is not in px', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavDimensions({ maxWidth: '40rem' }))],
    });
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.width.set('300px');
    fixture.detectChanges();
    const handle = resizeHandle(fixture);
    expect(handle.getAttribute('aria-valuenow')).toBe('300');
    expect(handle.getAttribute('aria-valuemax')).toBe('600');
    expect(stripBidiIsolates(handle.getAttribute('aria-valuetext'))).toBe('38%');
  });

  it('names the resize handle from the sidenav labels bundle', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavLabels({ resizeHandle: 'Navigation anpassen' }))],
    });
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.detectChanges();
    const leftDe = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0];
    const handle = (leftDe.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.cngx-sidenav__resize-handle',
    )!;
    expect(handle.getAttribute('aria-label')).toBe('Navigation anpassen');
  });

  function setupDual() {
    const fixture = TestBed.createComponent(DualHost);
    fixture.detectChanges();
    const sidenavs = fixture.debugElement.queryAll(By.directive(CngxSidenav));
    const left = sidenavs.find((d) => d.injector.get(CngxSidenav).position() === 'start')!;
    return {
      fixture,
      leftEl: left.nativeElement as HTMLElement,
      left: left.injector.get(CngxSidenav),
      host: fixture.componentInstance,
    };
  }

  it('adds cngx-sidenav--resizable class when resizable is true', () => {
    const { fixture, leftEl, host } = setupDual();
    expect(leftEl.classList.contains('cngx-sidenav--resizable')).toBe(false);
    host.resizable.set(true);
    fixture.detectChanges();
    expect(leftEl.classList.contains('cngx-sidenav--resizable')).toBe(true);
  });

  it('width model can be set programmatically', () => {
    const { fixture, left, host } = setupDual();
    expect(left.width()).toBe('240px');
    host.width.set('320px');
    fixture.detectChanges();
    expect(left.width()).toBe('320px');
  });

  it('aborts resize listeners when the component is destroyed mid-drag', () => {
    const { fixture, leftEl, host } = setupDual();
    host.resizable.set(true);
    fixture.detectChanges();

    const addSpy = vi.spyOn(document, 'addEventListener');
    const handle = leftEl.querySelector<HTMLElement>('.cngx-sidenav__resize-handle')!;
    (handle as unknown as Record<string, unknown>)['setPointerCapture'] = vi.fn();
    handle.dispatchEvent(
      Object.assign(new Event('pointerdown', { bubbles: true, cancelable: true }), {
        button: 0,
        clientX: 100,
        pointerId: 1,
      }),
    );

    const moveCall = addSpy.mock.calls.find((c) => c[0] === 'pointermove');
    const options = moveCall?.[2] as AddEventListenerOptions | undefined;
    expect(options?.signal).toBeDefined();
    expect(options?.signal?.aborted).toBe(false);

    // Teardown mid-drag (onUp never fired) must still remove both listeners.
    fixture.destroy();
    expect(options?.signal?.aborted).toBe(true);
  });
});

describe('CngxSidenav auto mode', () => {
  let roMock: ResizeObserverMock;

  // The docking decision reads --cngx-sidenav-width-class, which the layout's
  // @container rule block resolves. jsdom evaluates no container query, so the
  // property read is stubbed here and the real CSS path is covered by
  // sidenav.geometry.spec.ts in Chromium.
  function stubWide(value: string): void {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ getPropertyValue: () => value }) as unknown as CSSStyleDeclaration,
    );
  }

  function flushResize(): void {
    roMock.triggerResize({
      borderBoxSize: [{ inlineSize: 1200, blockSize: 800 }],
    } as unknown as ResizeObserverEntry);
  }

  function mount<T = AutoModeHost>(host: Type<T> = AutoModeHost as Type<T>) {
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    return { fixture, nav };
  }

  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('renders as over before the first resize entry arrives', () => {
    stubWide('expanded');
    const { nav } = mount();
    expect(nav.effectiveMode()).toBe('over');
  });

  it('docks beside the content when the layout reports wide', () => {
    stubWide('expanded');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    expect(nav.effectiveMode()).toBe('side');
  });

  it('overlays when the layout reports narrow', () => {
    stubWide('compact');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    expect(nav.effectiveMode()).toBe('over');
  });

  it('docks in the medium width class', () => {
    stubWide('medium');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    expect(nav.widthClass()).toBe('medium');
    expect(nav.effectiveMode()).toBe('side');
  });

  it('rests as a rail in medium and opens the full nav as an overlay over it', () => {
    stubWide('medium');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    const el = nav.elementRef.nativeElement as HTMLElement;
    expect(el.getAttribute('data-sidebar-state')).toBe('rail');
    expect(nav.expanded()).toBe(false);

    nav.toggle();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(nav.overlayActive()).toBe(true);
    expect(nav.expanded()).toBe(true);
    expect(el.getAttribute('data-sidebar-state')).toBe('peek');
    expect(el.getAttribute('aria-modal')).toBe('true');

    nav.close();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(el.getAttribute('data-sidebar-state')).toBe('rail');
  });

  it('resolves an unknown width class to compact and warns CNGX3026', () => {
    stubWide('wide');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.widthClass()).toBe('compact');
    expect(nav.effectiveMode()).toBe('over');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX3026: \[cngx-sidenav\] unknown --cngx-sidenav-width-class "wide"/),
      expect.anything(),
    );
  });

  it('resolves an empty width class to compact without a warning', () => {
    stubWide('');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.widthClass()).toBe('compact');
    expect(warn).not.toHaveBeenCalledWith(expect.stringMatching(/CNGX3026/), expect.anything());
  });

  it('pins over when mode is bound explicitly, even on a wide layout', () => {
    stubWide('expanded');
    const { fixture, nav } = mount();
    fixture.componentInstance.mode.set('over');
    flushResize();
    fixture.detectChanges();
    expect(nav.effectiveMode()).toBe('over');
  });

  it('pins side when mode is bound explicitly, even on a narrow layout', () => {
    stubWide('compact');
    const { fixture, nav } = mount();
    fixture.componentInstance.mode.set('side');
    flushResize();
    fixture.detectChanges();
    expect(nav.effectiveMode()).toBe('side');
  });

  it('falls back to over and warns when no layout provides a container', () => {
    stubWide('expanded');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { nav } = mount(StandaloneRailHost);
    expect(nav.effectiveMode()).toBe('over');
    expect(warn).toHaveBeenCalledWith(
      expect.stringMatching(/^CNGX3010: \[cngx-sidenav\] auto mode needs/),
    );
  });

  it('keeps the rail open and unhidden when a wide layout narrows under focus', () => {
    stubWide('expanded');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.effectiveMode()).toBe('side');
    const host = fixture.debugElement.query(By.directive(CngxSidenav)).nativeElement as HTMLElement;
    (host.querySelector('.nav-item') as HTMLElement).focus();

    stubWide('compact');
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();

    // Focus inside the rail keeps it open as the drawer, so the focused
    // element is never orphaned behind inert / aria-hidden.
    expect(nav.effectiveMode()).toBe('over');
    expect(nav.opened()).toBe(true);
    expect(host.getAttribute('aria-hidden')).not.toBe('true');
    expect(host.hasAttribute('inert')).toBe(false);
  });

  it('starts every width class closed: an overlay opened at one width never reopens stale', () => {
    stubWide('compact');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    nav.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.opened()).toBe(true);
    const content = fixture.nativeElement.querySelector('.content-item') as HTMLElement;
    content.focus();

    stubWide('expanded');
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.effectiveMode()).toBe('side');
    expect(nav.opened()).toBe(false);

    stubWide('compact');
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.effectiveMode()).toBe('over');
    expect(nav.opened()).toBe(false);
  });

  it('closes the medium overlay when the layout widens to expanded', () => {
    stubWide('medium');
    const { fixture, nav } = mount();
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    nav.toggle();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.overlayActive()).toBe(true);
    (fixture.nativeElement.querySelector('.content-item') as HTMLElement).focus();

    stubWide('expanded');
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.opened()).toBe(false);
    expect(nav.expanded()).toBe(true);
  });

  it('does not reset opened in a pinned mode when the width class changes', () => {
    stubWide('compact');
    const { fixture, nav } = mount();
    fixture.componentInstance.mode.set('over');
    flushResize();
    fixture.detectChanges();
    nav.open();
    fixture.detectChanges();
    TestBed.flushEffects();

    stubWide('expanded');
    flushResize();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(nav.opened()).toBe(true);
  });
});

describe('CngxSidenav resize math and shortcut', () => {
  beforeEach(() => {
    // rAF only paints the CSS var mid-drag; run it synchronously so the drag is
    // deterministic. currentWidth (the value committed on pointerup) is computed
    // in the move handler regardless.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', () => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // restoreAllMocks does NOT undo stubGlobal - without this the synchronous
    // requestAnimationFrame stub leaks into later spec files in the same worker
    // and makes Angular's scheduler run reentrantly. The shared setup file
    // (projects/testing/setup/vitest-setup.ts) unstubs per file, which covers
    // that leak, but the stub here is installed per test and a synchronous rAF
    // must not survive into the next test in this file either. Keeping the call
    // also makes this spec the detector if a test target ever loses its
    // setupFiles entry.
    vi.unstubAllGlobals();
  });

  // Through the DOM, not the (now protected) handler: dispatch a pointerdown
  // on the rendered separator, exactly like a real drag starts.
  function startDrag(navEl: HTMLElement, clientX: number): void {
    const handle = navEl.querySelector<HTMLElement>('.cngx-sidenav__resize-handle')!;
    (handle as unknown as Record<string, unknown>)['setPointerCapture'] = vi.fn();
    handle.dispatchEvent(
      Object.assign(new Event('pointerdown', { bubbles: true, cancelable: true }), {
        button: 0,
        clientX,
        pointerId: 1,
      }),
    );
  }

  const move = (clientX: number): void => {
    document.dispatchEvent(new MouseEvent('pointermove', { clientX }));
  };
  const up = (): void => {
    document.dispatchEvent(new MouseEvent('pointerup'));
  };

  it('clamps a start-side resize to [minWidth, maxWidth]', () => {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.detectChanges();
    const leftDe = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0];
    const left = leftDe.injector.get(CngxSidenav);
    const leftEl = leftDe.nativeElement as HTMLElement;

    // Dragging far right on a start-positioned rail widens; clamps to max (600).
    startDrag(leftEl, 100);
    move(100_000);
    up();
    fixture.detectChanges();
    expect(left.width()).toBe('600px');

    // Dragging far left clamps to min (120).
    startDrag(leftEl, 100);
    move(-100_000);
    up();
    expect(left.width()).toBe('120px');
  });

  it('flips the delta sign for an end-positioned rail', () => {
    const fixture = TestBed.createComponent(EndResizableHost);
    fixture.detectChanges();
    const endDe = fixture.debugElement.query(By.directive(CngxSidenav));
    const end = endDe.injector.get(CngxSidenav);
    const endEl = endDe.nativeElement as HTMLElement;

    // On an end rail the delta is inverted: dragging right narrows it (clamps to
    // min), dragging left widens it (clamps to max) - the mirror of the start rail.
    startDrag(endEl, 100);
    move(100_000);
    up();
    fixture.detectChanges();
    expect(end.width()).toBe('120px');

    startDrag(endEl, 100);
    move(-100_000);
    up();
    expect(end.width()).toBe('600px');
  });

  it('resizes with arrow keys on the focusable separator, direction-aware and clamped', () => {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.width.set('240px');
    fixture.detectChanges();
    const leftDe = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0];
    const left = leftDe.injector.get(CngxSidenav);
    const handle = (leftDe.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.cngx-sidenav__resize-handle',
    )!;
    expect(handle.getAttribute('tabindex')).toBe('0');
    expect(handle.getAttribute('aria-label')).toBe('Resize navigation');
    expect(stripBidiIsolates(handle.getAttribute('aria-valuetext'))).toBe('25%');

    const press = (key: string): void => {
      handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    };

    press('ArrowRight');
    expect(left.width()).toBe('256px');
    press('ArrowLeft');
    press('ArrowLeft');
    expect(left.width()).toBe('224px');
    press('Home');
    expect(left.width()).toBe('120px');
    press('End');
    expect(left.width()).toBe('600px');

    // Modified arrows pass through untouched (browser/AT shortcuts) - shift
    // included.
    const before = left.width();
    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, bubbles: true }),
    );
    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', shiftKey: true, bubbles: true }),
    );
    expect(left.width()).toBe(before);
  });

  it('never reports a parsed non-px width: a rem rail reads its rendered width', async () => {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.width.set('17.5rem');
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    vi.spyOn(leftEl, 'getBoundingClientRect').mockReturnValue({ width: 280 } as DOMRect);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const handle = leftEl.querySelector<HTMLElement>('.cngx-sidenav__resize-handle')!;

    // parseInt('17.5rem') would report 17, below the 120 minimum; the first
    // render measures the rail instead.
    expect(handle.getAttribute('aria-valuenow')).toBe('280');
    expect(handle.getAttribute('aria-valuemin')).toBe('120');
    expect(handle.getAttribute('aria-valuemax')).toBe('600');
  });

  it('derives aria-valuenow from the rendered width once the separator gains focus', () => {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.width.set('17.5rem');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    const handle = leftEl.querySelector<HTMLElement>('.cngx-sidenav__resize-handle')!;
    vi.spyOn(leftEl, 'getBoundingClientRect').mockReturnValue({ width: 280 } as DOMRect);

    // The window-splitter pattern wants a valuenow on the focused separator
    // even for rem-sized rails - resolved by measurement at focus time.
    handle.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(handle.getAttribute('aria-valuenow')).toBe('280');
  });

  it('renders no resize handle on a collapsed rail (fixed width)', () => {
    const fixture = TestBed.createComponent(DualHost);
    fixture.componentInstance.resizable.set(true);
    fixture.componentInstance.mode.set('side');
    fixture.componentInstance.leftCollapsed.set(true);
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.querySelector('.cngx-sidenav__resize-handle')).toBeNull();
  });

  it('toggles opened via the configured mod+b keyboard shortcut', () => {
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    expect(host.open()).toBe(false);

    // ctrl+meta both set so the combo matches regardless of the platform mod
    // resolution (ctrl off macOS, meta on it).
    const press = (): void => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, metaKey: true }),
      );
    };

    press();
    fixture.detectChanges();
    expect(host.open()).toBe(true);

    press();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });

  it('routes the shortcut through toggle(): on a docked rail it flips collapsed, not opened', () => {
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.componentInstance.mode.set('side');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;

    // A raw opened flip would set the model false while the docked rail stays
    // visible (and a router sync would write ?nav=closed).
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, metaKey: true }),
    );
    fixture.detectChanges();
    expect(host.open()).toBe(true);
    expect(nav.expanded()).toBe(false);
  });
});


@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" mode="over" [(opened)]="startOpen">Start</cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
      <cngx-sidenav position="end" mode="over" [(opened)]="endOpen" [shortcut]="endShortcut()">
        End
      </cngx-sidenav>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class DualShortcutHost {
  startOpen = signal(false);
  endOpen = signal(false);
  endShortcut = signal<string | undefined>(undefined);
}

describe('CngxSidenav toggle hotkey', () => {
  const pressModB = (): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, metaKey: true }));
  };

  it('announces the new state through CngxLiveAnnouncer, scoped to the rail', () => {
    const announce = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: CngxLiveAnnouncer, useValue: { announce } }],
    });
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.detectChanges();
    const railEl = fixture.debugElement.query(By.directive(CngxSidenav)).nativeElement;

    pressModB();
    fixture.detectChanges();
    expect(announce).toHaveBeenLastCalledWith('Navigation expanded', 'polite', railEl);

    pressModB();
    fixture.detectChanges();
    expect(announce).toHaveBeenLastCalledWith('Navigation collapsed', 'polite', railEl);
  });

  it('reads the announcement copy from withSidenavLabels', () => {
    const announce = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: CngxLiveAnnouncer, useValue: { announce } },
        provideSidenavConfig(withSidenavLabels({ expandedAnnouncement: 'Menü offen' })),
      ],
    });
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.detectChanges();
    pressModB();
    expect(announce.mock.calls[0][0]).toBe('Menü offen');
  });

  it('lets CNGX_SIDENAV_ANNOUNCER_FACTORY replace the announcer', () => {
    const spoken: boolean[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_SIDENAV_ANNOUNCER_FACTORY,
          useValue: () => ({ announce: (expanded: boolean) => spoken.push(expanded) }),
        },
      ],
    });
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.detectChanges();
    pressModB();
    pressModB();
    expect(spoken).toEqual([true, false]);
  });

  it('registers no binding while shortcut is unset, and follows a runtime remap', () => {
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.componentInstance.shortcut.set(undefined);
    fixture.detectChanges();
    pressModB();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);

    fixture.componentInstance.shortcut.set('mod+k');
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('warns nothing for an unset shortcut (no empty combo reaches the registry)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.componentInstance.shortcut.set(undefined);
    fixture.detectChanges();
    expect(warn.mock.calls.some((args) => String(args[0]).startsWith('CNGX1080'))).toBe(false);
    warn.mockRestore();
  });

  it('applies the app-wide shortcut to the start rail only, so a dual layout has one binding', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavShortcut('mod+b'))],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(DualShortcutHost);
    fixture.detectChanges();

    pressModB();
    fixture.detectChanges();

    expect(fixture.componentInstance.startOpen()).toBe(true);
    expect(fixture.componentInstance.endOpen()).toBe(false);
    expect(warn.mock.calls.some((args) => String(args[0]).startsWith('CNGX1077'))).toBe(false);
    warn.mockRestore();
  });

  it('turns the app-wide shortcut off for a start rail bound to an empty string', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavShortcut('mod+b'))],
    });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.componentInstance.shortcut.set('');
    fixture.detectChanges();

    pressModB();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(warn.mock.calls.some((args) => String(args[0]).startsWith('CNGX1080'))).toBe(false);
    warn.mockRestore();

    fixture.componentInstance.shortcut.set(undefined);
    fixture.detectChanges();
    pressModB();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('registers an end rail binding only for an explicit [shortcut]', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavShortcut('mod+b'))],
    });
    const fixture = TestBed.createComponent(DualShortcutHost);
    fixture.componentInstance.endShortcut.set('mod+k');
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true }));
    fixture.detectChanges();

    expect(fixture.componentInstance.endOpen()).toBe(true);
    expect(fixture.componentInstance.startOpen()).toBe(false);
  });

  it('registers under the remap id sidenav.toggle, unlisted', () => {
    const sources: Signal<readonly CngxHotkeyBinding[]>[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CNGX_HOTKEY_REGISTRY,
          useFactory: () => {
            const real = createHotkeyRegistry(injectHotkeyRegistryDeps());
            return {
              ...real,
              register: (
                source: Signal<readonly CngxHotkeyBinding[]>,
                scope: CngxHotkeyScopeNode | null,
              ) => {
                sources.push(source);
                return real.register(source, scope);
              },
            };
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(ShortcutHost);
    fixture.detectChanges();
    // The source is live: read it once the shortcut input has bound.
    const binding = sources.flatMap((source) => source()).find((b) => b.id === 'sidenav.toggle');
    expect(binding).toBeDefined();
    expect(binding?.description).toBeUndefined();
  });
});

describe('CngxSidenav config cascade', () => {
  // The shortcut effect reads navigator/matchMedia during detectChanges;
  // jsdom ships no matchMedia, so install it for the whole suite.
  let mmMock: MatchMediaMock;

  beforeEach(() => {
    mmMock = createMatchMediaMock();
    mmMock.install(window);
  });

  afterEach(() => {
    mmMock.restore(window);
  });

  function getNav<T>(host: Type<T>): {
    fixture: ReturnType<typeof TestBed.createComponent<T>>;
    nav: CngxSidenav;
  } {
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    return { fixture, nav };
  }

  it('resolves un-bound width/miniWidth from provideSidenavConfig', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSidenavConfig(withSidenavDimensions({ width: '320px', miniWidth: '72px' })),
      ],
    });
    const { nav } = getNav(UnboundHost);

    expect(nav.width()).toBe('320px');
    expect(nav.miniWidth()).toBe('72px');
  });

  it('per-instance [width] binding still wins over the config default', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavDimensions({ width: '320px' }))],
    });
    const { nav } = getNav(BoundWidthHost);

    expect(nav.width()).toBe('500px');
  });

  it('un-configured sidenav keeps the byte-identical defaults', () => {
    const { nav } = getNav(UnboundHost);

    expect(nav.width()).toBe('280px');
    expect(nav.miniWidth()).toBe('56px');
    expect(nav.minWidth()).toBe('120px');
    expect(nav.maxWidth()).toBe('600px');
  });
});

describe('CngxSidenav tunable dwell', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function railNav<T>(host: Type<T>): { nav: CngxSidenav; el: HTMLElement } {
    const fixture = TestBed.createComponent(host);
    fixture.detectChanges();
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    return { nav, el: nav.elementRef.nativeElement };
  }

  it('per-instance [expandDelay] tunes the rail peek dwell', () => {
    const { nav, el } = railNav(RailDwellHost);

    el.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(199);
    expect(nav.expanded()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(nav.expanded()).toBe(true);
  });

  it('withSidenavHoverDwell drives the app-wide rail peek dwell (enter and leave)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSidenavConfig(withSidenavHoverDwell({ enterDelay: 250, leaveDelay: 150 })),
      ],
    });
    const { nav, el } = railNav(RailUnboundHost);

    el.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(249);
    expect(nav.expanded()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(nav.expanded()).toBe(true);

    el.dispatchEvent(new PointerEvent('pointerleave'));
    vi.advanceTimersByTime(149);
    expect(nav.expanded()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(nav.expanded()).toBe(false);
  });

  it('per-instance [expandDelay] still wins over withSidenavHoverDwell', () => {
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavHoverDwell({ enterDelay: 250 }))],
    });
    // RailDwellHost binds [expandDelay]=200, which must beat the config's 250.
    const { nav, el } = railNav(RailDwellHost);

    el.dispatchEvent(new PointerEvent('pointerenter'));
    vi.advanceTimersByTime(199);
    expect(nav.expanded()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(nav.expanded()).toBe(true);
  });
});

@Component({
  template: `
    <button type="button" class="outer-trigger" [cngxPanelTrigger]="nav.panelTarget">Menu</button>
    <cngx-sidenav-layout>
      <cngx-sidenav #nav="cngxSidenav" [mode]="mode()" [(opened)]="open">
        <button type="button" class="pin" cngxPanelTrigger>Pin</button>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent, CngxPanelTrigger],
})
class PanelTriggerHost {
  mode = signal<SidenavMode>('side');
  open = signal(false);
}

describe('CngxSidenav panel target', () => {
  function setup() {
    const fixture = TestBed.createComponent(PanelTriggerHost);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const navDe = fixture.debugElement.query(By.directive(CngxSidenav));
    return {
      fixture,
      host: fixture.componentInstance,
      nav: navDe.injector.get(CngxSidenav),
      rail: navDe.nativeElement as HTMLElement,
      outer: root.querySelector('.outer-trigger') as HTMLButtonElement,
      pin: root.querySelector('.pin') as HTMLButtonElement,
    };
  }

  it('drives a docked rail from an outside trigger: collapsed flips, aria mirrors expanded', () => {
    const { fixture, nav, rail, outer } = setup();
    expect(outer.getAttribute('aria-controls')).toBe(rail.id);
    expect(outer.getAttribute('aria-expanded')).toBe('true');

    outer.click();
    fixture.detectChanges();
    expect(rail.getAttribute('data-sidebar-state')).toBe('rail');
    expect(outer.getAttribute('aria-expanded')).toBe('false');
    expect(nav.panelTarget.mode?.()).toBe('inline');
  });

  it('opens the overlay from the same trigger once the rail is an overlay', () => {
    const { fixture, host, nav, outer } = setup();
    host.mode.set('over');
    fixture.detectChanges();
    expect(nav.panelTarget.mode?.()).toBe('over');
    expect(nav.panelTarget.modal?.()).toBe(true);

    outer.click();
    fixture.detectChanges();
    expect(host.open()).toBe(true);
    expect(outer.getAttribute('aria-expanded')).toBe('true');
  });

  it('resolves CNGX_PANEL_TARGET inside the rail to the sidenav, not the bare sidebar', () => {
    const { fixture, host, pin } = setup();
    host.mode.set('over');
    fixture.detectChanges();
    host.open.set(true);
    fixture.detectChanges();

    // The sidebar's own toggle would flip collapsed; the sidenav's closes the overlay.
    pin.click();
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });
});

describe('CngxSidenav persistence', () => {
  function memoryStorage(seed: Record<string, string> = {}): Storage & { data: Map<string, string> } {
    const data = new Map(Object.entries(seed));
    return {
      data,
      get length() {
        return data.size;
      },
      clear: () => data.clear(),
      getItem: (k: string) => data.get(k) ?? null,
      key: (i: number) => [...data.keys()][i] ?? null,
      removeItem: (k: string) => void data.delete(k),
      setItem: (k: string, v: string) => void data.set(k, v),
    };
  }

  function mount(storage: Storage | null) {
    TestBed.configureTestingModule({
      providers: [
        provideSidenavConfig(withSidenavPersistence()),
        { provide: CNGX_SIDENAV_STORAGE, useValue: storage },
      ],
    });
    const fixture = TestBed.createComponent(RailUnboundPersistHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const navDe = fixture.debugElement.query(By.directive(CngxSidenav));
    return { fixture, nav: navDe.injector.get(CngxSidenav), rail: navDe.nativeElement as HTMLElement };
  }

  it('seeds an unbound collapsed from storage', () => {
    const storage = memoryStorage({ 'cngx-sidenav:start': 'true' });
    const { rail } = mount(storage);
    expect(rail.getAttribute('data-sidebar-state')).toBe('rail');
  });

  it('writes a change, never the untouched default', () => {
    const storage = memoryStorage();
    const { fixture, nav } = mount(storage);
    expect(storage.data.size).toBe(0);

    nav.toggle();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(storage.data.get('cngx-sidenav:start')).toBe('true');
  });

  it('keys each rail by its static position', () => {
    TestBed.configureTestingModule({
      providers: [
        provideSidenavConfig(withSidenavPersistence('app-nav')),
        { provide: CNGX_SIDENAV_STORAGE, useValue: memoryStorage({ 'app-nav:end': 'true' }) },
      ],
    });
    const fixture = TestBed.createComponent(EndPersistHost);
    fixture.detectChanges();
    const rail = fixture.debugElement.query(By.directive(CngxSidenav)).nativeElement as HTMLElement;
    expect(rail.getAttribute('data-sidebar-state')).toBe('rail');
  });

  it('survives a storage that throws and a missing storage', () => {
    const throwing = memoryStorage();
    throwing.getItem = () => {
      throw new Error('blocked');
    };
    throwing.setItem = () => {
      throw new Error('quota');
    };
    const { fixture, nav, rail } = mount(throwing);
    expect(rail.getAttribute('data-sidebar-state')).toBe('expanded');
    nav.toggle();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(rail.getAttribute('data-sidebar-state')).toBe('rail');
    TestBed.resetTestingModule();

    const { rail: plain } = mount(null);
    expect(plain.getAttribute('data-sidebar-state')).toBe('expanded');
  });
});

@Component({
  template: `<cngx-sidenav mode="side">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class RailUnboundPersistHost {}

@Component({
  template: `<cngx-sidenav mode="side" position="end">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class EndPersistHost {}
