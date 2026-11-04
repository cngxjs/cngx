import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCloseWatcher } from './close-watcher';

interface FakeWatcher {
  onclose: (() => void) | null;
  destroy: ReturnType<typeof vi.fn>;
}

describe('createCloseWatcher', () => {
  let watchers: FakeWatcher[];
  let fakeWindow: Record<string, unknown>;

  beforeEach(() => {
    watchers = [];
    fakeWindow = {
      CloseWatcher: class {
        onclose: (() => void) | null = null;
        destroy = vi.fn();
        constructor() {
          watchers.push(this);
        }
      },
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates one watcher on arm and ignores a second arm', () => {
    const handle = createCloseWatcher(vi.fn(), fakeWindow as unknown as Window);
    handle.arm();
    handle.arm();
    expect(watchers).toHaveLength(1);
  });

  it('runs onClose once when the armed watcher fires', () => {
    const onClose = vi.fn();
    const handle = createCloseWatcher(onClose, fakeWindow as unknown as Window);
    handle.arm();

    watchers[0].onclose?.();
    watchers[0].onclose?.();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('re-arms a fresh watcher after a close', () => {
    const onClose = vi.fn();
    const handle = createCloseWatcher(onClose, fakeWindow as unknown as Window);
    handle.arm();
    watchers[0].onclose?.();

    handle.arm();
    expect(watchers).toHaveLength(2);
    watchers[1].onclose?.();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('re-arms from inside onClose', () => {
    const handle = createCloseWatcher(() => handle.arm(), fakeWindow as unknown as Window);
    handle.arm();
    watchers[0].onclose?.();
    expect(watchers).toHaveLength(2);
  });

  it('destroys the watcher on disarm and ignores its late close', () => {
    const onClose = vi.fn();
    const handle = createCloseWatcher(onClose, fakeWindow as unknown as Window);
    handle.arm();
    handle.disarm();
    handle.disarm();

    expect(watchers[0].destroy).toHaveBeenCalledTimes(1);
    watchers[0].onclose?.();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('is a no-op where the platform has no CloseWatcher', () => {
    const onClose = vi.fn();
    const handle = createCloseWatcher(onClose, {} as Window);
    expect(() => {
      handle.arm();
      handle.disarm();
    }).not.toThrow();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('is a no-op without a window', () => {
    const handle = createCloseWatcher(vi.fn(), null);
    expect(() => {
      handle.arm();
      handle.disarm();
    }).not.toThrow();
  });

  it('reads CloseWatcher from the global window by default', () => {
    vi.stubGlobal('CloseWatcher', fakeWindow['CloseWatcher']);
    const handle = createCloseWatcher(vi.fn());
    handle.arm();
    expect(watchers).toHaveLength(1);
  });
});
