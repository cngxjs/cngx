// The engine's only entry. Code outside engine/ imports from here, never
// from a module path inside it.

export type { Tree } from './fs/tree';
export { createMemoryTree } from './fs/memory-tree';
export { createNodeTree, type NodeTree } from './fs/node-tree';

export { addLockstepDependency } from './manifest/lockstep';
export {
  AI_TOOLS,
  type AiTool,
  CNGX_LIBS,
  type CngxLib,
  type Language,
  LANGUAGES,
  NG_ADD_PRESETS,
  type NgAddOptions,
  type NgAddPreset,
  THEME_CHOICES,
  type ThemeChoice,
} from './options';
export {
  declaredRange,
  type PackageManifest,
  parseManifest,
  readOwnVersion,
} from './manifest/manifest';

export {
  type AddDependency,
  type AddImport,
  type AddProvider,
  type AddStyleEntry,
  type AddStyleImport,
  type Change,
  type CreateFile,
  type EditFile,
  type JsonEntry,
  type JsonPath,
  type Note,
  type Provenance,
  type ProviderCall,
  type ProviderLiteral,
  type SkippedStep,
  skipChange,
  type StepResult,
  type WriteJson,
} from './plan/change';
export { type ChangePlan, createChangePlan, describeChangePlan } from './plan/plan';
export { createReport, type Report, type ReportLink } from './plan/report';
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
export { delegateNgAdd } from './shim/delegate-ng-add';
export {
  DEFAULT_ESLINT_PLUGIN_VERSION,
  DEFAULT_MCP_VERSION,
  type ReleaseVersions,
  type ResolvedVersions,
  resolveVersions,
} from './versions';
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
