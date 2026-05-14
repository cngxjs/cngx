import { Injector, runInInjectionContext, signal, Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxFilterBuilderAddFilterButton,
  CngxFilterBuilderAddGroupButton,
  CngxFilterBuilderEmpty,
  CngxFilterBuilderExpressionTemplate,
  CngxFilterBuilderGroupTemplate,
  CngxFilterBuilderLogicToggle,
  CngxFilterBuilderRemoveButton,
  type CngxFilterBuilderAddFilterButtonContext,
  type CngxFilterBuilderAddGroupButtonContext,
  type CngxFilterBuilderEmptyContext,
  type CngxFilterBuilderExpressionTemplateContext,
  type CngxFilterBuilderGroupTemplateContext,
  type CngxFilterBuilderLogicToggleContext,
  type CngxFilterBuilderRemoveButtonContext,
} from './filter-builder-slots';
import {
  CngxFilterBuilderValueEditor,
  type CngxFilterBuilderValueEditorContext,
} from './filter-builder-value-editor.slot';
import {
  createFilterBuilderTemplateRegistry,
  type CngxFilterBuilderTemplateRegistryQueries,
} from './filter-builder-template-registry';
import {
  provideFilterBuilderConfig,
  withTemplates,
} from './filter-builder.config';
import type { TemplateRef } from '@angular/core';

@Component({
  template: `
    <ng-template cngxFilterBuilderEmpty>empty</ng-template>
    <ng-template cngxFilterBuilderExpressionTemplate>expr</ng-template>
    <ng-template cngxFilterBuilderGroupTemplate>group</ng-template>
    <ng-template cngxFilterBuilderAddFilterButton>add-filter</ng-template>
    <ng-template cngxFilterBuilderAddGroupButton>add-group</ng-template>
    <ng-template cngxFilterBuilderRemoveButton>remove</ng-template>
    <ng-template cngxFilterBuilderLogicToggle>logic</ng-template>
  `,
  imports: [
    CngxFilterBuilderEmpty,
    CngxFilterBuilderExpressionTemplate,
    CngxFilterBuilderGroupTemplate,
    CngxFilterBuilderAddFilterButton,
    CngxFilterBuilderAddGroupButton,
    CngxFilterBuilderRemoveButton,
    CngxFilterBuilderLogicToggle,
  ],
})
class SlotHost {
  readonly empty = viewChild.required(CngxFilterBuilderEmpty);
  readonly expressionTemplate = viewChild.required(CngxFilterBuilderExpressionTemplate);
  readonly groupTemplate = viewChild.required(CngxFilterBuilderGroupTemplate);
  readonly addFilterButton = viewChild.required(CngxFilterBuilderAddFilterButton);
  readonly addGroupButton = viewChild.required(CngxFilterBuilderAddGroupButton);
  readonly removeButton = viewChild.required(CngxFilterBuilderRemoveButton);
  readonly logicToggle = viewChild.required(CngxFilterBuilderLogicToggle);
}

