import { describe, expect, it, vi } from 'vitest';
import type { ErrorCodeResolverDeps } from '../data/docs-resolver.js';
import { createDocsResolver, createErrorCodeResolver } from '../data/docs-resolver.js';
import type { DocsIndex, ErrorCodeIndex } from '../data/loader.js';
import type { ErrorCodeEntry } from '../data/types.js';
import {
  explainError,
  explainErrorCommand,
  explainErrorMarkdown,
  parseErrorCode,
  type ExplainErrorPayload,
} from './get-error-code.js';

const DOCS_BASE = 'https://cngxjs.github.io/cngx/additional-documentation/error-codes/';

function entry(overrides: Partial<ErrorCodeEntry> & Pick<ErrorCodeEntry, 'code'>): ErrorCodeEntry {
  return {
    lib: 'core',
    severity: 'warn',
    production: 'stripped',
    title: `Title ${overrides.code}`,
    status: 'active',
    url: `${DOCS_BASE}${overrides.code.toLowerCase()}.html`,
    messages: [`${overrides.code} message`],
    body: `## Title ${overrides.code}\n\nBody for ${overrides.code}.`,
    ...overrides,
  };
}

const block: ErrorCodeIndex = {
  docsBaseUrl: DOCS_BASE,
  ranges: [
    { lib: 'core', from: 1, to: 899 },
    { lib: 'common', from: 1000, to: 1999 },
  ],
  codes: [
    // The block already carries deduped messages (buildErrorCodeBlock does that at snapshot time).
    entry({ code: 'CNGX0001', messages: ['formatMessage(): not a BCP 47 locale'] }),
    entry({ code: 'CNGX0005' }),
    entry({ code: 'CNGX0010' }),
    entry({ code: 'CNGX0050' }),
    entry({ code: 'CNGX1006', lib: 'common', production: 'code-only' }),
  ],
};

function makeDocs(errorCodes: ErrorCodeIndex | null): DocsIndex {
  return {
    meta: { schemaVersion: 6, cngxVersion: '0.3.0', generatedAt: null, compodocxVersion: null },
    components: [],
    directives: [],
    injectables: [],
    tokens: [],
    functions: [],
    errorCodes,
  };
}

const docs = makeDocs(block);

describe('parseErrorCode', () => {
  it('reads a bare code, a lowercase code, and a four-digit number', () => {
    expect(parseErrorCode('CNGX0001')).toBe('CNGX0001');
    expect(parseErrorCode('cngx0001')).toBe('CNGX0001');
    expect(parseErrorCode('0001')).toBe('CNGX0001');
  });

  it('reads the first code out of a pasted console line', () => {
    expect(parseErrorCode('CNGX0001: formatMessage(): "de_AT" is not a BCP 47 locale')).toBe('CNGX0001');
  });

  it('rejects an ambiguous short number and a too-short code and an empty string', () => {
    expect(parseErrorCode('1')).toBeNull();
    expect(parseErrorCode('CNGX12')).toBeNull();
    expect(parseErrorCode('')).toBeNull();
  });
});

describe('explainError', () => {
  it('returns the entry for a known code, with its deduped messages', () => {
    const result = explainError(block, 'cngx0001');

    expect(result).toMatchObject({ code: 'CNGX0001', lib: 'core', title: 'Title CNGX0001' });
    expect((result as ErrorCodeEntry).messages).toEqual(['formatMessage(): not a BCP 47 locale']);
  });

  it('returns a not-found view with the lib and three nearest codes for an unknown code in range', () => {
    const result = explainError(block, 'CNGX0007');

    expect(result).toEqual({
      code: 'CNGX0007',
      lib: 'core',
      nearest: ['CNGX0005', 'CNGX0010', 'CNGX0001'],
      url: `${DOCS_BASE}cngx0007.html`,
    });
  });

  it('returns a not-found view with a null lib and no nearest codes for a number outside every range', () => {
    const result = explainError(block, 'CNGX9999');

    expect(result).toEqual({ code: 'CNGX9999', lib: null, nearest: [], url: `${DOCS_BASE}cngx9999.html` });
  });

  it('returns null for an input that is not a code', () => {
    expect(explainError(block, 'nonsense')).toBeNull();
  });

  it('answers a parseable code with a null url when the snapshot has no readable block', () => {
    expect(explainError(null, 'CNGX0001')).toEqual({ code: 'CNGX0001', lib: null, nearest: [], url: null });
  });
});

