/**
 * @module @cngx/ui/mat-paginator
 *
 * Material instrumentation for `<mat-paginator>`: the `[cngxMatPaginator]` bridge
 * `CngxMatPaginator` adopts an existing `<mat-paginator>` in place, letting the
 * signal-native `CngxPaginate` brain drive its state with no DOM rewrite. It adds
 * `[resetOn]` (reset to first on upstream change) and `[announce]` (live-region
 * page announcements).
 *
 * The brain-level `CngxPaginateResetOn` / `CngxPaginateRouting` companion
 * directives (deep-link / reset for any `cngxPaginate` host) live in
 * `@cngx/common/data`; they are re-exported here for discoverability alongside
 * the bridge.
 */
export {
  CngxMatPaginator,
  type CngxMatPaginatorAnnounceContext,
} from './mat-paginator-bridge.directive';
export { CngxPaginateResetOn, CngxPaginateRouting } from '@cngx/common/data';
