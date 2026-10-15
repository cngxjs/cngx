import { join } from 'node:path';

import { chain, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { readWorkspace } from '@schematics/angular/utility';

import {
  applyChangePlan,
  type Codemod,
  createChangePlan,
  createNote,
  createProvenance,
  createRenderer,
  createReport,
  errorMessage,
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
import { createShellRendererOptions } from '../ng-add/shell/terminal';
import { createSummary, type SummaryHeadlines } from '../ng-add/steps/finish';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  planManifestUpdate,
} from '../ng-add/steps/manifest';
import { planManifestReruns } from '../ng-add/steps/reruns';

/** What one release migrates: renames as data, codemods for the rest. */
export interface Migration {
  readonly renames: RenameTable;
  readonly codemods: readonly Codemod<InstallManifest | undefined>[];
  /** `__dirname` of the migration entry, `schematics/migrations/<version>`. */
  readonly bundleDir: string;
}

function note(id: string, label: string, reason: string, version: string): StepResult {
  return {
    changes: [
      createNote({ id, label, reason, provenance: createProvenance('ng-update', version) }),
    ],
    skipped: [],
  };
}

// Each migration of a multi-release update prints its own summary, so the
// headline names the release; a later entry finding nothing is not misread
// as the whole update having changed nothing.
function headlines(version: string): SummaryHeadlines {
  return {
    changed: (changes) => `cngx ${version} migration planned ${changes}.`,
    unchanged: `cngx ${version} migration found nothing to change.`,
  };
}

// The release names come from the collection entry that ran: the CLI hands
// every schematic its entry, `version` included. A run outside a collection
// falls back to the release the bundle ships.
function entryVersion(context: SchematicContext): string | undefined {
  const { description } = context.schematic;
  return 'version' in description && typeof description.version === 'string'
    ? description.version
    : undefined;
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
 * printed before it is applied and summarised after, through the renderer
 * `ng add` uses, so nothing changes unannounced; the manifest records only
 * the install steps, not the renames.
 */
export function createMigration(migration: Migration): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    // The entry sits one folder below `schematics/`, where versions.json lives.
    const { versions, warning } = resolveVersions(join(migration.bundleDir, '..'));
    const provenance = createProvenance('ng-update', versions.cngx);
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

    const renderer = createRenderer(
      createShellRendererOptions(process.env, process.stdout, context.logger, false),
    );

    const release = entryVersion(context) ?? versions.cngx;
    context.logger.info(`cngx ${release} migration`);
    await renderer.todo(plan);
    return chain([
      applyChangePlan(plan),
      () => renderer.summary(createSummary(createReport(plan), true, headlines(release))),
    ]);
  };
}
