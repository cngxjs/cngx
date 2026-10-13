import { CNGX_LIBS, parseManifest } from '../engine';
import { type ProjectFacts } from '../ng-add/detect/detect';
import { type OnboardingAnswers, type Versions } from '../ng-add/steps/model';

export const VERSIONS: Versions = { cngx: '0.1.0', mcp: '0.3.0', eslintPlugin: '0.2.0', angular: '^21.2.0' };

/** The stock standalone fixture app as facts, so a step spec states only what differs. */
export function createFacts(overrides: Partial<ProjectFacts> = {}): ProjectFacts {
  return {
    project: 'fixture-app',
    manifest: parseManifest(JSON.stringify({ dependencies: { '@angular/core': '^21.2.0' } })),
    sourceRoot: 'src',
    angularVersion: '21.2.0',
    bootstrap: 'standalone',
    zoneless: true,
    signalForms: false,
    stylesKind: 'css',
    stylesPath: 'src/styles.css',
    cngxStylesheet: false,
    cngxThemePath: undefined,
    cngxThemeListed: false,
    tailwind: undefined,
    appConfigPath: 'src/app/app.config.ts',
    rootProviders: ['provideBrowserGlobalErrorListeners', 'provideRouter'],
    material: { present: false, themeShape: 'none', themePath: undefined, themeVariable: undefined, density: 0 },
    editors: { claude: false, cursor: false, vscode: false },
    mcpConfigs: { claude: 'absent', cursor: 'absent', vscode: 'absent' },
    mcpPins: { claude: undefined, cursor: undefined, vscode: undefined },
    agentsMd: 'absent',
    claudeInstructions: undefined,
    helperReadme: undefined,
    eslintConfig: undefined,
    legacyEslintConfig: undefined,
    eslintStack: { eslintMajor: undefined, templateParser: false, typescriptParser: false, angularEslint: undefined, templateParserMajor: undefined },
    ssr: false,
    sourceLocale: undefined,
    maturity: 'fresh',
    ...overrides,
  };
}

/** The `recommended` answers for the stock app. */
export function createAnswers(overrides: Partial<OnboardingAnswers> = {}): OnboardingAnswers {
  return {
    preset: 'recommended',
    libs: [...CNGX_LIBS],
    theme: 'cngx',
    i18n: 'en',
    runtimeSwitch: false,
    lint: true,
    a11yPreferences: true,
    feedback: false,
    floatingFallback: false,
    aiTools: [],
    ...overrides,
  };
}

/** Freezes a step input all the way down, so a mutating step throws in a spec. */
export function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}
