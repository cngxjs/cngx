import {
  type AiTool,
  type CngxLib,
  type Language,
  type NgAddPreset,
  type ReleaseVersions,
  type StepResult,
  type ThemeChoice,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';

/** The typed answers every step reads, from flags, prompts or the preset. */
export interface OnboardingAnswers {
  readonly preset: NgAddPreset;
  readonly libs: readonly CngxLib[];
  readonly theme: ThemeChoice;
  readonly i18n: Language;
  readonly runtimeSwitch: boolean;
  readonly lint: boolean;
  readonly a11yPreferences: boolean;
  readonly feedback: boolean;
  readonly floatingFallback: boolean;
  readonly aiTools: readonly AiTool[];
}

/** The release versions a run pins; `versions.json` at publish time. */
export type Versions = ReleaseVersions;

export type Step = (facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions) => StepResult;
