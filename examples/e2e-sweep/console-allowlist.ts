/** The channels the sweep listens to; `pageerror` is an uncaught exception. */
export type ConsoleLineType = 'warning' | 'error' | 'assert' | 'pageerror';

/**
 * Console lines the two console watchers tolerate: the route sweep and the
 * feature e2e guard (`examples/e2e/_test.ts`). One row = one route + one
 * channel + the start of one normalised line (first line, `Find more at <url>`
 * dropped) + why it stays. A row never matches a line on another channel. The
 * guard matches against the route the page showed when the line fired.
 *
 * Capped at 3 rows across both watchers: a fourth needs a user decision, the
 * same budget as the examples-e2e quarantine. Only the sweep reports stale
 * rows, because only the sweep visits every route; a row that matches nothing
 * there fails it, so fixed findings leave the list in the same PR. A row kept
 * for an interaction-only line therefore needs the line on load too, or a
 * user decision.
 */
export interface ConsoleAllowRow {
  /** Route path as in `ROUTES_META`, e.g. `common/display/avatar/...`. */
  readonly route: string;
  /** Channel the line arrives on. */
  readonly type: ConsoleLineType;
  /** Non-empty prefix of the normalised console line. */
  readonly startsWith: string;
  /** Why the line is expected and not a defect. */
  readonly reason: string;
}

export const CONSOLE_ALLOWLIST_CAP = 3;

export const CONSOLE_ALLOWLIST: readonly ConsoleAllowRow[] = [];
