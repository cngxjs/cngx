import { describe, expect, it } from 'vitest';

import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { planAiTools } from './ai-tools';

describe('planAiTools', () => {
  it('plans nothing when no editor was asked for', () => {
    expect(planAiTools(createFacts(), createAnswers(), VERSIONS)).toEqual({ changes: [], skipped: [] });
  });

  it('says the requested editors get no configs yet instead of skipping them silently', () => {
    const result = planAiTools(createFacts(), createAnswers({ aiTools: ['claude', 'vscode'] }), VERSIONS);

    expect(result.changes).toEqual([
      expect.objectContaining({
        kind: 'note',
        id: 'ai-tools',
        label: 'Skip the AI tooling configs',
        reason: 'the MCP and agent configs for claude and vscode are not written by this release yet',
      }),
    ]);
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planAiTools(deepFreeze(createFacts()), deepFreeze(createAnswers({ aiTools: ['cursor'] })), deepFreeze(VERSIONS)),
    ).not.toThrow();
  });
});
