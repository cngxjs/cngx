import { describe, expect, it, vi } from 'vitest';

import {
  CNGX_FILTER_BUILTIN_OPERATOR_DEFS,
  type CngxFilterOperatorDef,
} from './filter-builder-operators';
import { DEFAULT_OPERATORS } from './filter-builder.types';
import type { FilterExpression, FilterFieldDef, FilterGroup } from './filter-builder.types';
import {
  createEmptyFilterRoot,
  createFilterExpression,
  createFilterGroup,
  ensureFilterTreeIds,
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
  it('defaults to and / non-negated / empty filters with an auto-generated id', () => {
    const g = createFilterGroup();
    expect(g.type).toBe('group');
    expect(g.logic).toBe('and');
    expect(g.negated).toBe(false);
    expect(g.filters).toEqual([]);
    expect(g.id).toMatch(/^cngx-filter-/);
  });

  it('accepts logic, filters, and negation options', () => {
    const g = createFilterGroup('or', [exprEq('name', 'foo')], { negated: true });
    expect(g.logic).toBe('or');
    expect(g.negated).toBe(true);
    expect(g.filters).toHaveLength(1);
  });

  it('emits a fresh id on every call', () => {
    expect(createFilterGroup().id).not.toBe(createFilterGroup().id);
  });
});

describe('createFilterExpression', () => {
  it('builds a discriminated-union expression node with an auto-generated id', () => {
    const e = createFilterExpression('name', 'contains', 'foo');
    expect(e.type).toBe('expression');
    expect(e.field).toBe('name');
    expect(e.operator).toBe('contains');
    expect(e.value).toBe('foo');
    expect(e.id).toMatch(/^cngx-filter-/);
  });

  it('omits value when not supplied', () => {
    const e = createFilterExpression('name', 'isEmpty');
    expect(e.value).toBeUndefined();
  });

  it('emits a fresh id on every call', () => {
    expect(createFilterExpression('a', 'eq').id).not.toBe(createFilterExpression('a', 'eq').id);
  });
});

