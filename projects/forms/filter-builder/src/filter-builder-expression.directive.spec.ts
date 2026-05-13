import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { FilterFieldDef, FilterGroup, FilterNode } from './filter-builder.types';
import { CNGX_FILTER_BUILDER_HOST, type CngxFilterBuilderHost } from './filter-builder-host.token';
import { CngxFilterExpression } from './filter-builder-expression.directive';

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };
const FIELD_CUSTOM: FilterFieldDef = {
  key: 'tags',
  label: 'Tags',
  editorType: 'string',
  operators: ['hasAny', 'hasAll'],
};

function buildMockHost(initial: FilterGroup, fieldList: readonly FilterFieldDef[]): CngxFilterBuilderHost {
  const tree = signal<FilterGroup>(initial);
  const fields = signal<readonly FilterFieldDef[]>(fieldList);
  const fieldMap = signal<ReadonlyMap<string, FilterFieldDef>>(
    new Map(fieldList.map((def) => [def.key, def])),
  );
  const lastMutation = signal(null);

  function walk(root: FilterGroup, path: readonly number[]): FilterNode | null {
    let current: FilterNode = root;
    for (const index of path) {
      if (current.type !== 'group') {
        return null;
      }
      const next: FilterNode | undefined = current.filters[index];
      if (!next) {
        return null;
      }
      current = next;
    }
    return current;
  }

  return {
    tree,
    fields,
    fieldMap,
    lastMutation,
    addExpression: () => undefined,
    addGroup: () => undefined,
    removeNode: () => undefined,
    setLogic: () => undefined,
    toggleNegated: () => undefined,
    setField: () => undefined,
    setOperator: () => undefined,
    setValue: () => undefined,
    getNodeAtPath: (path) => walk(tree(), path),
    getFieldDef: (key) => fieldList.find((def) => def.key === key),
  };
}

@Component({
  template: `<div [cngxFilterExpression]="path()"></div>`,
  imports: [CngxFilterExpression],
})
class Host {
  readonly path = signal<readonly number[]>([0]);
  readonly directive = viewChild.required(CngxFilterExpression);
}

function setup(
  initial: FilterGroup,
  fieldList: readonly FilterFieldDef[],
  path: readonly number[] = [0],
): { directive: CngxFilterExpression } {
  TestBed.configureTestingModule({
    providers: [{ provide: CNGX_FILTER_BUILDER_HOST, useValue: buildMockHost(initial, fieldList) }],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.path.set(path);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { directive: fixture.componentInstance.directive() };
}

describe('CngxFilterExpression', () => {
  it('reads the expression node from the host', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'name', operator: 'contains', value: 'foo' }],
    };
    const { directive } = setup(tree, [FIELD_NAME]);
    expect(directive.node()?.field).toBe('name');
    expect(directive.fieldDef()).toBe(FIELD_NAME);
  });

  it('returns the field-defined operator list when present', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'tags', operator: 'hasAny', value: [] }],
    };
    const { directive } = setup(tree, [FIELD_CUSTOM]);
    expect(directive.availableOperators()).toEqual(['hasAny', 'hasAll']);
  });

  it('falls back to DEFAULT_OPERATORS by editor type', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'age', operator: 'eq', value: 30 }],
    };
    const { directive } = setup(tree, [FIELD_AGE]);
    expect(directive.availableOperators()).toContain('gt');
    expect(directive.availableOperators()).toContain('gte');
  });

  it('flags incomplete when field or operator missing', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: '', operator: '', value: null }],
    };
    const { directive } = setup(tree, [FIELD_NAME]);
    expect(directive.isIncomplete()).toBe(true);
  });

  it('builds expressionLabel from the field def label', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'name', operator: 'contains', value: 'foo' }],
    };
    const { directive } = setup(tree, [FIELD_NAME]);
    expect(directive.expressionLabel()).toBe('Filter: Name contains');
  });

  it('returns null node when path addresses a group instead of an expression', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'group', logic: 'or', negated: false, filters: [] }],
    };
    const { directive } = setup(tree, [FIELD_NAME], [0]);
    expect(directive.node()).toBeNull();
    expect(directive.isIncomplete()).toBe(true);
    expect(directive.expressionLabel()).toBe('Unbound filter');
  });

  it('availableOperators returns the shared empty array when fieldDef is undefined', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'missing-key', operator: 'eq', value: null }],
    };
    const { directive } = setup(tree, []);
    const a = directive.availableOperators();
    const b = directive.availableOperators();
    expect(a).toBe(b);
    expect(a).toEqual([]);
  });

  it('node identity is stable across re-reads when tree unchanged', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'name', operator: 'eq', value: 'x' }],
    };
    const { directive } = setup(tree, [FIELD_NAME]);
    expect(directive.node()).toBe(directive.node());
  });
});
