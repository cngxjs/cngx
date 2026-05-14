import { describe, expect, it } from 'vitest';

import type {
  FilterExpression,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import { DEFAULT_OPERATORS } from './filter-builder.types';

describe('filter-builder.types', () => {
  describe('FilterLogic union', () => {
    it('accepts and / or / xor', () => {
      const operators: readonly FilterLogic[] = ['and', 'or', 'xor'];
      expect(operators).toEqual(['and', 'or', 'xor']);
    });

    it('rejects nand at compile time', () => {
      // @ts-expect-error — `nand` is not a FilterLogic; consumers express it as negated:true + and
      const nand: FilterLogic = 'nand';
      expect(nand).toBe('nand');
    });

    it('rejects nor at compile time', () => {
      // @ts-expect-error — `nor` is not a FilterLogic; consumers express it as negated:true + or
      const nor: FilterLogic = 'nor';
      expect(nor).toBe('nor');
    });
  });

  describe('FilterNode discriminated union', () => {
    it('narrows on type=group', () => {
      const tree: FilterNode = {
        type: 'group',
        id: 'g',
        logic: 'and',
        negated: false,
        filters: [],
      };

      if (tree.type === 'group') {
        const group: FilterGroup = tree;
        expect(group.logic).toBe('and');
        expect(group.negated).toBe(false);
      } else {
        throw new Error('expected group narrowing');
      }
    });

    it('narrows on type=expression', () => {
      const node: FilterNode = {
        type: 'expression',
        id: 'e',
        field: 'name',
        operator: 'contains',
        value: 'foo',
      };

      if (node.type === 'expression') {
        const expr: FilterExpression = node;
        expect(expr.field).toBe('name');
        expect(expr.operator).toBe('contains');
        expect(expr.value).toBe('foo');
      } else {
        throw new Error('expected expression narrowing');
      }
    });

    it('exhaustive switch hits both branches', () => {
      const classify = (node: FilterNode): string => {
        switch (node.type) {
          case 'group':
            return 'g';
          case 'expression':
            return 'e';
          default: {
            const _exhaustive: never = node;
            return _exhaustive;
          }
        }
      };

      const g: FilterNode = { type: 'group', id: 'g', logic: 'or', negated: true, filters: [] };
      const e: FilterNode = { type: 'expression', id: 'e', field: 'a', operator: 'eq', value: 1 };
      expect(classify(g)).toBe('g');
      expect(classify(e)).toBe('e');
    });
  });

  describe('DEFAULT_OPERATORS', () => {
    it('provides operator sets for the four builtin editor types', () => {
      expect(Object.keys(DEFAULT_OPERATORS).sort()).toEqual(['boolean', 'date', 'number', 'string']);
    });

    it('string operators cover the documented contract', () => {
      expect(DEFAULT_OPERATORS.string).toEqual([
        'contains',
        'eq',
        'neq',
        'startsWith',
        'endsWith',
        'isEmpty',
        'isNotEmpty',
      ]);
    });

    it('number and date share comparator operators', () => {
      const shared = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'];
      expect(DEFAULT_OPERATORS.number).toEqual(shared);
      expect(DEFAULT_OPERATORS.date).toEqual(shared);
    });

    it('boolean operators are minimal', () => {
      expect(DEFAULT_OPERATORS.boolean).toEqual(['eq', 'neq']);
    });
  });
});
