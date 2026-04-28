import { InjectionToken, type Signal } from '@angular/core';

/**
 * Pull-based contract a parent host (e.g. `CngxSelectShell`) implements
 * so individual `CngxOption` instances can resolve their highlight state
 * and route click + hover activations when the option's own
 * `inject(CngxActiveDescendant)` returns null.
 *
 * The need arises with content-projected options: at construction time,
 * the option's element-injector chain anchors in the consumer's
 * authoring view — which has no surrounding `CngxActiveDescendant`. The
 * shell that owns the listbox + AD provides this token via `useExisting`,
 * and projected options consult it as a fallback.
 *
 * Splitting the contract into a narrow surface (`activeId` /
 * `activate` / `highlight`) keeps the option agnostic about HOW the
 * host wires its AD — the shell forwards to its inner listbox's AD,
 * a hypothetical custom host could route through telemetry / multi-AD
 * coordination / etc. without changing the option directive.
 *
 * @category interactive
 */
export interface CngxOptionInteractionHost {
  /**
   * Currently active option id, or `null` when no option is
   * highlighted. The option compares against its own `id` to drive the
   * `cngx-option--highlighted` host class.
   */
  readonly activeId: Signal<string | null>;
  /**
   * Activate (commit / select) the option carrying the given value.
   * Called from the option's click handler when its own AD inject is
   * null. The host typically routes through its listbox's
   * `highlightByValue(value); activateCurrent()` pair.
   */
  activate(value: unknown): void;
  /**
   * Move the highlight to the option carrying the given value.
   * Called from the option's pointerenter handler. The host typically
   * routes through its listbox's `highlightByValue(value)`.
   */
  highlight(value: unknown): void;
}

/**
 * DI token a host provides on itself when content-projected
 * `CngxOption` instances need a fallback path to highlight + activate
 * + hover behaviour. Mirrors the four other shell-host tokens
 * (`CNGX_OPTION_CONTAINER`, `CNGX_OPTION_STATUS_HOST`,
 * `CNGX_OPTION_FILTER_HOST`, `CNGX_SELECT_SHELL_SEARCH_HOST`).
 *
 * `CngxOption` injects this token with `{ optional: true }` —
 * standalone use (no host provides the token) leaves option behaviour
 * unchanged because the option's own AD inject takes precedence when
 * available.
 *
 * @category interactive
 */
export const CNGX_OPTION_INTERACTION_HOST =
  new InjectionToken<CngxOptionInteractionHost>('CNGX_OPTION_INTERACTION_HOST');
