// The engine's only entry. Code outside engine/ imports from here, never
// from a module path inside it.

export type { Tree } from './fs/tree';
export { createMemoryTree } from './fs/memory-tree';
export { BUILD_OUTPUT_DIRS, isAppSource, NON_SOURCE_DIRS } from './fs/source-files';
export { listFiles } from './fs/walk';

export { companionRange } from './manifest/companion';
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
  type Change,
  createNote,
  type CreateFile,
  createProvenance,
  type EditFile,
  type JsonEntry,
  mergeStepResults,
  type Provenance,
  type ProvenanceSource,
  type ProviderArg,
  type ProviderCall,
  renderProviderCall,
  type SkippedStep,
  skipChange,
  type StepResult,
  type WriteJson,
} from './plan/change';
export { type ChangePlan, createChangePlan, LOCKSTEP_REASON } from './plan/plan';
export { createReport } from './plan/report';
export { errorMessage, isRecord, joinNames, newlineOf } from './plan/text';
export {
  contentFingerprint,
  createProvenanceStamp,
  hasProvenanceMarker,
  hasProvenanceStamp,
  withProvenanceMarker,
} from './plan/provenance';
export {
  addNamedImports,
  addToArrayLiteral,
  declaresClass,
  ensureArrayProperty,
  hasArrayElement,
  hasArrayLiteral,
  importsModule,
  insertAfterImports,
  type DecoratorReading,
  type LanguagePackArgument,
  parsesCleanly,
  promoteTypeOnlyImport,
  readBootstrapCall,
  readDecorator,
  readProviderCalls,
  reexportSources,
  type TopLevelBinding,
  topLevelBindings,
  type TypeOnlyValueImport,
  typeOnlyValueImports,
  unfollowedRootProviders,
  type UnfollowedRootProviders,
} from './edit/ts-edit';
export {
  appendElements,
  hasElement,
  hasElementOutsidePlaceholder,
  hasPlaceholderBlock,
  insertBeforeElement,
  insertBeforePlaceholder,
} from './edit/template-edit';
export {
  hasStyleImport,
  insertLeadingStyleImport,
  isInjectedStyleEntry,
  styleEntryPath,
  styleImportUrls,
} from './edit/style-edit';
export { EMPTY_RENAME_TABLE, type RenameTable } from './migrate/rename-table';
export { planRenames } from './migrate/plan-renames';
export { type Codemod, planCodemods } from './migrate/codemod';
export { applyChangePlan } from './apply/apply';
export { delegateNgAdd } from './shim/delegate-ng-add';
export {
  DEFAULT_ESLINT_PLUGIN_VERSION,
  DEFAULT_MCP_VERSION,
  isUnstampedVersion,
  type ReleaseVersions,
  resolveVersions,
} from './versions';
export {
  canPrompt,
  createPromptFlow,
  type MultiSelectQuestion,
  type PromptAdapter,
  type PromptAnswers,
  type PromptChoice,
  type PromptFlow,
} from './prompt/prompt';
export {
  createRenderer,
  type PreflightItem,
  type TodoNext,
} from './render/renderer';
export { createSummary, type SummaryHeadlines } from './render/summary';
export { canReachPrompts, createShellRendererOptions, isCi } from './render/terminal';
