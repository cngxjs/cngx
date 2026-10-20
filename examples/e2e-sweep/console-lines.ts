import type { ConsoleAllowRow, ConsoleLineType } from './console-allowlist';

// The console line rules shared by both watchers: the route sweep
// (console-sweep.sweep-spec.ts) and the feature e2e guard (e2e/_test.ts).

export interface ConsoleLine {
  readonly type: ConsoleLineType;
  readonly text: string;
}

const CONSOLE_TYPES: ReadonlySet<string> = new Set<ConsoleLineType>(['warning', 'error', 'assert']);

export const isWatchedConsoleType = (type: string): type is ConsoleLineType =>
  CONSOLE_TYPES.has(type);

export const formatConsoleLine = (line: ConsoleLine) => `[${line.type}] ${line.text}`;

export const matchesAllowRow = (line: ConsoleLine, row: ConsoleAllowRow) =>
  line.type === row.type && line.text.startsWith(row.startsWith);

/**
 * First line only, without the trailing `Find more at <url>` and whatever
 * context arguments follow it (`JSHandle@node` for a logged element).
 */
export function normaliseConsoleText(text: string): string {
  const firstLine = text.split('\n', 1)[0] ?? '';
  return firstLine.replace(/\s*Find more at \S+.*$/, '').trim();
}

/**
 * Route path of an examples app URL in `ROUTES_META` form (no leading slash).
 * Router-synced demos write query params or a fragment after the route path
 * (`#/<route>?step=2`); only the path names the route.
 */
export function routeOfUrl(url: string): string {
  const path = new URL(url).hash.slice(1).split(/[?#]/, 1)[0] ?? '';
  return path.replace(/^\/+/, '');
}
