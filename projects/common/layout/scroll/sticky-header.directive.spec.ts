import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxStickyHeader } from './sticky-header.directive';

let observerCallback: IntersectionObserverCallback;
let observerOptions: IntersectionObserverInit | undefined;

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    observerCallback = callback;
    observerOptions = options;
  }
}
// Stubbed once at module level on purpose: every test here needs the mock, so it
// must not be unstubbed per test. The shared setup unstubs at file end, which is
// what keeps it out of the next spec file.
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

@Component({
  template: `<header cngxStickyHeader #sh="cngxStickyHeader" (stickyChange)="sticky = $event">
    Header
  </header>`,
  imports: [CngxStickyHeader],
})
class TestHost {
  sticky = false;
}

describe('CngxStickyHeader', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TestHost] }));

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const header = fixture.debugElement.query(By.directive(CngxStickyHeader));
    const dir = header.injector.get(CngxStickyHeader);
    return { fixture, header, dir };
  }

  it('starts not sticky', () => {
    const { dir } = setup();
    expect(dir.isSticky()).toBe(false);
  });

  it('becomes sticky when sentinel leaves viewport', () => {
    const { dir, fixture } = setup();

    observerCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(dir.isSticky()).toBe(true);
    expect(fixture.componentInstance.sticky).toBe(true);
  });

  it('becomes un-sticky when sentinel re-enters viewport', () => {
    const { dir, fixture } = setup();

    observerCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(dir.isSticky()).toBe(true);

    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(dir.isSticky()).toBe(false);
    expect(fixture.componentInstance.sticky).toBe(false);
  });

  it('adds cngx-sticky--active class when sticky', () => {
    const { header, fixture } = setup();

    observerCallback(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    fixture.detectChanges();

    expect((header.nativeElement as HTMLElement).classList.contains('cngx-sticky--active')).toBe(
      true,
    );
  });
});

@Component({
  template: `<div class="scrollport" style="overflow-y: auto">
    <header cngxStickyHeader>Header</header>
  </div>`,
  imports: [CngxStickyHeader],
})
class ScrollportHost {}

describe('CngxStickyHeader scrollport resolution', () => {
  let restoreLayout: (() => void) | undefined;

  beforeEach(() => TestBed.configureTestingModule({ imports: [ScrollportHost] }));

  afterEach(() => {
    restoreLayout?.();
    restoreLayout = undefined;
  });

  // jsdom returns 0 for both layout reads and does not lay out. Pin them on the
  // prototype so the resolved scrollport reports the intended scrollability whenever
  // the after-render callback runs (it can run across more than one detection pass in
  // this runner). Restored per test so nothing leaks into the shared worker env.
  function stubLayout(clientHeight: number, scrollHeight: number): void {
    const proto = HTMLElement.prototype;
    const bag = proto as unknown as Record<string, unknown>;
    const oc = Object.getOwnPropertyDescriptor(proto, 'clientHeight');
    const os = Object.getOwnPropertyDescriptor(proto, 'scrollHeight');
    Object.defineProperty(proto, 'clientHeight', { get: () => clientHeight, configurable: true });
    Object.defineProperty(proto, 'scrollHeight', { get: () => scrollHeight, configurable: true });
    restoreLayout = () => {
      if (oc) {
        Object.defineProperty(proto, 'clientHeight', oc);
      } else {
        delete bag['clientHeight'];
      }
      if (os) {
        Object.defineProperty(proto, 'scrollHeight', os);
      } else {
        delete bag['scrollHeight'];
      }
    };
  }

  function setup() {
    const fixture = TestBed.createComponent(ScrollportHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    fixture.detectChanges();
    const scrollport = fixture.nativeElement.querySelector('.scrollport') as HTMLElement;
    const dir = fixture.debugElement
      .query(By.directive(CngxStickyHeader))
      .injector.get(CngxStickyHeader);
    return { fixture, scrollport, dir };
  }

  it('roots the observer at the nearest overflow-y ancestor, not the viewport', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubLayout(100, 500); // scrollable: scroll height exceeds client height
    const { scrollport } = setup();

    expect(observerOptions?.root).toBe(scrollport);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns and stays un-sticky when the resolved scrollport cannot scroll', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    stubLayout(100, 100); // content-height: client height equals scroll height
    const { dir, scrollport } = setup();

    expect(observerOptions?.root).toBe(scrollport);
    expect(dir.isSticky()).toBe(false);
    expect(warn).toHaveBeenCalled();
    expect(warn.mock.calls[0][0]).toMatch(/cngxStickyHeader/);
    expect(warn.mock.calls[0][0]).toMatch(/never pin/);
    warn.mockRestore();
  });
});
