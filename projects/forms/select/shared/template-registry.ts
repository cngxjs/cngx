import { InjectionToken, signal, type Signal, type TemplateRef } from '@angular/core';

import { resolveTemplate } from './resolve-template';
import type {
  CngxSelectAction,
  CngxSelectActionContext,
  CngxSelectCaret,
  CngxSelectCheck,
  CngxSelectClearButton,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionError,
  CngxSelectOptionLabel,
  CngxSelectOptionPending,
  CngxSelectPlaceholder,
  CngxSelectLoadingGlyph,
  CngxSelectRefreshing,
  CngxSelectRetryButton,
  CngxSelectCaretContext,
  CngxSelectCheckContext,
  CngxSelectClearButtonContext,
  CngxSelectCommitErrorContext,
  CngxSelectEmptyContext,
  CngxSelectErrorContext,
  CngxSelectLoadingContext,
  CngxSelectOptgroupContext,
  CngxSelectOptionErrorContext,
  CngxSelectOptionLabelContext,
  CngxSelectOptionPendingContext,
  CngxSelectPlaceholderContext,
  CngxSelectRefreshingContext,
  CngxSelectRetryButtonContext,
} from './template-slots';

/**
 * Raw `contentChild` queries passed to {@link createTemplateRegistry}.
 * `triggerLabel` is excluded because each variant wires a distinct
 * directive class. NG8110 forces `contentChild()` at the call site;
 * only the cascade lives in the factory.
 *
 * @category forms/select/templates
 */
export interface CngxSelectTemplateRegistryQueries<T = unknown> {
  readonly check: Signal<CngxSelectCheck<T> | undefined>;
  readonly caret: Signal<CngxSelectCaret | undefined>;
  readonly optgroup: Signal<CngxSelectOptgroupTemplate<T> | undefined>;
  readonly placeholder: Signal<CngxSelectPlaceholder | undefined>;
  readonly empty: Signal<CngxSelectEmpty | undefined>;
  readonly loading: Signal<CngxSelectLoading | undefined>;
  readonly optionLabel: Signal<CngxSelectOptionLabel<T> | undefined>;
  readonly error: Signal<CngxSelectError | undefined>;
  readonly retryButton: Signal<CngxSelectRetryButton | undefined>;
  /** Optional. Config-level `templates.loadingGlyph` still resolves via cascade. */
  readonly loadingGlyph?: Signal<CngxSelectLoadingGlyph | undefined>;
  readonly refreshing: Signal<CngxSelectRefreshing | undefined>;
  readonly commitError: Signal<CngxSelectCommitError<T> | undefined>;
  readonly clearButton: Signal<CngxSelectClearButton | undefined>;
  readonly optionPending: Signal<CngxSelectOptionPending<T> | undefined>;
  readonly optionError: Signal<CngxSelectOptionError<T> | undefined>;
  /** Optional. Action-select organisms wire it; flat variants omit. */
  readonly action?: Signal<CngxSelectAction | undefined>;
}

/**
 * Resolved template-ref signals - output of the 3-stage cascade, ready
 * for `*ngTemplateOutlet`.
 *
 * @category forms/select/templates
 */
export interface CngxSelectTemplateRegistry<T = unknown> {
  readonly check: Signal<TemplateRef<CngxSelectCheckContext<T>> | null>;
  readonly caret: Signal<TemplateRef<CngxSelectCaretContext> | null>;
  readonly optgroup: Signal<TemplateRef<CngxSelectOptgroupContext<T>> | null>;
  readonly placeholder: Signal<TemplateRef<CngxSelectPlaceholderContext> | null>;
  readonly empty: Signal<TemplateRef<CngxSelectEmptyContext> | null>;
  readonly loading: Signal<TemplateRef<CngxSelectLoadingContext> | null>;
  readonly optionLabel: Signal<TemplateRef<CngxSelectOptionLabelContext<T>> | null>;
  readonly error: Signal<TemplateRef<CngxSelectErrorContext> | null>;
  readonly retryButton: Signal<TemplateRef<CngxSelectRetryButtonContext> | null>;
  readonly loadingGlyph: Signal<TemplateRef<void> | null>;
  readonly refreshing: Signal<TemplateRef<CngxSelectRefreshingContext> | null>;
  readonly commitError: Signal<TemplateRef<CngxSelectCommitErrorContext<T>> | null>;
  readonly clearButton: Signal<TemplateRef<CngxSelectClearButtonContext> | null>;
  readonly optionPending: Signal<TemplateRef<CngxSelectOptionPendingContext<T>> | null>;
  readonly optionError: Signal<TemplateRef<CngxSelectOptionErrorContext<T>> | null>;
  readonly action: Signal<TemplateRef<CngxSelectActionContext> | null>;
}

