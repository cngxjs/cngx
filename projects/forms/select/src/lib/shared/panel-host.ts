import { InjectionToken, type Signal } from '@angular/core';

import type {
  CngxSelectCheck,
  CngxSelectCommitError,
  CngxSelectEmpty,
  CngxSelectError,
  CngxSelectErrorContext,
  CngxSelectCommitErrorContext,
  CngxSelectLoading,
  CngxSelectOptgroupTemplate,
  CngxSelectOptionLabel,
  CngxSelectRefreshing,
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
  readonly selectedOption: Signal<CngxSelectOptionDef<T> | null>;
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
  readonly listboxCompareWith: Signal<(a: unknown, b: unknown) => boolean>;
  readonly externalActivation: Signal<boolean>;

  // ── Content-projected templates ───────────────────────────────────
  readonly checkTpl: Signal<CngxSelectCheck<T> | undefined>;
  readonly optgroupTpl: Signal<CngxSelectOptgroupTemplate<T> | undefined>;
  readonly emptyTpl: Signal<CngxSelectEmpty | undefined>;
  readonly loadingTpl: Signal<CngxSelectLoading | undefined>;
  readonly refreshingTpl: Signal<CngxSelectRefreshing | undefined>;
  readonly errorTpl: Signal<CngxSelectError | undefined>;
  readonly commitErrorTpl: Signal<CngxSelectCommitError<T> | undefined>;
  readonly optionLabelTpl: Signal<CngxSelectOptionLabel<T> | undefined>;

  // ── Two-way value + imperative helpers ────────────────────────────
  readonly value: {
    (): T | undefined;
    set(v: T | undefined): void;
    update(fn: (v: T | undefined) => T | undefined): void;
  };
  isGroup(item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>):
    item is CngxSelectOptionGroupDef<T>;
  isSelected(opt: CngxSelectOptionDef<T>): boolean;
  isCommittingOption(opt: CngxSelectOptionDef<T>): boolean;
  handleRetry(): void;
}

/**
 * Injection token for the panel-host contract. Provided by `CngxSelect`
 * (and, eventually, `CngxMultiSelect`/`CngxCombobox`) via `useExisting`.
 * The panel sub-component injects this token — never the concrete
 * `CngxSelect` class — so the two files stay decoupled.
 *
 * @internal
 */
export const CNGX_SELECT_PANEL_HOST = new InjectionToken<CngxSelectPanelHost>(
  'CNGX_SELECT_PANEL_HOST',
);
