import {
  ChangeDetectionStrategy,
  Component,
  computed,
  model,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import type { CngxFilterEditorComponent } from './filter-builder-editor.contract';
import { CngxFilterExpressionRow } from './filter-builder-expression-row.component';
import {
  CNGX_FILTER_BUILDER_HOST,
  type CngxFilterBuilderHost,
} from './filter-builder-host.token';
import { CNGX_FILTER_EDITORS } from './filter-builder.tokens';
import type { CngxFilterEditor } from './filter-builder.config';
import type { Type } from '@angular/core';
import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterNode,
} from './filter-builder.types';

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };
const FIELD_BIRTH: FilterFieldDef = { key: 'birth', label: 'Birth', editorType: 'date' };
const FIELD_ACTIVE: FilterFieldDef = { key: 'active', label: 'Active', editorType: 'boolean' };
const FIELD_CUSTOM: FilterFieldDef = {
  key: 'tag',
  label: 'Tag',
  editorType: 'tag-picker',
  operators: ['eq'],
};

interface MockHost extends CngxFilterBuilderHost {
  setValueSpy: ReturnType<typeof vi.fn>;
}

function buildHost(initial: FilterGroup, fieldList: readonly FilterFieldDef[]): MockHost {
  const tree = signal<FilterGroup>(initial);
  const fields = signal<readonly FilterFieldDef[]>(fieldList);
  const fieldMap: Signal<ReadonlyMap<string, FilterFieldDef>> = computed(
    () => new Map(fieldList.map((d) => [d.key, d])),
  );
  const isEmpty = computed(() => tree().filters.length === 0);
  const lastMutation = signal(null);

  function walk(path: readonly number[]): FilterNode | null {
    let current: FilterNode = tree();
    for (const i of path) {
      if (current.type !== 'group') {
        return null;
      }
      const next: FilterNode | undefined = current.filters[i];
      if (!next) {
        return null;
      }
      current = next;
    }
    return current;
  }

  const setValueSpy = vi.fn((path: readonly number[], value: unknown) => {
    const root = tree();
    if (path.length === 0 || root.filters.length === 0) {
      return;
    }
    const idx = path[0];
    const target = root.filters[idx];
    if (target.type !== 'expression') {
      return;
    }
    const updated: FilterExpression = { ...target, value };
    tree.set({
      ...root,
      filters: root.filters.map((node, i) => (i === idx ? updated : node)),
    });
  });

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
    setValue: setValueSpy,
    getNodeAtPath: walk,
    getFieldDef: (key) => fieldList.find((d) => d.key === key),
    setValueSpy,
  };
}

@Component({
  selector: 'cngx-test-tag-picker-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      data-test="tag-picker-write"
      (click)="value.set('written-by-custom-editor')"
    >
      pick tag
    </button>
  `,
})
class TagPickerEditor implements CngxFilterEditorComponent<string> {
  readonly value = model<string | null>(null);
}

@Component({
  template: `<cngx-filter-expression-row [path]="path()"></cngx-filter-expression-row>`,
  imports: [CngxFilterExpressionRow],
})
class HostShell {
  readonly path = signal<readonly number[]>([0]);
  readonly row = viewChild.required(CngxFilterExpressionRow);
}

function setup(
  expression: FilterExpression,
  fieldList: readonly FilterFieldDef[] = [
    FIELD_NAME,
    FIELD_AGE,
    FIELD_BIRTH,
    FIELD_ACTIVE,
    FIELD_CUSTOM,
  ],
): {
  fixture: ReturnType<typeof TestBed.createComponent<HostShell>>;
  host: MockHost;
} {
  const tree: FilterGroup = {
    type: 'group',
    id: 'root',
    logic: 'and',
    negated: false,
    filters: [expression],
  };
  const mockHost = buildHost(tree, fieldList);
  const editors = new Map<string, CngxFilterEditor>([
    ['string', 'native:string'],
    ['number', 'native:number'],
    ['date', 'native:date'],
    ['boolean', 'native:boolean'],
    ['tag-picker', TagPickerEditor as Type<CngxFilterEditorComponent<unknown>>],
  ]);
  TestBed.configureTestingModule({
    providers: [
      { provide: CNGX_FILTER_BUILDER_HOST, useValue: mockHost },
      { provide: CNGX_FILTER_EDITORS, useValue: editors },
    ],
  });
  const fixture = TestBed.createComponent(HostShell);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, host: mockHost };
}

describe('CngxFilterExpressionRow — editor wiring matrix', () => {
  it('string editor: input event writes the raw string through to the host tree', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e-string',
      field: 'name',
      operator: 'contains',
      value: '',
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="text"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'alpha';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.setValueSpy).toHaveBeenCalledWith([0], 'alpha');
    const after = host.tree().filters[0] as FilterExpression;
    expect(after.value).toBe('alpha');
  });

  it('number editor: input event writes a parsed number through to the host tree', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e-number',
      field: 'age',
      operator: 'gte',
      value: 0,
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="number"]'))
      .nativeElement as HTMLInputElement;
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.setValueSpy).toHaveBeenCalledWith([0], 42);
    const after = host.tree().filters[0] as FilterExpression;
    expect(after.value).toBe(42);
  });

  it('date editor: change event writes the picked ISO date through to the host tree', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e-date',
      field: 'birth',
      operator: 'lt',
      value: undefined,
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="date"]'))
      .nativeElement as HTMLInputElement;
    input.value = '2024-09-01';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.setValueSpy).toHaveBeenCalledWith([0], '2024-09-01');
    const after = host.tree().filters[0] as FilterExpression;
    expect(after.value).toBe('2024-09-01');
  });

  it('boolean editor: cngx-toggle click writes the new boolean through to the host tree', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e-boolean',
      field: 'active',
      operator: 'eq',
      value: false,
    };
    const { fixture, host } = setup(expression);
    const toggle = fixture.debugElement.query(By.css('cngx-toggle'))
      .nativeElement as HTMLElement;
    toggle.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.setValueSpy).toHaveBeenCalledWith([0], true);
    const after = host.tree().filters[0] as FilterExpression;
    expect(after.value).toBe(true);
  });

  it('custom-component editor: mounts and exposes the model<T>() contract for write-through', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e-custom',
      field: 'tag',
      operator: 'eq',
      value: null,
    };
    const { fixture } = setup(expression);
    const editorEl = fixture.debugElement.query(By.directive(TagPickerEditor));
    expect(editorEl).not.toBeNull();
    const editor = editorEl.componentInstance as TagPickerEditor;
    const contractAlias: CngxFilterEditorComponent<string> = editor;
    expect(typeof contractAlias.value.set).toBe('function');
    editor.value.set('written-by-custom-editor');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(editor.value()).toBe('written-by-custom-editor');
  });
});
