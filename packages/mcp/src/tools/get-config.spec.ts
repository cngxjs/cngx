import { beforeEach, describe, expect, it } from 'vitest';
import { createDocsIndex } from '../data/loader.js';
import type { DocsResolverDeps } from '../data/docs-resolver.js';
import { answerVersioned, resetDocsCache } from '../data/docs-resolver.js';
import type { DocFunction, DocumentationJson } from '../data/types.js';
import { getConfig } from './get-config.js';

// A controlled snapshot exercising every cascade layout the token-file anchor
// must survive: the single-file select surface, the shared select/shared/
// directory (three tokens, one directory), the token-file split (accordion:
// token in a config/*.defaults.ts file, providers/features elsewhere in config/),
// the Cngx-infix and bare-aggregator provider names, and a multi-provider token
// file. File paths mirror the real snapshot so featureDir/dir resolution matches.
const fn = (name: string, file: string, factoryKind: DocFunction['factoryKind'], returnType?: string): DocFunction => ({
  name,
  file,
  factoryKind,
  returnType,
});

const DOC: DocumentationJson = {
  schemaVersion: 2,
  components: [
    { name: 'CngxCombobox', selector: 'cngx-combobox', file: 'projects/forms/select/combobox/combobox.component.ts' },
    {
      name: 'CngxActionSelect',
      selector: 'cngx-action-select',
      file: 'projects/forms/select/action-select/action-select.component.ts',
    },
  ],
  directives: [
    { name: 'CngxDivider', selector: 'cngx-divider', file: 'projects/common/display/divider/divider.directive.ts' },
  ],
  tokens: [
    { name: 'CNGX_SELECT_CONFIG', file: 'projects/forms/select/shared/config.ts' },
    { name: 'CNGX_ACTION_SELECT_CONFIG', file: 'projects/forms/select/shared/action-select-config.ts' },
    { name: 'CNGX_ACCORDION_CONFIG', file: 'projects/ui/accordion/config/accordion.config.defaults.ts' },
    { name: 'CNGX_PAGINATOR_CONFIG', file: 'projects/ui/paginator/paginator-config.ts' },
    { name: 'CNGX_FEEDBACK_CONFIG', file: 'projects/ui/feedback/config/feedback-config.ts' },
    { name: 'CNGX_FORM_FIELD_CONFIG', file: 'projects/forms/field/form-field.token.ts' },
    // A malformed token carrying no file - the anchor must yield empty, not over-capture.
    { name: 'CNGX_NO_FILE_CONFIG' },
  ],
  miscellaneous: {
    functions: [
      // Select - single file, own token file, plus a separate-file aggregator.
      fn('provideSelectConfig', 'projects/forms/select/shared/config.ts', 'provider'),
      fn('provideSelectConfigAt', 'projects/forms/select/shared/config.ts', 'provider'),
      fn('provideCngxSelect', 'projects/forms/select/shared/provide-cngx-select.ts', 'provider'),
      fn('withPanelWidth', 'projects/forms/select/shared/config.ts', 'feature', 'CngxSelectConfigFeature'),
      fn('withSelectDebounce', 'projects/forms/select/shared/config.ts', 'feature', 'CngxSelectConfigFeature'),
      // A co-located feature with no returnType must be skipped, never throw.
      fn('withNoReturn', 'projects/forms/select/shared/config.ts', 'feature', undefined),
      // Action-select - shares the directory but owns action-select-config.ts.
      fn('provideActionSelectConfig', 'projects/forms/select/shared/action-select-config.ts', 'provider'),
      fn('provideActionSelectConfigAt', 'projects/forms/select/shared/action-select-config.ts', 'provider'),
      fn('withActionLabel', 'projects/forms/select/shared/action-select-config.ts', 'feature', 'CngxActionSelectConfigFeature'),
      // Accordion - token file carries no providers/features; both live in config/.
      fn('provideAccordionConfig', 'projects/ui/accordion/config/accordion.config.ts', 'provider'),
      fn('provideAccordionConfigAt', 'projects/ui/accordion/config/accordion.config.ts', 'provider'),
      fn('withAccordionMultiExpand', 'projects/ui/accordion/config/accordion.config.ts', 'feature', 'CngxAccordionConfigFeature'),
      // Paginator - deviant Cngx-infix provider name, resolved via the file anchor.
      fn('provideCngxPaginatorConfig', 'projects/ui/paginator/paginator-config.ts', 'provider'),
      fn('withPageSizeOptions', 'projects/ui/paginator/paginator-config.ts', 'feature', 'CngxPaginatorConfigFeature'),
      // Feedback - bare-aggregator provider name (the name-reconstruction null case).
      fn('provideFeedback', 'projects/ui/feedback/config/feedback-config.ts', 'provider'),
      fn('withToasts', 'projects/ui/feedback/config/feedback-config.ts', 'feature', 'FeedbackFeature'),
      // Form-field - two providers co-located in one token file.
      fn('provideFormField', 'projects/forms/field/form-field.token.ts', 'provider'),
      fn('provideErrorMessages', 'projects/forms/field/form-field.token.ts', 'provider'),
      fn('withErrorMessages', 'projects/forms/field/form-field.token.ts', 'feature', 'FormFieldFeature'),
      // Root-level functions (no directory) - must never be captured by a file-less token.
      fn('provideOrphan', 'orphan.ts', 'provider'),
      fn('withOrphan', 'orphan.ts', 'feature', 'OrphanFeature'),
    ],
  },
};

