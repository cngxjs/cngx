import { InjectionToken, type ModelSignal, type Signal } from '@angular/core';

import type { CngxListbox } from '@cngx/common/interactive';

/**
 * Pull-based contract a select-shell host implements so a declaratively-
 * projected `<cngx-select-search>` can read and write the host's search
 * term AND forward navigation keys into the listbox AD without ancestor
 * injection of the concrete shell class.
 *
 * Members are intentionally narrow:
 * - `searchTerm` — `ModelSignal<string>` so the search element's input
 *   binding can write through. Empty string disables the filter.
 * - `listboxRef` — read-only signal to the rendered listbox instance,
 *   used by the search element to forward `ArrowUp` / `ArrowDown` /
 *   `Enter` / `Home` / `End` / `Escape` while the user keeps focus in
 *   the search input.
 * - `close()` — closes the panel and returns focus to the trigger,
 *   used on `Escape`.
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
 * DI token a `CngxSelectShell` (or any pin-compatible host) provides on
 * itself. `CngxSelectSearch` injects this token to keep the declarative
 * search element decoupled from the concrete shell class — same shape
 * as `CNGX_OPTION_FILTER_HOST` and `CNGX_OPTION_STATUS_HOST`.
 *
 * @category interactive
 */
export const CNGX_SELECT_SHELL_SEARCH_HOST =
  new InjectionToken<CngxSelectShellSearchHost>('CNGX_SELECT_SHELL_SEARCH_HOST');