describe('filter-builder slot directives', () => {
  it('all 7 directives mount on ng-template selectors and expose viewChild handles', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(host.empty()).toBeTruthy();
    expect(host.expressionTemplate()).toBeTruthy();
    expect(host.groupTemplate()).toBeTruthy();
    expect(host.addFilterButton()).toBeTruthy();
    expect(host.addGroupButton()).toBeTruthy();
    expect(host.removeButton()).toBeTruthy();
    expect(host.logicToggle()).toBeTruthy();
  });

  it('exposes templateRef on every slot directive instance', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(host.empty().templateRef).toBeTruthy();
    expect(host.expressionTemplate().templateRef).toBeTruthy();
    expect(host.groupTemplate().templateRef).toBeTruthy();
    expect(host.addFilterButton().templateRef).toBeTruthy();
    expect(host.addGroupButton().templateRef).toBeTruthy();
    expect(host.removeButton().templateRef).toBeTruthy();
    expect(host.logicToggle().templateRef).toBeTruthy();
  });

  it('ngTemplateContextGuard returns true for every slot directive', () => {
    expect(CngxFilterBuilderEmpty.ngTemplateContextGuard(null as unknown as CngxFilterBuilderEmpty, {})).toBe(true);
    expect(CngxFilterBuilderExpressionTemplate.ngTemplateContextGuard(null as unknown as CngxFilterBuilderExpressionTemplate, {})).toBe(true);
    expect(CngxFilterBuilderGroupTemplate.ngTemplateContextGuard(null as unknown as CngxFilterBuilderGroupTemplate, {})).toBe(true);
    expect(CngxFilterBuilderAddFilterButton.ngTemplateContextGuard(null as unknown as CngxFilterBuilderAddFilterButton, {})).toBe(true);
    expect(CngxFilterBuilderAddGroupButton.ngTemplateContextGuard(null as unknown as CngxFilterBuilderAddGroupButton, {})).toBe(true);
    expect(CngxFilterBuilderRemoveButton.ngTemplateContextGuard(null as unknown as CngxFilterBuilderRemoveButton, {})).toBe(true);
    expect(CngxFilterBuilderLogicToggle.ngTemplateContextGuard(null as unknown as CngxFilterBuilderLogicToggle, {})).toBe(true);
  });

  it('valueEditor directive mounts on its ng-template selector', () => {
    @Component({
      template: `<ng-template cngxFilterBuilderValueEditor>value-editor</ng-template>`,
      imports: [CngxFilterBuilderValueEditor],
    })
    class ValueEditorHost {
      readonly valueEditor = viewChild.required(CngxFilterBuilderValueEditor);
    }

    const fixture = TestBed.createComponent(ValueEditorHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.valueEditor()).toBeTruthy();
    expect(fixture.componentInstance.valueEditor().templateRef).toBeTruthy();
    expect(
      CngxFilterBuilderValueEditor.ngTemplateContextGuard(
        null as unknown as CngxFilterBuilderValueEditor,
        {},
      ),
    ).toBe(true);
  });

  it('valueEditor context interface is structurally well-formed', () => {
    const context: CngxFilterBuilderValueEditorContext<string> = {
      value: 'foo',
      fieldDef: { key: 'name', label: 'Name', editorType: 'string' },
      setValue: () => undefined,
      expression: { type: 'expression', id: 'e1', field: 'name', operator: 'eq', value: 'foo' },
    };
    expect(context.value).toBe('foo');
    expect(context.fieldDef.key).toBe('name');
    expect(context.expression.id).toBe('e1');
  });

  it('context interfaces are structurally well-formed', () => {
    const empty: CngxFilterBuilderEmptyContext = { addFilter: () => undefined, addGroup: () => undefined };
    const expression: CngxFilterBuilderExpressionTemplateContext = {
      expression: { type: 'expression', id: 'e1', field: 'name', operator: 'eq', value: 'x' },
      fieldDef: { key: 'name', label: 'Name', editorType: 'string' },
      availableOperators: ['eq'],
      value: 'x',
      setField: () => undefined,
      setOperator: () => undefined,
      setValue: () => undefined,
      remove: () => undefined,
    };
    const group: CngxFilterBuilderGroupTemplateContext = {
      group: { type: 'group', id: 'g1', logic: 'and', negated: false, filters: [] },
      logic: 'and',
      isRoot: true,
      setLogic: () => undefined,
      toggleNegated: () => undefined,
      addFilter: () => undefined,
      addGroup: () => undefined,
      remove: () => undefined,
    };
    const addFilter: CngxFilterBuilderAddFilterButtonContext = {
      add: () => undefined,
      label: 'Add filter',
      disabled: false,
    };
    const addGroup: CngxFilterBuilderAddGroupButtonContext = {
      add: () => undefined,
      label: 'Add group',
      disabled: false,
    };
    const remove: CngxFilterBuilderRemoveButtonContext = {
      remove: () => undefined,
      label: 'Remove',
    };
    const logicToggle: CngxFilterBuilderLogicToggleContext = {
      logic: 'and',
      options: ['and', 'or'],
      setLogic: () => undefined,
    };
    expect([empty, expression, group, addFilter, addGroup, remove, logicToggle]).toHaveLength(7);
  });
});

function fakeTemplate<Ctx>(): TemplateRef<Ctx> {
  return { elementRef: undefined } as unknown as TemplateRef<Ctx>;
}

function emptyQueriesWithValueEditor(): CngxFilterBuilderTemplateRegistryQueries {
  return {
    empty: signal(undefined),
    expressionTemplate: signal(undefined),
    groupTemplate: signal(undefined),
    addFilterButton: signal(undefined),
    addGroupButton: signal(undefined),
    removeButton: signal(undefined),
    logicToggle: signal(undefined),
    negationToggle: signal(undefined),
    valueEditor: signal(undefined),
  };
}

describe('cngxFilterBuilderValueEditor — 3-stage cascade resolution', () => {
  it('returns the directive templateRef when contentChild resolves', () => {
    TestBed.configureTestingModule({});
    const injector = TestBed.inject(Injector);
    const directiveTpl = fakeTemplate<CngxFilterBuilderValueEditorContext<unknown>>();
    const directive = {
      templateRef: directiveTpl,
    } as unknown as CngxFilterBuilderValueEditor;

    runInInjectionContext(injector, () => {
      const registry = createFilterBuilderTemplateRegistry({
        ...emptyQueriesWithValueEditor(),
        valueEditor: signal(directive),
      });
      expect(registry.valueEditor()).toBe(directiveTpl);
    });
  });

  it('falls through to CONFIG.templates.valueEditor when contentChild is undefined', () => {
    const configTpl = fakeTemplate<CngxFilterBuilderValueEditorContext<unknown>>();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ valueEditor: configTpl }))],
    });
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      const registry = createFilterBuilderTemplateRegistry(emptyQueriesWithValueEditor());
      expect(registry.valueEditor()).toBe(configTpl);
    });
  });

  it('returns null when neither contentChild nor CONFIG.templates provide a ref', () => {
    TestBed.configureTestingModule({});
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      const registry = createFilterBuilderTemplateRegistry(emptyQueriesWithValueEditor());
      expect(registry.valueEditor()).toBeNull();
    });
  });

  it('instance contentChild wins over CONFIG.templates when both are set', () => {
    const configTpl = fakeTemplate<CngxFilterBuilderValueEditorContext<unknown>>();
    const directiveTpl = fakeTemplate<CngxFilterBuilderValueEditorContext<unknown>>();
    TestBed.configureTestingModule({
      providers: [provideFilterBuilderConfig(withTemplates({ valueEditor: configTpl }))],
    });
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      const directive = {
        templateRef: directiveTpl,
      } as unknown as CngxFilterBuilderValueEditor;
      const registry = createFilterBuilderTemplateRegistry({
        ...emptyQueriesWithValueEditor(),
        valueEditor: signal(directive),
      });
      expect(registry.valueEditor()).toBe(directiveTpl);
    });
  });
});