const docs = createDocsIndex(DOC);

describe('getConfig', () => {
  it('resolves the single-file Select cascade by token name, appending the separate-file aggregator', () => {
    const result = getConfig(docs, 'CNGX_SELECT_CONFIG');

    expect(result).not.toBeNull();
    expect(result?.token).toBe('CNGX_SELECT_CONFIG');
    expect(result?.resolvedVia).toBe('token');
    expect(result?.providers).toEqual(['provideSelectConfig', 'provideSelectConfigAt', 'provideCngxSelect']);
    expect(result?.features).toEqual([
      { name: 'withPanelWidth', returnType: 'CngxSelectConfigFeature' },
      { name: 'withSelectDebounce', returnType: 'CngxSelectConfigFeature' },
    ]);
    expect(result?.resolutionPriority).toHaveLength(4);
  });

  it('resolves the Select cascade by stem', () => {
    const result = getConfig(docs, 'select');

    expect(result?.token).toBe('CNGX_SELECT_CONFIG');
    expect(result?.resolvedVia).toBe('stem');
  });

  it('isolates CNGX_ACTION_SELECT_CONFIG to its own token file within the shared directory', () => {
    const result = getConfig(docs, 'CNGX_ACTION_SELECT_CONFIG');

    expect(result?.providers).toEqual(['provideActionSelectConfig', 'provideActionSelectConfigAt']);
    expect(result?.features).toEqual([{ name: 'withActionLabel', returnType: 'CngxActionSelectConfigFeature' }]);
  });

  it('recovers a token-split surface (accordion) via the directory fallback for BOTH providers and features', () => {
    const result = getConfig(docs, 'accordion');

    expect(result?.token).toBe('CNGX_ACCORDION_CONFIG');
    expect(result?.providers).toEqual(['provideAccordionConfig', 'provideAccordionConfigAt']);
    expect(result?.features).toEqual([{ name: 'withAccordionMultiExpand', returnType: 'CngxAccordionConfigFeature' }]);
  });

  it('resolves the Cngx-infix provider name (paginator) via the file anchor', () => {
    const result = getConfig(docs, 'paginator');

    expect(result?.providers).toEqual(['provideCngxPaginatorConfig']);
    expect(result?.features).toEqual([{ name: 'withPageSizeOptions', returnType: 'CngxPaginatorConfigFeature' }]);
  });

  it('resolves the bare-aggregator provider name (feedback) the name-reconstruction returned null for', () => {
    const result = getConfig(docs, 'feedback');

    expect(result?.providers).toEqual(['provideFeedback']);
    expect(result?.features).toEqual([{ name: 'withToasts', returnType: 'FeedbackFeature' }]);
  });

  it('returns every provider co-located in a multi-provider token file (form-field)', () => {
    const result = getConfig(docs, 'form-field');

    expect(result?.providers).toEqual(['provideFormField', 'provideErrorMessages']);
    expect(result?.features).toEqual([{ name: 'withErrorMessages', returnType: 'FormFieldFeature' }]);
  });

  it('maps a shared-token component to its config token with resolvedVia component', () => {
    const result = getConfig(docs, 'CngxCombobox');

    expect(result?.token).toBe('CNGX_SELECT_CONFIG');
    expect(result?.resolvedVia).toBe('component');
  });

  it('resolves a component by selector as readily as by class name', () => {
    expect(getConfig(docs, 'cngx-combobox')?.token).toBe('CNGX_SELECT_CONFIG');
  });

  it('intentionally collapses a select-family sub-config component to the generic token (best-effort priority-3)', () => {
    // The three select tokens share forms/select/shared/, so the component path
    // cannot distinguish a sub-config surface: every select-family component
    // resolves to the generic CNGX_SELECT_CONFIG. This is documented best-effort -
    // callers wanting the sub-config pass the token name or stem (priority 1/2).
    const result = getConfig(docs, 'CngxActionSelect');

    expect(result?.token).toBe('CNGX_SELECT_CONFIG');
    expect(result?.token).not.toBe('CNGX_ACTION_SELECT_CONFIG');
    expect(result?.resolvedVia).toBe('component');
    // The precise path still resolves the sub-config by token name and stem.
    expect(getConfig(docs, 'CNGX_ACTION_SELECT_CONFIG')?.resolvedVia).toBe('token');
    expect(getConfig(docs, 'action-select')?.token).toBe('CNGX_ACTION_SELECT_CONFIG');
  });

  it('returns null for a component with no ancestor config token', () => {
    expect(getConfig(docs, 'CngxDivider')).toBeNull();
  });

  it('returns null when the input maps to no config token', () => {
    expect(getConfig(docs, 'no-such-surface')).toBeNull();
  });

  it('resolves a file-less config token to empty collections without over-capturing root-level functions', () => {
    const result = getConfig(docs, 'CNGX_NO_FILE_CONFIG');

    expect(result).not.toBeNull();
    expect(result?.token).toBe('CNGX_NO_FILE_CONFIG');
    expect(result?.providers).toEqual([]);
    expect(result?.features).toEqual([]);
  });
});

