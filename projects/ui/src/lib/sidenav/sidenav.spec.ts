import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CngxSidenav } from './sidenav';
import { CngxSidenavLayout } from './sidenav-layout';
import { CngxSidenavContent } from './sidenav-content';

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" [(opened)]="leftOpen"
                    [mode]="mode()" [width]="width()">
        Left content
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
      <cngx-sidenav position="end" [(opened)]="rightOpen">
        Right content
      </cngx-sidenav>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class DualHost {
  leftOpen = signal(false);
  rightOpen = signal(false);
  mode = signal<'over' | 'push' | 'side'>('over');
  width = signal('240px');
}

@Component({
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" [(opened)]="open" [mode]="mode()" [responsive]="responsive()">
        Nav
      </cngx-sidenav>
      <cngx-sidenav-content>Content</cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
  imports: [CngxSidenavLayout, CngxSidenav, CngxSidenavContent],
})
class ResponsiveHost {
  open = signal(false);
  mode = signal<'over' | 'push' | 'side'>('over');
  responsive = signal<string | undefined>(undefined);
}

describe('CngxSidenav', () => {
  afterEach(() => vi.restoreAllMocks());

  function setupDual() {
    const fixture = TestBed.createComponent(DualHost);
    fixture.detectChanges();
    const layout = fixture.debugElement.query(By.directive(CngxSidenavLayout)).injector.get(CngxSidenavLayout);
    const sidenavs = fixture.debugElement.queryAll(By.directive(CngxSidenav));
    const left = sidenavs.find(d => d.injector.get(CngxSidenav).position() === 'start')!.injector.get(CngxSidenav);
    const right = sidenavs.find(d => d.injector.get(CngxSidenav).position() === 'end')!.injector.get(CngxSidenav);
    const content = fixture.debugElement.query(By.directive(CngxSidenavContent)).injector.get(CngxSidenavContent);
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

  it('close() does nothing in side mode', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    left.open();
    left.close();
    expect(left.opened()).toBe(true); // side mode doesn't close
  });

  it('content never applies margins (flex handles layout)', () => {
    const { fixture, content, host } = setupDual();
    host.mode.set('side');
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(content.marginStart()).toBe('0');
    expect(content.marginEnd()).toBe('0');

    host.mode.set('push');
    fixture.detectChanges();
    expect(content.marginStart()).toBe('0');

    host.mode.set('over');
    fixture.detectChanges();
    expect(content.marginStart()).toBe('0');
  });

  it('adds position classes', () => {
    const { fixture, host } = setupDual();
    host.leftOpen.set(true);
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0].nativeElement as HTMLElement;
    expect(leftEl.classList.contains('cngx-sidenav--start')).toBe(true);
    expect(leftEl.classList.contains('cngx-sidenav--open')).toBe(true);
  });

  it('adds mode classes', () => {
    const { fixture, host } = setupDual();
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0].nativeElement as HTMLElement;
    expect(leftEl.classList.contains('cngx-sidenav--over')).toBe(true);
    host.mode.set('push');
    fixture.detectChanges();
    expect(leftEl.classList.contains('cngx-sidenav--push')).toBe(true);
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
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0].nativeElement as HTMLElement;
    leftEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.leftOpen()).toBe(false);
  });

  it('sets aria-hidden on overlay sidenavs', () => {
    const { fixture, host } = setupDual();
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0].nativeElement as HTMLElement;
    expect(leftEl.getAttribute('aria-hidden')).toBe('true');
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(leftEl.getAttribute('aria-hidden')).toBe('false');
  });

  it('does not set aria-hidden in side mode', () => {
    const { fixture, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0].nativeElement as HTMLElement;
    expect(leftEl.getAttribute('aria-hidden')).toBeNull();
  });

  it('preserves opened state when switching from side to push', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    host.leftOpen.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('side');
    expect(left.opened()).toBe(true);

    host.mode.set('push');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('push');
    expect(left.opened()).toBe(true);
  });

  it('auto-opens when leaving side mode with opened=false', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('side');
    host.leftOpen.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('side');

    host.mode.set('push');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('push');
    expect(host.leftOpen()).toBe(true);
  });
});

describe('CngxSidenav responsive', () => {
  let changeHandler: ((e: { matches: boolean }) => void) | undefined;

  beforeEach(() => {
    changeHandler = undefined;
    (globalThis as Record<string, unknown>)['matchMedia'] = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn((_: string, h: (e: { matches: boolean }) => void) => { changeHandler = h; }),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as Record<string, unknown>)['matchMedia'];
  });

  it('switches to side mode when media query matches', () => {
    const fixture = TestBed.createComponent(ResponsiveHost);
    fixture.componentInstance.responsive.set('(min-width: 1024px)');
    fixture.detectChanges();
    TestBed.flushEffects();
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    expect(nav.effectiveMode()).toBe('side');
  });

  it('falls back to mode() input when media query does not match', () => {
    const fixture = TestBed.createComponent(ResponsiveHost);
    fixture.componentInstance.responsive.set('(min-width: 1024px)');
    fixture.detectChanges();
    TestBed.flushEffects();
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    changeHandler!({ matches: false });
    expect(nav.effectiveMode()).toBe('over'); // default mode is 'over'
  });

  it('falls back to push mode when responsive does not match and mode is push', () => {
    const fixture = TestBed.createComponent(ResponsiveHost);
    fixture.componentInstance.mode.set('push');
    fixture.componentInstance.responsive.set('(min-width: 1024px)');
    fixture.detectChanges();
    TestBed.flushEffects();
    const nav = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);
    changeHandler!({ matches: false });
    expect(nav.effectiveMode()).toBe('push');
  });
});
