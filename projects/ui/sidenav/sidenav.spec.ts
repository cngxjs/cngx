import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SidenavMode } from './sidenav';
import { CngxSidenav } from './sidenav';
import { CngxSidenavLayout } from './sidenav-layout';
import { CngxSidenavContent } from './sidenav-content';

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
      >
        Left content
      </cngx-sidenav>
      <cngx-sidenav-content>Main</cngx-sidenav-content>
      <cngx-sidenav position="end" [(opened)]="rightOpen"> Right content </cngx-sidenav>
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
  template: `<cngx-sidenav [shortcut]="shortcut()" [(opened)]="open">Nav</cngx-sidenav>`,
  imports: [CngxSidenav],
})
class ShortcutHost {
  open = signal(false);
  shortcut = signal<string | undefined>('mod+b');
}

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
    expect(content.marginStart).toBe('0');
    expect(content.marginEnd).toBe('0');

    host.mode.set('push');
    fixture.detectChanges();
    expect(content.marginStart).toBe('0');

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

  it('sets aria-hidden on overlay sidenavs', () => {
    const { fixture, host } = setupDual();
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.getAttribute('aria-hidden')).toBe('true');
    host.leftOpen.set(true);
    fixture.detectChanges();
    expect(leftEl.getAttribute('aria-hidden')).toBe('false');
  });

  it('does not set aria-hidden in side mode', () => {
    const { fixture, host } = setupDual();
    host.mode.set('side');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
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

  it('auto-opens when switching from mini to an overlay mode', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    host.leftOpen.set(false);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('mini');

    host.mode.set('over');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(left.effectiveMode()).toBe('over');
    expect(host.leftOpen()).toBe(true);
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

describe('CngxSidenav mini mode', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Debounced expand-on-hover routes through the CngxHoverIntent hostDirective,
  // whose pointerenter/pointerleave listeners settle `active` after enterDelay
  // (120ms) / leaveDelay (0ms). Drive it with real pointer events under fake
  // timers, mirroring the hover-intent directive's own specs.
  const ENTER_DELAY = 120;

  function enter(el: HTMLElement): void {
    el.dispatchEvent(new PointerEvent('pointerenter'));
  }
  function leave(el: HTMLElement): void {
    el.dispatchEvent(new PointerEvent('pointerleave'));
  }

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

  it('effectiveMode() returns mini when mode is mini', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    expect(left.effectiveMode()).toBe('mini');
  });

  it('close() is a no-op in mini mode', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    left.open();
    left.close();
    expect(left.opened()).toBe(true);
  });

  it('expanded signal starts false', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    expect(left.expanded()).toBe(false);
  });

  it('expands only after a deliberate hover dwell in mini mode', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY - 1);
    expect(left.expanded()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(left.expanded()).toBe(true);
  });

  it('collapses on a debounced pointer leave in mini mode', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY);
    expect(left.expanded()).toBe(true);
    leave(el);
    vi.advanceTimersByTime(1);
    expect(left.expanded()).toBe(false);
  });

  it('does not expand on a sweep-through (leave before enterDelay)', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;
    enter(el);
    vi.advanceTimersByTime(80);
    leave(el);
    vi.advanceTimersByTime(500);
    expect(left.expanded()).toBe(false);
  });

  it('ignores hover when expandOnHover=false, but expand() still works', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    host.expandOnHover.set(false);
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;
    enter(el);
    vi.advanceTimersByTime(500);
    expect(left.expanded()).toBe(false);
    left.expand();
    expect(left.expanded()).toBe(true);
  });

  it('clears the pending hover timer on destroy (no late expand)', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;
    enter(el);
    vi.advanceTimersByTime(80);
    fixture.destroy();
    vi.advanceTimersByTime(500);
    expect(left.expanded()).toBe(false);
  });

  it('lets a pointer edge override a prior programmatic expand when expandOnHover=true', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;

    // Programmatic expand holds while the debounced hover has not changed.
    left.expand();
    expect(left.expanded()).toBe(true);

    // A hover dwell then a leave re-derive expanded from the debounced hover,
    // overriding the prior programmatic set - hover is the source of truth.
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY);
    expect(left.expanded()).toBe(true);
    leave(el);
    vi.advanceTimersByTime(1);
    expect(left.expanded()).toBe(false);
  });

  it('resets expanded to false automatically when leaving mini mode', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const el = left.elementRef.nativeElement;
    enter(el);
    vi.advanceTimersByTime(ENTER_DELAY);
    expect(left.expanded()).toBe(true);

    // Leaving mini derives expanded back to false via linkedSignal, with no
    // imperative reset in the mode effect.
    host.mode.set('side');
    fixture.detectChanges();
    expect(left.expanded()).toBe(false);
  });

  it('effectiveWidth returns miniWidth when collapsed', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    host.miniWidth.set('64px');
    fixture.detectChanges();
    expect(left.effectiveWidth()).toBe('64px');
  });

  it('effectiveWidth returns width when expanded', () => {
    const { fixture, left, host } = setupDual();
    host.mode.set('mini');
    host.width.set('300px');
    fixture.detectChanges();
    enter(left.elementRef.nativeElement);
    vi.advanceTimersByTime(ENTER_DELAY);
    expect(left.effectiveWidth()).toBe('300px');
  });

  it('adds cngx-sidenav--mini class', () => {
    const { fixture, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.classList.contains('cngx-sidenav--mini')).toBe(true);
  });

  it('adds cngx-sidenav--expanded class when expanded', () => {
    const { fixture, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.classList.contains('cngx-sidenav--expanded')).toBe(false);
    enter(leftEl);
    vi.advanceTimersByTime(ENTER_DELAY);
    fixture.detectChanges();
    expect(leftEl.classList.contains('cngx-sidenav--expanded')).toBe(true);
  });

  it('does not set aria-hidden in mini mode', () => {
    const { fixture, host } = setupDual();
    host.mode.set('mini');
    fixture.detectChanges();
    const leftEl = fixture.debugElement.queryAll(By.directive(CngxSidenav))[0]
      .nativeElement as HTMLElement;
    expect(leftEl.getAttribute('aria-hidden')).toBeNull();
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

  it('does not set aria-label when undefined', () => {
    const { leftEl } = setupDual();
    expect(leftEl.getAttribute('aria-label')).toBeNull();
  });
});

