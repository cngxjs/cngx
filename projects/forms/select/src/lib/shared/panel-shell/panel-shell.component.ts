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
import type { CngxSelectActionContext } from '../template-slots';

/**
 * Position(s) in the default-case stack where the `*cngxSelectAction`
 * slot is rendered. `'none'` suppresses the slot entirely — useful
 * when a consumer projects the template for one variant but wants it
 * hidden on another inside the same view.
 *
 * @internal
 */
export type CngxSelectPanelActionPosition = 'top' | 'bottom' | 'both' | 'none';

/**
 * No-op callback bundle used when the view-host leaves
 * `actionCallbacks` undefined (every button-trigger variant in
 * Commit 3 — the organisms wire real handlers in Commit 5/6).
 *
 * @internal
 */
const NOOP_ACTION_CALLBACKS: CngxSelectActionCallbacks = Object.freeze({
  close: () => {
    /* no-op */
  },
  commit: () => {
    /* no-op */
  },
  isPending: false,
  setDirty: () => {
    /* no-op */
  },
  cancel: () => {
    /* no-op */
  },
  retry: () => {
    /* no-op */
  },
});

/**
 * Panel frame shared by every variant in the select family — owns the
 * `host.activeView()` switch (loading variants, empty/error, refreshing
 * indicator, commit-error banner, inline-error) and projects the
 * variant-specific body (options loop, tree loop, etc.) via
 * `<ng-content />` into the "content" case.
 *
 * Extracted from `CngxSelectPanel` so the upcoming `CngxTreeSelectPanel`
 * can render a `role="tree"` body without duplicating ~100 LOC of
 * loading-and-error scaffolding. The shell stays value-shape-agnostic —
 * everything it needs comes from `CngxSelectPanelHost<T>`.
 *
 * The default-case ordering is intentional: inline-error → commit-error
 * banner → refreshing indicator → action-top → projected body →
 * action-bottom. Matches the v0.1 panel's visual hierarchy; the action
 * slots are additive and default to `'bottom'` so pre-existing
 * consumers see no layout change.
 *
 * **Action-slot integration**. When the resolved `host.tpl.action()`
 * is non-null AND `actionPosition()` is not `'none'`, the shell
 * renders the projected template at the configured position(s),
 * passing the {@link CngxSelectActionContext} bundle (live
 * `searchTerm`, `dirty`, `isPending`, plus the `close` / `commit` /
 * `setDirty` callbacks) sourced from the view-host. Variants that
 * don't expose an inline action workflow can leave the view-host
 * slots undefined — the shell substitutes the `NOOP_ACTION_CALLBACKS`
 * bundle and `''` search term.
 *
 * **Focus-trap**. `CngxFocusTrap` rides on the shell as a host
 * directive. Its `enabled` input is re-exposed as
 * `actionFocusTrapEnabled` (default `false`) so the action-select
 * organisms can bind the dirty-cascade signal from the variant side
 * in Commit 4 without every shell consumer having to care.
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
          <ng-container *ngTemplateOutlet="tpl" />
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
          <ng-container *ngTemplateOutlet="tpl" />
        } @else {
          <div class="cngx-select__empty">{{ host.fallbackLabels.empty }}</div>
        }
      }
      @case ('none') {
        @if (host.tpl.empty(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
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
            <ng-container *ngTemplateOutlet="tpl" />
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

  /**
   * Position of the projected `*cngxSelectAction` slot within the
   * default-case stack. `'top'` renders above the projected body,
   * `'bottom'` (default) after it, `'both'` at both ends, `'none'`
   * suppresses the slot even if the consumer projected a template.
   */
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

  /**
   * Context emitted to the `*cngxSelectAction` template. Re-computes
   * whenever `actionSearchTerm` / `actionDirty` / `actionCallbacks`
   * change on the view-host — the `ngTemplateOutlet` detects the
   * fresh reference and refreshes embedded-view bindings. Variants
   * that don't supply the fields fall back to `''`, `false`, and the
   * frozen no-op bundle respectively, so the shell never crashes
   * when a consumer projects the slot against a non-action variant.
   *
   * @internal
   */
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
      // Structural equal — match the family's pattern (inputSlotContext,
      // core.selected, bridge.callbacks all have one). The callback refs
      // inside the bundle are already stable across re-computes because
      // `bridge.callbacks` pins its own identity to `isPending`, so
      // comparing the 5 reactive fields + `searchTerm` + `dirty` covers
      // every semantic change. Suppresses per-keystroke template-outlet
      // rebinds when an action-slot template only reads a subset of the
      // context (e.g. just `isPending`).
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
}
