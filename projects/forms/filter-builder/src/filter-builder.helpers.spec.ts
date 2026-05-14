import { describe, expect, it } from 'vitest';

import type { FilterExpression, FilterFieldDef, FilterGroup } from './filter-builder.types';
import {
  createEmptyFilterRoot,
  createFilterExpression,
  createFilterGroup,
  evaluateExpression,
  toFilterPredicate,
} from './filter-builder.helpers';

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };
const FIELD_BIRTH: FilterFieldDef = { key: 'birth', label: 'Birth', editorType: 'date' };
const FIELD_ACTIVE: FilterFieldDef = { key: 'active', label: 'Active', editorType: 'boolean' };

const FIELDS: readonly FilterFieldDef[] = [FIELD_NAME, FIELD_AGE, FIELD_BIRTH, FIELD_ACTIVE];

const exprEq = (field: string, value: unknown): FilterExpression =>
  createFilterExpression(field, 'eq', value);

describe('createFilterGroup', () => {
  it('defaults to and / non-negated / empty filters', () => {
    const g = createFilterGroup();
    expect(g).toEqual({ type: 'group', logic: 'and', negated: false, filters: [] });
  });

  it('accepts logic, filters, and negation options', () => {
    const g = createFilterGroup('or', [exprEq('name', 'foo')], { negated: true });
    expect(g.logic).toBe('or');
    expect(g.negated).toBe(true);
    expect(g.filters).toHaveLength(1);
  });
});

describe('createFilterExpression', () => {
  it('builds a discriminated-union expression node', () => {
    const e = createFilterExpression('name', 'contains', 'foo');
    expect(e).toEqual({ type: 'expression', field: 'name', operator: 'contains', value: 'foo' });
  });

  it('omits value when not supplied', () => {
    const e = createFilterExpression('name', 'isEmpty');
    expect(e.value).toBeUndefined();
  });
});

describe('createEmptyFilterRoot', () => {
  it('returns the same frozen reference on every call', () => {
    expect(createEmptyFilterRoot()).toBe(createEmptyFilterRoot());
  });

  it('is a frozen non-negated and group with no filters', () => {
    const root = createEmptyFilterRoot();
    expect(Object.isFrozen(root)).toBe(true);
    expect(root.logic).toBe('and');
    expect(root.negated).toBe(false);
    expect(root.filters).toHaveLength(0);
  });
});

describe('toFilterPredicate — null tree', () => {
  it('returns null for null tree', () => {
    expect(toFilterPredicate(null, FIELDS)).toBeNull();
  });

  it('accepts empty root and returns truthy predicate', () => {
    const predicate = toFilterPredicate(createEmptyFilterRoot(), FIELDS);
    expect(predicate).not.toBeNull();
    expect(predicate?.({ name: 'whatever' })).toBe(true);
  });
});

describe('toFilterPredicate — logic operators', () => {
  it('and: every child must match', () => {
    const tree = createFilterGroup('and', [exprEq('name', 'alice'), exprEq('age', 30)]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 30 })).toBe(true);
    expect(predicate({ name: 'alice', age: 31 })).toBe(false);
    expect(predicate({ name: 'bob', age: 30 })).toBe(false);
  });

  it('or: at least one child must match', () => {
    const tree = createFilterGroup('or', [exprEq('name', 'alice'), exprEq('age', 30)]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 20 })).toBe(true);
    expect(predicate({ name: 'bob', age: 30 })).toBe(true);
    expect(predicate({ name: 'bob', age: 31 })).toBe(false);
  });

  it('xor at n=2: exactly one true matches', () => {
    const tree = createFilterGroup('xor', [exprEq('name', 'alice'), exprEq('age', 30)]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 31 })).toBe(true);
    expect(predicate({ name: 'bob', age: 30 })).toBe(true);
    expect(predicate({ name: 'alice', age: 30 })).toBe(false);
    expect(predicate({ name: 'bob', age: 31 })).toBe(false);
  });

  it('xor at n=3: exactly one true matches', () => {
    const tree = createFilterGroup('xor', [
      exprEq('name', 'alice'),
      exprEq('age', 30),
      exprEq('active', true),
    ]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 31, active: false })).toBe(true);
    expect(predicate({ name: 'alice', age: 30, active: false })).toBe(false);
    expect(predicate({ name: 'alice', age: 30, active: true })).toBe(false);
    expect(predicate({ name: 'bob', age: 31, active: false })).toBe(false);
  });

  it('xor at n=5: exactly one true matches', () => {
    const tree = createFilterGroup('xor', [
      exprEq('name', 'a'),
      exprEq('name', 'b'),
      exprEq('name', 'c'),
      exprEq('name', 'd'),
      exprEq('name', 'e'),
    ]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'a' })).toBe(true);
    expect(predicate({ name: 'z' })).toBe(false);
  });

  it('xor at n<2 returns false', () => {
    const treeOne = createFilterGroup('xor', [exprEq('name', 'alice')]);
    expect(toFilterPredicate(treeOne, FIELDS)!({ name: 'alice' })).toBe(false);

    const treeZero = createFilterGroup('xor', []);
    expect(toFilterPredicate(treeZero, FIELDS)!({})).toBe(false);
  });

  it('throws on unknown FilterLogic at runtime (exhaustiveness guard)', () => {
    const tree = {
      type: 'group' as const,
      logic: 'rogue' as unknown as 'and',
      negated: false,
      filters: [exprEq('name', 'alice')],
    };
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(() => predicate({ name: 'alice' })).toThrow(/Unhandled FilterLogic variant: rogue/);
  });
});

