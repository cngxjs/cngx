/**
 * @cngx/testing/geometry - assertion helpers for `*.geometry.spec.ts`, which
 * run in a real Chromium rather than jsdom. Browser-only reads over the CSSOM.
 *
 * @module @cngx/testing/geometry
 */
export {
  containerState,
  gridTracks,
  resolvedToken,
  type ContainerState,
  type GridAxis,
} from './geometry';