describe('ensureFilterTreeIds', () => {
  it('returns the same reference when every node already has an id', () => {
    const tree = createFilterGroup('and', [createFilterExpression('name', 'eq', 'foo')]);
    expect(ensureFilterTreeIds(tree)).toBe(tree);
  });

  it('assigns ids to nodes that are missing them', () => {
    const stale = {
      type: 'group',
      id: '',
      logic: 'and',
      negated: false,
      filters: [
        { type: 'expression', id: '', field: 'name', operator: 'eq', value: 'x' } as FilterExpression,
      ],
    } as unknown as FilterGroup;
    const normalised = ensureFilterTreeIds(stale);
    expect(normalised).not.toBe(stale);
    expect(normalised.id).toMatch(/^cngx-filter-/);
    expect(normalised.filters[0]?.id).toMatch(/^cngx-filter-/);
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

describe('toFilterPredicate - null tree', () => {
  it('returns null for null tree', () => {
    expect(toFilterPredicate(null, FIELDS)).toBeNull();
  });

  it('accepts empty root and returns truthy predicate', () => {
    const predicate = toFilterPredicate(createEmptyFilterRoot(), FIELDS);
    expect(predicate).not.toBeNull();
    expect(predicate?.({ name: 'whatever' })).toBe(true);
  });
});

describe('toFilterPredicate - logic operators', () => {
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

  it('xor at n=1 returns false', () => {
    const treeOne = createFilterGroup('xor', [exprEq('name', 'alice')]);
    expect(toFilterPredicate(treeOne, FIELDS)!({ name: 'alice' })).toBe(false);
  });

  it('empty groups accept every item regardless of logic (no-constraint semantics)', () => {
    const andEmpty = createFilterGroup('and', []);
    const orEmpty = createFilterGroup('or', []);
    const xorEmpty = createFilterGroup('xor', []);
    expect(toFilterPredicate(andEmpty, FIELDS)!({})).toBe(true);
    expect(toFilterPredicate(orEmpty, FIELDS)!({})).toBe(true);
    expect(toFilterPredicate(xorEmpty, FIELDS)!({})).toBe(true);
  });

  it('empty groups remain neutral even when negated (no inverted "reject all")', () => {
    const negatedEmptyOr = createFilterGroup('or', [], { negated: true });
    expect(toFilterPredicate(negatedEmptyOr, FIELDS)!({})).toBe(true);
  });

  it('throws on unknown FilterLogic at runtime (exhaustiveness guard)', () => {
    const tree = {
      type: 'group' as const,
      id: 'rogue-root',
      logic: 'rogue' as unknown as 'and',
      negated: false,
      filters: [exprEq('name', 'alice')],
    };
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(() => predicate({ name: 'alice' })).toThrow(/Unhandled FilterLogic variant: rogue/);
  });
});

describe('toFilterPredicate - negated modifier (no nand/nor operator)', () => {
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

describe('evaluateExpression - every default operator', () => {
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

    it('expression with undefined value is treated as no-op for ordinary operators', () => {
      expect(evaluateExpression(createFilterExpression('name', 'eq'), item, FIELD_NAME)).toBe(true);
      expect(evaluateExpression(createFilterExpression('name', 'contains'), item, FIELD_NAME)).toBe(true);
      expect(evaluateExpression(createFilterExpression('age', 'gt'), item, FIELD_AGE)).toBe(true);
    });

    it('isEmpty / isNotEmpty remain active when expression value is undefined', () => {
      const emptyField: FilterFieldDef = { key: 'empty', label: '', editorType: 'string' };
      expect(evaluateExpression(createFilterExpression('empty', 'isEmpty'), item, emptyField)).toBe(true);
      expect(evaluateExpression(createFilterExpression('name', 'isNotEmpty'), item, FIELD_NAME)).toBe(true);
    });
  });
});

describe('toFilterPredicate - incomplete expressions are skipped', () => {
  it('and-group: an expression with undefined value does not exclude items', () => {
    const tree = createFilterGroup('and', [
      createFilterExpression('name', 'contains'),
      createFilterExpression('age', 'eq', 30),
    ]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'whatever', age: 30 })).toBe(true);
    expect(predicate({ name: 'whatever', age: 31 })).toBe(false);
  });

  it('tree with only incomplete expressions accepts every item', () => {
    const tree = createFilterGroup('and', [
      createFilterExpression('name', 'eq'),
      createFilterExpression('age', 'gt'),
    ]);
    const predicate = toFilterPredicate(tree, FIELDS)!;
    expect(predicate({ name: 'alice', age: 25 })).toBe(true);
  });
});

describe('toFilterPredicate - missing fields', () => {
  it('returns false for expressions whose field is not in the fields list', () => {
    const tree: FilterGroup = createFilterGroup('and', [exprEq('ghost', 'x')]);
    expect(toFilterPredicate(tree, FIELDS)!({ ghost: 'x' })).toBe(false);
  });
});

describe('evaluateExpression - widened no-op guard (null / undefined / empty string)', () => {
  const item = { name: 'Ada', age: 36 };

  it('treats null and empty-string values as no-ops like undefined', () => {
    expect(evaluateExpression(createFilterExpression('name', 'eq', null), item, FIELD_NAME)).toBe(true);
    expect(evaluateExpression(createFilterExpression('name', 'contains', ''), item, FIELD_NAME)).toBe(true);
  });

  it('keeps isEmpty active for an empty-string expression value', () => {
    expect(evaluateExpression(createFilterExpression('name', 'isEmpty', ''), item, FIELD_NAME)).toBe(false);
    expect(evaluateExpression(createFilterExpression('name', 'isNotEmpty', ''), item, FIELD_NAME)).toBe(true);
  });
});

describe('evaluateExpression - operator registry routing', () => {
  const item = { name: 'Ada Lovelace', age: 36 };

  const registryWith = (
    key: string,
    def: CngxFilterOperatorDef,
  ): ReadonlyMap<string, CngxFilterOperatorDef> =>
    new Map([...CNGX_FILTER_BUILTIN_OPERATOR_DEFS, [key, def]]);

  it('evaluates a consumer-registered operator through options.operators', () => {
    const operators = registryWith('lengthGt', {
      evaluate: (itemValue, exprValue) =>
        typeof itemValue === 'string' && typeof exprValue === 'number'
          ? itemValue.length > exprValue
          : false,
    });

    const expr = createFilterExpression('name', 'lengthGt', 5);
    expect(evaluateExpression(expr, item, FIELD_NAME, { operators })).toBe(true);
    expect(evaluateExpression(expr, { name: 'Ada' }, FIELD_NAME, { operators })).toBe(false);
  });

  it('exempts a consumer-registered valueless operator from the empty-value no-op guard', () => {
    const operators = registryWith('isBlankish', {
      valueless: true,
      evaluate: (itemValue) => typeof itemValue === 'string' && itemValue.trim() === '',
    });

    const expr = createFilterExpression('name', 'isBlankish');
    expect(evaluateExpression(expr, { name: '   ' }, FIELD_NAME, { operators })).toBe(true);
    expect(evaluateExpression(expr, item, FIELD_NAME, { operators })).toBe(false);
  });

  it('warns exactly once per unknown operator key and evaluates false', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const expr = createFilterExpression('name', 'unknownOpRegistryRoutingSpec', 'x');
      expect(evaluateExpression(expr, item, FIELD_NAME)).toBe(false);
      expect(evaluateExpression(expr, item, FIELD_NAME)).toBe(false);
      const matching = warn.mock.calls.filter((c) =>
        String(c[0]).includes('unknownOpRegistryRoutingSpec'),
      );
      expect(matching).toHaveLength(1);
    } finally {
      warn.mockRestore();
    }
  });

  it('keeps the no-options default path identical to the builtin registry', () => {
    const expr = createFilterExpression('name', 'contains', 'Love');
    expect(evaluateExpression(expr, item, FIELD_NAME)).toBe(
      evaluateExpression(expr, item, FIELD_NAME, {
        operators: CNGX_FILTER_BUILTIN_OPERATOR_DEFS,
      }),
    );
  });

  it('routes toFilterPredicate through the same registry options', () => {
    const operators = registryWith('lengthGt', {
      evaluate: (itemValue, exprValue) =>
        typeof itemValue === 'string' && typeof exprValue === 'number'
          ? itemValue.length > exprValue
          : false,
    });
    const tree = createFilterGroup('and', [createFilterExpression('name', 'lengthGt', 5)]);

    expect(toFilterPredicate(tree, FIELDS, { operators })!(item)).toBe(true);
    expect(toFilterPredicate(tree, FIELDS, { operators })!({ name: 'Ada' })).toBe(false);
  });
});

