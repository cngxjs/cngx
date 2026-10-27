import { inject, InjectionToken, type ModelSignal, type Signal } from '@angular/core';
import { CngxRuntimeError } from '@cngx/utils';

import type { CngxListbox } from '@cngx/common/interactive';

/**
 * Pull-based contract for a select-shell host so a projected
 * `<cngx-select-search>` reads and writes the search term and
 * forwards navigation keys into the listbox AD without ancestor
 * injection of the concrete shell class.
 *
 *   - `searchTerm` - `ModelSignal<string>`. Empty disables the filter.
 *   - `listboxRef` - read-only signal to the listbox; used by the
 *     search element to forward `ArrowUp/Down`, `Enter`, `Home`,
 *     `End`, `Escape` while focus stays in the input.
 *   - `close()` - closes panel and returns focus to the trigger
 *     (Escape path).
 */
export interface CngxSelectShellSearchHost {
  readonly searchTerm: ModelSignal<string>;
  readonly listboxRef: Signal<CngxListbox | undefined>;
  close(): void;
  focus(): void;
  /**
   * Make `element` the initial focus of the host's mobile sheet. Returns the
   * release. Optional: hosts without a sheet omit it.
   */
  registerInitialFocus?(element: HTMLElement): () => void;
}

/**
 * DI token a `CngxSelectShell` (or any pin-compatible host) provides
 * on itself. `CngxSelectSearch` injects this to stay decoupled from
 * the concrete shell class - same pattern as `CNGX_OPTION_FILTER_HOST`
 * / `CNGX_OPTION_STATUS_HOST`.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/select/declarative/select-search-host.ts
 * @since 0.1.0
 */
export const CNGX_SELECT_SHELL_SEARCH_HOST = new InjectionToken<CngxSelectShellSearchHost>(
  'CNGX_SELECT_SHELL_SEARCH_HOST',
);

/**
 * Inject the {@link CNGX_SELECT_SHELL_SEARCH_HOST} of the surrounding select
 * shell from `<cngx-select-search>`. Throws a `CngxRuntimeError` with code
 * `CNGX2018` when no shell is above it, in development and production alike.
 *
 * @internal
 */
export function injectSelectShellSearchHost(): CngxSelectShellSearchHost {
  const host = inject(CNGX_SELECT_SHELL_SEARCH_HOST, { optional: true });
  if (!host) {
    throw new CngxRuntimeError(
      'CNGX2018',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        '[cngx-select-search] must be placed inside <cngx-select-shell>.',
    );
  }
  return host;
}
