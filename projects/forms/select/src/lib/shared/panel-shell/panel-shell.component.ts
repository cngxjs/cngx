import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CNGX_SELECT_PANEL_HOST, type CngxSelectPanelHost } from '../panel-host';

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
 * banner → refreshing indicator → projected body. Matches the v0.1
 * panel's visual hierarchy so no migration is required for any of the
 * four shipped variants.
 *
 * @internal
 */
@Component({
  selector: 'cngx-select-panel-shell',
  exportAs: 'cngxSelectPanelShell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  host: {
    class: 'cngx-select-panel-shell',
  },
  template: `
    @switch (host.activeView()) {
      @case ('skeleton') {
        @if (host.tpl.loading(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
        } @else {
          @switch (host.loadingVariant()) {
            @case ('spinner') {
              <div class="cngx-select__spinner-wrap" role="status" aria-live="polite" aria-label="Loading">
                <div aria-hidden="true" class="cngx-select__spinner"></div>
              </div>
            }
            @case ('bar') {
              <div class="cngx-select__loading-bar" role="status" aria-live="polite" aria-label="Loading"></div>
            }
            @case ('text') {
              <div class="cngx-select__loading" role="status" aria-live="polite">Loading…</div>
            }
            @default {
              <div class="cngx-select__skeleton" role="status" aria-live="polite" aria-label="Loading">
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
          <div class="cngx-select__empty">No Options</div>
        }
      }
      @case ('none') {
        @if (host.tpl.empty(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl" />
        } @else {
          <div class="cngx-select__empty">No Options</div>
        }
      }
      @case ('error') {
        @if (host.tpl.error(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl; context: host.errorContext()" />
        } @else {
          <div class="cngx-select__error" role="alert">
            <span class="cngx-select__error-message">Loading failed</span>
            <button type="button" class="cngx-select__error-retry" (click)="host.handleRetry()">
              Retry
            </button>
          </div>
        }
      }
      @default {
        @if (host.showInlineError()) {
          @if (host.tpl.error(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: host.errorContext()" />
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
          @if (host.tpl.commitError(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl; context: host.commitErrorContext()" />
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
          @if (host.tpl.refreshing(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl" />
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
        <ng-content />
      }
    }
  `,
})
export class CngxSelectPanelShell<T = unknown> {
  protected readonly host = inject(CNGX_SELECT_PANEL_HOST) as CngxSelectPanelHost<T>;
}
