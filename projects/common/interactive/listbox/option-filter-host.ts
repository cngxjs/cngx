import { InjectionToken, type Signal } from '@angular/core';

import type { CngxOption } from './option.directive';

/**
 * Pull-based contract a parent host (e.g. `CngxSelectShell` with a search
 * input, future filter-driven hosts) implements so individual `CngxOption`
 * instances can compute their own `hidden` visibility from a host-owned
 * `searchTerm` signal and a host-owned `matches` policy.
 *
 * Splitting policy from visibility keeps the option agnostic about HOW
 * filtering decides - substring, fuzzy, server-driven - and gives the
 * host a single point of control. Empty search term ALWAYS resolves to
 * "show everything"; the option short-circuits before calling `matches`.
 *
 * @category common/interactive/listbox
 */
export interface CngxOptionFilterHost {
  /** Current search term. Empty string means "no filter active". */
  readonly searchTerm: Signal<string>;
  /**
   * Decides whether the option is a match for the active term. Receives the
   * option's value, its resolved plain-text label, the current term, and the
   * calling `CngxOption` instance. The option is a stable identity across
   * filter runs, so a host can key per-option caches (a folded label, a
   * stable `{ value, label }` record) on it; a host that only needs value and
   * label leaves the parameter out.
   */
  matches<T>(value: T, label: string, term: string, option?: CngxOption): boolean;
}

/**
 * DI token a host provides on itself when it wants to drive per-option
 * `hidden` visibility through a reactive search term and a `matches`
 * policy.
 *
 * `CngxOption` injects this token with `{ optional: true }` - standalone
 * use (no host provides the token) leaves every option visible at all
 * times with no DOM cost.
 *
 * @category common/interactive/listbox
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/listbox/option-filter-host.ts
 * @since 0.1.0
 */
export const CNGX_OPTION_FILTER_HOST = new InjectionToken<CngxOptionFilterHost>(
  'CNGX_OPTION_FILTER_HOST',
);
