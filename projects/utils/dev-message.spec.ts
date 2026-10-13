import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_ERROR_DOCS_URL, cngxDevError, cngxDevWarn } from './dev-message';

describe('cngxDevWarn / cngxDevError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('prefixes the code and appends the lowercase doc link', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    cngxDevWarn('CNGX0901', 'Something drifted.');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'CNGX0901: Something drifted. Find more at ' +
        'https://cngxjs.github.io/cngx/additional-documentation/error-codes/cngx0901.html',
    );
  });

  it('builds the link from CNGX_ERROR_DOCS_URL', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    cngxDevWarn('CNGX1234', 'x');
    expect(warn.mock.calls[0][0]).toContain(`${CNGX_ERROR_DOCS_URL}cngx1234.html`);
  });

  it('forwards context values after the message', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const element = { tagName: 'DIV' };
    cngxDevWarn('CNGX0001', 'With context.', element, 42);
    expect(warn.mock.calls[0].slice(1)).toEqual([element, 42]);
  });

  it('writes errors to console.error, not console.warn', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    cngxDevError('CNGX0002', 'Broken.');
    expect(warn).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toMatch(/^CNGX0002: Broken\. Find more at .*cngx0002\.html$/);
  });
});