describe('evaluateExpression - between / in / notIn definitions', () => {
  const item = { name: 'Ada', age: 36, joined: new Date(2024, 3, 10) };
  const FIELD_JOINED: FilterFieldDef = { key: 'joined', label: 'Joined', editorType: 'date' };

  it('between matches values inside the inclusive [min, max] range', () => {
    const expr = (value: unknown) => createFilterExpression('age', 'between', value);
    expect(evaluateExpression(expr([30, 40]), item, FIELD_AGE)).toBe(true);
    expect(evaluateExpression(expr([36, 36]), item, FIELD_AGE)).toBe(true);
    expect(evaluateExpression(expr([37, 40]), item, FIELD_AGE)).toBe(false);
    expect(evaluateExpression(expr([10, 35]), item, FIELD_AGE)).toBe(false);
  });

  it('between orders dates and rejects mixed/uncomparable pairs', () => {
    const inRange = createFilterExpression('joined', 'between', [
      new Date(2024, 0, 1),
      new Date(2024, 11, 31),
    ]);
    const mixed = createFilterExpression('age', 'between', ['10', 40]);
    expect(evaluateExpression(inRange, item, FIELD_JOINED)).toBe(true);
    expect(evaluateExpression(mixed, item, FIELD_AGE)).toBe(false);
  });

  it('between treats a nullish bound as a half-filled no-op and a non-array value as false', () => {
    expect(
      evaluateExpression(createFilterExpression('age', 'between', [null, 40]), item, FIELD_AGE),
    ).toBe(true);
    expect(
      evaluateExpression(createFilterExpression('age', 'between', [30, undefined]), item, FIELD_AGE),
    ).toBe(true);
    expect(evaluateExpression(createFilterExpression('age', 'between', 30), item, FIELD_AGE)).toBe(
      false,
    );
    expect(
      evaluateExpression(createFilterExpression('age', 'between', [30]), item, FIELD_AGE),
    ).toBe(false);
  });

  it('in matches by Object.is membership and notIn is its complement', () => {
    const inExpr = (value: unknown) => createFilterExpression('age', 'in', value);
    const notInExpr = (value: unknown) => createFilterExpression('age', 'notIn', value);
    expect(evaluateExpression(inExpr([35, 36, 37]), item, FIELD_AGE)).toBe(true);
    expect(evaluateExpression(inExpr([1, 2]), item, FIELD_AGE)).toBe(false);
    expect(evaluateExpression(inExpr(['36']), item, FIELD_AGE)).toBe(false);
    expect(evaluateExpression(notInExpr([1, 2]), item, FIELD_AGE)).toBe(true);
    expect(evaluateExpression(notInExpr([35, 36]), item, FIELD_AGE)).toBe(false);
  });

  it('in / notIn treat an empty list as an unfilled no-op', () => {
    expect(evaluateExpression(createFilterExpression('age', 'in', []), item, FIELD_AGE)).toBe(true);
    expect(
      evaluateExpression(createFilterExpression('age', 'notIn', []), item, FIELD_AGE),
    ).toBe(true);
  });

  it('in / notIn evaluate false for a non-array value', () => {
    expect(evaluateExpression(createFilterExpression('age', 'in', 36), item, FIELD_AGE)).toBe(
      false,
    );
    expect(evaluateExpression(createFilterExpression('age', 'notIn', 36), item, FIELD_AGE)).toBe(
      false,
    );
  });

  it('ships none of the three keys in the DEFAULT_OPERATORS picker lists', () => {
    const listed = Object.values(DEFAULT_OPERATORS).flat();
    expect(listed).not.toContain('between');
    expect(listed).not.toContain('in');
    expect(listed).not.toContain('notIn');
  });
});

