import { type Provenance, type StepResult } from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';

function list(names: readonly string[]): string {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The AI tooling answer is recorded, but no release writes editor configs
 * yet; a requested editor gets a note instead of a silent no-op.
 */
export function planAiTools(_facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  if (answers.aiTools.length === 0) {
    return { changes: [], skipped: [] };
  }
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  return {
    changes: [
      {
        kind: 'note',
        id: 'ai-tools:configs',
        label: 'Skip the AI tooling configs',
        reason: `the MCP and agent configs for ${list(answers.aiTools)} are not written by this release yet`,
        provenance,
      },
    ],
    skipped: [],
  };
}
