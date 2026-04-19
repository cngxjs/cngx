import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  viewChildren,
} from '@angular/core';

import { CngxOption } from '@cngx/common/interactive';

import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from '../panel-host';

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
  styleUrls: ['../select-base.css', './panel.component.css'],
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
