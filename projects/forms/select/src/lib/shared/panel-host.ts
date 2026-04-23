import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type {
  CngxSelectActionContext,
  CngxSelectCommitErrorContext,
  CngxSelectEmptyContext,
  CngxSelectErrorContext,
  CngxSelectLoadingContext,
  CngxSelectRefreshingContext,
} from './template-slots';

/**
 * Callback bundle passed to the `*cngxSelectAction` slot via the
 * shared panel-shell context. Lifecycle methods live here (`close`,
 * `commit`, `setDirty`); `isPending` is the live commit-controller
 * state inside the bundle so the context stays a single reference
 * per emission — the shell's action-context computed re-allocates
 * whenever `isPending` flips, triggering a template-outlet context
 * refresh.
 *
 * Per cngx pillar: derived values (dirty, searchTerm) live as signals
 * directly on the view-host; this bundle carries only the imperative
 * surface the slot template invokes from event handlers.
 *
 * @internal
 */
export interface CngxSelectActionCallbacks {
  readonly close: () => void;
  readonly commit: (draft?: { label: string }) => void;
  readonly isPending: boolean;
  readonly setDirty: (value: boolean) => void;
  /**
   * Called by the shared panel shell when the user presses Escape
   * while `actionDirty()` is `true`. Distinct from `close`: `cancel`
   * lets the action-owner run variant-specific abandon logic (reset
   * form state, roll back optimistic writes, …) before the slot's
   * dirty flag flips back to `false`. The default bridge
   * implementation resets the dirty signal; the action-select
   * organisms in Commit 5/6 override with real rollback.
   */
  readonly cancel: () => void;
}
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
import type { CngxSelectTemplateRegistry } from './template-registry';
import type { AsyncView } from '@cngx/common/data';

/**
 * The five template slots the shared `CngxSelectPanelShell` renders.
 * Everything else on `CngxSelectTemplateRegistry` is option-loop-specific
 * and stays off this narrow shape so value-shape-agnostic consumers
 * (notably `CngxTreeSelect`) never have to stub missing slots.
 *
 * @internal
 */
export interface CngxSelectPanelShellTemplates<T = unknown> {
  readonly loading: Signal<TemplateRef<CngxSelectLoadingContext> | null>;
  readonly empty: Signal<TemplateRef<CngxSelectEmptyContext> | null>;
  readonly error: Signal<TemplateRef<CngxSelectErrorContext> | null>;
  readonly refreshing: Signal<TemplateRef<CngxSelectRefreshingContext> | null>;
  readonly commitError: Signal<TemplateRef<CngxSelectCommitErrorContext<T>> | null>;
  /**
   * Inline action-slot template projected via `*cngxSelectAction`.
   * Cross-variant: the flat panels, tree panels, and the action-select
   * organisms all rely on the same shell frame to render it, so the
   * slot lives on this narrow contract rather than on the option-loop
   * specific `CngxSelectPanelHost.tpl`.
   */
  readonly action: Signal<TemplateRef<CngxSelectActionContext> | null>;
}

/**
 * Minimal contract consumed by `CngxSelectPanelShell` — the async-view
 * switch, the five shell-rendered template slots, and the error / retry
 * callbacks. Split out from the option-loop-specific surface so
 * value-shape-agnostic consumers (tree-select, any future grid / card
 * variant) can stay free of the stub-field boilerplate that the flat
 * `CngxSelectPanelHost` demands.
 *
 * All five shipped select-family components provide this token alongside
 * the full {@link CngxSelectPanelHost} token; `CngxTreeSelect` provides
 * ONLY this narrower surface (plus `CNGX_TREE_SELECT_PANEL_HOST`).
 *
 * @internal
 */
export interface CngxSelectPanelViewHost<T = unknown> {
  readonly activeView: Signal<AsyncView>;
  readonly skeletonIndices: Signal<number[]>;
  readonly showInlineError: Signal<boolean>;
  readonly showCommitError: Signal<boolean>;
  readonly showRefreshIndicator: Signal<boolean>;
  readonly errorContext: Signal<CngxSelectErrorContext>;
  readonly commitErrorContext: Signal<CngxSelectCommitErrorContext<T>>;
  readonly loadingVariant: Signal<CngxSelectLoadingVariant>;
  readonly refreshingVariant: Signal<CngxSelectRefreshingVariant>;
  readonly commitErrorDisplay: Signal<CngxSelectCommitErrorDisplay>;
  readonly tpl: CngxSelectPanelShellTemplates<T>;
  handleRetry(): void;

