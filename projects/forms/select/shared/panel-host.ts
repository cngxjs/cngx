import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type {
  CngxSelectActionContext,
  CngxSelectCommitErrorContext,
  CngxSelectEmptyContext,
  CngxSelectErrorContext,
  CngxSelectLoadingContext,
  CngxSelectRefreshingContext,
  CngxSelectRetryButtonContext,
} from './template-slots';

/**
 * Imperative bundle for the `*cngxSelectAction` slot. `isPending` lives
 * inside so the bundle ref churns when commit state flips (forces an
 * outlet context refresh). Derived values (dirty, searchTerm) live on
 * the view-host directly.
 *
 * @internal
 */
export interface CngxSelectActionCallbacks {
  readonly close: () => void;
  readonly commit: (draft?: { label: string }) => void;
  readonly isPending: boolean;
  readonly setDirty: (value: boolean) => void;
  /** Distinct from `close` — runs variant abandon logic before dirty flips. */
  readonly cancel: () => void;
  /** Re-dispatches the last commit through the same controller. */
  readonly retry: () => void;
}
import type {
  CngxSelectCommitErrorDisplay,
} from './commit-action.types';
import type {
  CngxSelectAriaLabels,
  CngxSelectFallbackLabels,
  CngxSelectLoadingVariant,
  CngxSelectRefreshingVariant,
} from './config';
import type { PanelRenderer as PanelRendererForHost } from './panel-renderer';
import type {
  CngxSelectOptionDef,
  CngxSelectOptionGroupDef,
  CngxSelectOptionsInput,
} from './option.model';
import type { CngxSelectTemplateRegistry } from './template-registry';
import type { AsyncView } from '@cngx/common/data';

/**
 * Narrow template surface rendered by `CngxSelectPanelShell`. Excludes
 * option-loop slots so `CngxTreeSelect` doesn't have to stub them.
 *
 * @internal
 */
export interface CngxSelectPanelShellTemplates<T = unknown> {
  readonly loading: Signal<TemplateRef<CngxSelectLoadingContext> | null>;
  readonly empty: Signal<TemplateRef<CngxSelectEmptyContext> | null>;
  readonly error: Signal<TemplateRef<CngxSelectErrorContext> | null>;
  readonly refreshing: Signal<TemplateRef<CngxSelectRefreshingContext> | null>;
  readonly commitError: Signal<TemplateRef<CngxSelectCommitErrorContext<T>> | null>;
  /** Drives all three error-surface retries. Null → default button. */
  readonly retryButton: Signal<TemplateRef<CngxSelectRetryButtonContext> | null>;
  /** Inner body of spinner/bar/dots indicators. Skeleton stays HTML-driven. */
  readonly loadingGlyph: Signal<TemplateRef<void> | null>;
  /** `*cngxSelectAction` slot. Cross-variant — flat, tree, and action panels all read it. */
  readonly action: Signal<TemplateRef<CngxSelectActionContext> | null>;
}

/**
 * Narrow contract consumed by `CngxSelectPanelShell` — async view,
 * shell-rendered slots, retry callback. `CngxTreeSelect` provides only
 * this surface; flat variants provide this plus the full
 * {@link CngxSelectPanelHost}.
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
  /** All keys non-optional; library defaults applied. */
  readonly fallbackLabels: Required<CngxSelectFallbackLabels>;
  /** Search-input variants forward this; button triggers omit (shell → `''`). */
  readonly searchTerm?: Signal<string>;
  /** `unfilteredFlatOptions().length`. Shell → `0` when omitted. */
  readonly unfilteredCount?: Signal<number>;
  /** Frozen `flatOptions().length` during refresh. Shell → `0` when omitted. */
  readonly previousLoadedCount?: Signal<number>;
  /** Mirrors `CNGX_SELECT_CONFIG.ariaLabels`. Per-instance inputs apply outside. */
  readonly ariaLabels: CngxSelectAriaLabels;
  handleRetry(): void;

  /** Action slot's live search term. Shell → `''` when omitted. */
  readonly actionSearchTerm?: Signal<string>;
  /**
   * Drives the dismiss-guard: Escape and click-outside are intercepted
   * while `true`. Shell → `false` when omitted.
   */
  readonly actionDirty?: Signal<boolean>;
  /** Bundled action-slot callbacks. */
  readonly actionCallbacks?: Signal<CngxSelectActionCallbacks>;
  /**
   * `CngxFocusTrap.enabled` resolved from `ActionHostBridge`. Shell →
   * `false` when omitted.
   */
  readonly actionFocusTrapEnabled?: Signal<boolean>;
  /** `*cngxSelectAction` position in the panel frame. Shell → `'bottom'`. */
  readonly actionPosition?: Signal<'top' | 'bottom' | 'both' | 'none'>;
  /**
   * Action-workflow commit-error. Distinct from `commitErrorContext`
   * (toggle/clear commits) — both surfaces co-exist.
   */
  readonly actionError?: Signal<unknown>;
  /** Current primary value, type-erased. Forwarded into action context. */
  readonly actionValue?: Signal<unknown>;
}

