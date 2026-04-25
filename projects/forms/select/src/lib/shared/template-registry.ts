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
 * The 13 `contentChild` signals a select-family component passes to
 * {@link createTemplateRegistry}. Each entry is the raw directive query
 * before the 3-stage cascade runs — the factory handles the cascade.
 *
 * `triggerLabel` is **not** part of the shared registry because each
 * variant wires a different directive class to it (`CngxSelectTriggerLabel`
 * for single-select, `CngxMultiSelectTriggerLabel` for multi,
 * `CngxComboboxTriggerLabel` for combobox, none for typeahead). Each
 * variant therefore keeps its own `triggerLabelTpl` field inline.
 *
 * **Why the call site declares them.** Angular's AOT compiler only
 * accepts `contentChild()` calls as the direct initializer of a class
 * field (NG8110). Consumers own the 13 one-line queries; the factory
 * owns the 13 `resolveTemplate` cascades (config fallback + signal
 * derivation) so the shared bit stays in one place.
 *
 * @category interactive
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
  readonly refreshing: Signal<CngxSelectRefreshing | undefined>;
  readonly commitError: Signal<CngxSelectCommitError<T> | undefined>;
  readonly clearButton: Signal<CngxSelectClearButton | undefined>;
  readonly optionPending: Signal<CngxSelectOptionPending<T> | undefined>;
  readonly optionError: Signal<CngxSelectOptionError<T> | undefined>;
  /**
   * Optional — variants that don't host an inline-action workflow omit
   * this query entirely, and the cascade still resolves
   * `CNGX_SELECT_CONFIG.templates.action` as the config-level fallback.
   * The new action-select organisms declare the `contentChild` and
   * pass it in; every other variant stays source-compatible.
   */
  readonly action?: Signal<CngxSelectAction | undefined>;
}

/**
 * Bundle of the 14 resolved template-ref signals every select-family
 * component shares. Each entry is the output of the standard 3-stage
 * cascade (instance-level directive → `CNGX_SELECT_CONFIG.templates.*` →
 * library default), ready to bind via `*ngTemplateOutlet` without any
 * per-component cascade wiring.
 *
 * Returned by {@link createTemplateRegistry}.
 *
 * @category interactive
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
  readonly refreshing: Signal<TemplateRef<CngxSelectRefreshingContext> | null>;
  readonly commitError: Signal<TemplateRef<CngxSelectCommitErrorContext<T>> | null>;
  readonly clearButton: Signal<TemplateRef<CngxSelectClearButtonContext> | null>;
  readonly optionPending: Signal<TemplateRef<CngxSelectOptionPendingContext<T>> | null>;
  readonly optionError: Signal<TemplateRef<CngxSelectOptionErrorContext<T>> | null>;
  readonly action: Signal<TemplateRef<CngxSelectActionContext> | null>;
}

/**
 * Resolve a select-family component's 14 shared template slots into their
 * cascaded final signals. Consumer hands in the raw `contentChild` signals
 * — they must be declared at call-site because Angular's AOT compiler
 * rejects `contentChild()` calls from inside helper functions (NG8110).
 * The factory wires each query through `resolveTemplate` so the 3-stage
 * cascade (instance → `CNGX_SELECT_CONFIG.templates.*` → null) is
 * defined exactly once for the whole select family.
 *
 * **Injection context.** Must be called from a field initialiser /
 * constructor: `resolveTemplate` internally `inject()`s the config token.
 *
 * **What this replaces.** Before this factory every variant repeated
 * ~14× `contentChild(...)` (still required — they stay) **plus** ~14×
 * `resolveTemplate(...)` in a parallel block. The factory collapses the
 * second block into a single `createTemplateRegistry(...)` call so the
 * cascade logic lives in one place.
 *
 * @example
 * ```ts
 * @Component({ … })
 * export class CngxSelect<T> {
 *   private readonly checkDirective = contentChild<CngxSelectCheck<T>>(CngxSelectCheck);
 *   // ...13 more contentChild queries...
 *
 *   protected readonly tpl = createTemplateRegistry<T>({
 *     check: this.checkDirective,
 *     // ...13 more query references...
 *   });
 *
 *   // template: `@if (tpl.check(); as t) { <ng-container *ngTemplateOutlet="t" /> }`
 * }
 * ```
 *
 * @category interactive
 */
/**
 * Stable empty-signal used as the `action` query fallback for variants
 * that don't host an inline-action workflow. Keeps the cascade call
 * shape uniform — the config-level `templates.action` fallback still
 * resolves via `resolveTemplate`, so an app-wide `provideSelectConfig(
 * withAction(...))` still reaches every panel.
 *
 * @internal
 */
const NO_ACTION_DIRECTIVE: Signal<CngxSelectAction | undefined> = signal(undefined);

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
    refreshing: resolveTemplate(queries.refreshing, 'refreshing'),
    commitError: resolveTemplate(queries.commitError, 'commitError'),
    clearButton: resolveTemplate(queries.clearButton, 'clearButton'),
    optionPending: resolveTemplate(queries.optionPending, 'optionPending'),
    optionError: resolveTemplate(queries.optionError, 'optionError'),
    action: resolveTemplate(queries.action ?? NO_ACTION_DIRECTIVE, 'action'),
  };
}

/**
 * Factory-signature matching {@link createTemplateRegistry} — used by
 * {@link CNGX_TEMPLATE_REGISTRY_FACTORY} for DI-swappable cascade
 * implementations.
 *
 * @category interactive
 */
export type CngxTemplateRegistryFactory = <T = unknown>(
  queries: CngxSelectTemplateRegistryQueries<T>,
) => CngxSelectTemplateRegistry<T>;

/**
 * Override-capable factory for the select-family template-slot cascade.
 * Defaults to {@link createTemplateRegistry}; override app-wide or per-
 * component (via `providers` / `viewProviders`) for telemetry-wrapped
 * cascades, custom resolution policies, or alternative fallback chains.
 *
 * Symmetrical to the other five select-family factory tokens
 * (`CNGX_SELECTION_CONTROLLER_FACTORY`, `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`,
 * `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`, `CNGX_DISPLAY_BINDING_FACTORY`).
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     {
 *       provide: CNGX_TEMPLATE_REGISTRY_FACTORY,
 *       useValue: (queries) => {
 *         const registry = createTemplateRegistry(queries);
 *         // Wrap each signal with a telemetry probe, or return a
 *         // caller-local variant.
 *         return registry;
 *       },
 *     },
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export const CNGX_TEMPLATE_REGISTRY_FACTORY =
  new InjectionToken<CngxTemplateRegistryFactory>('CNGX_TEMPLATE_REGISTRY_FACTORY', {
    providedIn: 'root',
    factory: () => createTemplateRegistry,
  });
