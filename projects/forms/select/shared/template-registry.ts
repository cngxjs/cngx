import { InjectionToken, signal, type Signal, type TemplateRef } from '@angular/core';

import { injectResolvedTemplate } from './internal/resolve-template';
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
  CngxSelectSheetCount,
  CngxSelectSheetCountContext,
  CngxSelectSheetHandle,
  CngxSelectSheetHandleContext,
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
  /** Optional. Omit on hosts that render no option loop; resolves to `null`. */
  readonly check?: Signal<CngxSelectCheck<T> | undefined>;
  readonly caret: Signal<CngxSelectCaret | undefined>;
  /** Optional. Omit on hosts that render no option loop; resolves to `null`. */
  readonly optgroup?: Signal<CngxSelectOptgroupTemplate<T> | undefined>;
  /** Optional. Omit on hosts without a trigger placeholder outlet; resolves to `null`. */
  readonly placeholder?: Signal<CngxSelectPlaceholder | undefined>;
  readonly empty: Signal<CngxSelectEmpty | undefined>;
  readonly loading: Signal<CngxSelectLoading | undefined>;
  /** Optional. Omit on hosts that render no option loop; resolves to `null`. */
  readonly optionLabel?: Signal<CngxSelectOptionLabel<T> | undefined>;
  readonly error: Signal<CngxSelectError | undefined>;
  readonly retryButton: Signal<CngxSelectRetryButton | undefined>;
  readonly loadingGlyph: Signal<CngxSelectLoadingGlyph | undefined>;
  readonly refreshing: Signal<CngxSelectRefreshing | undefined>;
  readonly commitError: Signal<CngxSelectCommitError<T> | undefined>;
  readonly clearButton: Signal<CngxSelectClearButton | undefined>;
  /** Optional. Omit on hosts that render no option loop; resolves to `null`. */
  readonly optionPending?: Signal<CngxSelectOptionPending<T> | undefined>;
  /** Optional. Omit on hosts that render no option loop; resolves to `null`. */
  readonly optionError?: Signal<CngxSelectOptionError<T> | undefined>;
  /** Optional. Action-select organisms wire it; flat variants omit. */
  readonly action?: Signal<CngxSelectAction | undefined>;
  /** Optional. Config-level `templates.sheetHandle` still resolves via cascade. */
  readonly sheetHandle?: Signal<CngxSelectSheetHandle | undefined>;
  /** Optional. Config-level `templates.sheetCount` still resolves via cascade. */
  readonly sheetCount?: Signal<CngxSelectSheetCount | undefined>;
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
  readonly sheetHandle: Signal<TemplateRef<CngxSelectSheetHandleContext> | null>;
  readonly sheetCount: Signal<TemplateRef<CngxSelectSheetCountContext> | null>;
}

/**
 * Resolves the shared template slots through the 3-stage cascade.
 * Injection context required (`injectResolvedTemplate` reads
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
/**
 * Resolution of an omitted optional query. A host without the outlet must
 * not resolve the `templates.<slot>` config default either: flat variants
 * wire no action query, so an app-wide `templates.action` would otherwise
 * render at the bottom of every flat panel, and the same holds for the
 * option-loop and placeholder slots on hosts that never render them.
 */
const NO_TEMPLATE: Signal<null> = signal(null);

const NO_SHEET_HANDLE_DIRECTIVE: Signal<CngxSelectSheetHandle | undefined> = signal(undefined);
const NO_SHEET_COUNT_DIRECTIVE: Signal<CngxSelectSheetCount | undefined> = signal(undefined);

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
    check: queries.check ? injectResolvedTemplate(queries.check, 'check') : NO_TEMPLATE,
    caret: injectResolvedTemplate(queries.caret, 'caret'),
    optgroup: queries.optgroup ? injectResolvedTemplate(queries.optgroup, 'optgroup') : NO_TEMPLATE,
    placeholder: queries.placeholder
      ? injectResolvedTemplate(queries.placeholder, 'placeholder')
      : NO_TEMPLATE,
    empty: injectResolvedTemplate(queries.empty, 'empty'),
    loading: injectResolvedTemplate(queries.loading, 'loading'),
    optionLabel: queries.optionLabel
      ? injectResolvedTemplate(queries.optionLabel, 'optionLabel')
      : NO_TEMPLATE,
    error: injectResolvedTemplate(queries.error, 'error'),
    retryButton: injectResolvedTemplate(queries.retryButton, 'retryButton'),
    loadingGlyph: injectResolvedTemplate(queries.loadingGlyph, 'loadingGlyph'),
    refreshing: injectResolvedTemplate(queries.refreshing, 'refreshing'),
    commitError: injectResolvedTemplate(queries.commitError, 'commitError'),
    clearButton: injectResolvedTemplate(queries.clearButton, 'clearButton'),
    optionPending: queries.optionPending
      ? injectResolvedTemplate(queries.optionPending, 'optionPending')
      : NO_TEMPLATE,
    optionError: queries.optionError
      ? injectResolvedTemplate(queries.optionError, 'optionError')
      : NO_TEMPLATE,
    action: queries.action ? injectResolvedTemplate(queries.action, 'action') : NO_TEMPLATE,
    sheetHandle: injectResolvedTemplate(
      queries.sheetHandle ?? NO_SHEET_HANDLE_DIRECTIVE,
      'sheetHandle',
    ),
    sheetCount: injectResolvedTemplate(
      queries.sheetCount ?? NO_SHEET_COUNT_DIRECTIVE,
      'sheetCount',
    ),
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
 * Factory that resolves the select family's slot-template registry. For each
 * slot it runs the cascade and returns the `TemplateRef` set the trigger and
 * panel render:
 *
 * - the consumer's projected slot template (`*cngxSelect...`)
 * - else `CNGX_SELECT_CONFIG.templates.<slot>`
 * - else the built-in default
 *
 * Default: `createTemplateRegistry`. Swap the whole resolution strategy by
 * providing your own factory at root or component scope.
 *
 * @category forms/select/templates
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/shared/template-registry.ts
 * @since 0.1.0
 * @relatedTo CNGX_SELECT_CONFIG, provideSelectConfig
 */
export const CNGX_TEMPLATE_REGISTRY_FACTORY = new InjectionToken<CngxTemplateRegistryFactory>(
  'CngxTemplateRegistryFactory',
  {
    providedIn: 'root',
    factory: () => createTemplateRegistry,
  },
);
