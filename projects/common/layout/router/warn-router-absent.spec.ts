import { afterEach, describe, expect, it, vi } from 'vitest';

import { warnRouterAbsent } from './warn-router-absent';

describe('warnRouterAbsent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('warns once with the directive name and the enables clause', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    warnRouterAbsent('CngxSidenavRouterSync', 'deep-linking');

    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0][0] as string;
    expect(message).toContain('CngxSidenavRouterSync');
    expect(message).toContain('no Router available');
    expect(message).toContain('provideRouter(...)');
    expect(message).toContain('deep-linking');
  });
});
