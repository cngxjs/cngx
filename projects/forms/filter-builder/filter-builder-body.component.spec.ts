import { Component, computed, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { FilterFieldDef, FilterGroup, FilterNode } from './filter-builder.types';
import { CNGX_FILTER_BUILDER_HOST, type CngxFilterBuilderHost } from './filter-builder-host.token';
import { CngxFilterBuilderBody } from './filter-builder-body.component';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';

const FIELD: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };

function buildMockHost(initial: FilterGroup): CngxFilterBuilderHost {
  const tree = signal<FilterGroup>(initial);
  const fields = signal<readonly FilterFieldDef[]>([FIELD]);
  const fieldMap = signal<ReadonlyMap<string, FilterFieldDef>>(new Map([[FIELD.key, FIELD]]));
  const lastMutation = signal(null);
  const isEmpty = computed(() => tree().filters.length === 0);

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
    isEmpty,
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

const EMPTY_REGISTRY: CngxFilterBuilderTemplateRegistry = {
  empty: signal(null),
  expressionTemplate: signal(null),
  groupTemplate: signal(null),
  addFilterButton: signal(null),
  addGroupButton: signal(null),
  removeButton: signal(null),
  logicToggle: signal(null),
  negationToggle: signal(null),
  valueEditor: signal(null),
};

@Component({
  template: `<cngx-filter-builder-body [templates]="templates" />`,
  imports: [CngxFilterBuilderBody],
})
class Host {
  readonly templates = EMPTY_REGISTRY;
  readonly body = viewChild.required(CngxFilterBuilderBody);
}

interface BodyInternals {
  addFilterButtonContext: (path: readonly number[]) => unknown;
  addGroupButtonContext: (path: readonly number[]) => unknown;
  removeButtonContext: (path: readonly number[], label: string) => unknown;
  logicToggleContext: (group: FilterGroup, path: readonly number[]) => unknown;
  negationToggleContext: (group: FilterGroup, path: readonly number[]) => unknown;
}

function setup(initial: FilterGroup): { body: CngxFilterBuilderBody; internals: BodyInternals } {
  const mockHost = buildMockHost(initial);
  TestBed.configureTestingModule({
    providers: [{ provide: CNGX_FILTER_BUILDER_HOST, useValue: mockHost }],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const body = fixture.componentInstance.body();
  return { body, internals: body as unknown as BodyInternals };
}

describe('CngxFilterBuilderBody — non-caching per-state contexts', () => {
  const ROOT: FilterGroup = { type: 'group', id: 'root', logic: 'and', negated: false, filters: [] };
  const PATH: readonly number[] = [0];

  it('addFilterButtonContext returns a fresh object on every call', () => {
    const { internals } = setup(ROOT);
    expect(internals.addFilterButtonContext(PATH)).not.toBe(internals.addFilterButtonContext(PATH));
  });

  it('addGroupButtonContext returns a fresh object on every call', () => {
    const { internals } = setup(ROOT);
    expect(internals.addGroupButtonContext(PATH)).not.toBe(internals.addGroupButtonContext(PATH));
  });

  it('removeButtonContext returns a fresh object on every call', () => {
    const { internals } = setup(ROOT);
    const a = internals.removeButtonContext(PATH, 'remove');
    const b = internals.removeButtonContext(PATH, 'remove');
    expect(a).not.toBe(b);
  });

  it('logicToggleContext returns a fresh object on every call', () => {
    const { internals } = setup(ROOT);
    const group: FilterGroup = { type: 'group', id: 'g', logic: 'and', negated: false, filters: [] };
    expect(internals.logicToggleContext(group, PATH)).not.toBe(
      internals.logicToggleContext(group, PATH),
    );
  });

  it('negationToggleContext returns a fresh object on every call', () => {
    const { internals } = setup(ROOT);
    const group: FilterGroup = { type: 'group', id: 'g', logic: 'and', negated: false, filters: [] };
    expect(internals.negationToggleContext(group, PATH)).not.toBe(
      internals.negationToggleContext(group, PATH),
    );
  });

});
