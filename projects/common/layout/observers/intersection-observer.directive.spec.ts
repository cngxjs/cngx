import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CngxIntersectionObserver } from './intersection-observer.directive';

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void;

let capturedCallback: IntersectionCallback | null = null;
let mockObserver: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };

@Component({
  template: `
    <div
      cngxIntersectionObserver
      [rootMargin]="rootMargin()"
      [threshold]="threshold()"
      (intersectionChange)="onChange($event)"
      (entered)="onEntered()"
      (left)="onLeft()"
    ></div>
  `,
  imports: [CngxIntersectionObserver],
})
class TestHost {
  rootMargin = signal('0px');
  threshold = signal<number | number[]>(0);
  onChange = vi.fn();
  onEntered = vi.fn();
  onLeft = vi.fn();
}

describe('CngxIntersectionObserver', () => {
  beforeEach(() => {
    mockObserver = { observe: vi.fn(), disconnect: vi.fn() };
    capturedCallback = null;

    class MockIO {
      constructor(cb: IntersectionCallback) {
        capturedCallback = cb;
        Object.assign(this, mockObserver);
      }
    }
    vi.stubGlobal('IntersectionObserver', MockIO);

    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxIntersectionObserver))
      .injector.get(CngxIntersectionObserver);
    return { fixture, dir };
  }

  function makeEntry(
    isIntersecting: boolean,
    ratio = isIntersecting ? 1 : 0,
  ): IntersectionObserverEntry {
    return {
      isIntersecting,
      intersectionRatio: ratio,
      target: document.createElement('div'),
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: null,
      time: 0,
    };
  }

  it('isIntersecting defaults to false', () => {
    const { dir } = setup();
    expect(dir.isIntersecting()).toBe(false);
    expect(dir.intersectionRatio()).toBe(0);
  });

  it('updates isIntersecting when entry fires', () => {
    const { dir } = setup();
    capturedCallback!([makeEntry(true)]);
    expect(dir.isIntersecting()).toBe(true);
    expect(dir.intersectionRatio()).toBe(1);
  });

  it('emits entered when element becomes intersecting', () => {
    const { dir } = setup();
    const spy = vi.fn();
    dir.entered.subscribe(spy);
    capturedCallback!([makeEntry(true)]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('emits left when element stops intersecting', () => {
    const { dir } = setup();
    const spy = vi.fn();
    dir.left.subscribe(spy);
    // First make it intersecting
    capturedCallback!([makeEntry(true)]);
    // Then leave
    capturedCallback!([makeEntry(false)]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('rebuilds observer when rootMargin changes', () => {
    const { fixture } = setup();
    const disconnectBefore = (mockObserver.disconnect as ReturnType<typeof vi.fn>).mock.calls
      .length;
    fixture.componentInstance.rootMargin.set('10px');
    fixture.detectChanges();
    expect((mockObserver.disconnect as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
      disconnectBefore,
    );
  });

  it('disconnects on destroy', () => {
    const { fixture } = setup();
    const before = mockObserver.disconnect.mock.calls.length;
    fixture.destroy();
    expect(mockObserver.disconnect.mock.calls.length).toBeGreaterThan(before);
  });
});
