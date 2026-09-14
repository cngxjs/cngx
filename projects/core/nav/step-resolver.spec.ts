import { describe, expect, it } from 'vitest';

import { resolveBoundaryStep, resolveStepFrom } from './step-resolver';

const disabledSet =
  (...disabled: number[]) =>
  (index: number) =>
    disabled.includes(index);

describe('resolveStepFrom', () => {
  it('steps to the adjacent index without disabled skipping', () => {
    expect(resolveStepFrom(1, 1, { count: 4 })).toBe(2);
    expect(resolveStepFrom(1, -1, { count: 4 })).toBe(0);
  });

  it('skips disabled indices in the step direction', () => {
    expect(resolveStepFrom(0, 1, { count: 4, isDisabledAt: disabledSet(1, 2) })).toBe(3);
    expect(resolveStepFrom(3, -1, { count: 4, isDisabledAt: disabledSet(1, 2) })).toBe(0);
  });

  it('stops at the boundary without loop', () => {
    expect(resolveStepFrom(3, 1, { count: 4 })).toBeNull();
    expect(resolveStepFrom(0, -1, { count: 4 })).toBeNull();
  });

  it('wraps via modulo with loop', () => {
    expect(resolveStepFrom(3, 1, { count: 4, loop: true })).toBe(0);
    expect(resolveStepFrom(0, -1, { count: 4, loop: true })).toBe(3);
  });

  it('wrap + skip combine: the scan continues past the seam', () => {
    expect(resolveStepFrom(3, 1, { count: 4, loop: true, isDisabledAt: disabledSet(0) })).toBe(1);
  });

  it('resolves null on a fully disabled range, with and without loop', () => {
    const isDisabledAt = disabledSet(0, 1, 2);
    expect(resolveStepFrom(0, 1, { count: 3, isDisabledAt })).toBeNull();
    expect(resolveStepFrom(0, 1, { count: 3, loop: true, isDisabledAt })).toBeNull();
  });

  it('a negative current enters from the approach edge', () => {
    expect(resolveStepFrom(-1, 1, { count: 3 })).toBe(0);
    expect(resolveStepFrom(-1, -1, { count: 3 })).toBe(2);
    expect(resolveStepFrom(-1, 1, { count: 3, isDisabledAt: disabledSet(0) })).toBe(1);
  });

  it('current >= count is not remapped: null without loop, modulo with loop', () => {
    expect(resolveStepFrom(9, 1, { count: 3 })).toBeNull();
    expect(resolveStepFrom(9, -1, { count: 3 })).toBeNull();
    expect(resolveStepFrom(9, 1, { count: 3, loop: true })).toBe(1);
  });

  it('clamp composition (?? current) keeps the index at the boundary', () => {
    const current = 2;
    expect(resolveStepFrom(current, 1, { count: 3 }) ?? current).toBe(2);
    expect(resolveStepFrom(0, -1, { count: 3 }) ?? 0).toBe(0);
    expect(resolveStepFrom(1, 1, { count: 3 }) ?? 1).toBe(2);
  });

  it('single-item and empty ranges', () => {
    expect(resolveStepFrom(0, 1, { count: 1 })).toBeNull();
    expect(resolveStepFrom(0, 1, { count: 1, loop: true })).toBe(0);
    expect(resolveStepFrom(0, 1, { count: 0 })).toBeNull();
  });
});

describe('resolveBoundaryStep', () => {
  it('resolves the first and last enabled index', () => {
    expect(resolveBoundaryStep(1, { count: 4 })).toBe(0);
    expect(resolveBoundaryStep(-1, { count: 4 })).toBe(3);
    expect(resolveBoundaryStep(1, { count: 4, isDisabledAt: disabledSet(0, 1) })).toBe(2);
    expect(resolveBoundaryStep(-1, { count: 4, isDisabledAt: disabledSet(3) })).toBe(2);
  });

  it('resolves null on empty or fully disabled ranges', () => {
    expect(resolveBoundaryStep(1, { count: 0 })).toBeNull();
    expect(resolveBoundaryStep(1, { count: 2, isDisabledAt: disabledSet(0, 1) })).toBeNull();
  });
});
