import { join } from 'node:path';

import { chain, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';

import {
  applyChangePlan,
  applyRenameTable,
  type Codemod,
  createChangePlan,
  describeChangePlan,
  planCodemods,
  type ReleaseVersions,
  type RenameTable,
  resolveVersions,
  type StepResult,
} from '../engine';
import { detectProject } from '../ng-add/detect/detect';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  planManifestReruns,
  readManifest,
  updateManifest,
} from '../ng-add/steps/manifest';

/** What one release migrates: renames as data, codemods for the rest. */
export interface Migration {
  /** The release this migration brings an app to. */
  readonly version: string;
  readonly renames: RenameTable;
  readonly codemods: readonly Codemod<InstallManifest | undefined>[];
  /** `__dirname` of the migration entry, `schematics/migrations/<version>`. */
  readonly bundleDir: string;
}

function note(id: string, label: string, reason: string, version: string): StepResult {
  return { changes: [{ kind: 'note', id, label, reason, provenance: { source: 'ng-update', version } }], skipped: [] };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function planReruns(
  tree: Tree,
  manifest: InstallManifest | undefined,
  versions: ReleaseVersions,
): Promise<StepResult> {
  if (manifest === undefined) {
    return note(
      'manifest:missing',
      'Re-run the recorded install steps',
      `no ${INSTALL_MANIFEST_PATH} from ng add; only the renames and codemods ran`,
      versions.cngx,
    );
  }
  const project = manifest.facts['project'];
  try {
    const facts = detectProject(tree, await readWorkspace(tree), typeof project === 'string' ? project : undefined);
    return planManifestReruns(facts, manifest, versions);
  } catch (error) {
    return note('manifest:project', 'Re-run the recorded install steps', errorMessage(error), versions.cngx);
  }
}

/**
 * One `ng update` migration: rename what the table names across the
 * workspace, plan the codemods, re-run the install steps the manifest
 * records, and record the new release in it. The plan is printed before it
 * is applied, so nothing changes unannounced.
 */
export function createMigration(migration: Migration): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    // The entry sits one folder below `schematics/`, where versions.json lives.
    const { versions, warning } = resolveVersions(join(migration.bundleDir, '..'));
    const manifest = readManifest(tree);
    const steps = createChangePlan(
      [planCodemods(migration.codemods, tree, manifest), await planReruns(tree, manifest, versions)],
      warning === undefined ? [] : [warning],
    );
    const record =
      manifest === undefined ? { changes: [], skipped: [] } : updateManifest(manifest, versions, steps, new Date().toISOString());
    const plan = createChangePlan([steps, record], steps.warnings);

    context.logger.info(`cngx ${migration.version} migration`);
    context.logger.info(describeChangePlan(plan));
    return chain([applyRenameTable(migration.renames), applyChangePlan(plan)]);
  };
}
