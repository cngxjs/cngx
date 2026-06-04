import { describe, expect, it } from 'vitest';

import type { FilterExpression, FilterGroup, FilterNode } from './filter-builder.types';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import {
  appendAtPath,
  filterTreeEqual,
  getNodeAtPath,
  removeAtPath,
  updateAtPath,
} from './filter-builder.utils';

const expr = (field: string, operator = 'eq', value: unknown = null): FilterExpression =>
  createFilterExpression(field, operator, value);

const group = (
  filters: readonly FilterNode[] = [],
  logic: FilterGroup['logic'] = 'and',
  negated = false,
): FilterGroup => createFilterGroup(logic, filters, { negated });

describe('filter-builder.utils', () => {
  describe('getNodeAtPath', () => {
    it('returns the root for the empty path', () => {
      const root = group([expr('a')]);
      expect(getNodeAtPath(root, [])).toBe(root);
    });

    it('walks deep paths', () => {
      const leaf = expr('deep');
      const root = group([group([group([leaf])])]);
      expect(getNodeAtPath(root, [0, 0, 0])).toBe(leaf);
    });

    it('returns null when the path overshoots an expression leaf', () => {
      const root = group([expr('a')]);
      expect(getNodeAtPath(root, [0, 0])).toBeNull();
    });

    it('returns null when the index is out of bounds', () => {
      const root = group([expr('a')]);
      expect(getNodeAtPath(root, [5])).toBeNull();
    });
  });

  describe('updateAtPath', () => {
    it('returns a new root when a leaf changes', () => {
      const root = group([expr('a', 'eq', 1), expr('b', 'eq', 2)]);
      const next = updateAtPath(root, [0], (node) =>
        node.type === 'expression' ? { ...node, value: 99 } : node,
      );

      expect(next).not.toBe(root);
      expect(next.filters).toHaveLength(2);
      expect((next.filters[0] as FilterExpression).value).toBe(99);
      expect(next.filters[1]).toBe(root.filters[1]);
    });

    it('replaces the root via the empty path', () => {
      const root = group([expr('a')]);
      const next = updateAtPath(root, [], (node) =>
        node.type === 'group' ? { ...node, logic: 'or' } : node,
      );

      expect(next.logic).toBe('or');
      expect(next).not.toBe(root);
    });

    it('returns the same root reference when the updater no-ops', () => {
      const root = group([expr('a')]);
      const next = updateAtPath(root, [0], (node) => node);
      expect(next).toBe(root);
    });

    it('throws when the path descends into an expression', () => {
      const root = group([expr('a')]);
      expect(() => updateAtPath(root, [0, 0], (n) => n)).toThrow(/cannot descend/);
    });

    it('throws when root replacement returns a non-group', () => {
      const root = group([expr('a')]);
      expect(() => updateAtPath(root, [], () => expr('x') as unknown as FilterGroup)).toThrow(
        /must remain a FilterGroup/,
      );
    });
  });

  describe('removeAtPath', () => {
    it('removes a top-level expression', () => {
      const root = group([expr('a'), expr('b')]);
      const next = removeAtPath(root, [0]);
      expect(next.filters).toHaveLength(1);
      expect((next.filters[0] as FilterExpression).field).toBe('b');
    });

    it('leaves an empty group when removing the only child', () => {
      const root = group([expr('only')]);
      const next = removeAtPath(root, [0]);
      expect(next.filters).toHaveLength(0);
    });

    it('removes a nested expression', () => {
      const root = group([group([expr('inner-a'), expr('inner-b')])]);
      const next = removeAtPath(root, [0, 0]);
      const innerGroup = next.filters[0] as FilterGroup;
      expect(innerGroup.filters).toHaveLength(1);
      expect((innerGroup.filters[0] as FilterExpression).field).toBe('inner-b');
    });

    it('refuses to remove the root', () => {
      const root = group([expr('a')]);
      expect(() => removeAtPath(root, [])).toThrow(/cannot remove the root/);
    });

    it('returns the same root when the index is out of bounds', () => {
      const root = group([expr('a')]);
      expect(removeAtPath(root, [5])).toBe(root);
    });
  });

  describe('appendAtPath', () => {
    it('appends to the root group', () => {
      const root = group([expr('a')]);
      const next = appendAtPath(root, [], expr('b'));
      expect(next.filters).toHaveLength(2);
      expect((next.filters[1] as FilterExpression).field).toBe('b');
    });

    it('appends inside a nested group', () => {
      const root = group([group([expr('inner-a')])]);
      const next = appendAtPath(root, [0], expr('inner-b'));
      const innerGroup = next.filters[0] as FilterGroup;
      expect(innerGroup.filters).toHaveLength(2);
    });

    it('throws when appending to an expression', () => {
      const root = group([expr('a')]);
      expect(() => appendAtPath(root, [0], expr('illegal'))).toThrow(/cannot append/);
    });
  });

  describe('filterTreeEqual', () => {
    it('returns true for identical references', () => {
      const root = group([expr('a')]);
      expect(filterTreeEqual(root, root)).toBe(true);
    });

    it('returns true for structurally equal trees with different references', () => {
      const a = group([expr('name', 'contains', 'foo')]);
      const b = group([expr('name', 'contains', 'foo')]);
      expect(a).not.toBe(b);
      expect(filterTreeEqual(a, b)).toBe(true);
    });

    it('returns false when logic differs', () => {
      const a = group([expr('a')], 'and');
      const b = group([expr('a')], 'or');
      expect(filterTreeEqual(a, b)).toBe(false);
    });

    it('returns false when negated differs', () => {
      const a = group([expr('a')], 'and', false);
      const b = group([expr('a')], 'and', true);
      expect(filterTreeEqual(a, b)).toBe(false);
    });

    it('returns false when expression value differs', () => {
      const a = group([expr('name', 'contains', 'foo')]);
      const b = group([expr('name', 'contains', 'bar')]);
      expect(filterTreeEqual(a, b)).toBe(false);
    });

    it('returns false when child count differs', () => {
      const a = group([expr('a'), expr('b')]);
      const b = group([expr('a')]);
      expect(filterTreeEqual(a, b)).toBe(false);
    });

    it('returns false when sibling types differ', () => {
      const a = group([expr('a')]);
      const b = group([group([expr('a')])]);
      expect(filterTreeEqual(a, b)).toBe(false);
    });

    it('recurses through nested groups', () => {
      const a = group([group([expr('a')], 'or', true)]);
      const b = group([group([expr('a')], 'or', true)]);
      expect(filterTreeEqual(a, b)).toBe(true);
    });
  });
});
