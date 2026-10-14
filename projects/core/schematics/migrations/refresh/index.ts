import { type Rule } from '@angular-devkit/schematics';

import { EMPTY_RENAME_TABLE } from '../../engine';
import { createMigration } from '../migration';

/**
 * The migration of every release that ships none of its own. `publish.mjs`
 * keys one `migration-v<release>-refresh` entry to this factory in the
 * published collection, so every `ng update` re-checks the install steps
 * the manifest records and moves the manifest to the installed release.
 */
export function migrate(): Rule {
  return createMigration({ renames: EMPTY_RENAME_TABLE, codemods: [], bundleDir: __dirname });
}
