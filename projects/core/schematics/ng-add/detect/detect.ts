import { type workspaces } from '@angular-devkit/core';
import { posix } from 'node:path';

import {
  type AiTool,
  declaredRange,
  type LanguagePackArgument,
  listFiles,
  type PackageManifest,
  parseManifest,
  readProviderCalls,
  type Tree,
} from '../../engine';
import {
  claudeInstructionsOf,
  type ClaudeInstructions,
  type EditorFacts,
  hasEntries,
  helperReadmeOf,
  type HelperReadmeFacts,
  instructionState,
  type InstructionState,
  mcpConfigsOf,
  type McpConfigState,
} from './ai-tooling';
import { isSourceFile, maturityOf, rootProvidersPath } from './bootstrap';
import {
  detectEslintConfig,
  detectEslintStack,
  detectLegacyEslintConfig,
  type EslintConfigFacts,
  type EslintStackFacts,
  type LegacyEslintConfigFacts,
} from './eslint';
import {
  CNGX_THEME_FILES,
  detectMaterial,
  detectTailwind,
  existingCngxTheme,
  generatedFileState,
  type GeneratedFileState,
  importsCngxStylesheet,
  type MaterialFacts,
  type TailwindFacts,
} from './styles';
import {
  buildOptions,
  globalStylesheet,
  type Read,
  resolveProject,
  sourceLocaleOf,
  styleEntries,
  versionOf,
} from './workspace';

export {
  AGENTS_MARKER,
  type ClaudeInstructions,
  type EditorFacts,
  HELPER_README_PATH,
  type HelperReadmeFacts,
  helperReadmeFingerprintLine,
  type InstructionState,
  MCP_CONFIGS,
  type McpConfigState,
} from './ai-tooling';
export { type EslintConfigFacts, type EslintStackFacts, type LegacyEslintConfigFacts } from './eslint';
export {
  CNGX_LAYERS_FILE,
  CNGX_STYLESHEET,
  CNGX_THEME_FILES,
  type GeneratedFileState,
  type MaterialFacts,
  type MaterialThemeShape,
  type TailwindFacts,
} from './styles';

/** The file holding the runtime language switch signal, next to the root providers file. */
export const CNGX_LANGUAGE_FILE = 'cngx-language.ts';

/** Everything the plan steps branch on, read once before any question. */
export interface ProjectFacts {
  readonly project: string;
  /** The app's `package.json`; steps read declared ranges from it. */
  readonly manifest: PackageManifest;
  readonly sourceRoot: string;
  readonly angularVersion: string | undefined;
  /** The global stylesheet; `undefined` when the build lists none. */
  readonly stylesPath: string | undefined;
  /** `@cngx/themes/cngx.css` is imported by a global stylesheet or listed as a style entry. */
  readonly cngxStylesheet: boolean;
  /** The file already wiring a cngx theme: a `cngx-theme.*` file or a stylesheet using the Material bridge. */
  readonly cngxThemePath: string | undefined;
  /** A generated `cngx-theme.*` is listed in the build styles, whether or not the file is still there. */
  readonly cngxThemeListed: boolean;
  /** `undefined` when the app does not declare `tailwindcss`. */
  readonly tailwind: TailwindFacts | undefined;
  /** The file holding the root providers: `app.config.ts`, the root NgModule, or `main.ts` with an inline config. */
  readonly rootProvidersFile: string;
  /** Every `provide*()` call already in that file. */
  readonly rootProviders: readonly string[];
  /** `cngx-language.ts` next to `rootProvidersFile`. */
  readonly languageFile: GeneratedFileState;
  /** The pack a `provideCngxI18n(withPack(...))` there passes; `undefined` when none. */
  readonly languagePack: LanguagePackArgument | undefined;
  readonly material: MaterialFacts;
  readonly editors: EditorFacts;
  readonly mcpConfigs: Readonly<Record<AiTool, McpConfigState>>;
  /** The `@cngx/mcp` version a `wired` config pins; `undefined` when none is found. */
  readonly mcpPins: Readonly<Record<AiTool, string | undefined>>;
  /** `AGENTS.md`: missing, present, or already carrying the cngx block. */
  readonly agentsMd: InstructionState;
  /**
   * The project instructions Claude Code reads: `CLAUDE.md`, else
   * `.claude/CLAUDE.md` (where `ng new --ai-config=claude` puts it);
   * `undefined` when there is neither. Claude Code reads `AGENTS.md` only
   * without one.
   */
  readonly claudeInstructions: ClaudeInstructions | undefined;
  /** `.cngx/README.md`; `undefined` when there is none. */
  readonly helperReadme: HelperReadmeFacts | undefined;
  /** The eslint flat config; `undefined` when the app has none. */
  readonly eslintConfig: EslintConfigFacts | undefined;
  /** An `.eslintrc*` config ESLint 9 no longer reads; `undefined` when there is none. */
  readonly legacyEslintConfig: LegacyEslintConfigFacts | undefined;
  readonly eslintStack: EslintStackFacts;
  readonly sourceLocale: string | undefined;
  readonly maturity: 'fresh' | 'existing';
}

