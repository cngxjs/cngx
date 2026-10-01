import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  untracked,
} from '@angular/core';

import { CngxFocusTrap } from '@cngx/common/a11y';
import { recordEqual } from '@cngx/utils';

import { resolveActionSelectConfig } from '../../action-select-config';
import {
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectActionCallbacks,
  type CngxSelectPanelViewHost,
} from '../../panel-host';
import type {
  CngxSelectActionContext,
  CngxSelectEmptyContext,
  CngxSelectLoadingContext,
  CngxSelectRefreshingContext,
} from '../../template-slots';

/** `*cngxSelectAction` position. `'none'` suppresses. @internal */
export type CngxSelectPanelActionPosition = 'top' | 'bottom' | 'both' | 'none';

/** No-op fallback when the view-host omits `actionCallbacks`. @internal */
const NOOP_ACTION_CALLBACKS: CngxSelectActionCallbacks = Object.freeze({
  close: () => {/* noop */},
  commit: () => {/* noop */},
  isPending: false,
  setDirty: () => {/* noop */},
  cancel: () => {/* noop */},
  retry: () => {/* noop */},
});

/**
 * Shared frame for every select-family variant. Owns the
 * `host.activeView()` switch (loading / empty / error / refreshing /
 * commit-error / inline-error) and projects the variant body via
 * `<ng-content />` on the default branch.
 *
 * Default-branch order: inline-error → commit-error banner →
 * refreshing → action-top → body → action-bottom.
 *
 * Action slot renders when `host.tpl.action()` is non-null and
 * `actionPosition()` ≠ `'none'`; view-host omissions fall back to a
 * frozen no-op bundle.
 *
 * `CngxFocusTrap` rides as a host directive; `enabled` is re-exposed
 * as `actionFocusTrapEnabled`.
 *
 * @internal
 */
@Component({
  selector: 'cngx-select-panel-shell',
  exportAs: 'cngxSelectPanelShell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  hostDirectives: [
    {
      directive: CngxFocusTrap,
      inputs: ['enabled: actionFocusTrapEnabled'],
    },
  ],
  host: {
    class: 'cngx-select-panel-shell',
  },
  templateUrl: './panel-shell.component.html',
})
export class CngxSelectPanelShell<T = unknown> {
  protected readonly host = inject(CNGX_SELECT_PANEL_VIEW_HOST) as CngxSelectPanelViewHost<T>;

  /** Default `'bottom'`. */
  readonly actionPosition = input<CngxSelectPanelActionPosition>('bottom');

  /**
   * @internal Accessible name of the action-slot group, from
   * `CNGX_ACTION_SELECT_CONFIG.ariaLabel`; follows a language switch.
   */
  protected readonly actionLabel = resolveActionSelectConfig().ariaLabel;

  /** @internal */
  protected readonly showActionTop = computed<boolean>(() => {
    const p = this.actionPosition();
    return p === 'top' || p === 'both';
  });

  /** @internal */
  protected readonly showActionBottom = computed<boolean>(() => {
    const p = this.actionPosition();
    return p === 'bottom' || p === 'both';
  });

/** @internal */
  protected readonly actionContext = computed<CngxSelectActionContext>(
    () => {
      const searchTerm = this.host.actionSearchTerm?.() ?? '';
      const dirty = this.host.actionDirty?.() ?? false;
      const callbacks = this.host.actionCallbacks?.() ?? NOOP_ACTION_CALLBACKS;
      const error = this.host.actionError?.() ?? null;
      const value = this.host.actionValue?.() ?? null;
      return {
        $implicit: searchTerm,
        searchTerm,
        close: callbacks.close,
        commit: callbacks.commit,
        isPending: callbacks.isPending,
        setDirty: callbacks.setDirty,
        dirty,
        retry: callbacks.retry,
        error,
        hasError: error !== null,
        value,
      };
    },
    {
      // Structural equal - `bridge.callbacks` pins identity to
      // isPending, so 5 reactive fields + searchTerm + dirty cover
      // every semantic change. Suppresses per-keystroke outlet rebinds.
      equal: (a, b) =>
        a.searchTerm === b.searchTerm &&
        a.dirty === b.dirty &&
        a.isPending === b.isPending &&
        a.error === b.error &&
        a.value === b.value &&
        a.close === b.close &&
        a.commit === b.commit &&
        a.setDirty === b.setDirty &&
        a.retry === b.retry,
    },
  );

/** @internal */
  protected readonly emptyContext = computed<CngxSelectEmptyContext>(
    () => {
      const searchTerm = this.host.searchTerm?.() ?? '';
      const totalCount = this.host.unfilteredCount?.() ?? 0;
      return {
        searchTerm,
        filtered: searchTerm.length > 0,
        totalCount,
      };
    },
    {
      equal: (a, b) =>
        a.searchTerm === b.searchTerm &&
        a.filtered === b.filtered &&
        a.totalCount === b.totalCount,
    },
  );

/** @internal */
  protected readonly loadingContext = computed<CngxSelectLoadingContext>(
    () => ({
      progress: undefined,
      retry: this.host.handleRetry.bind(this.host),
    }),
    { equal: (a, b) => a.progress === b.progress && a.retry === b.retry },
  );

/** @internal */
  protected readonly refreshingContext = computed<CngxSelectRefreshingContext>(
    () => ({
      previousCount: this.host.previousLoadedCount?.() ?? 0,
    }),
    { equal: (a, b) => a.previousCount === b.previousCount },
  );

  // Live-region copy. Each region reads its copy untracked and re-reads it
  // only when its own status changes, so a language flip never re-speaks a
  // shown region; the next time it appears it speaks the new language.

  /**
   * @internal Loading and first-load error regions, keyed on `activeView` and
   * `loadingVariant` (a variant swap renders a new region element).
   */
  protected readonly viewCopy = computed(
    () => {
      this.host.activeView();
      this.host.loadingVariant();
      return untracked(() => {
        const fallback = this.host.fallbackLabels();
        return {
          statusLoading: this.host.ariaLabels().statusLoading,
          loading: fallback.loading,
          loadFailed: fallback.loadFailed,
          loadFailedRetry: fallback.loadFailedRetry,
        };
      });
    },
    { equal: recordEqual },
  );

  /** @internal Inline refresh-error region, keyed on `showInlineError`. */
  protected readonly inlineErrorCopy = computed(
    () => {
      this.host.showInlineError();
      return untracked(() => {
        const fallback = this.host.fallbackLabels();
        return { message: fallback.refreshFailed, retry: fallback.refreshFailedRetry };
      });
    },
    { equal: recordEqual },
  );

  /** @internal Commit-error banner region, keyed on `showCommitError`. */
  protected readonly commitErrorCopy = computed(
    () => {
      this.host.showCommitError();
      return untracked(() => {
        const fallback = this.host.fallbackLabels();
        return { message: fallback.commitFailed, retry: fallback.commitFailedRetry };
      });
    },
    { equal: recordEqual },
  );

  /**
   * @internal Refreshing indicator region, keyed on `showRefreshIndicator` and
   * `refreshingVariant`.
   */
  protected readonly refreshingLabel = computed(() => {
    this.host.showRefreshIndicator();
    this.host.refreshingVariant();
    return untracked(() => this.host.ariaLabels().statusRefreshing);
  });
}
