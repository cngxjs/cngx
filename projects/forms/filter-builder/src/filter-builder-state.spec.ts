import { signal, type WritableSignal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { FilterExpression, FilterFieldDef, FilterGroup } from './filter-builder.types';
import {
  createFilterBuilderState,
  type CngxFilterBuilderStateOptions,
} from './filter-builder-state';

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };

const expr = (field = 'name', operator = 'eq', value: unknown = null): FilterExpression => ({
  type: 'expression',
  field,
  operator,
  value,
});

const group = (
  filters: readonly (FilterGroup | FilterExpression)[] = [],
  logic: FilterGroup['logic'] = 'and',
  negated = false,
): FilterGroup => ({ type: 'group', logic, negated, filters });

function build(
  initial: FilterGroup,
  extra: Partial<Pick<CngxFilterBuilderStateOptions, 'source'>> = {},
): ReturnType<typeof createFilterBuilderState> {
  const fields = signal<readonly FilterFieldDef[]>([FIELD_NAME, FIELD_AGE]);
  return createFilterBuilderState({ initial, fields, ...extra });
}

describe('createFilterBuilderState', () => {
  describe('source-of-truth wiring', () => {
    it('uses internal storage when no source is provided', () => {
      const initial = group([expr('name')]);
      const state = build(initial);
      expect(state.tree()).toEqual(initial);
    });

    it('writes through the caller-supplied source on every mutation', () => {
      const source: WritableSignal<FilterGroup> = signal<FilterGroup>(group([], 'and'));
      const fields = signal<readonly FilterFieldDef[]>([FIELD_NAME]);
      const state = createFilterBuilderState({ source, fields });

      state.setLogic([], 'or');
      expect(source().logic).toBe('or');
      expect(state.tree().logic).toBe('or');
    });

    it('reflects external writes to the source in tree()', () => {
      const source: WritableSignal<FilterGroup> = signal<FilterGroup>(group([], 'and'));
      const fields = signal<readonly FilterFieldDef[]>([FIELD_NAME]);
      const state = createFilterBuilderState({ source, fields });

      source.set(group([expr('name')], 'or'));
      expect(state.tree().logic).toBe('or');
      expect(state.tree().filters).toHaveLength(1);
    });

    it('preserves tree identity when source emits a structurally-equal value', () => {
      const a = group([expr('name', 'eq', 'foo')]);
      const b = group([expr('name', 'eq', 'foo')]);
      const source = signal<FilterGroup>(a);
      const fields = signal<readonly FilterFieldDef[]>([FIELD_NAME]);
      const state = createFilterBuilderState({ source, fields });

      const before = state.tree();
      source.set(b);
      expect(state.tree()).toBe(before);
    });
  });

  describe('addExpression / addGroup', () => {
    it('addExpression appends at root', () => {
      const state = build(group());
      state.addExpression([], expr('name'));
      expect(state.tree().filters).toHaveLength(1);
      expect(state.expressionCount()).toBe(1);
      expect(state.isEmpty()).toBe(false);
    });

    it('addGroup appends a nested group at root', () => {
      const state = build(group());
      state.addGroup([], group([], 'or'));
      const child = state.tree().filters[0] as FilterGroup;
      expect(child.type).toBe('group');
      expect(child.logic).toBe('or');
    });
  });

  describe('removeNode', () => {
    it('refuses to remove the root', () => {
      const state = build(group([expr('name')]));
      const before = state.tree();
      state.removeNode([]);
      expect(state.tree()).toBe(before);
      expect(state.lastMutation()).toBeNull();
    });

    it('emits remove-filter for an expression target', () => {
      const state = build(group([expr('name')]));
      state.removeNode([0]);
      expect(state.tree().filters).toHaveLength(0);
      expect(state.lastMutation()).toEqual({ kind: 'remove-filter', path: [0] });
    });

    it('emits remove-group for a group target', () => {
      const state = build(group([group([expr('name')])]));
      state.removeNode([0]);
      expect(state.tree().filters).toHaveLength(0);
      expect(state.lastMutation()).toEqual({ kind: 'remove-group', path: [0] });
    });
  });

  describe('setLogic + structural equality short-circuit', () => {
    it('preserves tree identity when the new logic matches', () => {
      const state = build(group([expr('name')], 'and'));
      const before = state.tree();
      state.setLogic([], 'and');
      expect(state.tree()).toBe(before);
    });

    it('changes tree when the new logic differs', () => {
      const state = build(group([expr('name')], 'and'));
      state.setLogic([], 'or');
      expect(state.tree().logic).toBe('or');
    });

    it('emits set-logic with context', () => {
      const state = build(group([], 'and'));
      state.setLogic([], 'xor');
      expect(state.lastMutation()).toEqual({
        kind: 'set-logic',
        path: [],
        context: { logic: 'xor' },
      });
    });
  });

  describe('toggleNegated', () => {
    it('flips negated and emits new value', () => {
      const state = build(group([], 'and', false));
      state.toggleNegated([]);
      expect(state.tree().negated).toBe(true);
      expect(state.lastMutation()).toEqual({
        kind: 'toggle-negated',
        path: [],
        context: { negated: true },
      });
    });
  });

  describe('setField / setOperator / setValue', () => {
    it('setField rewrites expression.field', () => {
      const state = build(group([expr('name', 'eq', 'foo')]));
      state.setField([0], 'age');
      const node = state.tree().filters[0] as FilterExpression;
      expect(node.field).toBe('age');
      expect(state.lastMutation()).toEqual({
        kind: 'set-field',
        path: [0],
        context: { fieldKey: 'age' },
      });
    });

    it('setOperator rewrites expression.operator', () => {
      const state = build(group([expr('name', 'eq', 'foo')]));
      state.setOperator([0], 'contains');
      const node = state.tree().filters[0] as FilterExpression;
      expect(node.operator).toBe('contains');
    });

    it('setValue rewrites expression.value', () => {
      const state = build(group([expr('name', 'eq', 'foo')]));
      state.setValue([0], 'bar');
      const node = state.tree().filters[0] as FilterExpression;
      expect(node.value).toBe('bar');
    });

    it('setValue preserves identity when the new value matches', () => {
      const state = build(group([expr('name', 'eq', 'foo')]));
      const before = state.tree();
      state.setValue([0], 'foo');
      expect(state.tree()).toBe(before);
    });
  });

  describe('clear', () => {
    it('resets to an empty root and emits clear', () => {
      const state = build(group([expr('name'), expr('age')]));
      state.clear();
      expect(state.tree().filters).toHaveLength(0);
      expect(state.isEmpty()).toBe(true);
      expect(state.lastMutation()).toEqual({ kind: 'clear', path: [] });
    });
  });

  describe('fieldMap', () => {
    it('keys field defs by their key', () => {
      const state = build(group());
      const map = state.fieldMap();
      expect(map.get('name')).toBe(FIELD_NAME);
      expect(map.get('age')).toBe(FIELD_AGE);
    });

    it('getFieldDef proxies fieldMap.get', () => {
      const state = build(group());
      expect(state.getFieldDef('name')).toBe(FIELD_NAME);
      expect(state.getFieldDef('missing')).toBeUndefined();
    });
  });

  describe('expressionCount', () => {
    it('counts nested expressions recursively', () => {
      const state = build(group([expr('a'), group([expr('b'), group([expr('c')])])]));
      expect(state.expressionCount()).toBe(3);
    });
  });
});
