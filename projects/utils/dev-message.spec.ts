import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_ERROR_DOCS_URL, cngxDevError, cngxDevWarn, errorDocsUrl } from './dev-message';

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
        'https://cngxjs.github.io/cngx/main/additional-documentation/error-codes/cngx0901.html',
    );
  });

  it('builds the link from errorDocsUrl', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    cngxDevWarn('CNGX1234', 'x');
    expect(warn.mock.calls[0][0]).toContain(`${errorDocsUrl()}cngx1234.html`);
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

describe('errorDocsUrl', () => {
  it('keeps the docs of main as the literal', () => {
    expect(CNGX_ERROR_DOCS_URL).toBe(
      'https://cngxjs.github.io/cngx/main/additional-documentation/error-codes/',
    );
  });

  it('links a final release to the docs of that version', () => {
    expect(errorDocsUrl('0.4.0')).toBe(
      'https://cngxjs.github.io/cngx/v0.4.0/additional-documentation/error-codes/',
    );
  });

  it('links a prerelease to the docs of main', () => {
    expect(errorDocsUrl('0.4.0-rc.1')).toBe(CNGX_ERROR_DOCS_URL);
  });

  it('links the unpublished placeholder to the docs of main', () => {
    expect(errorDocsUrl('0.0.0-PLACEHOLDER')).toBe(CNGX_ERROR_DOCS_URL);
    expect(errorDocsUrl()).toBe(CNGX_ERROR_DOCS_URL);
  });
});
