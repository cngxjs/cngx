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

export {
  type AddDependency,
  type AddImport,
  type AddProvider,
  type Change,
  type CreateFile,
  type EditFile,
  type JsonEntry,
  type JsonPath,
  type Note,
  type Provenance,
  type ProviderCall,
  type SkippedStep,
  skipChange,
  type StepResult,
  type WriteJson,
} from './plan/change';
export { type ChangePlan, createChangePlan, describeChangePlan } from './plan/plan';
export {
  createProvenanceStamp,
  hasProvenanceMarker,
  hasProvenanceStamp,
  withProvenanceMarker,
} from './plan/provenance';
export { applyChangePlan } from './apply/apply';