  /**
   * Optional — live search term piped into the `*cngxSelectAction`
   * slot's `$implicit` + `searchTerm` context fields. Variants that
   * host an inline search input (combobox, typeahead, action-select
   * organisms) forward their own `searchTerm` signal. Button-trigger
   * variants (select, multi, reorderable) leave this undefined and
   * the shell falls back to `''`.
   */
  readonly actionSearchTerm?: Signal<string>;
  /**
   * Optional — dirty flag for the in-flight action workflow. Drives
   * the dismiss-guard protocol (wired up in Commit 4): Escape and
   * click-outside are intercepted while `actionDirty()` is `true`.
   * Variants default-undefined; the shell reads `false`.
   */
  readonly actionDirty?: Signal<boolean>;
  /**
   * Optional — imperative callbacks exposed to the action slot
   * (`close`, `commit`, `setDirty`, `cancel`) plus the live
   * `isPending` flag from the variant's commit controller. Bundled
   * into a single signal so the shell's context re-emits as one
   * unit when any element changes.
   */
  readonly actionCallbacks?: Signal<CngxSelectActionCallbacks>;
  /**
   * Optional — resolved focus-trap policy signal piped from the
   * variant's `ActionHostBridge` through to `CngxFocusTrap.enabled`.
   * Combines `CNGX_ACTION_SELECT_CONFIG.focusTrapBehavior` with the
   * live dirty flag. Inner panels (`CngxSelectPanel`, `CngxTreeSelectPanel`)
   * forward this into the shell's `actionFocusTrapEnabled` input;
   * variants that don't host an action workflow leave this undefined
   * and the shell defaults the hostDirective input to `false`.
   */
  readonly actionFocusTrapEnabled?: Signal<boolean>;
  /**
   * Optional — where the `*cngxSelectAction` slot renders inside the
   * shared panel frame. Inner panels forward this into the shell's
   * `actionPosition` input. Variants that don't host an action
   * workflow leave this undefined; the shell's default `'bottom'`
   * applies. Action-select organisms expose an `actionPosition` input
   * on their own public API and project the resolved signal here.
   */
  readonly actionPosition?: Signal<'top' | 'bottom' | 'both' | 'none'>;
}

/**
 * Injection token for the shell's narrow contract. Provided by every
 * select-family variant via `useExisting`. `CngxSelectPanelShell` injects
 * this token — never the full {@link CngxSelectPanelHost} — so tree /
 * future non-option-loop variants stay clean.
 *
 * @internal
 */
export const CNGX_SELECT_PANEL_VIEW_HOST = new InjectionToken<CngxSelectPanelViewHost>(
  'CNGX_SELECT_PANEL_VIEW_HOST',
);

/**
 * Full panel-host contract for the option-loop panel (`CngxSelectPanel`).
 * Extends {@link CngxSelectPanelViewHost} with every field the option
 * row-rendering path reads: options input, selection state, indicator
 * resolution, listbox comparator, AD active id, commit-error value for
 * the per-row inline glyph, outer-panel class/width.
 *
 * `CngxTreeSelect` does NOT implement this — it uses `CngxTreeSelectPanel`
 * which renders treeitem rows instead of option rows.
 *
 * @internal
 */
export interface CngxSelectPanelHost<T = unknown> extends CngxSelectPanelViewHost<T> {
  readonly effectiveOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly flatOptions: Signal<CngxSelectOptionDef<T>[]>;
  readonly loading: Signal<boolean>;
  readonly panelClassList: Signal<string | readonly string[] | null>;
  readonly panelWidthCss: Signal<string | null>;
  readonly resolvedListboxLabel: Signal<string>;
  readonly resolvedShowSelectionIndicator: Signal<boolean>;
  readonly resolvedSelectionIndicatorVariant: Signal<'checkbox' | 'checkmark'>;
  readonly resolvedSelectionIndicatorPosition: Signal<'before' | 'after'>;
  readonly listboxCompareWith: Signal<(a: unknown, b: unknown) => boolean>;
  readonly externalActivation: Signal<boolean>;
  /** Override parent `tpl` with the full 13-slot registry. */
  readonly tpl: CngxSelectTemplateRegistry<T>;
  readonly commitErrorValue: Signal<unknown>;
  readonly activeId: Signal<string | null>;
  isGroup(item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>):
    item is CngxSelectOptionGroupDef<T>;
  isSelected(opt: CngxSelectOptionDef<T>): boolean;
  isIndeterminate(opt: CngxSelectOptionDef<T>): boolean;
  isCommittingOption(opt: CngxSelectOptionDef<T>): boolean;
  /**
   * Append an option to the host's persistent local-items buffer.
   * Folded onto server-provided options inside
   * `createSelectCore.effectiveOptions` via `mergeLocalItems`, so the
   * newly patched item renders in the panel even when no server
   * refetch has happened yet. The insertion is dedup-guarded: a
   * second patch with a value already in the buffer (or already
   * present on the server side) is silently dropped.
   *
   * Used by the action-select organisms' quick-create flow from
   * inside the action-slot template — consumers don't call this
   * directly on the 5 flat variants today.
   */
  patchData(item: CngxSelectOptionDef<T>): void;
  /**
   * Reset the local-items buffer to empty. Idempotent — no emit when
   * already empty.
   */
  clearLocalItems(): void;
}

/**
 * Injection token for the full option-loop panel-host contract. Provided
 * by `CngxSelect` / `CngxMultiSelect` / `CngxCombobox` / `CngxTypeahead`
 * via `useExisting`. `CngxSelectPanel` injects this token.
 * `CngxTreeSelect` does NOT provide it (it uses the narrower view-host
 * + its own tree-specific token).
 *
 * @internal
 */
export const CNGX_SELECT_PANEL_HOST = new InjectionToken<CngxSelectPanelHost>(
  'CNGX_SELECT_PANEL_HOST',
);
