import { type Tree } from '../fs/tree';
import { mergeStepResults, type StepResult } from '../plan/change';

/**
 * A hand-written migration step for what a rename table cannot express: a
 * changed provider signature, a removed input with a replacement pattern.
 * It reads the tree the way detection does and plans changes; it never
 * writes, `applyChangePlan` does. `manifest` is the app's install record,
 * typed by the caller so the engine stays free of the onboarding model.
 * The release it belongs to is its migration's `migrations.json` entry;
 * `ng update` picks the entries to run, so a codemod repeats no version.
 */
export interface Codemod<TManifest> {
  /** Names the codemod in a migration's list; its changes carry their own ids. */
  readonly id: string;
  readonly plan: (tree: Tree, manifest: TManifest) => StepResult;
}

/** Every codemod's plan, in list order, as one step result. */
export function planCodemods<TManifest>(
  codemods: readonly Codemod<TManifest>[],
  tree: Tree,
  manifest: TManifest,
): StepResult {
  return mergeStepResults(codemods.map((codemod) => codemod.plan(tree, manifest)));
}
