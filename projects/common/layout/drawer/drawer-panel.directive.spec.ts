import { Component, ElementRef, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { provideLayoutI18n, withLayoutI18nLabels } from '../i18n/layout-i18n';
import { CngxDrawer } from './drawer.directive';
import {
  CNGX_DRAWER_HOST,
  type CngxDrawerHost,
  type CngxDrawerPanelPresentation,
} from './drawer-host';
import { CngxDrawerPanel, type DrawerMode } from './drawer-panel.directive';
import type { CngxDrawerModality } from './drawer-surface.directive';

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
    <div cngxDrawer #drawer="cngxDrawer" class="drawer-host">
      <nav
        id="panel"
        [cngxDrawerPanel]="drawer"
        [position]="position()"
        [mode]="mode()"
        [modality]="modality()"
        [role]="role()"
        [label]="label()"
        [closeOnClickOutside]="closeOnClickOutside()"
      >
        <a href="#">Link</a>
      </nav>
      <main class="content">Content</main>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerPanel],
})
class TestHost {
  position = signal<'left' | 'right' | 'top' | 'bottom'>('left');
  mode = signal<DrawerMode>('over');
  modality = signal<CngxDrawerModality | undefined>(undefined);
  role = signal<string | null>('complementary');
  label = signal<string | undefined>(undefined);
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

  describe('name', () => {
    function open(ctx: ReturnType<typeof setup>) {
      ctx.drawer.open();
      ctx.fixture.detectChanges();
      TestBed.flushEffects();
    }

    it('names an open page-modal panel with the layout i18n fallback', () => {
      const ctx = setup();
      expect(ctx.panelEl.hasAttribute('aria-label')).toBe(false);

      open(ctx);

      expect(ctx.panelEl.getAttribute('role')).toBe('dialog');
      expect(ctx.panelEl.getAttribute('aria-label')).toBe('Drawer');
    });

    it('lets a bound label win over the fallback', () => {
      const ctx = setup();
      ctx.host.label.set('Main navigation');
      open(ctx);
      expect(ctx.panelEl.getAttribute('aria-label')).toBe('Main navigation');
    });

    it('renders no fallback name on a non-modal landmark', () => {
      const ctx = setup();
      ctx.host.modality.set('none');
      open(ctx);
      expect(ctx.panelEl.getAttribute('role')).toBe('complementary');
      expect(ctx.panelEl.hasAttribute('aria-label')).toBe(false);
    });

    it('follows a provideLayoutI18n override', () => {
      TestBed.configureTestingModule({
        providers: [provideLayoutI18n(withLayoutI18nLabels({ drawerDialog: 'Navigation' }))],
      });
      const ctx = setup();
      open(ctx);
      expect(ctx.panelEl.getAttribute('aria-label')).toBe('Navigation');
    });
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
      ctx.host.modality.set('none');
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

    for (const requested of ['page', 'contained'] as const) {
      it(`resolves push with modality="${requested}" to none and warns CNGX1075`, () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const ctx = setup();
        ctx.host.mode.set('push');
        ctx.host.modality.set(requested);
        open(ctx);

        expect(ctx.panelEl.hasAttribute('aria-modal')).toBe(false);
        expect(ctx.panelEl.classList).not.toContain('cngx-drawer-panel--modal');
        expect(mockTrap.enabled).toBe(false);
        expect(ctx.fixture.nativeElement.querySelector('.content').hasAttribute('inert')).toBe(
          false,
        );
        const calls = warn.mock.calls.filter(([msg]) => /^CNGX1075: /.test(String(msg)));
        expect(calls).toHaveLength(1);
      });
    }

    it('does not warn for push with modality="none"', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const ctx = setup();
      ctx.host.mode.set('push');
      ctx.host.modality.set('none');
      open(ctx);
      const calls = warn.mock.calls.filter(([msg]) => /^CNGX1075: /.test(String(msg)));
      expect(calls).toHaveLength(0);
    });

