// The one list of cngx packages the scripts build, guard, pack and publish.
// Kept free of imports, so a script reads it without loading a compiler.

/** The libs published from `projects/<lib>`, in build order; `@cngx/themes` is not among them. */
export const PUBLISHED_LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];

/** Every package a release builds, packs and publishes: the libs plus `@cngx/themes`. */
export const PACKED_LIBS = [...PUBLISHED_LIBS, 'themes'];
