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
  createShellRendererOptions,
  createSummary,
  errorMessage,
  planCodemods,
  planRenames,
  type ReleaseVersions,
  type RenameTable,
  resolveVersions,
  type StepResult,
  type SummaryHeadlines,
} from '../engine';
import { detectProject, type ProjectFacts } from '../ng-add/detect/detect';
import { type InstallManifestState, readInstallManifest, readManifestOf } from '../ng-add/shell/install-manifest';
import { presetDefaults } from '../ng-add/shell/questions';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  planManifestUpdate,
  recordedLibs,
  recordedStepIds,
} from '../ng-add/steps/manifest';
import { planManifestReruns, type WorkspaceReadme } from '../ng-add/steps/reruns';

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

const NOTHING: StepResult = { changes: [], skipped: [] };

/**
 * The re-run of every recorded project, each followed by the update of its
 * record. The first project that still resolves carries the workspace-wide
 * helper README, so it is planned once from the libs and steps of every
 * record. A recorded project gone from angular.json is named and its record
 * left as it is.
 */
async function planReruns(
  tree: Tree,
  stored: InstallManifestState,
  versions: ReleaseVersions,
  now: string,
): Promise<{ readonly reruns: StepResult; readonly records: StepResult }> {
  if (stored.state !== 'read') {
    const reason =
      stored.state === 'absent'
        ? `no ${INSTALL_MANIFEST_PATH} from ng add; only the renames and codemods ran`
        : `${INSTALL_MANIFEST_PATH} exists but cngx cannot read it; run ng add to record this install`;
    const id = stored.state === 'absent' ? 'manifest:missing' : 'manifest:unreadable';
    return { reruns: note(id, 'Re-run the recorded install steps', reason, versions.cngx), records: NOTHING };
  }
  const { manifest } = stored;
  const workspace = await readWorkspace(tree);
  let readme: WorkspaceReadme | undefined = { libs: recordedLibs(manifest), installed: recordedStepIds(manifest) };
  const reruns: StepResult[] = [];
  const records: StepResult[] = [];
  for (const [project, record] of Object.entries(manifest.projects)) {
    let facts: ProjectFacts;
    try {
      facts = detectProject(tree, workspace, project);
    } catch (error) {
      reruns.push(note('manifest:project', 'Re-run the recorded install steps', errorMessage(error), versions.cngx));
      continue;
    }
    const rerun = planManifestReruns(facts, record, versions, (preset) => presetDefaults(preset, facts), readme);
    readme = undefined;
    reruns.push(rerun);
    records.push(planManifestUpdate(project, record, versions, createChangePlan([rerun]), now));
  }
  return { reruns: createChangePlan(reruns), records: createChangePlan(records) };
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
    const stored = readInstallManifest(tree);
    const renames = planRenames(migration.renames, tree, provenance);
    const renamed = previewRenames(tree, renames);
    const { reruns, records } = await planReruns(renamed, stored, versions, new Date().toISOString());
    const plan = createChangePlan(
      [renames, planCodemods(migration.codemods, renamed, readManifestOf(stored)), reruns, records],
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
