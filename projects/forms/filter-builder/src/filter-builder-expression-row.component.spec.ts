import { Component, computed, signal, viewChild, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it, vi } from 'vitest';

import { CngxSelect } from '@cngx/forms/select';

import { CngxFilterExpressionRow } from './filter-builder-expression-row.component';
import { CNGX_FILTER_BUILDER_HOST, type CngxFilterBuilderHost } from './filter-builder-host.token';
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

interface MockHost extends CngxFilterBuilderHost {
  readonly tree: ReturnType<typeof signal<FilterGroup>>;
  setFieldSpy: ReturnType<typeof vi.fn>;
  setOperatorSpy: ReturnType<typeof vi.fn>;
  setValueSpy: ReturnType<typeof vi.fn>;
  removeNodeSpy: ReturnType<typeof vi.fn>;
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

  const setFieldSpy = vi.fn();
  const setOperatorSpy = vi.fn();
  const setValueSpy = vi.fn();
  const removeNodeSpy = vi.fn();

  return {
    tree,
    fields,
    fieldMap,
    isEmpty,
    lastMutation,
    addExpression: () => undefined,
    addGroup: () => undefined,
    removeNode: removeNodeSpy,
    setLogic: () => undefined,
    toggleNegated: () => undefined,
    setField: setFieldSpy,
    setOperator: setOperatorSpy,
    setValue: setValueSpy,
    getNodeAtPath: walk,
    getFieldDef: (key) => fieldList.find((d) => d.key === key),
    setFieldSpy,
    setOperatorSpy,
    setValueSpy,
    removeNodeSpy,
  };
}

@Component({
  template: `<cngx-filter-expression-row [path]="path()"></cngx-filter-expression-row>`,
  imports: [CngxFilterExpressionRow],
})
class Host {
  readonly path = signal<readonly number[]>([0]);
  readonly row = viewChild.required(CngxFilterExpressionRow);
}

function setup(
  expression: FilterExpression,
  fieldList: readonly FilterFieldDef[] = [FIELD_NAME, FIELD_AGE, FIELD_BIRTH, FIELD_ACTIVE],
): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
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
  TestBed.configureTestingModule({
    providers: [{ provide: CNGX_FILTER_BUILDER_HOST, useValue: mockHost }],
  });
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, host: mockHost };
}

