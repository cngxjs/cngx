import { afterEach, describe, expect, it, vi } from 'vitest';

import { CNGX_ERROR_DOCS_URL } from './dev-message';
import { CngxRuntimeError } from './runtime-error';

describe('CngxRuntimeError', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('in development', () => {
    it('formats the code, the message and the doc link', () => {
      vi.stubGlobal('ngDevMode', true);
      const err = new CngxRuntimeError('CNGX0902', 'm');
      expect(err.message).toBe(`CNGX0902: m Find more at ${CNGX_ERROR_DOCS_URL}cngx0902.html`);
    });

    it('is an Error and a CngxRuntimeError with its code and name', () => {
      vi.stubGlobal('ngDevMode', true);
      const err = new CngxRuntimeError('CNGX0902', 'm');
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(CngxRuntimeError);
      expect(err.code).toBe('CNGX0902');
      expect(err.name).toBe('CngxRuntimeError');
    });

    it('falls back to the bare code when the message was stripped', () => {
      vi.stubGlobal('ngDevMode', true);
      expect(new CngxRuntimeError('CNGX0902', false).message).toBe('CNGX0902');
    });
  });

  describe('in production', () => {
    it('drops a plain message and keeps the bare code', () => {
      vi.stubGlobal('ngDevMode', false);
      const err = new CngxRuntimeError('CNGX0902', 'm');
      expect(err.message).toBe('CNGX0902');
      expect(err.code).toBe('CNGX0902');
    });

    it('keeps the bare code for a guarded-away message', () => {
      vi.stubGlobal('ngDevMode', false);
      expect(new CngxRuntimeError('CNGX0902', false).message).toBe('CNGX0902');
      expect(new CngxRuntimeError('CNGX0902', null).message).toBe('CNGX0902');
    });
  });
});
