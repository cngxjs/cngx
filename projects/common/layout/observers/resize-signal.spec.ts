import { TestBed } from '@angular/core/testing';
import { DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { createResizeObserverMock, type ResizeObserverMock } from '@cngx/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createResizeSignal, observeResize, type ResizeObserverHost } from './resize-signal';

let roMock: ResizeObserverMock;

function makeEntry(inlineSize: number): ResizeObserverEntry {
  return {
    borderBoxSize: [{ inlineSize, blockSize: 10 }],
    contentBoxSize: [{ inlineSize, blockSize: 10 }],
    devicePixelContentBoxSize: [],
    contentRect: { width: inlineSize, height: 10 } as DOMRectReadOnly,
    target: document.createElement('div'),
  } as unknown as ResizeObserverEntry;
}

describe('observeResize', () => {
  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('observes the element with the requested box', () => {
    const element = document.createElement('div');
    observeResize(window, element, 'border-box', () => undefined);
    expect(roMock.observe).toHaveBeenCalledWith(element, { box: 'border-box' });
  });

  it('applies every observation', () => {
    const apply = vi.fn();
    observeResize(window, document.createElement('div'), 'content-box', apply);
    roMock.triggerResize(makeEntry(320));
    roMock.triggerResize(makeEntry(640));
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply.mock.calls[1][0].borderBoxSize[0].inlineSize).toBe(640);
  });

  it('disconnects through the returned teardown', () => {
    const teardown = observeResize(window, document.createElement('div'), 'content-box', vi.fn());
    const before = roMock.disconnect.mock.calls.length;
    teardown();
    expect(roMock.disconnect.mock.calls.length).toBe(before + 1);
  });

  it('wires nothing on a host without ResizeObserver', () => {
    const apply = vi.fn();
    const host: ResizeObserverHost = {};
    const teardown = observeResize(host, document.createElement('div'), 'content-box', apply);
    expect(roMock.observe).not.toHaveBeenCalled();
    expect(() => teardown()).not.toThrow();
    expect(apply).not.toHaveBeenCalled();
  });

  it('wires nothing on a null host', () => {
    expect(() =>
      observeResize(null, document.createElement('div'), 'content-box', vi.fn())(),
    ).not.toThrow();
  });
});

describe('createResizeSignal', () => {
  beforeEach(() => {
    roMock = createResizeObserverMock();
    roMock.install(window);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('starts null and carries the latest entry', () => {
    const injector = TestBed.inject(Injector);
    const entry = runInInjectionContext(injector, () =>
      createResizeSignal(
        document.createElement('div'),
        'border-box',
        TestBed.inject(DestroyRef),
        window,
      ),
    );
    expect(entry()).toBeNull();
    roMock.triggerResize(makeEntry(480));
    expect(entry()?.borderBoxSize[0].inlineSize).toBe(480);
  });

  it('stays null on a host without ResizeObserver', () => {
    const entry = createResizeSignal(
      document.createElement('div'),
      'border-box',
      TestBed.inject(DestroyRef),
      {},
    );
    expect(entry()).toBeNull();
  });
});