describe('toFilterPredicate — negated modifier (no nand/nor operator)', () => {
  it('negated + and denotes nand (the rejected operator)', () => {
    const tree = createFilterGroup('and', [exprEq('name', 'alice'), exprEq('age', 30)], {
      negated: true,
    });
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 30 })).toBe(false);
    expect(predicate({ name: 'bob', age: 30 })).toBe(true);
  });

  it('negated + or denotes nor', () => {
    const tree = createFilterGroup('or', [exprEq('name', 'alice'), exprEq('age', 30)], {
      negated: true,
    });
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'bob', age: 31 })).toBe(true);
    expect(predicate({ name: 'alice', age: 31 })).toBe(false);
  });

  it('negated + xor flips the exactly-one-true result', () => {
    const tree = createFilterGroup(
      'xor',
      [exprEq('name', 'alice'), exprEq('age', 30)],
      { negated: true },
    );
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 31 })).toBe(false);
    expect(predicate({ name: 'alice', age: 30 })).toBe(true);
  });
});

describe('evaluateExpression — every default operator', () => {
  const item = {
    name: 'Alice',
    age: 30,
    birth: new Date('1995-06-15'),
    active: true,
    empty: '',
    nullValue: null,
  };

  describe('string operators', () => {
    it('contains', () => {
      expect(
        evaluateExpression(createFilterExpression('name', 'contains', 'lic'), item, FIELD_NAME),
      ).toBe(true);
      expect(
        evaluateExpression(createFilterExpression('name', 'contains', 'XYZ'), item, FIELD_NAME),
      ).toBe(false);
    });

    it('startsWith', () => {
      expect(
        evaluateExpression(createFilterExpression('name', 'startsWith', 'Ali'), item, FIELD_NAME),
      ).toBe(true);
      expect(
        evaluateExpression(createFilterExpression('name', 'startsWith', 'Bob'), item, FIELD_NAME),
      ).toBe(false);
    });

    it('endsWith', () => {
      expect(
        evaluateExpression(createFilterExpression('name', 'endsWith', 'ice'), item, FIELD_NAME),
      ).toBe(true);
    });

    it('eq / neq', () => {
      expect(evaluateExpression(exprEq('name', 'Alice'), item, FIELD_NAME)).toBe(true);
      expect(
        evaluateExpression(createFilterExpression('name', 'neq', 'Bob'), item, FIELD_NAME),
      ).toBe(true);
    });

    it('isEmpty / isNotEmpty', () => {
      const emptyField: FilterFieldDef = { key: 'empty', label: '', editorType: 'string' };
      expect(evaluateExpression(createFilterExpression('empty', 'isEmpty'), item, emptyField)).toBe(true);
      expect(evaluateExpression(createFilterExpression('name', 'isNotEmpty'), item, FIELD_NAME)).toBe(true);
    });
  });

  describe('number operators', () => {
    it('gt / gte / lt / lte', () => {
      expect(evaluateExpression(createFilterExpression('age', 'gt', 29), item, FIELD_AGE)).toBe(true);
      expect(evaluateExpression(createFilterExpression('age', 'gte', 30), item, FIELD_AGE)).toBe(true);
      expect(evaluateExpression(createFilterExpression('age', 'lt', 31), item, FIELD_AGE)).toBe(true);
      expect(evaluateExpression(createFilterExpression('age', 'lte', 30), item, FIELD_AGE)).toBe(true);
      expect(evaluateExpression(createFilterExpression('age', 'gt', 30), item, FIELD_AGE)).toBe(false);
    });
  });

  describe('date operators', () => {
    it('gt / lt with Date instances', () => {
      const target = new Date('1990-01-01');
      expect(evaluateExpression(createFilterExpression('birth', 'gt', target), item, FIELD_BIRTH)).toBe(true);
      const later = new Date('2000-01-01');
      expect(evaluateExpression(createFilterExpression('birth', 'lt', later), item, FIELD_BIRTH)).toBe(true);
    });
  });

  describe('boolean operators', () => {
    it('eq / neq', () => {
      expect(evaluateExpression(exprEq('active', true), item, FIELD_ACTIVE)).toBe(true);
      expect(evaluateExpression(createFilterExpression('active', 'neq', false), item, FIELD_ACTIVE)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('missing field def returns false', () => {
      expect(evaluateExpression(exprEq('ghost', 'x'), item, undefined)).toBe(false);
    });

    it('unknown operator returns false', () => {
      expect(evaluateExpression(createFilterExpression('name', 'unknown', 'x'), item, FIELD_NAME)).toBe(false);
    });

    it('ordered comparisons against null return false', () => {
      const nullField: FilterFieldDef = { key: 'nullValue', label: '', editorType: 'number' };
      expect(evaluateExpression(createFilterExpression('nullValue', 'gt', 0), item, nullField)).toBe(false);
      expect(evaluateExpression(createFilterExpression('nullValue', 'lt', 0), item, nullField)).toBe(false);
    });
  });
});

describe('toFilterPredicate — missing fields', () => {
  it('returns false for expressions whose field is not in the fields list', () => {
    const tree: FilterGroup = createFilterGroup('and', [exprEq('ghost', 'x')]);
    expect(toFilterPredicate(tree, FIELDS)!({ ghost: 'x' })).toBe(false);
  });
});
