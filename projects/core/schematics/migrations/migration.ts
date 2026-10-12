import { join } from 'node:path';

import { type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';

import {
  applyChangePlan,
  type Codemod,
  createChangePlan,
  describeChangePlan,
  planCodemods,
  planRenames,
  type ReleaseVersions,
  type RenameTable,
  resolveVersions,
  type StepResult,
} from '../engine';
import { detectProject } from '../ng-add/detect/detect';
import { readInstallManifest } from '../ng-add/shell/install-manifest';
import { presetDefaults } from '../ng-add/shell/questions';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  planManifestUpdate,
} from '../ng-add/steps/manifest';
import { planManifestReruns } from '../ng-add/steps/reruns';

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
  return {
    changes: [{ kind: 'note', id, label, reason, provenance: { source: 'ng-update', version } }],
    skipped: [],
  };
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
    const facts = detectProject(
      tree,
      await readWorkspace(tree),
      typeof project === 'string' ? project : undefined,
    );
    return planManifestReruns(facts, manifest, versions, (preset) => presetDefaults(preset, facts));
  } catch (error) {
    return note(
      'manifest:project',
      'Re-run the recorded install steps',
      errorMessage(error),
      versions.cngx,
    );
  }
}

// The tree as it reads once the renames are applied, so codemods and
// re-runs plan against the new names. A branch: the real tree changes
// only when the plan is applied.
function previewRenames(tree: Tree, renames: StepResult): Tree {
  const preview = tree.branch();
  for (const change of renames.changes) {
    if (change.kind === 'edit-file') {
      preview.overwrite(change.path, change.edit(preview.readText(change.path)));
    }
  }
  return preview;
}

/**
 * One `ng update` migration: plan the renames across the workspace, plan
 * the codemods and the re-run of the install steps against the renamed
 * tree, and record the new release in the manifest. The whole plan is
 * printed before it is applied, so nothing changes unannounced; the
 * manifest records only the install steps, not the renames.
 */
export function createMigration(migration: Migration): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    // The entry sits one folder below `schematics/`, where versions.json lives.
    const { versions, warning } = resolveVersions(join(migration.bundleDir, '..'));
    const provenance = { source: 'ng-update', version: versions.cngx };
    const manifest = readInstallManifest(tree);
    const renames = planRenames(migration.renames, tree, provenance);
    const renamed = previewRenames(tree, renames);
    const reruns = await planReruns(renamed, manifest, versions);
    const record =
      manifest === undefined
        ? { changes: [], skipped: [] }
        : planManifestUpdate(
            manifest,
            versions,
            createChangePlan([reruns]),
            new Date().toISOString(),
          );
    const plan = createChangePlan(
      [renames, planCodemods(migration.codemods, renamed, manifest), reruns, record],
      warning === undefined ? [] : [warning],
    );

    context.logger.info(`cngx ${migration.version} migration`);
    context.logger.info(describeChangePlan(plan));
    return applyChangePlan(plan);
  };
}