/**
 * Resolves the shared template slots through the 3-stage cascade.
 * Injection context required (`resolveTemplate` reads
 * `CNGX_SELECT_CONFIG`).
 *
 * ```ts
 * @Component({ … })
 * export class CngxSelect<T> {
 *   private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
 *
 *   protected readonly tpl = createTemplateRegistry<T>({
 *     check: this.checkDirective,
 *     // ...
 *   });
 * }
 * ```
 */
const NO_ACTION_DIRECTIVE: Signal<CngxSelectAction | undefined> = signal(undefined);

const NO_LOADING_GLYPH_DIRECTIVE: Signal<CngxSelectLoadingGlyph | undefined> = signal(undefined);

/**
 * Build a resolved {@link CngxSelectTemplateRegistry} from raw
 * `contentChild` directive queries. Runs each slot through the
 * 3-stage cascade (instance directive → `CNGX_SELECT_CONFIG.templates`
 * default → `null`). Must be called in an injection context.
 *
 * Used by every select-family variant to replace ~13 inline
 * `injectResolvedTemplate(...)` cascade blocks. See
 * {@link CngxSelectTemplateRegistryQueries} for the input shape.
 *
 * @category forms/select/templates
 */
export function createTemplateRegistry<T = unknown>(
  queries: CngxSelectTemplateRegistryQueries<T>,
): CngxSelectTemplateRegistry<T> {
  return {
    check: resolveTemplate(queries.check, 'check'),
    caret: resolveTemplate(queries.caret, 'caret'),
    optgroup: resolveTemplate(queries.optgroup, 'optgroup'),
    placeholder: resolveTemplate(queries.placeholder, 'placeholder'),
    empty: resolveTemplate(queries.empty, 'empty'),
    loading: resolveTemplate(queries.loading, 'loading'),
    optionLabel: resolveTemplate(queries.optionLabel, 'optionLabel'),
    error: resolveTemplate(queries.error, 'error'),
    retryButton: resolveTemplate(queries.retryButton, 'retryButton'),
    loadingGlyph: resolveTemplate(
      queries.loadingGlyph ?? NO_LOADING_GLYPH_DIRECTIVE,
      'loadingGlyph',
    ),
    refreshing: resolveTemplate(queries.refreshing, 'refreshing'),
    commitError: resolveTemplate(queries.commitError, 'commitError'),
    clearButton: resolveTemplate(queries.clearButton, 'clearButton'),
    optionPending: resolveTemplate(queries.optionPending, 'optionPending'),
    optionError: resolveTemplate(queries.optionError, 'optionError'),
    action: resolveTemplate(queries.action ?? NO_ACTION_DIRECTIVE, 'action'),
  };
}

/**
 * Factory signature for {@link CNGX_TEMPLATE_REGISTRY_FACTORY}.
 *
 * @category forms/select/templates
 */
export type CngxTemplateRegistryFactory = <T = unknown>(
  queries: CngxSelectTemplateRegistryQueries<T>,
) => CngxSelectTemplateRegistry<T>;

/**
 * Factory token for the template-slot cascade. Default
 * {@link createTemplateRegistry}.
 *
 * @category forms/select/templates
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-registry.ts
 * @since 0.1.0
 */
export const CNGX_TEMPLATE_REGISTRY_FACTORY = new InjectionToken<CngxTemplateRegistryFactory>(
  'CNGX_TEMPLATE_REGISTRY_FACTORY',
  {
    providedIn: 'root',
    factory: () => createTemplateRegistry,
  },
);