describe('CngxFilterExpressionRow — embedded mode', () => {
  it('renders one CngxSelect each for field and operator with the right options', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'name',
      operator: 'eq',
      value: 'foo',
    };
    const { fixture } = setup(expression);
    const selects = fixture.debugElement.queryAll(By.directive(CngxSelect));
    expect(selects).toHaveLength(2);
    const fieldSelect = selects[0].componentInstance as CngxSelect<string>;
    const operatorSelect = selects[1].componentInstance as CngxSelect<string>;
    expect(fieldSelect.options()).toHaveLength(4);
    expect(operatorSelect.options().length).toBeGreaterThan(0);
  });

  it('emits setField via host when CngxSelect valueChange fires', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'name',
      operator: 'eq',
      value: 'foo',
    };
    const { fixture, host } = setup(expression);
    const fieldSelect = fixture.debugElement.queryAll(By.directive(CngxSelect))[0]
      .componentInstance as CngxSelect<string>;
    fieldSelect.value.set('age');
    expect(host.setFieldSpy).toHaveBeenCalledWith([0], 'age');
  });

  it('keeps the carry-over operator when the new field still supports it', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'name',
      operator: 'eq',
      value: 'foo',
    };
    const { fixture, host } = setup(expression);
    const fieldSelect = fixture.debugElement.queryAll(By.directive(CngxSelect))[0]
      .componentInstance as CngxSelect<string>;
    fieldSelect.value.set('age');
    // 'eq' is in number's operator set, so the operator/value stay.
    expect(host.setFieldSpy).toHaveBeenCalledWith([0], 'age');
    expect(host.setOperatorSpy).not.toHaveBeenCalled();
    expect(host.setValueSpy).not.toHaveBeenCalled();
  });

  it('resets operator + clears value when the carry-over operator is invalid for the new field', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'birth',
      operator: 'lt',
      value: '2006-01-14',
    };
    const { fixture, host } = setup(expression);
    const fieldSelect = fixture.debugElement.queryAll(By.directive(CngxSelect))[0]
      .componentInstance as CngxSelect<string>;
    fieldSelect.value.set('name');
    // 'lt' is not in string's operator set → reset to string default + clear value.
    expect(host.setFieldSpy).toHaveBeenCalledWith([0], 'name');
    expect(host.setOperatorSpy).toHaveBeenCalledWith([0], 'contains');
    expect(host.setValueSpy).toHaveBeenCalledWith([0], undefined);
  });

  it('emits setOperator via host when CngxSelect valueChange fires', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'name',
      operator: 'eq',
      value: 'foo',
    };
    const { fixture, host } = setup(expression);
    const operatorSelect = fixture.debugElement.queryAll(By.directive(CngxSelect))[1]
      .componentInstance as CngxSelect<string>;
    operatorSelect.value.set('contains');
    expect(host.setOperatorSpy).toHaveBeenCalledWith([0], 'contains');
  });

  it('emits setValue with raw string on text-input event', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'name',
      operator: 'eq',
      value: 'foo',
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="text"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'bar';
    input.dispatchEvent(new Event('input'));
    expect(host.setValueSpy).toHaveBeenCalledWith([0], 'bar');
  });

  it('emits setValue with parsed number on numeric-input event', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'age',
      operator: 'gt',
      value: 30,
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="number"]'))
      .nativeElement as HTMLInputElement;
    input.value = '42';
    input.dispatchEvent(new Event('input'));
    expect(host.setValueSpy).toHaveBeenCalledWith([0], 42);
  });

  it('emits setValue with null when the numeric input is cleared', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'age',
      operator: 'gt',
      value: 30,
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="number"]'))
      .nativeElement as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(host.setValueSpy).toHaveBeenCalledWith([0], null);
  });

  it('renders the date input branch for editor type "date"', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'birth',
      operator: 'eq',
      value: '1990-01-01',
    };
    const { fixture } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="date"]'));
    expect(input).not.toBeNull();
  });

  it('emits setValue with the picked ISO date on date-input change event', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'birth',
      operator: 'lt',
      value: undefined,
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="date"]'))
      .nativeElement as HTMLInputElement;
    input.value = '2006-01-14';
    input.dispatchEvent(new Event('change'));
    expect(host.setValueSpy).toHaveBeenCalledWith([0], '2006-01-14');
  });

  it('emits setValue with null when the date input is cleared', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'birth',
      operator: 'lt',
      value: '2006-01-14',
    };
    const { fixture, host } = setup(expression);
    const input = fixture.debugElement.query(By.css('input[type="date"]'))
      .nativeElement as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('change'));
    expect(host.setValueSpy).toHaveBeenCalledWith([0], null);
  });

  it('renders a cngx-toggle for boolean editor type and emits setValue on toggle change', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'active',
      operator: 'eq',
      value: false,
    };
    const { fixture, host } = setup(expression);
    const toggle = fixture.debugElement.query(By.css('cngx-toggle')).nativeElement as HTMLElement;
    toggle.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.setValueSpy).toHaveBeenCalledWith([0], true);
  });

  it('reflects the bound expression.value on the toggle aria-checked attribute', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'active',
      operator: 'eq',
      value: true,
    };
    const { fixture } = setup(expression);
    const toggle = fixture.debugElement.query(By.css('cngx-toggle')).nativeElement as HTMLElement;
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });

  it('emits removeNode via host on remove-button click', () => {
    const expression: FilterExpression = {
      type: 'expression',
      id: 'e1',
      field: 'name',
      operator: 'eq',
      value: 'foo',
    };
    const { fixture, host } = setup(expression);
    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
    button.click();
    expect(host.removeNodeSpy).toHaveBeenCalledWith([0]);
  });

  it('renders nothing when path resolves to a non-expression node', () => {
    const tree: FilterGroup = {
      type: 'group',
      id: 'root',
      logic: 'and',
      negated: false,
      filters: [
        {
          type: 'group',
          id: 'g1',
          logic: 'or',
          negated: false,
          filters: [],
        },
      ],
    };
    const host = buildHost(tree, [FIELD_NAME]);
    TestBed.configureTestingModule({
      providers: [{ provide: CNGX_FILTER_BUILDER_HOST, useValue: host }],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.debugElement.query(By.css('.cngx-filter-builder__expression'))).toBeNull();
  });
});
