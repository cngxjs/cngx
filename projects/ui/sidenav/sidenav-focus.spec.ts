import { FocusTrapFactory } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SidenavMode } from './sidenav';
import { CngxSidenav } from './sidenav';
import { CngxSidenavContent } from './sidenav-content';
import { CngxSidenavLayout } from './sidenav-layout';

let mockTrap: {
  enabled: boolean;
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

describe('CngxSidenav focus management', () => {
  beforeEach(() => {
    mockTrap = {
      enabled: false,
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

  it('never sets aria-modal in side or mini mode', () => {
    const { fixture, host, sidenavEl } = setup();
    host.open.set(true);

    host.mode.set('side');
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();

    host.mode.set('mini');
    fixture.detectChanges();
    expect(sidenavEl.getAttribute('aria-modal')).toBeNull();
  });

  it('does not steal focus when a mode switch auto-opens the overlay', () => {
    const { fixture, host, sidenavEl } = setup();
    host.mode.set('side');
    fixture.detectChanges();
    TestBed.flushEffects();
    mockTrap.focusFirstTabbableElementWhenReady.mockClear();

    // Leaving an always-visible mode (side) for overlay (over) auto-opens the
    // rail. The trap must engage but focus must not be pulled in - the open was
    // driven by a viewport change, not a user gesture.
    host.mode.set('over');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(host.open()).toBe(true);
    expect(mockTrap.enabled).toBe(true);
    expect(mockTrap.focusFirstTabbableElementWhenReady).not.toHaveBeenCalled();
    expect(sidenavEl.getAttribute('aria-modal')).toBe('true');
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
    const { fixture } = setup();
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

    // Restore is deferred to a microtask so it runs after the close DOM settles.
    await Promise.resolve();
    expect(document.activeElement).toBe(trigger);

    fixture.nativeElement.remove();
    fixture.destroy();
  });
});
