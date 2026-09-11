import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';

import {
  createFilterRowController,
  type CngxFilterRowControllerDeps,
  type CngxFilterRowWriteSink,
} from './filter-builder-row-controller';
import type { CngxFilterEditor } from './filter-builder.config';
import { CNGX_FILTER_BUILDER_DEFAULTS } from './filter-builder.config';
import { createFilterExpression } from './filter-builder.helpers';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_TITLE: FilterFieldDef = { key: 'title', label: 'Title', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };
const FIELD_RATING: FilterFieldDef = {
  key: 'rating',
  label: 'Rating',
  editorType: 'number',
  operators: ['gte', 'lte'],
};

const FIELDS: readonly FilterFieldDef[] = [FIELD_NAME, FIELD_TITLE, FIELD_AGE, FIELD_RATING];

const EDITORS: ReadonlyMap<string, CngxFilterEditor> = new Map<string, CngxFilterEditor>([
  ['string', 'native:string'],
  ['number', 'native:number'],
]);

function createSink() {
  return {
    applyFieldChange: vi.fn<CngxFilterRowWriteSink['applyFieldChange']>(),
    setOperator: vi.fn<CngxFilterRowWriteSink['setOperator']>(),
    setValue: vi.fn<CngxFilterRowWriteSink['setValue']>(),
    remove: vi.fn<CngxFilterRowWriteSink['remove']>(),
  };
}

function createHarness(initialNode: FilterExpression | null = null) {
  const node = signal<FilterExpression | null>(initialNode);
  const fields = signal<readonly FilterFieldDef[]>(FIELDS);
  const sink = createSink();
  const deps: CngxFilterRowControllerDeps = {
    node,
    fields,
    templates: signal(null),
    config: CNGX_FILTER_BUILDER_DEFAULTS,
    editors: EDITORS,
    sink,
  };
  return { node, fields, sink, controller: createFilterRowController(deps) };
}

describe('createFilterRowController - field-change carry-over', () => {
  it('keeps a still-valid operator and does not reset the value', () => {
    const { controller, sink } = createHarness(createFilterExpression('name', 'eq', 'foo'));

    controller.handleFieldChange('title');

    expect(sink.applyFieldChange).toHaveBeenCalledExactlyOnceWith({
      field: 'title',
      operator: 'eq',
      resetValue: false,
    });
  });

  it('falls back to the new field default and resets the value when the operator is invalid', () => {
    const { controller, sink } = createHarness(createFilterExpression('age', 'lt', 5));

    controller.handleFieldChange('name');

    expect(sink.applyFieldChange).toHaveBeenCalledExactlyOnceWith({
      field: 'name',
      operator: 'contains',
      resetValue: true,
    });
  });

  it('honours a per-field operator list over the editor-type defaults', () => {
    const { controller, sink } = createHarness(createFilterExpression('age', 'eq', 5));

    controller.handleFieldChange('rating');

    expect(sink.applyFieldChange).toHaveBeenCalledExactlyOnceWith({
      field: 'rating',
      operator: 'gte',
      resetValue: true,
    });
  });

  it('plans the seed path from a null node with the default operator and a reset', () => {
    const { controller, sink } = createHarness(null);

    controller.handleFieldChange('name');

    expect(sink.applyFieldChange).toHaveBeenCalledExactlyOnceWith({
      field: 'name',
      operator: 'contains',
      resetValue: true,
    });
  });

  it('ignores an undefined field change', () => {
    const { controller, sink } = createHarness(createFilterExpression('name', 'eq', 'foo'));

    controller.handleFieldChange(undefined);

    expect(sink.applyFieldChange).not.toHaveBeenCalled();
  });
});

describe('createFilterRowController - reference stability', () => {
  it('keeps the fieldOptions reference when fields are replaced with equal content', () => {
    const { controller, fields } = createHarness(createFilterExpression('name', 'eq', 'foo'));
    const first = controller.fieldOptions();

    fields.set([...FIELDS.map((f) => ({ ...f }))]);

    expect(controller.fieldOptions()).toBe(first);
  });

  it('keeps the operators and operatorOptions references across an equal node rewrite', () => {
    const { controller, node } = createHarness(createFilterExpression('name', 'eq', 'foo'));
    const firstOperators = controller.operators();
    const firstOptions = controller.operatorOptions();

    node.set(createFilterExpression('name', 'eq', 'bar'));

    expect(controller.operators()).toBe(firstOperators);
    expect(controller.operatorOptions()).toBe(firstOptions);
  });

  it('recomputes operators when the field actually changes', () => {
    const { controller, node } = createHarness(createFilterExpression('name', 'eq', 'foo'));
    const stringOperators = controller.operators();

    node.set(createFilterExpression('age', 'eq', 5));

    expect(controller.operators()).not.toBe(stringOperators);
    expect(controller.operators()).toEqual(CNGX_FILTER_BUILDER_DEFAULTS.defaultOperators['number']);
  });
});

