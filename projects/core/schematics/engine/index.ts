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
  type AddStyleImport,
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
export { addToArrayLiteral, type ArraySelector, hasArrayLiteral } from './edit/ts-edit';
export { findElements, insertAttribute, parseTemplateContent } from './edit/template-edit';
export { hasStyleImport, insertStyleImport } from './edit/style-edit';
export { applyChangePlan } from './apply/apply';
export {
  canPrompt,
  type ConfirmQuestion,
  createPromptFlow,
  inquirerAdapter,
  type MultiSelectQuestion,
  type PromptAdapter,
  type PromptAnswer,
  type PromptAnswers,
  type PromptChoice,
  type PromptFlow,
  type PromptFlowOptions,
  type SelectQuestion,
} from './prompt/prompt';
export { type ColorEnv, createPalette, type Palette } from './render/palette';
export {
  createRenderer,
  type PreflightItem,
  type PreflightStatus,
  type Renderer,
  type RendererOptions,
  type RenderLogger,
  type Verbosity,
} from './render/renderer';
