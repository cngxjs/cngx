import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CNGX_DEFAULT_HALF_WIRED_SLOT_SINK } from './half-wired-slot-sink';

describe('CNGX_DEFAULT_HALF_WIRED_SLOT_SINK', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('writes through to console.warn in dev-mode', () => {
    CNGX_DEFAULT_HALF_WIRED_SLOT_SINK('contentTemplate');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = String(warnSpy.mock.calls[0][0]);
    expect(message).toContain('aggregator-content slot half-wired');
    expect(message).toContain('contentTemplate');
  });

  it('reports the missing half verbatim', () => {
    CNGX_DEFAULT_HALF_WIRED_SLOT_SINK('viewContainerRef');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('viewContainerRef');
  });
});
