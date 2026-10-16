import { afterEach, describe, expect, it, vi } from 'vitest';

import { warnRouterAbsent } from './warn-router-absent';

describe('warnRouterAbsent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('warns once with the function prefix and the enables clause', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    warnRouterAbsent('deep-linking');

    expect(warn).toHaveBeenCalledTimes(1);
    const message = warn.mock.calls[0][0] as string;
    expect(message).toMatch(
      /^CNGX1031: injectQueryParamSync\(\): no Router available - the URL sync is a no-op\. Provide @angular\/router via provideRouter\(\.\.\.\) to enable /,
    );
    expect(message).toContain('provideRouter(...)');
    expect(message).toContain('deep-linking');
  });

  it('writes nothing to the console in production', () => {
    vi.stubGlobal('ngDevMode', false);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    warnRouterAbsent('deep-linking');

    expect(warn).not.toHaveBeenCalled();
  });
});
