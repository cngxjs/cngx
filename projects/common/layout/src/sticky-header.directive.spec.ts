import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxStickyHeader } from './sticky-header.directive';

let observerCallback: IntersectionObserverCallback;

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }
}
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
