import { Component, computed, signal, viewChild, type WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterNode,
} from './filter-builder.types';
import { provideFilterBuilderConfig, withNegation } from './filter-builder.config';
import { CNGX_FILTER_BUILDER_HOST, type CngxFilterBuilderHost } from './filter-builder-host.token';
import { CngxFilterBuilderBody } from './filter-builder-body.component';
import type { CngxFilterBuilderTemplateRegistry } from './filter-builder-template-registry';

const FIELD: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };

function buildMockHost(
  initial: FilterGroup,
): CngxFilterBuilderHost & { readonly disabled: WritableSignal<boolean> } {
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
    disabled: signal(false),
    addExpression: () => undefined,
    addGroup: () => undefined,
    removeNode: () => undefined,
    setLogic: () => undefined,
    toggleNegated: () => undefined,
    setField: () => undefined,
    setOperator: () => undefined,
    setValue: () => undefined,
    applyFieldChange: () => undefined,
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

describe('CngxFilterBuilderBody - non-caching per-state contexts', () => {
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

describe('CngxFilterBuilderBody - builder disabled', () => {
  const TREE: FilterGroup = {
    type: 'group',
    id: 'root',
    logic: 'and',
    negated: false,
    filters: [
      { type: 'expression', id: 'e1', field: 'name', operator: 'eq', value: 'a' },
      { type: 'group', id: 'g1', logic: 'or', negated: false, filters: [] },
    ],
  };
  const EMPTY: FilterGroup = { ...TREE, filters: [] };
  const GROUP: FilterGroup = { type: 'group', id: 'g', logic: 'and', negated: false, filters: [] };
  const EXPR = TREE.filters[0] as FilterExpression;

  interface DisabledInternals extends BodyInternals {
    emptyContext: () => { disabled: boolean };
    groupTemplateContext: (group: FilterGroup, path: readonly number[]) => { disabled: boolean };
    expressionTemplateContext: (
      expression: FilterExpression,
      path: readonly number[],
    ) => { disabled: boolean };
  }

  function setupDisabled(initial: FilterGroup) {
    const mockHost = buildMockHost(initial);
    mockHost.disabled.set(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: CNGX_FILTER_BUILDER_HOST, useValue: mockHost },
        provideFilterBuilderConfig(withNegation(true)),
      ],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    const body = fixture.componentInstance.body();
    return {
      fixture,
      mockHost,
      el: fixture.nativeElement as HTMLElement,
      internals: body as unknown as DisabledInternals,
    };
  }

  it('disables every default group button and the negation checkbox', () => {
    const { fixture, mockHost, el } = setupDisabled(TREE);
    const buttons = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.cngx-filter-builder__group button'),
    ).filter((b) => !b.closest('cngx-filter-expression-row'));
    const negations = Array.from(el.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
    // root: add filter, add group, logic joiner; nested: add filter, add group, remove group
    expect(buttons.length).toBe(6);
    expect(negations.length).toBe(2);
    expect([...buttons, ...negations].every((c) => c.disabled)).toBe(true);

    mockHost.disabled.set(false);
    fixture.detectChanges();
    expect([...buttons, ...negations].some((c) => c.disabled)).toBe(false);
  });

  it('disables the empty-state default buttons', () => {
    const { el } = setupDisabled(EMPTY);
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('button'));
    expect(buttons.length).toBe(2);
    expect(buttons.every((b) => b.disabled)).toBe(true);
  });

  it('add-filter context reports disabled and clears after the flip', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.addFilterButtonContext([])).toMatchObject({ disabled: true });
    mockHost.disabled.set(false);
    expect(internals.addFilterButtonContext([])).toMatchObject({ disabled: false });
  });

  it('add-group context reports disabled and clears after the flip', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.addGroupButtonContext([])).toMatchObject({ disabled: true });
    mockHost.disabled.set(false);
    expect(internals.addGroupButtonContext([])).toMatchObject({ disabled: false });
  });

  it('remove context reports disabled', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.removeButtonContext([1], 'Remove')).toMatchObject({ disabled: true });
    mockHost.disabled.set(false);
    expect(internals.removeButtonContext([1], 'Remove')).toMatchObject({ disabled: false });
  });

  it('logic context reports disabled', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.logicToggleContext(GROUP, [])).toMatchObject({ disabled: true });
    mockHost.disabled.set(false);
    expect(internals.logicToggleContext(GROUP, [])).toMatchObject({ disabled: false });
  });

  it('negation context reports disabled', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.negationToggleContext(GROUP, [])).toMatchObject({ disabled: true });
    mockHost.disabled.set(false);
    expect(internals.negationToggleContext(GROUP, [])).toMatchObject({ disabled: false });
  });

  it('empty context reports disabled', () => {
    const { mockHost, internals } = setupDisabled(EMPTY);
    expect(internals.emptyContext().disabled).toBe(true);
    mockHost.disabled.set(false);
    expect(internals.emptyContext().disabled).toBe(false);
  });

  it('group context reports disabled and is rebuilt on the flip despite the cache', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.groupTemplateContext(GROUP, [1]).disabled).toBe(true);
    mockHost.disabled.set(false);
    expect(internals.groupTemplateContext(GROUP, [1]).disabled).toBe(false);
  });

  it('expression context reports disabled and is rebuilt on the flip despite the cache', () => {
    const { mockHost, internals } = setupDisabled(TREE);
    expect(internals.expressionTemplateContext(EXPR, [0]).disabled).toBe(true);
    mockHost.disabled.set(false);
    expect(internals.expressionTemplateContext(EXPR, [0]).disabled).toBe(false);
  });
});
