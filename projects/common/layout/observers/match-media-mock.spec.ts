import { createMatchMediaMock } from '@cngx/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

const COMPACT = '(max-width: 640px)';
const MOTION = '(prefers-reduced-motion: reduce)';

type MaybeMatchMedia = Window & { matchMedia?: typeof window.matchMedia };

// Characterization of the shared @cngx/testing matchMedia mock, co-located
// with the media-query consumers (projects/testing has no test runner).
describe('createMatchMediaMock', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('installs without an original matchMedia (jsdom ships none)', () => {
    expect((window as MaybeMatchMedia).matchMedia).toBeUndefined();
    const mock = createMatchMediaMock();
    expect(() => mock.install(window)).not.toThrow();
    expect(typeof window.matchMedia).toBe('function');
  });

  it('restore removes the stub when no original existed', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    mock.restore(window);
    expect((window as MaybeMatchMedia).matchMedia).toBeUndefined();
  });

  it('sits inside the unstubAllGlobals net', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    vi.unstubAllGlobals();
    expect((window as MaybeMatchMedia).matchMedia).toBeUndefined();
  });

  it('echoes the query and the initial matches on each MQL', () => {
    const mock = createMatchMediaMock(true);
    mock.install(window);
    const mql = window.matchMedia(COMPACT);
    expect(mql.media).toBe(COMPACT);
    expect(mql.matches).toBe(true);
  });

  it('keys listeners per query and scopes trigger to the given query', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    const compact = window.matchMedia(COMPACT);
    const motion = window.matchMedia(MOTION);
    const onCompact = vi.fn();
    const onMotion = vi.fn();
    compact.addEventListener('change', onCompact);
    motion.addEventListener('change', onMotion);

    mock.trigger(true, COMPACT);

    expect(onCompact).toHaveBeenCalledWith(expect.objectContaining({ matches: true, media: COMPACT }));
    expect(onMotion).not.toHaveBeenCalled();
    expect(compact.matches).toBe(true);
    expect(motion.matches).toBe(false);
  });

  it('fires every tracked query when trigger has no query argument', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    const onCompact = vi.fn();
    const onMotion = vi.fn();
    window.matchMedia(COMPACT).addEventListener('change', onCompact);
    window.matchMedia(MOTION).addEventListener('change', onMotion);

    mock.trigger(true);

    expect(onCompact).toHaveBeenCalledTimes(1);
    expect(onMotion).toHaveBeenCalledTimes(1);
  });

  it('shares one listener list per query across repeated matchMedia calls', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    const listener = vi.fn();
    window.matchMedia(COMPACT).addEventListener('change', listener);

    mock.trigger(true, COMPACT);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(window.matchMedia(COMPACT).matches).toBe(true);
  });

  it('detaches via removeEventListener', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    const mql = window.matchMedia(COMPACT);
    const listener = vi.fn();
    mql.addEventListener('change', listener);
    mql.removeEventListener('change', listener);

    mock.trigger(true, COMPACT);

    expect(listener).not.toHaveBeenCalled();
  });

  it('routes the deprecated addListener/removeListener onto the same list', () => {
    const mock = createMatchMediaMock();
    mock.install(window);
    const mql = window.matchMedia(COMPACT);
    const legacy = vi.fn();
    mql.addListener(legacy);

    mock.trigger(true, COMPACT);
    expect(legacy).toHaveBeenCalledWith(expect.objectContaining({ matches: true }));

    mql.removeListener(legacy);
    mock.trigger(false, COMPACT);
    expect(legacy).toHaveBeenCalledTimes(1);
  });
});
