/**
 * Sheriff architecture enforcement — single source of truth for the cngx
 * library dependency graph.
 *
 * Tag axes (every module carries the full set):
 *   level:N     0..4   ordinal level in the dependency hierarchy
 *   lib:X       utils|core|common|forms|data-display|ui|testing|dev-app|e2e
 *   entry:Y     name of the secondary entry (or 'src' for the primary)
 *   scope:Z     lib | app | test
 *   grant:*     ad-hoc allow tokens (currently only `grant:material` on the
 *               data-display/mat-treetable secondary entry)
 *
 * The dependency direction is enforced via per-lib rules — peers at the same
 * level (forms <-> data-display) are forbidden,
 * ("a lib may only import from a **lower** level"). Level/entry/scope tags
 * are kept for diagnostics (they appear in violation messages) and resolved
 * with `anyTag` so the lib rule is the single decision point.
 *
 * External-package constraints (utils ↛ @angular/*, common ↛ @angular/material,
 * etc.) are enforced by `no-restricted-imports` in eslint.config.js — Sheriff
 * 0.19 filters externals before the dep-rule check runs and so cannot express
 * them. Adding a new constraint touches both files; the comment in each names
 * the other.
 *
 * Adding a new library:
 *   1. Add a row to `LIB_LEVELS` and a `modules` entry below.
 *   2. Add a `lib:<name>` rule to `depRules` enumerating the libs it may import.
 *   3. Update existing `lib:*` rules if any pre-existing lib should depend on it.
 *   4. Run `npm run lint` to verify.
 */

import { anyTag, type SheriffConfig } from '@softarc/sheriff-core';

export const config: SheriffConfig = {
  autoTagging: true,
  barrelFileName: 'public-api.ts',
  enableBarrelLess: true,
  encapsulationPattern: 'internal',
  excludeRoot: true,

  modules: {
    'projects/utils/<entry>': ({ entry }) => [
      'lib:utils',
      'level:0',
      `entry:${entry}`,
      'scope:lib',
    ],
    'projects/core/<entry>': ({ entry }) => [
      'lib:core',
      'level:1',
      `entry:${entry}`,
      'scope:lib',
    ],
    'projects/common/<entry>': ({ entry }) => [
      'lib:common',
      'level:2',
      `entry:${entry}`,
      'scope:lib',
    ],
    // Specific-before-generic so the field-testing barrel wins over the
    // forms/<entry> matcher at the field/src/testing depth.
    'projects/forms/field/src/testing': [
      'lib:forms',
      'level:3',
      'entry:field-testing',
      'scope:test',
    ],
    'projects/forms/<entry>': ({ entry }) => [
      'lib:forms',
      'level:3',
      `entry:${entry}`,
      'scope:lib',
    ],
    // mat-treetable carries grant:material to mark its Material exception
    // (the actual ban on @angular/material lives in eslint.config.js).
    'projects/data-display/mat-treetable': [
      'lib:data-display',
      'level:3',
      'entry:mat-treetable',
      'scope:lib',
      'grant:material',
    ],
    'projects/data-display/<entry>': ({ entry }) => [
      'lib:data-display',
      'level:3',
      `entry:${entry}`,
      'scope:lib',
    ],
    'projects/ui/<entry>': ({ entry }) => [
      'lib:ui',
      'level:4',
      `entry:${entry}`,
      'scope:lib',
    ],
    'projects/testing': ['lib:testing', 'level:0', 'scope:test'],
    'dev-app': ['lib:dev-app', 'scope:app'],
    'e2e': ['lib:e2e', 'scope:test'],
  },

  depRules: {
    // Per-lib import allow-lists. Each lib lists every lib it may import
    // from (including itself). Peers at the same level must NOT appear in
    // each other's lists. Add a new lib by inserting a row here and
    // updating the lists of higher-level libs that should consume it.
    'lib:utils':        ['lib:utils'],
    'lib:core':         ['lib:utils', 'lib:core'],
    'lib:common':       ['lib:utils', 'lib:core', 'lib:common'],
    'lib:forms':        ['lib:utils', 'lib:core', 'lib:common', 'lib:forms'],
    'lib:data-display': ['lib:utils', 'lib:core', 'lib:common', 'lib:data-display'],
    'lib:ui':           ['lib:utils', 'lib:core', 'lib:common', 'lib:forms', 'lib:data-display', 'lib:ui'],

    // Tooling / fixtures / demos can pull from any lib.
    'lib:testing':      anyTag,
    'lib:dev-app':      anyTag,
    'lib:e2e':          anyTag,

    // Diagnostic axes — every from-tag must be matched by some rule, so the
    // remaining axes get an explicit anyTag pass.
    'level:*':          anyTag,
    'entry:*':          anyTag,
    'scope:*':          anyTag,
    'grant:*':          anyTag,

    // A barrel module that isn't matched by any `modules` pattern lands
    // here. An empty list rejects all imports, so a stray public-api.ts
    // surfaces immediately as a Sheriff violation rather than slipping
    // through.
    'noTag':            [],
  },
};
