import { describe, expect, it } from 'vitest';

import {
  DEFAULT_OPERATORS,
  type FilterEditorType,
  type FilterExpression,
  type FilterFieldDef,
  type FilterGroup,
  type FilterLogic,
  type FilterNode,
} from '../public-api';

describe('@cngx/forms/filter-builder — public-api re-exports', () => {
  it('re-exports DEFAULT_OPERATORS from the package entry', () => {
    expect(DEFAULT_OPERATORS.string).toContain('contains');
    expect(DEFAULT_OPERATORS.number).toContain('gt');
  });

  it('re-exports tree-model types so consumers can type FilterFieldDef[] without reaching into src/', () => {
    const field: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
    const expression: FilterExpression = { type: 'expression', field: 'name', operator: 'eq', value: 'x' };
    const group: FilterGroup = { type: 'group', logic: 'and', negated: false, filters: [expression] };
    const node: FilterNode = group;
    const logic: FilterLogic = 'and';
    const editorType: FilterEditorType = 'string';
    expect(field.editorType).toBe(editorType);
    expect(node).toBe(group);
    expect(logic).toBe('and');
  });
});