describe('CngxSidenav resizable', () => {
  afterEach(() => vi.restoreAllMocks());

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
    const { fixture, left, host } = setupDual();
    host.resizable.set(true);
    fixture.detectChanges();

    const addSpy = vi.spyOn(document, 'addEventListener');
    left.handleResizeStart({
      preventDefault: vi.fn(),
      clientX: 100,
      pointerId: 1,
      target: { setPointerCapture: vi.fn() },
    } as unknown as PointerEvent);

    const moveCall = addSpy.mock.calls.find((c) => c[0] === 'pointermove');
    const options = moveCall?.[2] as AddEventListenerOptions | undefined;
    expect(options?.signal).toBeDefined();
    expect(options?.signal?.aborted).toBe(false);

    // Teardown mid-drag (onUp never fired) must still remove both listeners.
    fixture.destroy();
    expect(options?.signal?.aborted).toBe(true);
  });
});

describe('CngxSidenav responsive', () => {
  let changeHandler: ((e: { matches: boolean }) => void) | undefined;

  beforeEach(() => {
    changeHandler = undefined;
    (globalThis as Record<string, unknown>)['matchMedia'] = vi
      .fn()
      .mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: vi.fn((_: string, h: (e: { matches: boolean }) => void) => {
          changeHandler = h;
        }),
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
    // and makes Angular's scheduler run reentrantly.
    vi.unstubAllGlobals();
  });

  function startDrag(nav: CngxSidenav, clientX: number): void {
    nav.handleResizeStart({
      preventDefault: vi.fn(),
      clientX,
      pointerId: 1,
      target: { setPointerCapture: vi.fn() },
    } as unknown as PointerEvent);
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
    const left = fixture.debugElement
      .queryAll(By.directive(CngxSidenav))[0]
      .injector.get(CngxSidenav);

    // Dragging far right on a start-positioned rail widens; clamps to max (600).
    startDrag(left, 100);
    move(100_000);
    up();
    expect(left.width()).toBe('600px');

    // Dragging far left clamps to min (120).
    startDrag(left, 100);
    move(-100_000);
    up();
    expect(left.width()).toBe('120px');
  });

  it('flips the delta sign for an end-positioned rail', () => {
    const fixture = TestBed.createComponent(EndResizableHost);
    fixture.detectChanges();
    const end = fixture.debugElement.query(By.directive(CngxSidenav)).injector.get(CngxSidenav);

    // On an end rail the delta is inverted: dragging right narrows it (clamps to
    // min), dragging left widens it (clamps to max) - the mirror of the start rail.
    startDrag(end, 100);
    move(100_000);
    up();
    expect(end.width()).toBe('120px');

    startDrag(end, 100);
    move(-100_000);
    up();
    expect(end.width()).toBe('600px');
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
});
