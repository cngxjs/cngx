import { ROUTES_META, type RouteMeta } from '../src/app/_routes-meta';

/**
 * Route selection for the smoke matrices, derived from the generated
 * manifest instead of hand-maintained tables.
 *
 * `examples/src/app/_routes-meta.ts` is regenerated from
 * `examples/stories/**` before every serve and build
 * (`scripts/examples-gen/index.mjs`). Reading it here means a story rename
 * or a new story reaches the matrices for free: the old tables silently
 * 404'd to the home page instead, because `gotoDemo` only navigates and
 * never asserts the route resolved.
 *
 * The manifest is gitignored, so `npm run examples:generate` has to have run.
 * On a fresh clone the import fails loudly rather than yielding an empty list.
 */

/** One row of a smoke matrix: the story slug, its route, its generated title. */
export interface DemoRoute {
  /**
   * The route below the queried segments, e.g. `clearable` or
   * `action-select/async-error-rollback-observation`. Used as the test name,
   * so it has to be unique within a matrix: the trailing segment alone is not
   * (several select families ship an `async-error-rollback-observation`).
   */
  readonly name: string;
  /** Full route path, as passed to `gotoDemo`. */
  readonly path: string;
  /** Generated demo title, for failure messages. */
  readonly title: string;
}

function toDemoRoute(meta: RouteMeta, queried: readonly string[]): DemoRoute {
  return {
    name: meta.path.split('/').slice(queried.length).join('/'),
    path: meta.path,
    title: meta.title,
  };
}

function select(
  label: string,
  queried: readonly string[],
  match: (meta: RouteMeta) => boolean,
): readonly DemoRoute[] {
  const routes = ROUTES_META.filter(match).map((meta) => toDemoRoute(meta, queried));
  if (routes.length === 0) {
    // An empty matrix is the failure this helper exists to prevent: it walks
    // nothing and reports green. Fail at collection time instead.
    throw new Error(
      `${label} matched no route in ROUTES_META (${ROUTES_META.length} routes). ` +
        'The demo folder was renamed or removed — update the call, or run ' +
        'npm run examples:generate if the manifest is stale.',
    );
  }
  return routes;
}

/**
 * Routes whose demo folder is exactly `segments` — nested demo folders are
 * excluded. Use when a sibling spec already owns the nested routes, e.g.
 * `routesIn('common', 'popover')` leaves `common/popover/tooltip` to
 * `tooltip.e2e-spec.ts`.
 */
export function routesIn(...segments: string[]): readonly DemoRoute[] {
  return select(
    `routesIn(${segments.join(', ')})`,
    segments,
    (meta) =>
      meta.pathSegments.length === segments.length &&
      segments.every((segment, i) => meta.pathSegments[i] === segment),
  );
}

/**
 * Routes at or below `segments`, nested demo folders included. Use when the
 * matrix owns a whole family, e.g. `routesUnder('forms', 'input')` covers
 * `forms/input/mask`, `forms/input/otp` and the rest.
 */
export function routesUnder(...segments: string[]): readonly DemoRoute[] {
  return select(`routesUnder(${segments.join(', ')})`, segments, (meta) =>
    segments.every((segment, i) => meta.pathSegments[i] === segment),
  );
}
