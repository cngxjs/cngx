import { describe, expect, it } from 'vitest';

import { createBreadcrumbCollapse } from './breadcrumb-collapse';

describe('createBreadcrumbCollapse', () => {
  const collapse = createBreadcrumbCollapse();

  it('collapses nothing when maxVisible is unset (0)', () => {
    expect([...collapse(5, 0)]).toEqual([]);
  });

  it('collapses nothing when maxVisible is invalid (< 1)', () => {
    expect([...collapse(5, -3)]).toEqual([]);
  });

  it('collapses nothing when the trail already fits (total <= maxVisible)', () => {
    expect([...collapse(4, 4)]).toEqual([]);
    expect([...collapse(3, 5)]).toEqual([]);
  });

  it('keeps the first crumb and the last (maxVisible - 1), folding the middle', () => {
    // 5 crumbs, max 3: keep index 0 and the last 2 (indices 3, 4); fold 1, 2.
    expect([...collapse(5, 3)]).toEqual([1, 2]);
  });

  it('keeps only the first and last crumb when maxVisible is 2', () => {
    expect([...collapse(6, 2)]).toEqual([1, 2, 3, 4]);
  });

  it('collapses a single middle crumb at the minimum overflow', () => {
    // 4 crumbs, max 3: keep 0 and the last 2 (indices 2, 3); fold index 1 only.
    expect([...collapse(4, 3)]).toEqual([1]);
  });
});
