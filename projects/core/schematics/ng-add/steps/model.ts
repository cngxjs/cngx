import { type NgAddPreset, type StepResult } from '../../engine';
import { type ProjectFacts } from '../detect/detect';

/** Every package `ng add` can select; `@cngx/themes` follows the theme answer. */
export const CNGX_LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'] as const;

export type CngxLib = (typeof CNGX_LIBS)[number];

export type ThemeChoice = 'cngx' | 'material' | 'none';

export type AiTool = 'claude' | 'cursor' | 'vscode';

/** The typed answers every step reads, from flags, prompts or the preset. */
export interface OnboardingAnswers {
  readonly preset: NgAddPreset;
  readonly libs: readonly CngxLib[];
  readonly theme: ThemeChoice;
  readonly i18n: 'en' | 'de';
  readonly runtimeSwitch: boolean;
  readonly lint: boolean;
  readonly a11yPreferences: boolean;
  readonly feedback: boolean;
  readonly floatingFallback: boolean;
  readonly aiTools: readonly AiTool[];
}

/** The release versions a run pins; `versions.json` at publish time. */
export interface Versions {
  readonly cngx: string;
  readonly mcp: string;
  readonly eslintPlugin: string;
}

export type Step = (facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions) => StepResult;
