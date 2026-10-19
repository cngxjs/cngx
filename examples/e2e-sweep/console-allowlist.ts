/** The channels the sweep listens to; `pageerror` is an uncaught exception. */
export type ConsoleLineType = 'warning' | 'error' | 'assert' | 'pageerror';

/**
 * Console lines the sweep tolerates. One row = one route + one channel + the
 * start of one normalised line (first line, `Find more at <url>` dropped) +
 * why it stays. A row never matches a line on another channel.
 *
 * Capped at 3 rows: a fourth needs a user decision, the same budget as the
 * examples-e2e quarantine. A row that matches nothing on its route fails the
 * sweep as stale, so fixed findings leave the list in the same PR.
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
