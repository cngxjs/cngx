import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';
import { CngxResizeObserver } from './resize-observer.directive';

let roMock: ResizeObserverMock;

@Component({
  template: '<div cngxResizeObserver [box]="box()" (resize)="onResize($event)"></div>',
  imports: [CngxResizeObserver],
})
class TestHost {
  box = signal<ResizeObserverBoxOptions>('content-box');
  onResize = vi.fn();
}

describe('CngxResizeObserver', () => {
  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);

    TestBed.configureTestingModule({ imports: [TestHost] });
  });

  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    const dir = fixture.debugElement
      .query(By.directive(CngxResizeObserver))
      .injector.get(CngxResizeObserver);
    return { fixture, dir };
  }

  function makeEntry(width: number, height: number): ResizeObserverEntry {
    return {
      contentRect: {
        width,
        height,
        top: 0,
        left: 0,
        bottom: height,
        right: width,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRectReadOnly,
      target: document.createElement('div'),
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    };
  }

  it('isReady is false before first observation', () => {
    const { dir } = setup();
    expect(dir.isReady()).toBe(false);
  });

  it('updates width and height after resize entry', () => {
    const { dir } = setup();
    roMock.triggerResize(makeEntry(320, 200));
    expect(dir.width()).toBe(320);
    expect(dir.height()).toBe(200);
    expect(dir.isReady()).toBe(true);
  });

  it('emits resize output', () => {
    const { dir } = setup();
    const spy = vi.fn();
    dir.resize.subscribe(spy);
    roMock.triggerResize(makeEntry(100, 50));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('reconnects observer when box input changes', () => {
    const { fixture } = setup();
    const initialDisconnectCount = roMock.disconnect.mock.calls.length;
    fixture.componentInstance.box.set('border-box');
    fixture.detectChanges();
    expect(roMock.disconnect.mock.calls.length).toBeGreaterThan(initialDisconnectCount);
    expect(roMock.observe).toHaveBeenCalledWith(expect.any(HTMLElement), {
      box: 'border-box',
    });
  });

  it('disconnects observer on destroy', () => {
    const { fixture } = setup();
    const callsBefore = roMock.disconnect.mock.calls.length;
    fixture.destroy();
    expect(roMock.disconnect.mock.calls.length).toBeGreaterThan(callsBefore);
  });
});