describe('explainErrorMarkdown', () => {
  it('renders the entry with the production wording for a stripped code', () => {
    const md = explainErrorMarkdown(explainError(block, 'CNGX0001'));

    expect(md).toContain('## CNGX0001 - Title CNGX0001');
    expect(md).toContain('printed in development builds only');
    expect(md).toContain('formatMessage(): not a BCP 47 locale');
    expect(md).toContain(`Docs: ${DOCS_BASE}cngx0001.html`);
  });

  it('renders the production wording for a code-only code', () => {
    const md = explainErrorMarkdown(explainError(block, 'CNGX1006'));

    expect(md).toContain('thrown in production with the bare code as its message');
  });

  it('renders a non-active status line first', () => {
    const md = explainErrorMarkdown(entry({ code: 'CNGX0002', status: 'retired' }));

    expect(md).toContain('Status: retired.');
  });

  it('renders the nearest codes and the would-be docs url for an unknown code in range', () => {
    const md = explainErrorMarkdown(explainError(block, 'CNGX0007'));

    expect(md).toContain('CNGX0007 is a core error code');
    expect(md).toContain('Nearest core codes');
    expect(md).toContain('CNGX0005');
    expect(md).toContain('another cngx release; pass --cngx-version');
    expect(md).toContain(`Docs: ${DOCS_BASE}cngx0007.html`);
  });

  it('says the number is outside every range', () => {
    const md = explainErrorMarkdown(explainError(block, 'CNGX9999'));

    expect(md).toContain('outside every cngx error-code range');
  });

  it('names the accepted forms for an input that is not a code', () => {
    const md = explainErrorMarkdown(explainError(block, 'nonsense'));

    expect(md).toContain('Not a CNGX error code');
    expect(md).toContain('CNGX0001');
  });

  it('says a block-less snapshot carries no readable error codes', () => {
    const md = explainErrorMarkdown(explainError(null, 'CNGX0001'));

    expect(md).toContain('no readable error codes');
  });
});

describe('get_error_code run', () => {
  const fetchedBlock: ErrorCodeIndex = { ...block, codes: [entry({ code: 'CNGX0002', title: 'Only in that release' })] };

  function fetching(overrides: Partial<ErrorCodeResolverDeps> = {}) {
    const fetchErrorCodes = vi.fn<ErrorCodeResolverDeps['fetchErrorCodes']>(async () => ({ ok: true, path: '/asset.json' }));
    const deps = { fetchErrorCodes, loadErrorCodes: () => fetchedBlock, ...overrides };
    return {
      fetchErrorCodes: deps.fetchErrorCodes,
      run: (code: string, version?: string) =>
        explainErrorCommand.run({ bundled: docs, resolve: createDocsResolver(docs), resolveErrorCodes: createErrorCodeResolver(docs, deps) }, { code, version }),
    };
  }

  const { run } = fetching();

  it('answers a known code inside the versioned envelope', async () => {
    expect(await run('CNGX0001')).toMatchObject({
      ok: true,
      groundedVersion: '0.3.0',
      result: { code: 'CNGX0001', lib: 'core' },
    });
  });

  it('reports found only for a real entry, not for a miss or a non-code', () => {
    const found = (payload: ExplainErrorPayload) => explainErrorCommand.found?.(payload) ?? true;

    expect(found(explainError(block, 'CNGX0001'))).toBe(true);
    expect(found(explainError(block, 'CNGX0007'))).toBe(false);
    expect(found(explainError(block, 'nonsense'))).toBe(false);
  });

  it('answers from the fetched block, grounded on the requested version', async () => {
    const { run: runFetching, fetchErrorCodes } = fetching();

    expect(await runFetching('CNGX0002', '0.2.0')).toMatchObject({
      ok: true,
      groundedVersion: '0.2.0',
      result: { code: 'CNGX0002', title: 'Only in that release' },
    });
    expect(fetchErrorCodes).toHaveBeenCalledWith('0.2.0');
  });

  it('answers a code the bundled block lacks only for the release that has it', async () => {
    const { run: runFetching } = fetching();

    expect(await runFetching('CNGX0002')).toMatchObject({ ok: true, result: { code: 'CNGX0002', nearest: expect.any(Array) } });
    expect(await runFetching('CNGX0002', '0.2.0')).toMatchObject({ ok: true, result: { title: 'Only in that release' } });
  });

  it('answers the bundled version with no fetch', async () => {
    const { run: runFetching, fetchErrorCodes } = fetching();

    expect(await runFetching('CNGX0001', '0.3.0')).toMatchObject({ ok: true, groundedVersion: '0.3.0', result: { code: 'CNGX0001' } });
    expect(fetchErrorCodes).not.toHaveBeenCalled();
  });

  it('passes asset-missing through as data', async () => {
    const failure = { ok: false as const, reason: 'asset-missing' as const, message: 'no asset' };
    const { run: runFetching } = fetching({ fetchErrorCodes: vi.fn(async () => failure) });

    expect(await runFetching('CNGX0001', '0.2.0')).toEqual(failure);
  });

  it('rejects an invalid version before any fetch', async () => {
    const { run: runFetching, fetchErrorCodes } = fetching();

    expect(await runFetching('CNGX0001', '1.2')).toMatchObject({ ok: false, reason: 'invalid-version' });
    expect(fetchErrorCodes).not.toHaveBeenCalled();
  });

  it.each(['0.2.0', '1.2'])('answers a non-code with version %s as not a code, with no fetch', async (version) => {
    const { run: runFetching, fetchErrorCodes } = fetching();

    expect(await runFetching('nonsense', version)).toMatchObject({ ok: true, groundedVersion: '0.3.0', result: null });
    expect(fetchErrorCodes).not.toHaveBeenCalled();
  });
});
