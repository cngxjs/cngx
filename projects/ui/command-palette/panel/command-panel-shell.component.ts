import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import type { CommandGroup } from '@cngx/common/command';
import { resolveAsyncView, type AsyncView } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CNGX_COMMAND_PALETTE_DEFAULTS } from './command-palette-defaults';

/**
 * @internal
 * Async-state view switch that wraps {@link CngxCommandPanel}. Maps the
 * consumer's `CngxAsyncState<CommandGroup[]>` through `resolveAsyncView()` to
 * the six-state enum and renders the matching state: `skeleton` on first load,
 * `empty` on an empty success, `error` on a first-load failure, and the
 * projected panel for `content` / `content+error` / `none`. `content+error`
 * keeps the stale results visible while a re-query on the next keystroke errors.
 *
 * With no `[results]` bound (static registry only) the view is always
 * `content`, so the panel renders unconditionally.
 */
@Component({
  selector: 'cngx-command-panel-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    @switch (view()) {
      @case ('skeleton') {
        <div class="cngx-command-state" aria-busy="true">{{ defaults.loadingLabel }}</div>
      }
      @case ('empty') {
        <div class="cngx-command-state cngx-command-state--empty">{{ defaults.emptyLabel }}</div>
      }
      @case ('error') {
        <div class="cngx-command-state cngx-command-state--error" role="alert">
          <span>{{ defaults.errorLabel }}</span>
          <button type="button" class="cngx-command-retry" (click)="retry.emit()">
            {{ defaults.retryLabel }}
          </button>
        </div>
      }
      @default {
        @if (view() === 'content+error') {
          <div class="cngx-command-state--error-banner" role="alert">{{ defaults.errorLabel }}</div>
        }
        <ng-content />
      }
    }
  `,
})
export class CngxCommandPanelShell {
  /** Consumer-derived async result state driving the view switch. */
  readonly results = input<CngxAsyncState<CommandGroup[]> | undefined>(undefined);

  /** Fired when the user clicks Retry in the error state. */
  readonly retry = output<void>();

  protected readonly defaults = CNGX_COMMAND_PALETTE_DEFAULTS;

  /** The resolved view. `content` when no async source is bound. */
  protected readonly view = computed<AsyncView>(() => {
    const state = this.results();
    if (!state) {
      return 'content';
    }
    return resolveAsyncView(state.status(), state.isFirstLoad(), state.isEmpty());
  });
}
