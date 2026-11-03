import { describe, expect, it } from 'vitest';

import { createManualState } from '@cngx/common/data';

import { mergeCommitState } from './merged-commit-state';

function setup() {
  const primary = createManualState<string[]>();
  const create = createManualState<unknown>();
  primary.setSuccess(['red']);
  return { primary, create, merged: mergeCommitState(primary, create) };
}

describe('mergeCommitState', () => {
  it('follows the primary machine while the create machine is idle', () => {
    const { primary, merged } = setup();
    expect(merged.status()).toBe('success');
    expect(merged.data()).toEqual(['red']);
    primary.set('pending');
    expect(merged.status()).toBe('pending');
  });

  it('lets a pending create win over a settled primary', () => {
    const { create, merged } = setup();
    create.set('pending');
    expect(merged.status()).toBe('pending');
    expect(merged.data()).toEqual(['red']);
  });

  it('lets a failed create win with its own error', () => {
    const { primary, create, merged } = setup();
    const createError = new Error('create failed');
    primary.setError(new Error('toggle failed'));
    create.setError(createError);
    expect(merged.status()).toBe('error');
    expect(merged.error()).toBe(createError);
  });

  it('keeps the primary error while the create machine is not failed', () => {
    const { primary, merged } = setup();
    const toggleError = new Error('toggle failed');
    primary.setError(toggleError);
    expect(merged.status()).toBe('error');
    expect(merged.error()).toBe(toggleError);
  });

  it('does not let a settled create mask a later primary commit', () => {
    const { primary, create, merged } = setup();
    create.setSuccess('created');
    primary.set('pending');
    expect(merged.status()).toBe('pending');
    expect(merged.data()).toEqual(['red']);
  });
});