describe('evaluateExpression - case-comparison knob', () => {
  const item = { name: 'Ada Lovelace' };

  it.each([
    ['contains', 'lovelace'],
    ['startsWith', 'ada'],
    ['endsWith', 'LACE'],
  ])('%s is case-sensitive by default and folds under caseInsensitive', (operator, value) => {
    const expr = createFilterExpression('name', operator, value);
    expect(evaluateExpression(expr, item, FIELD_NAME)).toBe(false);
    expect(evaluateExpression(expr, item, FIELD_NAME, { caseInsensitive: true })).toBe(true);
  });

  it('leaves eq / neq on Object.is identity semantics regardless of the knob', () => {
    const eqExpr = createFilterExpression('name', 'eq', 'ada lovelace');
    expect(evaluateExpression(eqExpr, item, FIELD_NAME, { caseInsensitive: true })).toBe(false);
    const neqExpr = createFilterExpression('name', 'neq', 'ada lovelace');
    expect(evaluateExpression(neqExpr, item, FIELD_NAME, { caseInsensitive: true })).toBe(true);
  });

  it('keeps matching results unchanged when the knob is on', () => {
    const expr = createFilterExpression('name', 'contains', 'Love');
    expect(evaluateExpression(expr, item, FIELD_NAME, { caseInsensitive: true })).toBe(true);
  });
});
