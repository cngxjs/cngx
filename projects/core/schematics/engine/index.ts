// The engine's only entry. Code outside engine/ imports from here, never
// from a module path inside it.

export type { Tree } from './fs/tree';
export { createMemoryTree } from './fs/memory-tree';
export { listFiles, type ListFilesOptions } from './fs/walk';

export { addLockstepDependency } from './manifest/lockstep';
export {
  AI_TOOLS,
  type AiTool,
  CNGX_LIBS,
  type CngxLib,
  isBoolean,
  isListOf,
  isOneOf,
  type Language,
  LANGUAGES,
  NG_ADD_PRESETS,
  type NgAddFlags,
  type NgAddOptions,
  type NgAddPreset,
  parseNgAddOptions,
  readDryRunFlag,
  readPromptFlags,
  THEME_CHOICES,
  type ThemeChoice,
} from './options';
export {
  declaredRange,
  type PackageManifest,
  parseManifest,
  parseVersion,
} from './manifest/manifest';
export { planThirdPartyDependency } from './manifest/third-party';

export {
  type AddDependency,
  type AddProvider,
  type AddStyleEntry,
  type AddStyleImport,
  type Change,
  createNote,
  type CreateFile,
  createProvenance,
  type EditFile,
  type JsonEntry,
  type JsonPath,
  mergeStepResults,
  type Note,
  type Provenance,
  type ProvenanceSource,
  type ProviderArg,
  type ProviderArray,
  type ProviderCall,
  type ProviderLiteral,
  type SkippedStep,
  skipChange,
  type StepResult,
  type WriteJson,
} from './plan/change';
export { type ChangePlan, createChangePlan } from './plan/plan';
export { createReport, type Report, type ReportLink } from './plan/report';
export { errorMessage, isRecord, joinNames } from './plan/text';
export {
  contentFingerprint,
  createProvenanceStamp,
  hasProvenanceMarker,
  hasProvenanceStamp,
  withProvenanceMarker,
} from './plan/provenance';
export {
  addToArrayLiteral,
  type ArraySelector,
  hasArrayLiteral,
  importsModule,
  insertAfterImports,
  type LanguagePackArgument,
  readProviderCalls,
} from './edit/ts-edit';
export {
  hasStyleImport,
  insertLeadingStyleImport,
  isInjectedStyleEntry,
  styleEntryPath,
  styleImportUrls,
} from './edit/style-edit';
export { EMPTY_RENAME_TABLE, type MemberRename, type RenameTable } from './migrate/rename-table';
export { planRenames } from './migrate/plan-renames';
export { type Codemod, planCodemods } from './migrate/codemod';
export { applyChangePlan } from './apply/apply';
export { delegateNgAdd } from './shim/delegate-ng-add';
export {
  DEFAULT_ESLINT_PLUGIN_VERSION,
  DEFAULT_MCP_VERSION,
  isUnstampedVersion,
  type ReleaseVersions,
  type ResolvedVersions,
  resolveVersions,
} from './versions';
export {
  canPrompt,
  type ConfirmQuestion,
  createPromptFlow,
  type MultiSelectQuestion,
  type PromptAdapter,
  type PromptAnswer,
  type PromptAnswers,
  type PromptChoice,
  type PromptFlow,
  type PromptFlowOptions,
  type SelectQuestion,
} from './prompt/prompt';
export { type ColorEnv, type Palette } from './render/palette';
export {
  createRenderer,
  type PreflightItem,
  type PreflightStatus,
  type Renderer,
  type RendererOptions,
  type RenderLogger,
} from './render/renderer';
export { createSummary, type SummaryHeadlines } from './render/summary';
export { canReachPrompts, createShellRendererOptions, isCi, type TerminalStream } from './render/terminal';
