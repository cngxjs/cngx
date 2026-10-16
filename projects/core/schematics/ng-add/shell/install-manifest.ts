import { type Tree } from '../../engine';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  parseInstallManifest,
} from '../steps/manifest';

/**
 * What a previous `ng add` left in the tree. A file that exists but does
 * not parse as this release's manifest is `unreadable`, never read as no
 * previous install: a run that took it for absent would drop every record
 * in it without a word.
 */
export type InstallManifestState =
  | { readonly state: 'absent' }
  | { readonly state: 'unreadable'; readonly content: string }
  | { readonly state: 'read'; readonly manifest: InstallManifest };

/** The install manifest in the tree. Shell only: the rules read it and hand it to the pure steps. */
export function readInstallManifest(tree: Tree): InstallManifestState {
  if (!tree.exists(INSTALL_MANIFEST_PATH)) {
    return { state: 'absent' };
  }
  const content = tree.readText(INSTALL_MANIFEST_PATH);
  const manifest = parseInstallManifest(content);
  return manifest === undefined ? { state: 'unreadable', content } : { state: 'read', manifest };
}

/** The manifest of a `read` state, `undefined` for the other two. */
export function readManifestOf(state: InstallManifestState): InstallManifest | undefined {
  return state.state === 'read' ? state.manifest : undefined;
}

/**
 * Where an unreadable manifest is kept: `.cngx/install.json.unreadable`,
 * then `-2`, `-3`, so an earlier copy is never written over.
 */
export function unreadableCopyPath(exists: (path: string) => boolean): string {
  const base = `${INSTALL_MANIFEST_PATH}.unreadable`;
  let path = base;
  for (let suffix = 2; exists(path); suffix++) {
    path = `${base}-${suffix}`;
  }
  return path;
}
