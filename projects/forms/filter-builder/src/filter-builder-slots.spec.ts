import { Component, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import {
  CngxFilterBuilderAddFilterButton,
  CngxFilterBuilderAddGroupButton,
  CngxFilterBuilderEmpty,
  CngxFilterBuilderError,
  CngxFilterBuilderExpressionTemplate,
  CngxFilterBuilderGroupTemplate,
  CngxFilterBuilderLoading,
  CngxFilterBuilderLogicToggle,
  CngxFilterBuilderRemoveButton,
  type CngxFilterBuilderAddFilterButtonContext,
  type CngxFilterBuilderAddGroupButtonContext,
  type CngxFilterBuilderEmptyContext,
  type CngxFilterBuilderErrorContext,
  type CngxFilterBuilderExpressionTemplateContext,
  type CngxFilterBuilderGroupTemplateContext,
  type CngxFilterBuilderLoadingContext,
  type CngxFilterBuilderLogicToggleContext,
  type CngxFilterBuilderRemoveButtonContext,
} from './filter-builder-slots';

@Component({
  template: `
    <ng-template cngxFilterBuilderLoading>loading</ng-template>
    <ng-template cngxFilterBuilderError>error</ng-template>
    <ng-template cngxFilterBuilderEmpty>empty</ng-template>
    <ng-template cngxFilterBuilderExpressionTemplate>expr</ng-template>
    <ng-template cngxFilterBuilderGroupTemplate>group</ng-template>
    <ng-template cngxFilterBuilderAddFilterButton>add-filter</ng-template>
    <ng-template cngxFilterBuilderAddGroupButton>add-group</ng-template>
    <ng-template cngxFilterBuilderRemoveButton>remove</ng-template>
    <ng-template cngxFilterBuilderLogicToggle>logic</ng-template>
  `,
  imports: [
    CngxFilterBuilderLoading,
    CngxFilterBuilderError,
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
  readonly loading = viewChild.required(CngxFilterBuilderLoading);
  readonly error = viewChild.required(CngxFilterBuilderError);
  readonly empty = viewChild.required(CngxFilterBuilderEmpty);
  readonly expressionTemplate = viewChild.required(CngxFilterBuilderExpressionTemplate);
  readonly groupTemplate = viewChild.required(CngxFilterBuilderGroupTemplate);
  readonly addFilterButton = viewChild.required(CngxFilterBuilderAddFilterButton);
  readonly addGroupButton = viewChild.required(CngxFilterBuilderAddGroupButton);
  readonly removeButton = viewChild.required(CngxFilterBuilderRemoveButton);
  readonly logicToggle = viewChild.required(CngxFilterBuilderLogicToggle);
}

describe('filter-builder slot directives', () => {
  it('all 9 directives mount on ng-template selectors and expose viewChild handles', () => {
    const fixture = TestBed.createComponent(SlotHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    expect(host.loading()).toBeTruthy();
    expect(host.error()).toBeTruthy();
    expect(host.empty()).toBeTruthy();
    expect(host.expressionTemplate()).toBeTruthy();
    expect(host.groupTemplate()).toBeTruthy();
    expect(host.addFilterButton()).toBeTruthy();
    expect(host.addGroupButton()).toBeTruthy();
    expect(host.removeButton()).toBeTruthy();
    expect(host.logicToggle()).toBeTruthy();
  });

  it('ngTemplateContextGuard returns true for every slot directive', () => {
    expect(CngxFilterBuilderLoading.ngTemplateContextGuard(null as unknown as CngxFilterBuilderLoading, {})).toBe(true);
    expect(CngxFilterBuilderError.ngTemplateContextGuard(null as unknown as CngxFilterBuilderError, {})).toBe(true);
    expect(CngxFilterBuilderEmpty.ngTemplateContextGuard(null as unknown as CngxFilterBuilderEmpty, {})).toBe(true);
    expect(CngxFilterBuilderExpressionTemplate.ngTemplateContextGuard(null as unknown as CngxFilterBuilderExpressionTemplate, {})).toBe(true);
    expect(CngxFilterBuilderGroupTemplate.ngTemplateContextGuard(null as unknown as CngxFilterBuilderGroupTemplate, {})).toBe(true);
    expect(CngxFilterBuilderAddFilterButton.ngTemplateContextGuard(null as unknown as CngxFilterBuilderAddFilterButton, {})).toBe(true);
    expect(CngxFilterBuilderAddGroupButton.ngTemplateContextGuard(null as unknown as CngxFilterBuilderAddGroupButton, {})).toBe(true);
    expect(CngxFilterBuilderRemoveButton.ngTemplateContextGuard(null as unknown as CngxFilterBuilderRemoveButton, {})).toBe(true);
    expect(CngxFilterBuilderLogicToggle.ngTemplateContextGuard(null as unknown as CngxFilterBuilderLogicToggle, {})).toBe(true);
  });

  it('context interfaces are structurally well-formed', () => {
    const loading: CngxFilterBuilderLoadingContext = { skeletonCount: 3 };
    const error: CngxFilterBuilderErrorContext = { error: new Error(), retry: () => undefined };
    const empty: CngxFilterBuilderEmptyContext = { addFilter: () => undefined, addGroup: () => undefined };
    const expression: CngxFilterBuilderExpressionTemplateContext = {
      expression: { type: 'expression', field: 'name', operator: 'eq', value: 'x' },
      fieldDef: { key: 'name', label: 'Name', editorType: 'string' },
      availableOperators: ['eq'],
      value: 'x',
      setField: () => undefined,
      setOperator: () => undefined,
      setValue: () => undefined,
      remove: () => undefined,
    };
    const group: CngxFilterBuilderGroupTemplateContext = {
      group: { type: 'group', logic: 'and', negated: false, filters: [] },
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
    expect([loading, error, empty, expression, group, addFilter, addGroup, remove, logicToggle]).toHaveLength(9);
  });
});
