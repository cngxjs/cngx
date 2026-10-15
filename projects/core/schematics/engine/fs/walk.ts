import { type DirEntry } from '@angular-devkit/schematics';

import { type Tree } from './tree';

export interface ListFilesOptions {
  /** Directory names never entered, at any depth. */
  readonly skipDirs?: ReadonlySet<string>;
  /** Keeps a file by its path; every file when left out. */
  readonly accept?: (path: string) => boolean;
}

function filesIn(dir: DirEntry, skipDirs: ReadonlySet<string>): readonly string[] {
  const files = dir.subfiles.map((file) => `${dir.path}/${file}`.replace(/^\/+/, ''));
  const nested = dir.subdirs
    .filter((name) => !skipDirs.has(name))
    .flatMap((name) => filesIn(dir.dir(name), skipDirs));
  return [...files, ...nested];
}

/**
 * Every file below `root`, as a path without the leading slash, sorted. It
 * reads the directory listing and never a file, so a skipped directory such
 * as `node_modules` costs nothing.
 */
export function listFiles(
  tree: Tree,
  root: string,
  { skipDirs = new Set(), accept = () => true }: ListFilesOptions = {},
): readonly string[] {
  return filesIn(tree.getDir(root), skipDirs).filter(accept).sort();
}