describe('createFilterRowController - sink call discipline', () => {
  it('routes an operator change through setOperator exactly once', () => {
    const { controller, sink } = createHarness(createFilterExpression('name', 'eq', 'foo'));

    controller.handleOperatorChange('neq');

    expect(sink.setOperator).toHaveBeenCalledExactlyOnceWith('neq');
    expect(sink.setValue).not.toHaveBeenCalled();
    expect(sink.applyFieldChange).not.toHaveBeenCalled();
  });

  it('ignores an undefined operator change', () => {
    const { controller, sink } = createHarness(createFilterExpression('name', 'eq', 'foo'));

    controller.handleOperatorChange(undefined);

    expect(sink.setOperator).not.toHaveBeenCalled();
  });

  it('writes native input values through setValue exactly once each', () => {
    const { controller, sink } = createHarness(createFilterExpression('name', 'eq', 'foo'));
    const input = document.createElement('input');

    input.value = 'bar';
    controller.handleStringValueInput({ target: input } as unknown as Event);
    expect(sink.setValue).toHaveBeenCalledExactlyOnceWith('bar');

    sink.setValue.mockClear();
    input.value = '42';
    controller.handleNumberValueInput({ target: input } as unknown as Event);
    expect(sink.setValue).toHaveBeenCalledExactlyOnceWith(42);

    sink.setValue.mockClear();
    input.value = '';
    controller.handleNumberValueInput({ target: input } as unknown as Event);
    expect(sink.setValue).toHaveBeenCalledExactlyOnceWith(null);

    sink.setValue.mockClear();
    input.value = '2026-09-11';
    controller.handleDateValueInput({ target: input } as unknown as Event);
    expect(sink.setValue).toHaveBeenCalledExactlyOnceWith('2026-09-11');

    sink.setValue.mockClear();
    controller.handleBooleanValueChange(true);
    expect(sink.setValue).toHaveBeenCalledExactlyOnceWith(true);
  });

  it('routes remove through the sink from both the handler and the slot context', () => {
    const { controller, sink } = createHarness(createFilterExpression('name', 'eq', 'foo'));

    controller.handleRemove();
    expect(sink.remove).toHaveBeenCalledTimes(1);

    controller.removeButtonContext([0, 1]).remove();
    expect(sink.remove).toHaveBeenCalledTimes(2);
  });
});

describe('createFilterRowController - derivations', () => {
  it('resolves the editor from the registry via the field editorType', () => {
    const { controller, node } = createHarness(createFilterExpression('name', 'eq', 'foo'));

    expect(controller.editor()).toBe('native:string');

    node.set(createFilterExpression('age', 'eq', 5));
    expect(controller.editor()).toBe('native:number');

    node.set(null);
    expect(controller.editor()).toBeUndefined();
  });

  it('builds the value-editor context against the current node and routes setValue to the sink', () => {
    const expression = createFilterExpression('name', 'eq', 'foo');
    const { controller, sink } = createHarness(expression);

    const ctx = controller.valueEditorContext();
    expect(ctx).not.toBeNull();
    expect(ctx?.value).toBe('foo');
    expect(ctx?.fieldDef).toBe(FIELD_NAME);
    expect(ctx?.expression).toBe(expression);

    ctx?.setValue('bar');
    expect(sink.setValue).toHaveBeenCalledExactlyOnceWith('bar');
  });

  it('returns a null value-editor context for a null node or unknown field', () => {
    const nullNode = createHarness(null);
    expect(nullNode.controller.valueEditorContext()).toBeNull();

    const unknownField = createHarness(createFilterExpression('ghost', 'eq', 'x'));
    expect(unknownField.controller.valueEditorContext()).toBeNull();
  });

  it('labels operators from i18n with a raw-key fallback and defaults unknown fields to eq', () => {
    const { controller } = createHarness(null);

    expect(controller.operatorLabel('eq')).toBe('Equals');
    expect(controller.operatorLabel('customOp')).toBe('customOp');
    expect(controller.defaultOperatorFor('ghost')).toBe('eq');
    expect(controller.defaultOperatorFor('rating')).toBe('gte');
  });

  it('marks a missing node or blank field/operator as incomplete and labels it unbound', () => {
    const { controller, node } = createHarness(null);

    expect(controller.isIncomplete()).toBe(true);
    expect(controller.ariaLabel()).toBe(CNGX_FILTER_BUILDER_DEFAULTS.i18n.unboundFilterLabel);

    node.set(createFilterExpression('name', 'eq', 'foo'));
    expect(controller.isIncomplete()).toBe(false);
    expect(controller.ariaLabel()).toBe('Filter: Name eq');
  });
});

describe('createFilterRowController - operator registry integration', () => {
  it('resolves labels through the def tier between i18n and the raw key', () => {
    const node = signal<FilterExpression | null>(null);
    const sink = createSink();
    const controller = createFilterRowController({
      node,
      fields: signal<readonly FilterFieldDef[]>(FIELDS),
      templates: signal(null),
      config: {
        ...CNGX_FILTER_BUILDER_DEFAULTS,
        operators: new Map([
          ...CNGX_FILTER_BUILDER_DEFAULTS.operators,
          ['lengthGt', { label: 'Longer than', evaluate: () => false }],
        ]),
      },
      editors: EDITORS,
      sink,
    });

    expect(controller.operatorLabel('eq')).toBe('Equals');
    expect(controller.operatorLabel('lengthGt')).toBe('Longer than');
    expect(controller.operatorLabel('ghostOp')).toBe('ghostOp');
  });

  it('marks an empty-value expression incomplete unless its operator is valueless', () => {
    const { controller, node } = createHarness(createFilterExpression('name', 'eq'));

    expect(controller.isIncomplete()).toBe(true);

    node.set(createFilterExpression('name', 'isEmpty'));
    expect(controller.isIncomplete()).toBe(false);
  });

  it('honours a registered valueless operator in the incomplete derivation', () => {
    const node = signal<FilterExpression | null>(createFilterExpression('name', 'isBlankish'));
    const sink = createSink();
    const controller = createFilterRowController({
      node,
      fields: signal<readonly FilterFieldDef[]>(FIELDS),
      templates: signal(null),
      config: {
        ...CNGX_FILTER_BUILDER_DEFAULTS,
        operators: new Map([
          ...CNGX_FILTER_BUILDER_DEFAULTS.operators,
          ['isBlankish', { valueless: true, evaluate: () => false }],
        ]),
      },
      editors: EDITORS,
      sink,
    });

    expect(controller.isIncomplete()).toBe(false);
  });
});
