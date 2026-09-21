import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { createStepperDisplayMode } from './display-mode';
import type { CngxStepperMobileCollapse } from './stepper-config';

function setup(collapse?: CngxStepperMobileCollapse) {
  const collapsed = signal(false);
  const policy = signal<CngxStepperMobileCollapse | undefined>(collapse);
  return {
    collapsed,
    policy,
    mode: createStepperDisplayMode(collapsed, () => policy()),
  };
}

describe('createStepperDisplayMode', () => {
  it('keeps the classic strip while the container is wide', () => {
    const { mode } = setup('dots');
    expect(mode()).toBe('classic');
  });

  it("collapses to 'text' when no policy is configured", () => {
    const { collapsed, mode } = setup();
    collapsed.set(true);
    expect(mode()).toBe('text');
  });

  it("collapses to 'dots' when the policy asks for it", () => {
    const { collapsed, mode } = setup('dots');
    collapsed.set(true);
    expect(mode()).toBe('dots');
  });

  it("stays classic at any width when the policy is 'off'", () => {
    const { collapsed, mode } = setup('off');
    collapsed.set(true);
    expect(mode()).toBe('classic');
  });

  it('follows the collapse signal in both directions', () => {
    const { collapsed, mode } = setup('text');
    collapsed.set(true);
    expect(mode()).toBe('text');
    collapsed.set(false);
    expect(mode()).toBe('classic');
  });

  it('re-resolves when the policy changes under a collapsed container', () => {
    const { collapsed, policy, mode } = setup('text');
    collapsed.set(true);
    policy.set('dots');
    expect(mode()).toBe('dots');
  });
});
