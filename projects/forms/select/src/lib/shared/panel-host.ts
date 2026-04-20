import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type {
  CngxSelectCheckContext,
  CngxSelectCommitErrorContext,
  CngxSelectEmptyContext,
  CngxSelectErrorContext,
  CngxSelectLoadingContext,
  CngxSelectOptgroupContext,
  CngxSelectOptionErrorContext,
  CngxSelectOptionLabelContext,
  CngxSelectOptionPendingContext,
  CngxSelectRefreshingContext,
} from './template-slots';
import type {
  CngxSelectCommitErrorDisplay,
} from './commit-action.types';
import type {
  CngxSelectLoadingVariant,
  CngxSelectRefreshingVariant,
} from './config';
import type {
  CngxSelectOptionDef,
  CngxSelectOptionGroupDef,
  CngxSelectOptionsInput,
} from './option.model';
import type { AsyncView } from '@cngx/common/data';

/**
 * Minimal contract the panel sub-component needs from its select parent.
 *
 * **Why this interface exists.**
 * The panel body is a non-trivial piece of template (options loop,
 * variant-switched loading indicator, commit-error banner, refreshing
 * overlay, error state) that we extracted into a dedicated sub-component
 * to keep `CngxSelect`'s main template under 100 lines.
 *
 * The sub-component could have `inject(CngxSelect)` directly, but that
 * creates a cyclic type dependency between `select.component.ts` and the
 * panel file. Routing the panel's access through an injection token
 * decouples the two files: the panel depends on a stable,
 * purposefully-minimal surface, not on the entire `CngxSelect` class.
 *
 * **Template-slot signals carry resolved `TemplateRef`s, not directive
 * wrappers.** Each variant owns a 3-step cascade (instance-projected
 * directive → global `CNGX_SELECT_CONFIG.templates.*` → library default)
 * and exposes only the final `TemplateRef | null`. The panel stays free
 * of cascade logic.
 *
 * If you reshape `CngxSelect`, you'll see the breakage on this interface
 * before the panel's template — which is where you want it.
 *
 * @internal
 */
export interface CngxSelectPanelHost<T = unknown> {
  // ── Derived panel view ────────────────────────────────────────────
  readonly activeView: Signal<AsyncView>;
  readonly effectiveOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly flatOptions: Signal<CngxSelectOptionDef<T>[]>;
  readonly skeletonIndices: Signal<number[]>;
  readonly showInlineError: Signal<boolean>;
  readonly showCommitError: Signal<boolean>;
  readonly showRefreshIndicator: Signal<boolean>;
  readonly errorContext: Signal<CngxSelectErrorContext>;
  readonly commitErrorContext: Signal<CngxSelectCommitErrorContext<T>>;

  // ── Input / config signals ────────────────────────────────────────
  readonly loading: Signal<boolean>;
  readonly loadingVariant: Signal<CngxSelectLoadingVariant>;
  readonly refreshingVariant: Signal<CngxSelectRefreshingVariant>;
  readonly commitErrorDisplay: Signal<CngxSelectCommitErrorDisplay>;
  readonly panelClassList: Signal<string | readonly string[] | null>;
  readonly panelWidthCss: Signal<string | null>;
  readonly resolvedListboxLabel: Signal<string>;
  readonly resolvedShowSelectionIndicator: Signal<boolean>;
  /**
   * Concrete indicator variant after `instance > config > 'auto'` cascade.
   * Panel binds to `<cngx-checkbox-indicator [variant]="…">`.
   */
  readonly resolvedSelectionIndicatorVariant: Signal<'checkbox' | 'checkmark'>;
  /**
   * Indicator position relative to the label inside a panel option row.
   */
  readonly resolvedSelectionIndicatorPosition: Signal<'before' | 'after'>;
  readonly listboxCompareWith: Signal<(a: unknown, b: unknown) => boolean>;
  readonly externalActivation: Signal<boolean>;

  // ── Resolved templates (instance > config.templates > library default) ─
  readonly checkTpl: Signal<TemplateRef<CngxSelectCheckContext<T>> | null>;
  readonly optgroupTpl: Signal<TemplateRef<CngxSelectOptgroupContext<T>> | null>;
  readonly emptyTpl: Signal<TemplateRef<CngxSelectEmptyContext> | null>;
  readonly loadingTpl: Signal<TemplateRef<CngxSelectLoadingContext> | null>;
  readonly refreshingTpl: Signal<TemplateRef<CngxSelectRefreshingContext> | null>;
  readonly errorTpl: Signal<TemplateRef<CngxSelectErrorContext> | null>;
  readonly commitErrorTpl: Signal<TemplateRef<CngxSelectCommitErrorContext<T>> | null>;
  readonly optionLabelTpl: Signal<TemplateRef<CngxSelectOptionLabelContext<T>> | null>;
  readonly optionPendingTpl: Signal<TemplateRef<CngxSelectOptionPendingContext<T>> | null>;
  readonly optionErrorTpl: Signal<TemplateRef<CngxSelectOptionErrorContext<T>> | null>;
  /**
   * Latest commit error surfaced inline on the selected option row.
   * `null` when no commit is in error or `commitErrorDisplay !== 'inline'`.
   */
  readonly commitErrorValue: Signal<unknown>;

  // ── Active-descendant highlight (for options template context) ────
  /**
   * DOM id of the currently highlighted option inside the inner listbox,
   * or `null` when nothing is highlighted. Lets the panel compute
   * `highlighted` per option without injecting the listbox directly.
   */
  readonly activeId: Signal<string | null>;

  // ── Imperative helpers ────────────────────────────────────────────
  isGroup(item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>):
    item is CngxSelectOptionGroupDef<T>;
  isSelected(opt: CngxSelectOptionDef<T>): boolean;
  /**
   * Partial-selection test for an option. Always `false` in flat
   * (multi / combobox) panels today; tree-select consumers wire a
   * `childrenFn` into the selection controller and this reports the
   * real `some-but-not-all-descendants-selected` state.
   */
  isIndeterminate(opt: CngxSelectOptionDef<T>): boolean;
  isCommittingOption(opt: CngxSelectOptionDef<T>): boolean;
  handleRetry(): void;
}

/**
 * Injection token for the panel-host contract. Provided by `CngxSelect`
 * (and `CngxMultiSelect` / future `CngxCombobox`) via `useExisting`.
 * The panel sub-component injects this token — never the concrete
 * `CngxSelect` class — so the two files stay decoupled.
 *
 * @internal
 */
export const CNGX_SELECT_PANEL_HOST = new InjectionToken<CngxSelectPanelHost>(
  'CNGX_SELECT_PANEL_HOST',
);
