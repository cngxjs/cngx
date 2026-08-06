/**
 * @cngx/testing — Test utilities for the cngx component library.
 *
 * Not published to npm. Consumed directly from source via tsconfig paths.
 *
 * @module @cngx/testing
 */
// './geometry' is NOT re-exported here: its reads (getComputedStyle) return ''
// under jsdom, so it is reachable only through the '@cngx/testing/geometry'
// subpath, never the root barrel a jsdom spec imports.
export * from './helpers';
export * from './matchers';
export * from './mocks';
