import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { FilterFieldDef, FilterGroup, FilterNode } from './filter-builder.types';
import { CNGX_FILTER_BUILDER_HOST, type CngxFilterBuilderHost } from './filter-builder-host.token';
import { CngxFilterGroup } from './filter-builder-group.directive';

const FIELD: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };

function buildMockHost(initial: FilterGroup): CngxFilterBuilderHost {
  const tree = signal<FilterGroup>(initial);
  const fields = signal<readonly FilterFieldDef[]>([FIELD]);
  const fieldMap = signal<ReadonlyMap<string, FilterFieldDef>>(new Map([[FIELD.key, FIELD]]));
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
    getFieldDef: (key) => (key === FIELD.key ? FIELD : undefined),
  };
}

@Component({
  template: `<div [cngxFilterGroup]="path()"></div>`,
  imports: [CngxFilterGroup],
})
class Host {
  readonly path = signal<readonly number[]>([]);
  readonly directive = viewChild.required(CngxFilterGroup);
}

function setup(initial: FilterGroup, path: readonly number[] = []): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  host: Host;
  directive: CngxFilterGroup;
} {
  const mockHost = buildMockHost(initial);
  TestBed.configureTestingModule({
    providers: [{ provide: CNGX_FILTER_BUILDER_HOST, useValue: mockHost }],
  });

  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.path.set(path);
  fixture.detectChanges();
  TestBed.flushEffects();
  return {
    fixture,
    host: fixture.componentInstance,
    directive: fixture.componentInstance.directive(),
  };
}

describe('CngxFilterGroup', () => {
  it('resolves the host via the DI token', () => {
    const { directive } = setup({ type: 'group', logic: 'and', negated: false, filters: [] });
    expect(directive).toBeTruthy();
    expect(directive.isRoot()).toBe(true);
  });

  it('exposes logic, negated, children, childCount from the host tree', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'or',
      negated: true,
      filters: [{ type: 'expression', field: 'name', operator: 'eq', value: 'x' }],
    };
    const { directive } = setup(tree);
    expect(directive.logic()).toBe('or');
    expect(directive.negated()).toBe(true);
    expect(directive.children()).toHaveLength(1);
    expect(directive.childCount()).toBe(1);
  });

  it('rebuilds groupLabel when path changes', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'group', logic: 'or', negated: true, filters: [] }],
    };
    const { fixture, host, directive } = setup(tree, []);
    expect(directive.groupLabel()).toBe('Root filter group (AND)');

    host.path.set([0]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(directive.groupLabel()).toBe('Filter group (OR, negated)');
  });

  it('reflects null safely when the path addresses an expression', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'name', operator: 'eq', value: 'x' }],
    };
    const { directive } = setup(tree, [0]);
    expect(directive.node()).toBeNull();
    expect(directive.logic()).toBe('and');
    expect(directive.negated()).toBe(false);
  });

  it('node identity is stable across re-reads when tree unchanged', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [],
    };
    const { directive } = setup(tree);
    expect(directive.node()).toBe(directive.node());
  });

  it('children returns the shared empty array when node is null', () => {
    const tree: FilterGroup = {
      type: 'group',
      logic: 'and',
      negated: false,
      filters: [{ type: 'expression', field: 'name', operator: 'eq', value: 'x' }],
    };
    const { directive } = setup(tree, [0]);
    const a = directive.children();
    const b = directive.children();
    expect(a).toBe(b);
    expect(a).toEqual([]);
  });
});
