import { type Rule } from '@angular-devkit/schematics';

import { EMPTY_RENAME_TABLE } from '../../engine';
import { createMigration } from '../migration';

/**
 * The first migration, from any 0.1.0 release candidate. It renames
 * nothing: breaking changes before it stay documented in the
 * `core-concepts/*-migration.md` guides. From the manifest it re-checks the
 * theme once the cngx release moved and regenerates `.cngx/README.md` once
 * the `@cngx/mcp` release moved, then moves the manifest to 0.1.0.
 */
export function migrate(): Rule {
  return createMigration({ version: '0.1.0', renames: EMPTY_RENAME_TABLE, codemods: [], bundleDir: __dirname });
}
