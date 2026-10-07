import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  untracked,
  ViewEncapsulation,
  type TemplateRef,
} from '@angular/core';

import type { CngxCommandGroup } from '@cngx/common/command';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import {
  injectCommandPaletteConfig,
  resolveCommandPaletteCopy,
} from '../config/command-palette-config';
import type {
  CngxCommandPaletteErrorContext,
  CngxCommandPaletteLoadingContext,
} from '../slots/command-slots';

/**
 * @internal
 * Async-state view switch that wraps {@link CngxCommandPanel}. Maps the
 * consumer's `CngxAsyncState<CngxCommandGroup[]>` through `resolveAsyncView()` to
 * the six-state enum and renders the matching state: `skeleton` on first load,
 * `error` on a first-load failure, and the projected panel for everything
 * else. `content+error` keeps the stale results visible while a re-query on
 * the next keystroke errors. An empty success maps to `content` too: the
 * search input must stay mounted (the user keeps typing to refine the term),
 * so the panel itself renders the empty slot keyed on its own result count.
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
          <div class="cngx-command-state" aria-busy="true">{{ copy().loadingLabel }}</div>
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
            <span>{{ errorText() }}</span>
            <button type="button" class="cngx-command-retry" (click)="retry.emit()">
              {{ retryText() }}
            </button>
          </div>
        }
      }
      @default {
        @if (view() === 'content+error') {
          <div class="cngx-command-state--error-banner" role="alert">{{ errorText() }}</div>
        }
        <ng-content />
      }
    }
  `,
})
export class CngxCommandPanelShell {
  /** Consumer-derived async result state driving the view switch. */
  readonly results = input<CngxAsyncState<CngxCommandGroup[]> | undefined>(undefined);

  /** Resolved slot templates (instance > config > null). Built-in default when null. */
  readonly loadingTpl = input<TemplateRef<CngxCommandPaletteLoadingContext> | null>(null);
  readonly errorTpl = input<TemplateRef<CngxCommandPaletteErrorContext> | null>(null);

  /** Fired when the user clicks Retry in the error state. */
  readonly retry = output<void>();

  protected readonly copy = resolveCommandPaletteCopy(injectCommandPaletteConfig());

  /** The resolved view. `content` when no async source is bound. */
  protected readonly view = computed<AsyncView>(() => {
    const state = this.results();
    if (!state) {
      return 'content';
    }
    const view = resolveAsyncView(state.status(), state.isFirstLoad(), state.isEmpty());
    // An empty success keeps the panel (and its search input) mounted; the
    // panel renders the empty slot off its own result count instead.
    return view === 'empty' ? 'content' : view;
  });

  protected readonly errorValue = computed<unknown>(() => this.results()?.error());

  /**
   * @internal - copy of the `role="alert"` error regions, keyed on the view. Read
   * untracked, so a language switch never re-speaks a shown error; the next error
   * speaks the new language.
   */
  protected readonly errorText = computed<string>(() => {
    this.view();
    return untracked(() => this.copy().errorLabel);
  });

  /** @internal - retry-button copy inside the error region, keyed like {@link errorText}. */
  protected readonly retryText = computed<string>(() => {
    this.view();
    return untracked(() => this.copy().retryLabel);
  });

  /** Stable bound callback for the error slot's `retry`. */
  protected readonly emitRetry = (): void => this.retry.emit();
}
