import { FocusTrapFactory } from '@angular/cdk/a11y';
import { Component, signal, type DebugElement } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SidenavMode } from './sidenav';
import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';
import { provideSidenavConfig } from './config/provide-sidenav-config';
import { withSidenavLabels } from './config/features';
import type { CngxSidenavLabels } from './config/sidenav.config';
import { provideCngxI18n, withDocumentLanguage, withPartialPack } from '@cngx/core/i18n';

let mockTrap: {
  enabled: boolean;
  hasAttached: () => boolean;
  attachAnchors: ReturnType<typeof vi.fn>;
  focusFirstTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  focusLastTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

@Component({
  template: `
    <button class="external-trigger" type="button">Open</button>
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" [(opened)]="open" [mode]="mode()">
        <a class="nav-first" href="#a">First</a>
        <a class="nav-last" href="#b">Last</a>
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class FocusHost {
  open = signal(false);
  mode = signal<SidenavMode>('over');
}

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" mode="side" [ariaLabel]="startLabel()">Start</cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
      <cngx-sidenav position="end" mode="over">End</cngx-sidenav>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class NamedHost {
  startLabel = signal<string | undefined>(undefined);
}

function railsOf(fixture: { debugElement: DebugElement }) {
  const rails = fixture.debugElement.queryAll(By.directive(CngxSidenav));
  const byPosition = (position: 'start' | 'end') =>
    rails.find((d) => d.injector.get(CngxSidenav).position() === position)!
      .nativeElement as HTMLElement;
  return { start: byPosition('start'), end: byPosition('end') };
}

describe('CngxSidenav focus management', () => {
  beforeEach(() => {
    mockTrap = {
      enabled: false,
      hasAttached: () => true,
      attachAnchors: vi.fn(),
      focusFirstTabbableElementWhenReady: vi.fn(),
      focusLastTabbableElementWhenReady: vi.fn(),
      destroy: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [FocusHost],
      providers: [{ provide: FocusTrapFactory, useValue: { create: vi.fn(() => mockTrap) } }],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function setup() {
    const fixture = TestBed.createComponent(FocusHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const sidenavEl = fixture.debugElement.query(By.directive(CngxSidenav))
      .nativeElement as HTMLElement;
    return { fixture, host: fixture.componentInstance, sidenavEl };
  }

  it('leaves the trap disabled while closed', () => {
    setup();
    expect(mockTrap.enabled).toBe(false);
  });

  it('enables the trap and moves focus into the rail when opened in over mode', () => {
    const { fixture, host } = setup();
    host.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(true);
    expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalled();
  });

  it('makes the page outside an open overlay inert and releases it on close', () => {
    const { fixture, host } = setup();
    const outside = fixture.nativeElement.querySelector('.external-trigger') as HTMLElement;
    const content = fixture.nativeElement.querySelector('cngx-sidenav-content') as HTMLElement;
    host.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(content.hasAttribute('inert')).toBe(true);
    expect(outside.hasAttribute('inert')).toBe(true);

    host.open.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(content.hasAttribute('inert')).toBe(false);
    expect(outside.hasAttribute('inert')).toBe(false);
  });

  it('closes the overlay on Escape inside it', () => {
    const { fixture, host, sidenavEl } = setup();
    host.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    sidenavEl
      .querySelector('.nav-first')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });

  it('does not enable the trap in side mode even when open', () => {
    const { fixture, host } = setup();
    host.mode.set('side');
    host.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(false);
    expect(mockTrap.focusFirstTabbableElementWhenReady).not.toHaveBeenCalled();
  });

  it('sets aria-modal="true" only while an overlay is open', () => {
    const { fixture, host, sidenavEl } = setup();
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();

    host.open.set(true);
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('aria-modal')).toBe('true');

    host.open.set(false);
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();
  });

  it('is a complementary landmark while closed and a modal dialog while the overlay is open', () => {
    const { fixture, host, sidenavEl } = setup();
    expect(sidenavEl.getAttribute('role')).toBe('complementary');

    host.open.set(true);
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('role')).toBe('dialog');
    expect(sidenavEl.getAttribute('aria-modal')).toBe('true');

    host.open.set(false);
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('role')).toBe('complementary');
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();
  });

  it('stays complementary while docked, open or not', () => {
    const { fixture, host, sidenavEl } = setup();
    host.open.set(true);
    for (const mode of ['side'] as const) {
      host.mode.set(mode);
      fixture.detectChanges();
      expect(sidenavEl.getAttribute('role')).toBe('complementary');
    }
  });

  it('never sets aria-modal without role="dialog"', () => {
    const { fixture, host, sidenavEl } = setup();
    for (const mode of ['over', 'side'] as const) {
      for (const open of [false, true]) {
        host.mode.set(mode);
        host.open.set(open);
        fixture.detectChanges();
        if (sidenavEl.getAttribute('aria-modal') !== null) {
          expect(sidenavEl.getAttribute('role')).toBe('dialog');
        }
      }
    }
  });

  it('never sets aria-modal on a docked rail', () => {
    const { fixture, host, sidenavEl } = setup();
    host.open.set(true);

    host.mode.set('side');
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();
  });

  it('does not open the overlay or move focus when a pinned mode switches to over', () => {
    const { fixture, host, sidenavEl } = setup();
    host.mode.set('side');
    fixture.detectChanges();
    TestBed.flushEffects();
    mockTrap.focusFirstTabbableElementWhenReady.mockClear();

    host.mode.set('over');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(host.open()).toBe(false);
    expect(mockTrap.enabled).toBe(false);
    expect(mockTrap.focusFirstTabbableElementWhenReady).not.toHaveBeenCalled();
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();
  });

  it('disables the trap again when the overlay closes', () => {
    const { fixture, host } = setup();
    host.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(true);

    host.open.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(mockTrap.enabled).toBe(false);
  });

  it('destroys the trap on teardown', () => {
    const { fixture, host } = setup();
    host.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.destroy();
    expect(mockTrap.destroy).toHaveBeenCalled();
  });

  it('restores focus to the opener when the overlay closes', async () => {
    const fixture = TestBed.createComponent(FocusHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.flushEffects();

    const trigger = fixture.nativeElement.querySelector('.external-trigger') as HTMLButtonElement;
    const navFirst = fixture.nativeElement.querySelector('.nav-first') as HTMLAnchorElement;

    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();

    // The real CDK trap would move focus here; simulate it so the restore has
    // something to undo (the trap is mocked in this suite).
    navFirst.focus();
    expect(document.activeElement).toBe(navFirst);

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();

    // The surface's CngxFocusRestore returns focus once the close renders.
    await fixture.whenStable();
    expect(document.activeElement).toBe(trigger);

    fixture.nativeElement.remove();
    fixture.destroy();
  });
});

describe('CngxSidenav accessible name', () => {
  afterEach(() => vi.restoreAllMocks());

  function setup() {
    const fixture = TestBed.createComponent(NamedHost);
    fixture.detectChanges();
    return { fixture, host: fixture.componentInstance, ...railsOf(fixture) };
  }

  it('names each rail by position without consumer input', () => {
    const { start, end } = setup();
    expect(start.getAttribute('aria-label')).toBe('Navigation');
    expect(end.getAttribute('aria-label')).toBe('Side panel');
  });

  it('lets [ariaLabel] win over withSidenavLabels, which wins over the pack', () => {
    TestBed.configureTestingModule({
      providers: [
        provideCngxI18n(
          withPartialPack({ locale: 'de', sidenav: { startRegion: 'Pack start', endRegion: 'Pack end' } }),
          withDocumentLanguage('off'),
        ),
        provideSidenavConfig(withSidenavLabels({ startRegion: 'Config start' })),
      ],
    });
    const { fixture, host, start, end } = setup();
    expect(start.getAttribute('aria-label')).toBe('Config start');
    expect(end.getAttribute('aria-label')).toBe('Pack end');

    host.startLabel.set('Main navigation');
    fixture.detectChanges();
    expect(start.getAttribute('aria-label')).toBe('Main navigation');
  });

  it('treats an empty or blank [ariaLabel] as unbound', () => {
    const { fixture, host, start } = setup();
    for (const blank of ['', '   ']) {
      host.startLabel.set(blank);
      fixture.detectChanges();
      expect(start.getAttribute('aria-label')).toBe('Navigation');
    }
  });

  it('renames an unbound rail on a language switch', () => {
    const labels = signal<Partial<CngxSidenavLabels>>({});
    TestBed.configureTestingModule({
      providers: [provideSidenavConfig(withSidenavLabels(labels))],
    });
    const { fixture, start, end } = setup();
    expect(start.getAttribute('aria-label')).toBe('Navigation');

    labels.set({ startRegion: 'Navigation', endRegion: 'Seitenbereich' });
    fixture.detectChanges();
    expect(end.getAttribute('aria-label')).toBe('Seitenbereich');
  });

  it('makes the other rail inert while a modal overlay is open (F9)', () => {
    const { fixture, start, end } = setup();
    const rail = fixture.debugElement
      .queryAll(By.directive(CngxSidenav))
      .map((d) => d.injector.get(CngxSidenav))
      .find((nav) => nav.position() === 'end')!;
    rail.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(end.getAttribute('aria-modal')).toBe('true');
    expect(start.hasAttribute('inert')).toBe(true);

    rail.close();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(start.hasAttribute('inert')).toBe(false);
  });

  it('names the open overlay dialog with the same resolved label', () => {
    const { fixture, end } = setup();
    const rail = fixture.debugElement
      .queryAll(By.directive(CngxSidenav))
      .map((d) => d.injector.get(CngxSidenav))
      .find((nav) => nav.position() === 'end')!;
    rail.open();
    fixture.detectChanges();
    expect(end.getAttribute('role')).toBe('dialog');
    expect(end.getAttribute('aria-label')).toBe('Side panel');
  });
});

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" mode="side">Start</cngx-sidenav>
      <cngx-sidenav-content>
        <button class="order" type="button" [attr.aria-controls]="inspector.id()">Order</button>
      </cngx-sidenav-content>
      <cngx-sidenav #inspector position="end" mode="over" modality="none" [(opened)]="open">
        <button class="inside" type="button">Close</button>
      </cngx-sidenav>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class InspectorHost {
  open = signal(false);
}

describe('CngxSidenav non-modal inspector (S1)', () => {
  function setup() {
    TestBed.configureTestingModule({ imports: [InspectorHost] });
    const fixture = TestBed.createComponent(InspectorHost);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    return {
      fixture,
      host: fixture.componentInstance,
      layout: root.querySelector('cngx-sidenav-layout') as HTMLElement,
      content: root.querySelector('cngx-sidenav-content') as HTMLElement,
      ...railsOf(fixture),
      order: root.querySelector('.order') as HTMLElement,
      inside: root.querySelector('.inside') as HTMLElement,
    };
  }

  afterEach(() => document.body.replaceChildren());

  it('leaves the page operable: no dialog, no backdrop, no inert', () => {
    const { layout, content, start, end } = setup();
    expect(end.getAttribute('role')).not.toBe('dialog');
    expect(end.hasAttribute('aria-modal')).toBe(false);
    expect(layout.classList.contains('cngx-sidenav-layout--has-overlay')).toBe(false);
    expect(content.hasAttribute('inert')).toBe(false);
    expect(start.hasAttribute('inert')).toBe(false);
  });

  it('stays open on a press of an element that controls it', () => {
    const { fixture, host, order } = setup();
    order.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0 }));
    fixture.detectChanges();
    expect(host.open()).toBe(true);
  });

  it('closes on Escape inside it', () => {
    const { fixture, host, inside } = setup();
    inside.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.open()).toBe(false);
  });
});
