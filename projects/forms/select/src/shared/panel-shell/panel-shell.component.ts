import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { CngxFocusTrap } from '@cngx/common/a11y';

import {
  CNGX_SELECT_PANEL_VIEW_HOST,
  type CngxSelectActionCallbacks,
  type CngxSelectPanelViewHost,
} from '../panel-host';
import type {
  CngxSelectActionContext,
  CngxSelectEmptyContext,
  CngxSelectLoadingContext,
  CngxSelectRefreshingContext,
} from '../template-slots';

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
  template: `
    @if (showActionTop()) {
      @if (host.tpl.action(); as tpl) {
        <div class="cngx-select__action cngx-select__action--top">
          <ng-container *ngTemplateOutlet="tpl; context: actionContext()" />
        </div>
      }
    }
    @switch (host.activeView()) {
      @case ('skeleton') {
        @if (host.tpl.loading(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: loadingContext()" />
        } @else {
          @switch (host.loadingVariant()) {
            @case ('spinner') {
              <div class="cngx-select__spinner-wrap" role="status" aria-live="polite" [attr.aria-label]="host.ariaLabels.statusLoading ?? 'Loading options'">
                @if (host.tpl.loadingGlyph(); as glyph) {
                  <ng-container *ngTemplateOutlet="glyph" />
                } @else {
                  <div aria-hidden="true" class="cngx-select__spinner"></div>
                }
              </div>
            }
            @case ('bar') {
              <div class="cngx-select__loading-bar" role="status" aria-live="polite" [attr.aria-label]="host.ariaLabels.statusLoading ?? 'Loading options'">
                @if (host.tpl.loadingGlyph(); as glyph) {
                  <ng-container *ngTemplateOutlet="glyph" />
                }
              </div>
            }
            @case ('text') {
              <div class="cngx-select__loading" role="status" aria-live="polite">{{ host.fallbackLabels.loading }}</div>
            }
            @default {
              <div class="cngx-select__skeleton" role="status" aria-live="polite" [attr.aria-label]="host.ariaLabels.statusLoading ?? 'Loading options'">
                @for (i of host.skeletonIndices(); track i) {
                  <div aria-hidden="true" class="cngx-select__skeleton-row"></div>
                }
              </div>
            }
          }
        }
      }
      @case ('empty') {
        @if (host.tpl.empty(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: emptyContext()" />
        } @else {
          <div class="cngx-select__empty">{{ host.fallbackLabels.empty }}</div>
        }
      }
      @case ('none') {
        @if (host.tpl.empty(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: emptyContext()" />
        } @else {
          <div class="cngx-select__empty">{{ host.fallbackLabels.empty }}</div>
        }
      }
      @case ('error') {
        @if (host.tpl.error(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: host.errorContext()" />
        } @else {
          <div class="cngx-select__error" role="alert">
            <span class="cngx-select__error-message">{{ host.fallbackLabels.loadFailed }}</span>
            @if (host.tpl.retryButton(); as retryT) {
              <ng-container
                *ngTemplateOutlet="
                  retryT;
                  context: {
                    $implicit: host.handleRetry.bind(host),
                    retry: host.handleRetry.bind(host),
                    error: host.errorContext().error,
                    disabled: false,
                    label: host.fallbackLabels.loadFailedRetry
                  }
                "
              />
            } @else {
              <button type="button" class="cngx-select__error-retry" (click)="host.handleRetry()">
                {{ host.fallbackLabels.loadFailedRetry }}
              </button>
            }
          </div>
        }
      }
      @default {
        @if (host.showInlineError()) {
          @if (host.tpl.error(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: host.errorContext()" />
          } @else {
            <div class="cngx-select__error cngx-select__error--inline" role="alert">
              <span class="cngx-select__error-message">{{ host.fallbackLabels.refreshFailed }}</span>
              @if (host.tpl.retryButton(); as retryT) {
                <ng-container
                  *ngTemplateOutlet="
                    retryT;
                    context: {
                      $implicit: host.handleRetry.bind(host),
                      retry: host.handleRetry.bind(host),
                      error: host.errorContext().error,
                      disabled: false,
                      label: host.fallbackLabels.refreshFailedRetry
                    }
                  "
                />
              } @else {
                <button type="button" class="cngx-select__error-retry" (click)="host.handleRetry()">
                  {{ host.fallbackLabels.refreshFailedRetry }}
                </button>
              }
            </div>
          }
        }
        @if (host.showCommitError() && host.commitErrorDisplay() === 'banner') {
          @if (host.tpl.commitError(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: host.commitErrorContext()" />
          } @else {
            <div class="cngx-select__commit-error" role="alert">
              <span class="cngx-select__error-message">{{ host.fallbackLabels.commitFailed }}</span>
              @if (host.tpl.retryButton(); as retryT) {
                <ng-container
                  *ngTemplateOutlet="
                    retryT;
                    context: {
                      $implicit: host.commitErrorContext().retry,
                      retry: host.commitErrorContext().retry,
                      error: host.commitErrorContext().error,
                      disabled: false,
                      label: host.fallbackLabels.commitFailedRetry
                    }
                  "
                />
              } @else {
                <button type="button" class="cngx-select__error-retry" (click)="host.commitErrorContext().retry()">
                  {{ host.fallbackLabels.commitFailedRetry }}
                </button>
              }
            </div>
          }
        }
        @if (host.showRefreshIndicator()) {
          @if (host.tpl.refreshing(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: refreshingContext()" />
          } @else {
            @switch (host.refreshingVariant()) {
              @case ('none') { <!-- suppressed --> }
              @case ('spinner') {
                <div class="cngx-select__refreshing-spinner" role="status" aria-live="polite" [attr.aria-label]="host.ariaLabels.statusRefreshing ?? 'Refreshing options'">
                  @if (host.tpl.loadingGlyph(); as glyph) {
                    <ng-container *ngTemplateOutlet="glyph" />
                  } @else {
                    <div aria-hidden="true" class="cngx-select__spinner"></div>
                  }
                </div>
              }
              @case ('dots') {
                <div class="cngx-select__refreshing-dots" role="status" aria-live="polite" [attr.aria-label]="host.ariaLabels.statusRefreshing ?? 'Refreshing options'">
                  @if (host.tpl.loadingGlyph(); as glyph) {
                    <ng-container *ngTemplateOutlet="glyph" />
                  } @else {
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                  }
                </div>
              }
              @default {
                <div class="cngx-select__refreshing" role="status" aria-live="polite" [attr.aria-label]="host.ariaLabels.statusRefreshing ?? 'Refreshing options'">
                  @if (host.tpl.loadingGlyph(); as glyph) {
                    <ng-container *ngTemplateOutlet="glyph" />
                  }
                </div>
              }
            }
          }
        }
        <ng-content />
      }
    }
    @if (showActionBottom()) {
      @if (host.tpl.action(); as tpl) {
        <div class="cngx-select__action cngx-select__action--bottom">
          <ng-container *ngTemplateOutlet="tpl; context: actionContext()" />
        </div>
      }
    }
  `,
})
export class CngxSelectPanelShell<T = unknown> {
  protected readonly host = inject(CNGX_SELECT_PANEL_VIEW_HOST) as CngxSelectPanelViewHost<T>;

  /** Default `'bottom'`. */
  readonly actionPosition = input<CngxSelectPanelActionPosition>('bottom');

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
      // Structural equal — `bridge.callbacks` pins identity to
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
}
