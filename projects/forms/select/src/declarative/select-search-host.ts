import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';

/**
 * Pull-based contract for a select-shell host so a projected
 * `<cngx-select-search>` reads and writes the search term and
 * forwards navigation keys into the listbox AD without ancestor
 * injection of the concrete shell class.
 *
 *   - `searchTerm` — `ModelSignal<string>`. Empty disables the filter.
 *   - `listboxRef` — read-only signal to the listbox; used by the
 *     search element to forward `ArrowUp/Down`, `Enter`, `Home`,
 *     `End`, `Escape` while focus stays in the input.
 *   - `close()` — closes panel and returns focus to the trigger
 *     (Escape path).
 *
 * @category interactive
 */
export interface CngxSelectShellSearchHost {
  readonly searchTerm: ModelSignal<string>;
  readonly listboxRef: Signal<CngxListbox | undefined>;
  close(): void;
  focus(): void;
}

/**
 * DI token a `CngxSelectShell` (or any pin-compatible host) provides
 * on itself. `CngxSelectSearch` injects this to stay decoupled from
 * the concrete shell class — same pattern as `CNGX_OPTION_FILTER_HOST`
 * / `CNGX_OPTION_STATUS_HOST`.
 *
 * @category interactive
 */
export const CNGX_SELECT_SHELL_SEARCH_HOST =
  new InjectionToken<CngxSelectShellSearchHost>('CNGX_SELECT_SHELL_SEARCH_HOST');
