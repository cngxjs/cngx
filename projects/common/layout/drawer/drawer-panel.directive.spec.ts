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
    <div cngxDrawer #drawer="cngxDrawer">
      <nav
        [cngxDrawerPanel]="drawer"
        [position]="position()"
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
  closeOnClickOutside = signal(true);
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

  it('has role="complementary"', () => {
    const { panelEl } = setup();
    expect(panelEl.getAttribute('role')).toBe('complementary');
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

  it('closes drawer on click outside when enabled', () => {
    const { fixture, drawer } = setup();
    drawer.open();
    fixture.detectChanges();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(false);
  });

  it('does not close on click outside when disabled', () => {
    const { fixture, drawer, host } = setup();
    host.closeOnClickOutside.set(false);
    fixture.detectChanges();
    drawer.open();
    fixture.detectChanges();

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(true);
  });

  it('does not close on click inside the panel', () => {
    const { fixture, drawer, panelEl } = setup();
    drawer.open();
    fixture.detectChanges();

    panelEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(true);
  });

  it('does not close on click inside the drawer container but outside the panel', () => {
    const { fixture, drawer } = setup();
    drawer.open();
    fixture.detectChanges();

    // Click on the drawer container element (parent of the panel)
    const drawerEl = fixture.debugElement.query(By.directive(CngxDrawer))
      .nativeElement as HTMLElement;
    drawerEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(drawer.opened()).toBe(true);
  });
});
