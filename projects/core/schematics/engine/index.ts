// The engine's only entry. Code outside engine/ imports from here, never
// from a module path inside it.

export type { Tree } from './fs/tree';
export { createMemoryTree } from './fs/memory-tree';
export { createNodeTree, type NodeTree } from './fs/node-tree';

export { addLockstepDependency } from './manifest/lockstep';
export {
  declaredRange,
  type NgAddOptions,
  type NgAddPreset,
  type PackageManifest,
  parseManifest,
  readOwnVersion,
} from './manifest/manifest';
