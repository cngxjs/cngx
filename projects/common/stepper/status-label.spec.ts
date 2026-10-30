import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxStepperI18n } from './i18n/stepper-i18n';
import { resolveStepperStatusLabel } from './status-label';
import type { CngxStepNode } from './stepper-host.token';

type StepState = 'idle' | 'success' | 'error';

const i18n = {
  statusLabels: {
    done: 'Done',
    inProgress: 'In progress',
    upNext: 'Up next',
    errored: 'Errored',
    refused: 'Not allowed',
  },
} as unknown as CngxStepperI18n;

function node(state: StepState, kind: 'step' | 'group' = 'step'): CngxStepNode {
  return { kind, state: signal(state) } as unknown as CngxStepNode;
}

describe('resolveStepperStatusLabel', () => {
  it('maps the plain states without a rejection', () => {
    expect(resolveStepperStatusLabel(node('success'), i18n, false)).toBe('Done');
    expect(resolveStepperStatusLabel(node('error'), i18n, false)).toBe('Errored');
    expect(resolveStepperStatusLabel(node('idle'), i18n, true)).toBe('In progress');
    expect(resolveStepperStatusLabel(node('idle'), i18n, false)).toBe('Up next');
  });

  it('reads Errored for a failed commit instead of Up next', () => {
    expect(resolveStepperStatusLabel(node('idle'), i18n, false, 'failed')).toBe('Errored');
  });

  it('reads the refused word for a refused commit instead of Up next', () => {
    expect(resolveStepperStatusLabel(node('idle'), i18n, false, 'refused')).toBe('Not allowed');
  });

  it('puts the rejection before the active and done words', () => {
    expect(resolveStepperStatusLabel(node('idle'), i18n, true, 'refused')).toBe('Not allowed');
    expect(resolveStepperStatusLabel(node('success'), i18n, false, 'refused')).toBe('Not allowed');
    expect(resolveStepperStatusLabel(node('success'), i18n, false, 'failed')).toBe('Errored');
  });

  it('keeps a validation error over a refusal', () => {
    expect(resolveStepperStatusLabel(node('error'), i18n, false, 'refused')).toBe('Errored');
  });

  it('returns an empty string for a group node', () => {
    expect(resolveStepperStatusLabel(node('idle', 'group'), i18n, false, 'failed')).toBe('');
  });
});
