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
  type NgAddPreset,
  type ReleaseVersions,
  type RenameTable,
  resolveVersions,
  type StepResult,
  type SummaryHeadlines,
} from '../engine';
import { detectProject, type ProjectFacts } from '../ng-add/detect/detect';
import { type InstallManifestState, readInstallManifest, manifestOf } from '../ng-add/shell/install-manifest';
import { presetDefaults } from '../ng-add/shell/questions';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  planManifestUpdate,
  type ProjectRecord,
  recordedLibs,
  recordedStepIds,
} from '../ng-add/steps/manifest';
import {
  ngAddCommand,
  planManifestReruns,
  type PresetDefaults,
  readRecordedAnswers,
  type WorkspaceReadme,
} from '../ng-add/steps/reruns';

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

// Only a record that reaches the README re-run may carry it: one whose
// answers this release cannot read, or whose MCP pin did not move, would
// otherwise use it up and leave every later record without it.
function carriesReadme(record: ProjectRecord, defaultsFor: PresetDefaults, versions: ReleaseVersions): boolean {
  return record.mcpVersion !== versions.mcp && readRecordedAnswers(record, defaultsFor) !== undefined;
}

/**
 * The re-run of every recorded project, each followed by the update of its
 * record. The first project that re-runs the helper README carries it, so
 * the workspace-wide README is planned once from the libs and steps of
 * every record. A recorded project gone from angular.json is named and its
 * record left as it is.
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
        : `${INSTALL_MANIFEST_PATH} exists but cngx cannot read it and leaves it as it is; ${ngAddCommand('<name>')} keeps it as a copy and starts a new install record`;
    // Not `manifest:unreadable`: that id is the copy ng add plans.
    const id = stored.state === 'absent' ? 'manifest:missing' : 'manifest:unreadable-note';
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
      const reason = `${errorMessage(error)} Its record in ${INSTALL_MANIFEST_PATH} is kept as it is.`;
      reruns.push(note('manifest:project', `Re-run the recorded install steps for ${project}`, reason, versions.cngx));
      continue;
    }
    const defaultsFor = (preset: NgAddPreset) => presetDefaults(preset, facts);
    const carrier = readme !== undefined && carriesReadme(record, defaultsFor, versions) ? readme : undefined;
    const rerun = planManifestReruns(facts, record, versions, defaultsFor, carrier);
    if (carrier !== undefined) {
      readme = undefined;
    }
    reruns.push(rerun);
    records.push(planManifestUpdate(project, versions, createChangePlan([rerun]), record, now));
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
      [renames, planCodemods(migration.codemods, renamed, manifestOf(stored)), reruns, records],
      warning === undefined ? [] : [warning],
    );

    const renderer = createRenderer(
      createShellRendererOptions(process.env, process.stdout, context.logger, false),
    );

    const release = entryVersion(context) ?? versions.cngx;
    context.logger.info(`cngx ${release} migration`);
    await renderer.todo(plan);
    const unchanged = new Set<string>();
    return chain([
      applyChangePlan(plan, (id) => unchanged.add(id)),
      () => renderer.summary(createSummary(createReport(plan, unchanged), true, headlines(release))),
    ]);
  };
}
