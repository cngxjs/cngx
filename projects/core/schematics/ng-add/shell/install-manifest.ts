import { type Tree } from '../../engine';
import {
  INSTALL_MANIFEST_PATH,
  type InstallManifest,
  parseInstallManifest,
} from '../steps/manifest';

/**
 * The install manifest a previous `ng add` left in the tree, if cngx wrote
 * one. Shell only: the rules read it and hand it to the pure steps.
 */
export function readInstallManifest(tree: Tree): InstallManifest | undefined {
  return tree.exists(INSTALL_MANIFEST_PATH)
    ? parseInstallManifest(tree.readText(INSTALL_MANIFEST_PATH))
    : undefined;
}