/**
 * Reads the facts every onboarding step branches on from the tree and the
 * parsed workspace. Pure: it only reads, and git state, time and the
 * environment are not facts (a devkit `Tree` carries no `.git`).
 */
export function detectProject(tree: Tree, workspace: workspaces.WorkspaceDefinition, name?: string): ProjectFacts {
  const [projectName, project] = resolveProject(workspace, name);
  const sourceRoot = project.sourceRoot ?? posix.join(project.root, 'src');
  const options = buildOptions(project);
  const manifest = parseManifest(tree.readText('package.json'));

  // The component count is the only fact read from source contents, so only
  // the app folder is read up front; the cache serves its files to later reads.
  const appSources = listFiles(tree, posix.join(sourceRoot, 'app'), { accept: isSourceFile }).map((path) => ({
    path,
    content: tree.readText(path),
  }));
  const contents = new Map<string, string | undefined>(appSources.map(({ path, content }) => [path, content]));
  const read: Read = (path) => {
    if (!contents.has(path)) {
      contents.set(path, tree.exists(path) ? tree.readText(path) : undefined);
    }
    return contents.get(path);
  };

  const mainOption = options['browser'] ?? options['main'];
  const mainPath = typeof mainOption === 'string' ? mainOption : posix.join(sourceRoot, 'main.ts');
  const main = read(mainPath) ?? '';
  const standalone = !/bootstrapModule\s*\(/.test(main);
  const rootProvidersFile = rootProvidersPath(mainPath, main, standalone, sourceRoot);
  const providerCalls = readProviderCalls(read(rootProvidersFile) ?? '');
  const providers = providerCalls.names;

  const entries = styleEntries(options);
  const stylesPath = globalStylesheet(entries);
  const componentCount = appSources.filter(({ content }) => /@Component\s*\(/.test(content)).length;

  const mcpConfigs = mcpConfigsOf(tree);

  return {
    project: projectName,
    manifest,
    sourceRoot,
    angularVersion: versionOf(declaredRange(manifest, '@angular/core')),
    stylesPath,
    cngxStylesheet: importsCngxStylesheet(read, entries),
    cngxThemePath: existingCngxTheme(tree, read, sourceRoot, entries),
    cngxThemeListed: Object.values(CNGX_THEME_FILES).some((name) =>
      entries.includes(posix.join(sourceRoot, name)),
    ),
    tailwind: detectTailwind(read, manifest, entries),
    rootProvidersFile,
    rootProviders: providers,
    languageFile: generatedFileState(read(posix.join(posix.dirname(rootProvidersFile), CNGX_LANGUAGE_FILE))),
    languagePack: providerCalls.languagePack,
    material: detectMaterial(read, manifest, entries),
    editors: {
      claude: tree.exists('CLAUDE.md') || hasEntries(tree, '.claude'),
      cursor: tree.exists('.cursorrules') || hasEntries(tree, '.cursor'),
      vscode: hasEntries(tree, '.vscode'),
    },
    mcpConfigs: {
      claude: mcpConfigs.claude.state,
      cursor: mcpConfigs.cursor.state,
      vscode: mcpConfigs.vscode.state,
    },
    mcpPins: {
      claude: mcpConfigs.claude.pin,
      cursor: mcpConfigs.cursor.pin,
      vscode: mcpConfigs.vscode.pin,
    },
    agentsMd: instructionState(read, 'AGENTS.md'),
    claudeInstructions: claudeInstructionsOf(read),
    helperReadme: helperReadmeOf(read),
    eslintConfig: detectEslintConfig(tree),
    legacyEslintConfig: detectLegacyEslintConfig(tree),
    eslintStack: detectEslintStack(manifest),
    sourceLocale: sourceLocaleOf(project),
    maturity: maturityOf(componentCount, manifest, providers),
  };
}
