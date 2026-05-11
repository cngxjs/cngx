import { InjectionToken, type Signal } from '@angular/core';

/**
 * Pull-based contract a parent host (e.g. `CngxSelectShell` with a search
 * input, future filter-driven hosts) implements so individual `CngxOption`
 * instances can compute their own `hidden` visibility from a host-owned
 * `searchTerm` signal and a host-owned `matches` policy.
 *
 * Splitting policy from visibility keeps the option agnostic about HOW
 * filtering decides — substring, fuzzy, server-driven — and gives the
 * host a single point of control. Empty search term ALWAYS resolves to
 * "show everything"; the option short-circuits before calling `matches`.
 *
 * @category interactive
 */
export interface CngxOptionFilterHost {
  /** Current search term. Empty string means "no filter active". */
  readonly searchTerm: Signal<string>;
  /**
   * Decides whether the option is a match for the active term. Receives the
   * option's value, its resolved plain-text label, and the current term.
   */
  matches<T>(value: T, label: string, term: string): boolean;
}

/**
 * DI token a host provides on itself when it wants to drive per-option
 * `hidden` visibility through a reactive search term and a `matches`
 * policy.
 *
 * `CngxOption` injects this token with `{ optional: true }` — standalone
 * use (no host provides the token) leaves every option visible at all
 * times with no DOM cost.
 *
 * @category interactive
 */
export const CNGX_OPTION_FILTER_HOST = new InjectionToken<CngxOptionFilterHost>(
  'CNGX_OPTION_FILTER_HOST',
);
