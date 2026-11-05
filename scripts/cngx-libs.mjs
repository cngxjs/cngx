// The one list of cngx packages the scripts build, guard, pack and publish.
// Kept free of imports, so a script reads it without loading a compiler.
// Libs-only consumers (pack-libs, the ng-packagr builds, assertWholeGroup)
// read PACKED_LIBS; only the release run reads LOCKSTEP_PACKAGES.

/** The libs published from `projects/<lib>`, in build order; `@cngx/themes` is not among them. */
export const PUBLISHED_LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'];

/** Every package a release builds, packs and publishes: the libs plus `@cngx/themes`. */
export const PACKED_LIBS = [...PUBLISHED_LIBS, 'themes'];

/**
 * The tooling packages published from `packages/<name>` at the libs' version, in publish order:
 * `@cngx/core` pins `@cngx/mcp`, so mcp goes first. Built by `tsc`, not ng-packagr.
 */
export const TOOLING_PACKAGES = ['mcp', 'cli'];

/** Every package one `publish:*` run releases at one version. */
export const LOCKSTEP_PACKAGES = [...PACKED_LIBS, ...TOOLING_PACKAGES];
