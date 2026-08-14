import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
  type TemplateRef,
} from '@angular/core';

import type { CommandGroup } from '@cngx/common/command';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { injectCommandPaletteConfig } from '../config/command-palette-config';
import type {
  CngxCommandPaletteEmptyContext,
  CngxCommandPaletteErrorContext,
  CngxCommandPaletteLoadingContext,
} from '../slots/command-slots';

/**
 * @internal
 * Async-state view switch that wraps {@link CngxCommandPanel}. Maps the
 * consumer's `CngxAsyncState<CommandGroup[]>` through `resolveAsyncView()` to
 * the six-state enum and renders the matching state: `skeleton` on first load,
 * `empty` on an empty success, `error` on a first-load failure, and the
 * projected panel for `content` / `content+error` / `none`. `content+error`
 * keeps the stale results visible while a re-query on the next keystroke errors.
 *
 * Each state resolves its slot template (instance > config > built-in default),
 * passed down from the palette. With no `[results]` bound (static registry
 * only) the view is always `content`, so the panel renders unconditionally.
 */
@Component({
  selector: 'cngx-command-panel-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
  template: `
    @switch (view()) {
      @case ('skeleton') {
        @if (loadingTpl(); as tpl) {
          <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{}" />
        } @else {
          <div class="cngx-command-state" aria-busy="true">{{ config.loadingLabel }}</div>
        }
      }
      @case ('empty') {
        @if (emptyTpl(); as tpl) {
          <ng-container [ngTemplateOutlet]="tpl" [ngTemplateOutletContext]="{ term: term() }" />
        } @else {
          <div class="cngx-command-state cngx-command-state--empty">{{ config.emptyLabel }}</div>
        }
      }
      @case ('error') {
        @if (errorTpl(); as tpl) {
          <ng-container
            [ngTemplateOutlet]="tpl"
            [ngTemplateOutletContext]="{ error: errorValue(), retry: emitRetry }"
          />
        } @else {
          <div class="cngx-command-state cngx-command-state--error" role="alert">
            <span>{{ config.errorLabel }}</span>
            <button type="button" class="cngx-command-retry" (click)="retry.emit()">
              {{ config.retryLabel }}
            </button>
          </div>
        }
      }
      @default {
        @if (view() === 'content+error') {
          <div class="cngx-command-state--error-banner" role="alert">{{ config.errorLabel }}</div>
        }
        <ng-content />
      }
    }
  `,
})
export class CngxCommandPanelShell {
  /** Consumer-derived async result state driving the view switch. */
  readonly results = input<CngxAsyncState<CommandGroup[]> | undefined>(undefined);

  /** Current term, mirrored from the panel - the empty slot's context. */
  readonly term = input<string>('');

  /** Resolved slot templates (instance > config > null). Built-in default when null. */
  readonly emptyTpl = input<TemplateRef<CngxCommandPaletteEmptyContext> | null>(null);
  readonly loadingTpl = input<TemplateRef<CngxCommandPaletteLoadingContext> | null>(null);
  readonly errorTpl = input<TemplateRef<CngxCommandPaletteErrorContext> | null>(null);

  /** Fired when the user clicks Retry in the error state. */
  readonly retry = output<void>();

  protected readonly config = injectCommandPaletteConfig();

  /** The resolved view. `content` when no async source is bound. */
  protected readonly view = computed<AsyncView>(() => {
    const state = this.results();
    if (!state) {
      return 'content';
    }
    return resolveAsyncView(state.status(), state.isFirstLoad(), state.isEmpty());
  });

  protected readonly errorValue = computed<unknown>(() => this.results()?.error());

  /** Stable bound callback for the error slot's `retry`. */
  protected readonly emitRetry = (): void => this.retry.emit();
}