    describe('matrix', () => {
      const q = (ctx: ReturnType<typeof setup>, sel: string) =>
        (ctx.fixture.nativeElement as HTMLElement).querySelector(sel) as HTMLElement;

      it('page: dialog, aria-modal, trap, inert up to body, document lock', () => {
        const ctx = setup();
        ctx.host.modality.set('page');
        open(ctx);

        expect(ctx.panelEl.getAttribute('role')).toBe('dialog');
        expect(ctx.panelEl.getAttribute('aria-modal')).toBe('true');
        expect(mockTrap.enabled).toBe(true);
        expect(q(ctx, '.content').hasAttribute('inert')).toBe(true);
        expect(q(ctx, '.controller').hasAttribute('inert')).toBe(true);
        expect(q(ctx, '.outside-toggle').hasAttribute('inert')).toBe(true);
        expect(document.documentElement.style.overflow).toBe('hidden');
        expect(ctx.panelEl.classList).toContain('cngx-drawer-panel--modal');
        expect(ctx.panelEl.classList).not.toContain('cngx-drawer-panel--contained');
      });

      it('contained: landmark role, no trap, inert inside the drawer host only', () => {
        const ctx = setup();
        ctx.host.modality.set('contained');
        open(ctx);

        expect(ctx.panelEl.getAttribute('role')).toBe('complementary');
        expect(ctx.panelEl.hasAttribute('aria-modal')).toBe(false);
        expect(mockTrap.enabled).toBe(false);
        expect(mockTrap.focusFirstTabbableElementWhenReady).toHaveBeenCalledTimes(1);
        expect(q(ctx, '.content').hasAttribute('inert')).toBe(true);
        expect(q(ctx, '.drawer-host').hasAttribute('inert')).toBe(false);
        expect(q(ctx, '.controller').hasAttribute('inert')).toBe(false);
        expect(q(ctx, '.outside-toggle').hasAttribute('inert')).toBe(false);
        expect(document.documentElement.style.overflow).not.toBe('hidden');
        expect(ctx.panelEl.classList).toContain('cngx-drawer-panel--modal');
        expect(ctx.panelEl.classList).toContain('cngx-drawer-panel--contained');
      });

      it('contained: a header control outside the drawer host stays operable', () => {
        const ctx = setup();
        ctx.host.modality.set('contained');
        open(ctx);

        q(ctx, '.controller').click();
        ctx.fixture.detectChanges();
        expect(ctx.drawer.opened()).toBe(false);
      });

      it('contained: Escape closes, focus returns to the opener', () => {
        const ctx = setup();
        ctx.host.modality.set('contained');
        const opener = q(ctx, '.outside-toggle');
        opener.focus();
        open(ctx);
        (ctx.panelEl.querySelector('a') as HTMLElement).focus();

        ctx.panelEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        ctx.fixture.detectChanges();
        TestBed.flushEffects();

        expect(ctx.drawer.opened()).toBe(false);
        expect(document.activeElement).toBe(opener);
        expect(q(ctx, '.content').hasAttribute('inert')).toBe(false);
      });

      it('none: landmark role, no trap, nothing inert, no lock, no scrim class', () => {
        const ctx = setup();
        ctx.host.modality.set('none');
        open(ctx);

        expect(ctx.panelEl.getAttribute('role')).toBe('complementary');
        expect(mockTrap.enabled).toBe(false);
        expect(q(ctx, '.content').hasAttribute('inert')).toBe(false);
        expect(document.documentElement.style.overflow).not.toBe('hidden');
        expect(ctx.panelEl.classList).not.toContain('cngx-drawer-panel--modal');
      });
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

@Component({
  template: `
    <div
      cngxDrawer
      #drawer="cngxDrawer"
      [cngxDrawerOpened]="controlled() ? open() : undefined"
      (openedChange)="changes.push($event)"
      (closed)="closedCount = closedCount + 1"
    >
      <nav [cngxDrawerPanel]="drawer" modality="none"><a href="#">Link</a></nav>
      <main class="content">
        <button type="button">Content</button>
        <div popover="manual" class="menu"><button type="button">Item</button></div>
      </main>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerPanel],
})
class EscapeHost {
  readonly controlled = signal(true);
  readonly open = signal(true);
  readonly changes: boolean[] = [];
  closedCount = 0;
}

describe('CngxDrawer Escape with a panel', () => {
  let watchers: { onclose: (() => void) | null; destroy: () => void }[];

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
    TestBed.configureTestingModule({ imports: [EscapeHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  // Chromium turns an Escape keydown nobody cancelled into a close request
  // on the newest watcher, in the same task.
  function chromiumCloseRequest() {
    watchers.at(-1)?.onclose?.();
  }

  function escapeOn(target: Element) {
    target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }

  function setup(controlled: boolean) {
    const fixture = TestBed.createComponent(EscapeHost);
    fixture.componentInstance.controlled.set(controlled);
    fixture.detectChanges();
    const drawer = fixture.debugElement.query(By.directive(CngxDrawer)).injector.get(CngxDrawer);
    if (!controlled) {
      drawer.open();
      fixture.componentInstance.changes.length = 0;
    }
    fixture.detectChanges();
    TestBed.flushEffects();
    const root = fixture.nativeElement as HTMLElement;
    return { host: fixture.componentInstance, root };
  }

  for (const controlled of [true, false]) {
    const label = controlled ? 'controlled' : 'uncontrolled';

    it(`closes a ${label} drawer once for an Escape inside the panel`, () => {
      const { host, root } = setup(controlled);

      escapeOn(root.querySelector('nav a') as HTMLElement);

      expect(host.changes).toEqual([false]);
      expect(host.closedCount).toBe(1);
    });

    it(`closes a ${label} drawer once for an Escape outside the panel`, () => {
      const { host, root } = setup(controlled);

      escapeOn(root.querySelector('main button') as HTMLElement);

      expect(host.changes).toEqual([false]);
      expect(host.closedCount).toBe(1);
    });

    for (const [where, selector] of [
      ['in the content area', 'main button'],
      ['inside the panel', 'nav a'],
    ]) {
      it(`closes a ${label} drawer once for an Escape ${where} that Chromium also turns into a close request`, () => {
        const { host, root } = setup(controlled);

        escapeOn(root.querySelector(selector) as HTMLElement);
        chromiumCloseRequest();

        expect(host.changes).toEqual([false]);
        expect(host.closedCount).toBe(1);
      });
    }

    it(`keeps a ${label} drawer open while an open popover in the content takes Escape`, () => {
      const { host, root } = setup(controlled);
      const menu = root.querySelector('.menu') as HTMLElement;
      vi.spyOn(menu, 'matches').mockImplementation((selector) => selector === ':popover-open');

      escapeOn(menu.querySelector('button') as HTMLElement);
      chromiumCloseRequest();

      expect(host.changes).toEqual([]);
      expect(host.closedCount).toBe(0);
    });

    it(`closes a ${label} drawer on a back gesture`, () => {
      const { host } = setup(controlled);

      chromiumCloseRequest();

      expect(host.changes).toEqual([false]);
    });
  }
});

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

@Component({
  template: `<nav [cngxDrawerPanel]="customHost" modality="none"><a href="#">Link</a></nav>`,
  imports: [CngxDrawerPanel],
})
class CustomHostHost {
  readonly opened = signal(true);
  readonly connected: CngxDrawerPanelPresentation[] = [];
  readonly disconnected: CngxDrawerPanelPresentation[] = [];
  readonly close = vi.fn(() => this.opened.set(false));
  readonly customHost: CngxDrawerHost = {
    opened: this.opened,
    panelId: signal<string | undefined>('custom-panel'),
    elementRef: inject<ElementRef<HTMLElement>>(ElementRef),
    close: this.close,
    connectPanel: (panel) => {
      this.connected.push(panel);
      return () => this.disconnected.push(panel);
    },
  };
}

@Component({
  template: `<nav [cngxDrawerPanel]="useFirst() ? first : second" modality="none">
    <a href="#">Link</a>
  </nav>`,
  imports: [CngxDrawerPanel],
})
class ReboundHost {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly useFirst = signal(true);
  readonly log: string[] = [];
  readonly first = this.recordingHost('first');
  readonly second = this.recordingHost('second');

  private recordingHost(name: string): CngxDrawerHost {
    return {
      opened: signal(false),
      panelId: signal<string | undefined>(undefined),
      elementRef: this.elementRef,
      close: vi.fn(),
      connectPanel: () => {
        this.log.push(`connect ${name}`);
        return () => this.log.push(`disconnect ${name}`);
      },
    };
  }
}

describe('CngxDrawerPanel with a custom CngxDrawerHost', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CustomHostHost] });
  });

  it('reads the open state, the id and dismissals through the contract', () => {
    const fixture = TestBed.createComponent(CustomHostHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav') as HTMLElement;

    expect(nav.id).toBe('custom-panel');
    expect(nav.classList).toContain('cngx-drawer-panel--open');
    expect(host.connected).toHaveLength(1);
    expect(host.connected[0].element).toBe(nav);

    (nav.querySelector('a') as HTMLElement).dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(host.close).toHaveBeenCalledTimes(1);

    fixture.destroy();
    expect(host.disconnected).toEqual(host.connected);
  });

  it('connects once, follows a rebound host and disconnects on destroy', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [ReboundHost] });
    const fixture = TestBed.createComponent(ReboundHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const host = fixture.componentInstance;
    expect(host.log).toEqual(['connect first']);

    fixture.detectChanges();
    expect(host.log).toEqual(['connect first']);

    host.useFirst.set(false);
    fixture.detectChanges();
    expect(host.log).toEqual(['connect first', 'disconnect first', 'connect second']);

    fixture.destroy();
    expect(host.log.at(-1)).toBe('disconnect second');
  });

  it('is what CngxDrawer provides as CNGX_DRAWER_HOST', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ imports: [BareHost] });
    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(CngxDrawer));
    expect(el.injector.get(CNGX_DRAWER_HOST)).toBe(el.injector.get(CngxDrawer));
  });
});
