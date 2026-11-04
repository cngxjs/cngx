import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxDrawer } from './drawer.directive';
import { CngxDrawerPanel, type DrawerMode } from './drawer-panel.directive';

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
    <button class="outside-toggle" (click)="drawerDir.open()" type="button">open</button>
    <button class="controller" aria-controls="panel" (click)="drawerDir.toggle()" type="button">
      toggle
    </button>
    <div cngxDrawer #drawer="cngxDrawer">
      <nav
        id="panel"
        [cngxDrawerPanel]="drawer"
        [position]="position()"
        [mode]="mode()"
        [modal]="modal()"
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
  mode = signal<DrawerMode>('over');
  modal = signal<boolean | undefined>(undefined);
  role = signal<string | null>('complementary');
  closeOnClickOutside = signal(true);
  drawerDir!: CngxDrawer;
}

describe('CngxDrawerPanel', () => {
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
      imports: [TestHost],
      providers: [
        {
          provide: FocusTrapFactory,
          useValue: { create: vi.fn(() => mockTrap) },
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.overflow = '';
    document.documentElement.style.scrollbarGutter = '';
  });

  function pressOn(target: EventTarget) {
    target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  }

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

  it('is aria-hidden while closed and drops the attribute while open', () => {
    const { fixture, drawer, panelEl } = setup();
    expect(panelEl.getAttribute('aria-hidden')).toBe('true');
    drawer.open();
    fixture.detectChanges();
    expect(panelEl.hasAttribute('aria-hidden')).toBe(false);
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

  it('is inert and aria-hidden while closed in push mode too', () => {
    const { fixture, drawer, panelEl, host } = setup();
    host.mode.set('push');
    fixture.detectChanges();
    expect(panelEl.hasAttribute('inert')).toBe(true);
    expect(panelEl.getAttribute('aria-hidden')).toBe('true');
    drawer.open();
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

  it('closes the drawer on a press outside the panel', () => {
    const { fixture, drawer } = setup();
    drawer.open();
    fixture.detectChanges();

    pressOn(document.body);
    expect(drawer.opened()).toBe(false);
  });

  it('does not close on a press outside when closeOnClickOutside is false', () => {
    const { fixture, drawer, host } = setup();
    host.closeOnClickOutside.set(false);
    fixture.detectChanges();
    drawer.open();
    fixture.detectChanges();

    pressOn(document.body);
    expect(drawer.opened()).toBe(true);
  });

  it('does not close on a press inside the panel', () => {
    const { fixture, drawer, panelEl } = setup();
    drawer.open();
    fixture.detectChanges();

    pressOn(panelEl);
    expect(drawer.opened()).toBe(true);
  });

  it('closes on Escape inside the panel', () => {
    const { fixture, drawer, panelEl } = setup();
    drawer.open();
    fixture.detectChanges();

    (panelEl.querySelector('a') as HTMLAnchorElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(drawer.opened()).toBe(false);
  });

  it('restores focus to the opener after Escape closes the drawer', () => {
    const { fixture, drawer, panelEl } = setup();
    const toggle = fixture.debugElement.query(By.css('.outside-toggle'))
      .nativeElement as HTMLButtonElement;
    toggle.focus();
    drawer.open();
    fixture.detectChanges();
    TestBed.flushEffects();

    (panelEl.querySelector('a') as HTMLAnchorElement).focus();
    drawer.close();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(document.activeElement).toBe(toggle);
  });

  it('restores focus to the opener after an outside press on a non-focusable area', () => {
    const { fixture, drawer } = setup();
    const toggle = fixture.debugElement.query(By.css('.outside-toggle'))
      .nativeElement as HTMLButtonElement;
    toggle.focus();
    drawer.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    (document.activeElement as HTMLElement | null)?.blur();

    pressOn(document.body);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(drawer.opened()).toBe(false);
    expect(document.activeElement).toBe(toggle);
  });

  it('keeps focus on a focusable element the user pressed outside', () => {
    const { fixture, drawer } = setup();
    const toggle = fixture.debugElement.query(By.css('.outside-toggle'))
      .nativeElement as HTMLButtonElement;
    toggle.focus();
    drawer.open();
    fixture.detectChanges();
    TestBed.flushEffects();

    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    pressOn(outside);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(drawer.opened()).toBe(false);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it('stays open after the press and click that opened it', () => {
    const { drawer, fixture } = setup();
    const toggle = fixture.debugElement.query(By.css('.outside-toggle'))
      .nativeElement as HTMLButtonElement;

    pressOn(toggle);
    toggle.click();
    expect(drawer.opened()).toBe(true);
  });

  it('lets the aria-controls trigger toggle the open drawer closed', () => {
    const { fixture, drawer } = setup();
    drawer.open();
    fixture.detectChanges();
    const controller = fixture.debugElement.query(By.css('.controller'))
      .nativeElement as HTMLButtonElement;

    pressOn(controller);
    expect(drawer.opened()).toBe(true);
    controller.click();
    expect(drawer.opened()).toBe(false);
  });

  describe('modality', () => {
    function open(ctx: ReturnType<typeof setup>) {
      ctx.drawer.open();
      ctx.fixture.detectChanges();
      TestBed.flushEffects();
    }

    it('makes an open over panel a modal dialog with a trap and a scroll lock', () => {
      const ctx = setup();
      open(ctx);
      expect(ctx.panelEl.getAttribute('role')).toBe('dialog');
      expect(ctx.panelEl.getAttribute('aria-modal')).toBe('true');
      expect(mockTrap.enabled).toBe(true);
      expect(document.documentElement.style.overflow).toBe('hidden');
    });

    it('keeps a non-modal over panel operable', () => {
      const ctx = setup();
      ctx.host.modal.set(false);
      open(ctx);
      expect(ctx.panelEl.getAttribute('role')).toBe('complementary');
      expect(ctx.panelEl.hasAttribute('aria-modal')).toBe(false);
      expect(mockTrap.enabled).toBe(false);
      expect(document.documentElement.style.overflow).not.toBe('hidden');
    });

    it('never makes a push panel modal', () => {
      const ctx = setup();
      ctx.host.mode.set('push');
      open(ctx);
      expect(ctx.panelEl.hasAttribute('aria-modal')).toBe(false);
      expect(mockTrap.enabled).toBe(false);
    });

    it('resolves push with [modal]="true" to non-modal and warns CNGX1075', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const ctx = setup();
      ctx.host.mode.set('push');
      ctx.host.modal.set(true);
      open(ctx);

      expect(ctx.panelEl.hasAttribute('aria-modal')).toBe(false);
      expect(mockTrap.enabled).toBe(false);
      const calls = warn.mock.calls.filter(([msg]) => /^CNGX1075: /.test(String(msg)));
      expect(calls).toHaveLength(1);
    });

    it('closes a push panel on Escape and an outside press', () => {
      const ctx = setup();
      ctx.host.mode.set('push');
      open(ctx);
      pressOn(document.body);
      expect(ctx.drawer.opened()).toBe(false);
    });
  });
});

@Component({
  template: `
    <div cngxDrawer cngxDrawerPanel #panel="cngxDrawerPanel" #drawer="cngxDrawer"></div>
  `,
  imports: [CngxDrawer, CngxDrawerPanel],
})
class BareHost {}

describe('CngxDrawerPanel on a CngxDrawer host', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BareHost],
      providers: [
        {
          provide: FocusTrapFactory,
          useValue: {
            create: vi.fn(() => ({
              enabled: false,
              hasAttached: () => true,
              attachAnchors: vi.fn(),
              focusFirstTabbableElementWhenReady: vi.fn(),
              destroy: vi.fn(),
            })),
          },
        },
      ],
    });
  });

  afterEach(() => {
    document.documentElement.style.overflow = '';
    document.documentElement.style.scrollbarGutter = '';
  });

  it('falls back to the CngxDrawer on its own element', () => {
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDrawerPanel));
    const panel = el.injector.get(CngxDrawerPanel);
    const drawer = el.injector.get(CngxDrawer);

    expect(panel.drawerRef()).toBe(drawer);
    drawer.open();
    fixture.detectChanges();
    expect(panel.isOpen()).toBe(true);
    expect((el.nativeElement as HTMLElement).classList).toContain('cngx-drawer-panel--open');
  });
});