describe('get_config version wiring', () => {
  beforeEach(() => resetDocsCache());

  const bundled = createDocsIndex({
    schemaVersion: 2,
    cngxVersion: '0.1.0',
    components: [],
    directives: [],
    tokens: [],
    miscellaneous: { functions: [] },
  } as DocumentationJson);
  const fetched = createDocsIndex({
    schemaVersion: 2,
    cngxVersion: '0.2.0',
    components: [],
    directives: [],
    tokens: [{ name: 'CNGX_FOO_CONFIG', file: 'projects/foo/foo-config.ts' }],
    miscellaneous: { functions: [] },
  } as DocumentationJson);

  it('grounds the config answer against a fetched non-bundled version', () => {
    const deps: DocsResolverDeps = { fetchSnapshot: () => ({ ok: true, path: '/tmp/fetched.json' }), loadDocs: () => fetched };

    const answer = answerVersioned(bundled, '0.2.0', (resolved) => getConfig(resolved, 'CNGX_FOO_CONFIG'), deps);

    expect(answer).toMatchObject({ groundedVersion: '0.2.0' });
    // The bundled snapshot has no config tokens; only the fetched v0.2.0 resolves this one.
    expect((answer as { result: { token: string } }).result.token).toBe('CNGX_FOO_CONFIG');
  });

  it('passes a fetch failure through as a typed result', () => {
    const deps: DocsResolverDeps = {
      fetchSnapshot: () => ({ ok: false, reason: 'asset-missing', message: 'no release' }),
      loadDocs: () => fetched,
    };

    const answer = answerVersioned(bundled, '999.0.0', (resolved) => getConfig(resolved, 'CNGX_FOO_CONFIG'), deps);

    expect(answer).toEqual({ ok: false, reason: 'asset-missing', message: 'no release' });
  });
});