/**
 * Token for the shell's narrow contract. Injected by
 * `CngxSelectPanelShell`; never the full {@link CngxSelectPanelHost}.
 *
 * @internal
 */
export const CNGX_SELECT_PANEL_VIEW_HOST = new InjectionToken<CngxSelectPanelViewHost>(
  'CNGX_SELECT_PANEL_VIEW_HOST',
);

/**
 * Full option-loop contract for `CngxSelectPanel`. Extends
 * {@link CngxSelectPanelViewHost} with options, selection, indicator
 * resolution, listbox comparator, AD active id. `CngxTreeSelect`
 * does NOT implement this.
 *
 * @internal
 */
export interface CngxSelectPanelHost<T = unknown> extends CngxSelectPanelViewHost<T> {
  /**
   * Pre-built renderer reused by the panel — avoids duplicate state
   * and lets the host wire AD-virtualisation hooks against the same
   * instance.
   *
   * @internal
   */
  readonly panelRenderer?: PanelRendererForHost<T>;
  readonly effectiveOptions: Signal<CngxSelectOptionsInput<T>>;
  readonly flatOptions: Signal<CngxSelectOptionDef<T>[]>;
  readonly loading: Signal<boolean>;
  readonly panelClassList: Signal<string | readonly string[] | null>;
  readonly panelWidthCss: Signal<string | null>;
  readonly resolvedListboxLabel: Signal<string>;
  readonly resolvedShowSelectionIndicator: Signal<boolean>;
  readonly resolvedSelectionIndicatorVariant: Signal<'checkbox' | 'checkmark' | 'radio'>;
  readonly resolvedSelectionIndicatorPosition: Signal<'before' | 'after'>;
  readonly listboxCompareWith: Signal<(a: unknown, b: unknown) => boolean>;
  readonly externalActivation: Signal<boolean>;
  /** Overrides parent `tpl` with the full 13-slot registry. */
  readonly tpl: CngxSelectTemplateRegistry<T>;
  readonly commitErrorValue: Signal<unknown>;
  readonly activeId: Signal<string | null>;
  isGroup(item: CngxSelectOptionDef<T> | CngxSelectOptionGroupDef<T>):
    item is CngxSelectOptionGroupDef<T>;
  isSelected(opt: CngxSelectOptionDef<T>): boolean;
  isIndeterminate(opt: CngxSelectOptionDef<T>): boolean;
  isCommittingOption(opt: CngxSelectOptionDef<T>): boolean;
  /**
   * Appends to the local-items buffer, folded into `effectiveOptions`
   * via `mergeLocalItems`. Dedup-guarded.
   */
  patchData(item: CngxSelectOptionDef<T>): void;
  /** Idempotent. */
  clearLocalItems(): void;
}

/**
 * Token for the full option-loop contract. Injected by
 * `CngxSelectPanel`; `CngxTreeSelect` does not provide it.
 *
 * @internal
 */
export const CNGX_SELECT_PANEL_HOST = new InjectionToken<CngxSelectPanelHost>(
  'CNGX_SELECT_PANEL_HOST',
);
