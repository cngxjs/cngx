import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxDrawer } from './drawer.directive';
import { CngxDrawerPanel } from './drawer-panel.directive';

let mockTrap: {
  enabled: boolean;
  focusFirstTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  focusLastTabbableElementWhenReady: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
};

@Component({
  template: `
    <button class="outside-toggle" (click)="drawerDir.open()" type="button">open</button>
    <div cngxDrawer #drawer="cngxDrawer">
      <nav
        [cngxDrawerPanel]="drawer"
        [position]="position()"
        [mode]="mode()"
        [role]="role()"
        [closeOnClickOutside]="closeOnClickOutside()"
      >
        <a href="#">Link</a>
      </nav>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerPanel],
})
class TestHost {
  position = signal<'left' | 'right' | 'top' | 'bottom'>('left');
  mode = signal<'over' | 'push' | 'side'>('over');
  role = signal<string | null>('complementary');
  closeOnClickOutside = signal(true);
  drawerDir!: CngxDrawer;
}

describe('CngxDrawerPanel', () => {
  beforeEach(() => {
    mockTrap = {
      enabled: false,
      focusFirstTabbableElementWhenReady: vi.fn(),
      focusLastTabbableElementWhenReady: vi.fn(),
      destroy: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [
        {
          provide: FocusTrapFactory,
          useValue: { create: vi.fn(() => mockTrap) },
        },
      ],
    });
  });

  afterEach(() => vi.restoreAllMocks());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const drawer = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
    const panel = fixture.debugElement
      .query(By.directive(CngxDrawerPanel))
      .injector.get(CngxDrawerPanel);
    const panelEl = fixture.debugElement.query(By.directive(CngxDrawerPanel))
      .nativeElement as HTMLElement;
    fixture.componentInstance.drawerDir = drawer;
    return { fixture, drawer, panel, panelEl, host: fixture.componentInstance };
  }

  it('reflects isOpen from the drawer ref', () => {
    const { panel, drawer } = setup();
    expect(panel.isOpen()).toBe(false);
    drawer.open();
    expect(panel.isOpen()).toBe(true);
  });

  it('sets aria-hidden based on open state', () => {
    const { fixture, drawer, panelEl } = setup();
    expect(panelEl.getAttribute('aria-hidden')).toBe('true');
    drawer.open();
    fixture.detectChanges();
    expect(panelEl.getAttribute('aria-hidden')).toBe('false');
  });

  it('has role="complementary" by default', () => {
    const { panelEl } = setup();
    expect(panelEl.getAttribute('role')).toBe('complementary');
  });

  it('renders a consumer-supplied role and removes it on null', () => {
    const { fixture, panelEl, host } = setup();
    host.role.set('navigation');
    fixture.detectChanges();
    expect(panelEl.getAttribute('role')).toBe('navigation');
    host.role.set(null);
    fixture.detectChanges();
    expect(panelEl.hasAttribute('role')).toBe(false);
  });

  it('is inert while closed and interactive while open', () => {
    const { fixture, drawer, panelEl } = setup();
    expect(panelEl.hasAttribute('inert')).toBe(true);
    drawer.open();
    fixture.detectChanges();
    expect(panelEl.hasAttribute('inert')).toBe(false);
  });

  it('is never inert in side mode', () => {
    const { fixture, panelEl, host } = setup();
    host.mode.set('side');
    fixture.detectChanges();
    expect(panelEl.hasAttribute('inert')).toBe(false);
    expect(panelEl.hasAttribute('aria-hidden')).toBe(false);
  });

  it('applies position CSS class', () => {
    const { fixture, panelEl, host } = setup();
    expect(panelEl.classList.contains('cngx-drawer-panel--left')).toBe(true);
    host.position.set('right');
    fixture.detectChanges();
    expect(panelEl.classList.contains('cngx-drawer-panel--right')).toBe(true);
    expect(panelEl.classList.contains('cngx-drawer-panel--left')).toBe(false);
  });

  it('applies open CSS class when opened', () => {
    const { fixture, drawer, panelEl } = setup();
    expect(panelEl.classList.contains('cngx-drawer-panel--open')).toBe(false);
    drawer.open();
    fixture.detectChanges();
    expect(panelEl.classList.contains('cngx-drawer-panel--open')).toBe(true);
  });

  it('closes drawer on click outside when enabled', async () => {
    const { fixture, drawer } = setup();
    drawer.open();
    fixture.detectChanges();
    // let the opening-dispatch suppression window pass
    await new Promise((resolve) => setTimeout(resolve));

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(false);
  });

  it('does not close on click outside when disabled', async () => {
    const { fixture, drawer, host } = setup();
    host.closeOnClickOutside.set(false);
    fixture.detectChanges();
    drawer.open();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(true);
  });

  it('does not close on click inside the panel', async () => {
    const { fixture, drawer, panelEl } = setup();
    drawer.open();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    panelEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(true);
  });

  it('ignores the bubbling click that opened the drawer', async () => {
    const { fixture, drawer } = setup();
    TestBed.flushEffects();
    const toggle = fixture.debugElement.query(By.css('.outside-toggle'))
      .nativeElement as HTMLButtonElement;

    toggle.click();
    expect(drawer.opened()).toBe(true);

    // once the opening dispatch has settled, outside clicks close again
    await new Promise((resolve) => setTimeout(resolve));
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(false);
  });

  it('does not close on click inside the drawer container but outside the panel', async () => {
    const { fixture, drawer } = setup();
    drawer.open();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    // Click on the drawer container element (parent of the panel)
    const drawerEl = fixture.debugElement.query(By.directive(CngxDrawer))
      .nativeElement as HTMLElement;
    drawerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(true);
  });
});
