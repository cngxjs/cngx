import { normalize, virtualFs } from '@angular-devkit/core';
import { NodeJsSyncHost } from '@angular-devkit/core/node';
import { HostSink, HostTree } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';

import { type Tree } from './tree';

export interface NodeTree {
  /** The project as a `Tree`; reads hit the disk, writes stay staged. */
  readonly tree: Tree;
  /**
   * Writes the staged changes of `result` (default: `tree`) to disk. Pass the
   * tree a rule returned; a rule may hand back a branch, not the input.
   */
  readonly commit: (result?: Tree) => Promise<void>;
}

/**
 * A `Tree` over the folder `root` for runs outside the Angular CLI (the G1
 * CLI path). The devkit `HostSink` commits it, the same write-back the CLI
 * uses, so nothing here iterates tree actions itself.
 */
export function createNodeTree(root: string): NodeTree {
  const host = new virtualFs.ScopedHost(new NodeJsSyncHost(), normalize(root));
  const tree = new HostTree(host);
  return {
    tree,
    commit: (result = tree) => lastValueFrom(new HostSink(host).commit(result), { defaultValue: undefined }),
  };
}
