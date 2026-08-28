import { createResizeObserverMock } from '@cngx/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

type MaybeResizeObserver = Window & { ResizeObserver?: typeof ResizeObserver };

// Characterization of the shared @cngx/testing ResizeObserver mock, co-located
// with the resize-observer consumers (projects/testing has no test runner).
describe('createResizeObserverMock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as MaybeResizeObserver).ResizeObserver;
  });

  it('installs a constructible ResizeObserver and captures the callback', () => {
    const mock = createResizeObserverMock();
    mock.install(window);
    const seen: number[] = [];
    const observer = new window.ResizeObserver((entries) => {
      seen.push(entries[0].contentRect.width);
    });
    observer.observe(document.body);

    mock.triggerResize({ contentRect: { width: 500 } as DOMRectReadOnly });

    expect(seen).toEqual([500]);
    expect(mock.observe).toHaveBeenCalledWith(document.body);
  });

  it('restore removes the mock when no original existed (jsdom)', () => {
    const mock = createResizeObserverMock();
    mock.install(window);
    mock.restore(window);
    expect((window as MaybeResizeObserver).ResizeObserver).toBeUndefined();
  });

  it('restore reinstates a pre-existing ResizeObserver', () => {
    const original = class OriginalRO {} as unknown as typeof ResizeObserver;
    (window as MaybeResizeObserver).ResizeObserver = original;

    const mock = createResizeObserverMock();
    mock.install(window);
    expect(window.ResizeObserver).not.toBe(original);
    mock.restore(window);

    expect(window.ResizeObserver).toBe(original);
  });

  it('sits inside the unstubAllGlobals net', () => {
    const mock = createResizeObserverMock();
    mock.install(window);
    vi.unstubAllGlobals();
    expect((window as MaybeResizeObserver).ResizeObserver).toBeUndefined();
  });
});
