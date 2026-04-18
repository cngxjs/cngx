import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChildren,
} from '@angular/core';

import { CngxOption } from '@cngx/common/interactive';

import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from './shared/panel-host';

/**
 * Panel body sub-component — renders the dropdown's inner switch: the
 * four loading variants, the empty/error states, the refresh indicator,
 * the inline/commit-error banners, and the grouped/flat option loop.
 *
 * **Why this is a separate component.**
 * Inlining the whole panel in `CngxSelect`'s template pushed it past
 * 340 lines — beyond "readable in one screen". Moving the body here
 * shrinks the main template to ~80 lines focused on the trigger button
 * and the popover/listbox frame.
 *
 * The outer `<div cngxPopover>` and `<div cngxListbox>` stay on
 * `CngxSelect` so the trigger button's `[popover]` / `[cngxListboxTrigger]`
 * template references stay in scope. This sub-component renders ONLY
 * the listbox's children.
 *
 * **Why the `CNGX_SELECT_PANEL_HOST` token.**
 * A direct `inject(CngxSelect)` would create a cyclic type dependency
 * between this file and `select.component.ts`. The token carries the
 * minimal `CngxSelectPanelHost` interface — refactors on `CngxSelect`
 * show up there first, not in this template.
 *
 * @internal
 */
@Component({
  selector: 'cngx-select-panel',
  exportAs: 'cngxSelectPanel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxOption, NgTemplateOutlet],
  host: {
    class: 'cngx-select-panel-host',
  },
  template: `
    @switch (host.activeView()) {
      @case ('skeleton') {
        @if (host.loadingTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        } @else {
          @switch (host.loadingVariant()) {
            @case ('spinner') {
              <div class="cngx-select__spinner-wrap" role="status" aria-live="polite" aria-label="Lädt">
                <div aria-hidden="true" class="cngx-select__spinner"></div>
              </div>
            }
            @case ('bar') {
              <div class="cngx-select__loading-bar" role="status" aria-live="polite" aria-label="Lädt"></div>
            }
            @case ('text') {
              <div class="cngx-select__loading" role="status" aria-live="polite">Lädt…</div>
            }
            @default {
              <div class="cngx-select__skeleton" role="status" aria-live="polite" aria-label="Lädt">
                @for (i of host.skeletonIndices(); track i) {
                  <div aria-hidden="true" class="cngx-select__skeleton-row"></div>
                }
              </div>
            }
          }
        }
      }
      @case ('empty') {
        @if (host.emptyTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        } @else {
          <div class="cngx-select__empty">Keine Optionen</div>
        }
      }
      @case ('none') {
        @if (host.emptyTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        } @else {
          <div class="cngx-select__empty">Keine Optionen</div>
        }
      }
      @case ('error') {
        @if (host.errorTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: host.errorContext()" />
        } @else {
          <div class="cngx-select__error" role="alert">
            <span class="cngx-select__error-message">Laden fehlgeschlagen</span>
            <button type="button" class="cngx-select__error-retry" (click)="host.handleRetry()">
              Nochmal versuchen
            </button>
          </div>
        }
      }
      @default {
        @if (host.showInlineError()) {
          @if (host.errorTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef; context: host.errorContext()" />
          } @else {
            <div class="cngx-select__error cngx-select__error--inline" role="alert">
              <span class="cngx-select__error-message">Aktualisieren fehlgeschlagen</span>
              <button type="button" class="cngx-select__error-retry" (click)="host.handleRetry()">
                Nochmal versuchen
              </button>
            </div>
          }
        }
        @if (host.showCommitError() && host.commitErrorDisplay() === 'banner') {
          @if (host.commitErrorTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef; context: host.commitErrorContext()" />
          } @else {
            <div class="cngx-select__commit-error" role="alert">
              <span class="cngx-select__error-message">Speichern fehlgeschlagen</span>
              <button type="button" class="cngx-select__error-retry" (click)="host.commitErrorContext().retry()">
                Nochmal versuchen
              </button>
            </div>
          }
        }
        @if (host.showRefreshIndicator()) {
          @if (host.refreshingTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else {
            @switch (host.refreshingVariant()) {
              @case ('none') { <!-- suppressed --> }
              @case ('spinner') {
                <div class="cngx-select__refreshing-spinner" role="status" aria-live="polite" aria-label="Refreshing">
                  <div aria-hidden="true" class="cngx-select__spinner"></div>
                </div>
              }
              @case ('dots') {
                <div class="cngx-select__refreshing-dots" role="status" aria-live="polite" aria-label="Refreshing">
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                </div>
              }
              @default {
                <div class="cngx-select__refreshing" role="status" aria-live="polite" aria-label="Refreshing"></div>
              }
            }
          }
        }
        @for (item of host.effectiveOptions(); track $index) {
          @if (host.isGroup(item)) {
            <div class="cngx-select__group" role="group" [attr.aria-label]="item.label">
              @if (host.optgroupTpl(); as tpl) {
                <ng-container *ngTemplateOutlet="tpl.templateRef; context: { $implicit: item, group: item }" />
              } @else {
                <div class="cngx-select__group-header" aria-hidden="true">{{ item.label }}</div>
              }
              @for (opt of item.children; track opt.value) {
                <ng-container *ngTemplateOutlet="optionRow; context: { $implicit: opt, groupDisabled: !!item.disabled }" />
              }
            </div>
          } @else {
            <ng-container *ngTemplateOutlet="optionRow; context: { $implicit: item, groupDisabled: false }" />
          }
        }
      }
    }

    <!--
      Reusable option-row template — used for both grouped children and
      flat items. Single source of truth for selection class, pending
      class, check indicator, rich label template, and commit-status
      glyph. Keeps the grouped/flat paths from diverging when option-row
      concerns evolve.
    -->
    <ng-template #optionRow let-opt let-groupDisabled="groupDisabled">
      <div
        cngxOption
        [value]="opt.value"
        [disabled]="!!opt.disabled || groupDisabled"
        class="cngx-select__option"
        [class.cngx-select__option--selected]="host.isSelected(opt)"
        [class.cngx-select__option--pending]="host.isCommittingOption(opt)"
      >
        @if (host.resolvedShowSelectionIndicator()) {
          @if (host.checkTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef; context: { $implicit: opt, option: opt, selected: host.isSelected(opt) }" />
          } @else if (host.isSelected(opt)) {
            <span aria-hidden="true" class="cngx-select__check">&#10003;</span>
          }
        }
        @if (host.optionLabelTpl(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef; context: { $implicit: opt, option: opt, selected: host.isSelected(opt), highlighted: false }" />
        } @else {
          {{ opt.label }}
        }
        @if (host.isCommittingOption(opt)) {
          <span aria-hidden="true" class="cngx-select__option-spinner"></span>
        } @else if (host.commitErrorDisplay() === 'inline' && host.showCommitError() && host.isSelected(opt)) {
          <span aria-hidden="true" class="cngx-select__option-error">!</span>
        }
      </div>
    </ng-template>
  `,
  styles: `
    :host {
      display: contents;
    }
    /*
     * Panel-body styles. These elements live in THIS component's view
     * (not in CngxSelect's) — Angular's view-encapsulation scopes CSS
     * per-component, so the parent's styles don't reach here. Panel-
     * frame styles (border, box-shadow, max-height, position-try-
     * fallbacks) stay on CngxSelect because the <div cngxPopover> host
     * element is there.
     */
    .cngx-select__group-header {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cngx-select__option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: var(--cngx-select-option-padding, 0.375rem 0.5rem);
      cursor: pointer;
      border-radius: var(--cngx-select-option-radius, 0.125rem);
    }
    .cngx-select__option::after,
    .cngx-select__option::before {
      content: none;
    }
    .cngx-select__option[aria-disabled='true'] {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .cngx-select__option.cngx-option--highlighted {
      background: var(--cngx-select-option-highlight-bg, rgba(25, 118, 210, 0.1));
    }
    .cngx-select__check {
      color: var(--cngx-select-check-color, var(--cngx-focus-ring, #1976d2));
      font-weight: 700;
    }
    .cngx-select__loading,
    .cngx-select__empty {
      padding: 0.5rem 0.75rem;
      font-style: italic;
      opacity: 0.7;
    }
    .cngx-select__skeleton {
      display: flex;
      flex-direction: column;
      gap: var(--cngx-select-skeleton-gap, 0.25rem);
      padding: var(--cngx-select-skeleton-padding, 0.25rem);
    }
    .cngx-select__skeleton-row {
      height: var(--cngx-select-skeleton-row-height, 1.75rem);
      border-radius: var(--cngx-select-skeleton-row-radius, 0.125rem);
      background: linear-gradient(
        90deg,
        var(--cngx-skeleton-bg, rgba(0, 0, 0, 0.08)) 25%,
        var(--cngx-skeleton-shimmer, rgba(0, 0, 0, 0.12)) 50%,
        var(--cngx-skeleton-bg, rgba(0, 0, 0, 0.08)) 75%
      );
      background-size: 200% 100%;
      animation: cngx-select-skeleton-shimmer 1.5s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .cngx-select__skeleton-row { animation: none; }
    }
    @keyframes cngx-select-skeleton-shimmer {
      from { background-position: 200% 0; }
      to { background-position: -200% 0; }
    }
    .cngx-select__spinner-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--cngx-select-spinner-padding, 1rem);
    }
    .cngx-select__spinner {
      width: var(--cngx-select-spinner-size, 1.5rem);
      height: var(--cngx-select-spinner-size, 1.5rem);
      border: var(--cngx-select-spinner-border, 2px solid rgba(0, 0, 0, 0.15));
      border-top-color: var(--cngx-select-spinner-color, var(--cngx-focus-ring, #1976d2));
      border-radius: 50%;
      animation: cngx-select-spin 0.8s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .cngx-select__spinner { animation-duration: 3s; }
    }
    @keyframes cngx-select-spin {
      to { transform: rotate(360deg); }
    }
    .cngx-select__loading-bar {
      height: var(--cngx-select-loading-bar-height, 3px);
      margin: calc(-1 * var(--cngx-select-panel-padding, 0.25rem))
        calc(-1 * var(--cngx-select-panel-padding, 0.25rem));
      background: linear-gradient(
        90deg,
        transparent,
        var(--cngx-select-loading-bar-color, var(--cngx-focus-ring, #1976d2)),
        transparent
      );
      background-size: 200% 100%;
      animation: cngx-select-refresh 1.1s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .cngx-select__loading-bar { animation: none; }
    }
    .cngx-select__refreshing {
      height: var(--cngx-select-refreshing-height, 2px);
      margin: calc(-1 * var(--cngx-select-panel-padding, 0.25rem))
        calc(-1 * var(--cngx-select-panel-padding, 0.25rem)) 0;
      background: linear-gradient(
        90deg,
        transparent,
        var(--cngx-select-refreshing-color, var(--cngx-focus-ring, #1976d2)),
        transparent
      );
      background-size: 200% 100%;
      animation: cngx-select-refresh 1.1s linear infinite;
    }
    @keyframes cngx-select-refresh {
      from { background-position: 100% 0; }
      to { background-position: -100% 0; }
    }
    .cngx-select__refreshing-spinner {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--cngx-select-refreshing-spinner-padding, 0.25rem);
    }
    .cngx-select__refreshing-dots {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--cngx-select-refreshing-dots-gap, 0.25rem);
      padding: var(--cngx-select-refreshing-dots-padding, 0.375rem);
    }
    .cngx-select__refreshing-dots > span {
      width: var(--cngx-select-refreshing-dot-size, 0.375rem);
      height: var(--cngx-select-refreshing-dot-size, 0.375rem);
      border-radius: 50%;
      background: var(--cngx-select-refreshing-dot-color, currentColor);
      opacity: 0.6;
      animation: cngx-select-refreshing-dot 1.2s ease-in-out infinite;
    }
    .cngx-select__refreshing-dots > span:nth-child(2) { animation-delay: 0.15s; }
    .cngx-select__refreshing-dots > span:nth-child(3) { animation-delay: 0.3s; }
    @media (prefers-reduced-motion: reduce) {
      .cngx-select__refreshing-dots > span { animation: none; opacity: 0.8; }
    }
    @keyframes cngx-select-refreshing-dot {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
    .cngx-select__option--pending {
      cursor: progress;
    }
    .cngx-select__option-spinner {
      margin-inline-start: auto;
      width: var(--cngx-select-option-spinner-size, 0.875rem);
      height: var(--cngx-select-option-spinner-size, 0.875rem);
      border: 2px solid rgba(0, 0, 0, 0.15);
      border-top-color: var(--cngx-select-option-spinner-color, var(--cngx-focus-ring, #1976d2));
      border-radius: 50%;
      animation: cngx-select-spin 0.8s linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .cngx-select__option-spinner { animation-duration: 3s; }
    }
    .cngx-select__option-error {
      margin-inline-start: auto;
      color: var(--cngx-select-option-error-color, var(--cngx-error, #b71c1c));
      font-weight: 700;
      font-size: 0.875rem;
    }
    .cngx-select__error {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--cngx-select-error-gap, 0.5rem);
      padding: var(--cngx-select-error-padding, 0.5rem 0.75rem);
      color: var(--cngx-select-error-color, var(--cngx-error, #b71c1c));
    }
    .cngx-select__error--inline {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: var(--cngx-select-error-inline-padding, 0.375rem 0.5rem);
      margin-bottom: 0.25rem;
      border: 1px solid currentColor;
      border-radius: var(--cngx-select-error-inline-radius, 0.125rem);
      font-size: 0.875rem;
    }
    .cngx-select__error-message {
      font-weight: 500;
    }
    .cngx-select__error-retry {
      appearance: none;
      border: var(--cngx-select-error-retry-border, 1px solid currentColor);
      background: transparent;
      color: inherit;
      font: inherit;
      padding: 0.25rem 0.5rem;
      border-radius: 0.125rem;
      cursor: pointer;
    }
    .cngx-select__error-retry:focus-visible {
      outline: 2px solid var(--cngx-focus-ring, #1976d2);
      outline-offset: 2px;
    }
    .cngx-select__commit-error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
      padding: var(--cngx-select-commit-error-padding, 0.375rem 0.5rem);
      border: 1px solid currentColor;
      border-radius: var(--cngx-select-commit-error-radius, 0.125rem);
      color: var(--cngx-select-error-color, var(--cngx-error, #b71c1c));
      font-size: 0.875rem;
    }
  `,
})
export class CngxSelectPanel<T = unknown> {
  /**
   * Panel-host contract. Cast to the typed interface so template reads
   * like `host.activeView()` are properly checked. Angular provides the
   * concrete `CngxSelect` instance via `{ useExisting: CngxSelect }`,
   * typed here as `CngxSelectPanelHost<T>` — the minimal surface this
   * sub-component needs.
   */
  protected readonly host = inject(CNGX_SELECT_PANEL_HOST) as CngxSelectPanelHost<T>;

  /**
   * All `CngxOption` instances rendered in this panel's view. Exposed
   * to the parent so it can forward them to its outer `CngxListbox`
   * via `[explicitOptions]` — content-projection-scoping prevents the
   * listbox from seeing them as `contentChildren`.
   */
  readonly options = viewChildren(CngxOption);

  /**
   * ActiveDescendantItem projections of `options()`, ready to bind to
   * the outer listbox's `[items]` passthrough input (which forwards to
   * CngxActiveDescendant). AD's own `contentChildren(CNGX_AD_ITEM)`
   * can't see the options because they live in THIS component's view,
   * not in the listbox's projected content. Forwarding via `items`
   * bypasses the scoping boundary cleanly.
   */
  readonly items = computed(() =>
    this.options().map((o) => ({
      id: o.id,
      value: o.value(),
      label: o.label(),
      disabled: o.disabled(),
    })),
  );
}
