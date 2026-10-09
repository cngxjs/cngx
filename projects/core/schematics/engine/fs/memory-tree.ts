import { normalize, virtualFs } from '@angular-devkit/core';
import { HostTree } from '@angular-devkit/schematics';

import { type Tree } from './tree';

/**
 * A `Tree` over an in-memory host. Seeded files read as already on disk, so
 * a rule sees them the way it sees a real project: `overwrite` works,
 * `create` on a seeded path fails.
 */
export function createMemoryTree(seed: Readonly<Record<string, string>> = {}): Tree {
  const host = new virtualFs.SimpleMemoryHost();
  const writer = new virtualFs.SyncDelegateHost(host);
  for (const [path, content] of Object.entries(seed)) {
    writer.write(normalize(path), virtualFs.stringToFileBuffer(content));
  }
  return new HostTree(host);
}
