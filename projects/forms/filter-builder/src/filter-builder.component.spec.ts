import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxFilterBuilder } from './filter-builder.component';
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
} from './filter-builder-slots';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import { createEmptyFilterRoot, createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';
import { createManualState } from '@cngx/common/data';

function createLoadingState() {
  const state = createManualState<unknown>();
  state.set('loading');
  return state;
}

function createErrorState(err: unknown) {
  const state = createManualState<unknown>();
  state.setError(err);
  return state;
}

const FIELD_NAME: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const FIELD_AGE: FilterFieldDef = { key: 'age', label: 'Age', editorType: 'number' };
const FIELDS: readonly FilterFieldDef[] = [FIELD_NAME, FIELD_AGE];

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value"></cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder],
})
class BasicHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createEmptyFilterRoot();
  readonly builder = viewChild.required(CngxFilterBuilder);
}

function basicSetup(initial: FilterGroup = createEmptyFilterRoot()): {
  fixture: ReturnType<typeof TestBed.createComponent<BasicHost>>;
  host: BasicHost;
  presenter: CngxFilterBuilderPresenter;
  hostEl: HTMLElement;
} {
  const fixture = TestBed.createComponent(BasicHost);
  fixture.componentInstance.value = initial;
  fixture.detectChanges();
  TestBed.flushEffects();
  const presenter = (fixture.componentInstance.builder() as unknown as { presenter: CngxFilterBuilderPresenter }).presenter;
  return {
    fixture,
    host: fixture.componentInstance,
    presenter,
    hostEl: fixture.nativeElement as HTMLElement,
  };
}

describe('CngxFilterBuilder — empty state', () => {
  it('renders the default empty message when no slot is provided', () => {
    const { hostEl } = basicSetup();
    expect(hostEl.textContent).toContain('No filters defined');
  });

  it('shows Add filter and Add group buttons in the empty fallback', () => {
    const { hostEl } = basicSetup();
    const buttons = Array.from(hostEl.querySelectorAll('button')).map((b) => b.textContent?.trim());
    expect(buttons).toContain('Add filter');
    expect(buttons).toContain('Add group');
  });
});

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value">
      <ng-template cngxFilterBuilderEmpty>
        <span data-empty-slot>custom-empty</span>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderEmpty],
})
class EmptySlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createEmptyFilterRoot();
}

describe('CngxFilterBuilder — custom empty slot', () => {
  it('renders the consumer-supplied *cngxFilterBuilderEmpty template when present', () => {
    const fixture = TestBed.createComponent(EmptySlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-empty-slot]')).toBeTruthy();
    expect(el.textContent).not.toContain('No filters defined');
  });
});

describe('CngxFilterBuilder — recursive tree rendering', () => {
  it('renders a 3-level group-in-group-in-group structure', () => {
    const innermost = createFilterGroup('and', [createFilterExpression('name', 'eq', 'leaf')]);
    const middle = createFilterGroup('or', [innermost]);
    const root = createFilterGroup('and', [middle]);
    const { hostEl } = basicSetup(root);

    const groups = hostEl.querySelectorAll('.cngx-filter-builder__group');
    expect(groups.length).toBe(3);
    const expressions = hostEl.querySelectorAll('.cngx-filter-builder__expression');
    expect(expressions.length).toBe(1);
  });
});

describe('CngxFilterBuilder — announcer text', () => {
  it('announces "Filter added: name" when add filter button is clicked', () => {
    const { fixture, hostEl, presenter } = basicSetup();
    const addButton = Array.from(hostEl.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Add filter',
    ) as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(presenter.announcement()).toBe('Filter added: name');
  });

  it('announces "Logic changed to OR" when the logic select changes', () => {
    const initial = createFilterGroup('and', [createFilterExpression('name', 'eq', 'x')]);
    const { fixture, hostEl, presenter } = basicSetup(initial);
    const logicSelect = hostEl.querySelector('select') as HTMLSelectElement;
    logicSelect.value = 'or';
    logicSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(presenter.announcement()).toBe('Logic changed to OR');
  });

  it('announces "Filter removed: name eq \\"foo\\"" on remove', () => {
    const initial = createFilterGroup('and', [createFilterExpression('name', 'eq', 'foo')]);
    const { fixture, presenter } = basicSetup(initial);
    presenter.removeNode([0]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(presenter.announcement()).toBe('Filter removed: name eq "foo"');
  });

  it('announces "Group negated" on toggleNegated', () => {
    const initial = createFilterGroup('and', [createFilterExpression('name', 'eq', 'x')]);
    const { fixture, presenter } = basicSetup(initial);
    presenter.toggleNegated([]);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(presenter.announcement()).toBe('Group negated');
  });
});

describe('CngxFilterBuilder — ARIA labels reactive', () => {
  it('updates group aria-label when logic changes', () => {
    const initial = createFilterGroup('and', [createFilterExpression('name', 'eq', 'x')]);
    const { fixture, hostEl, presenter } = basicSetup(initial);
    const rootGroup = hostEl.querySelector('.cngx-filter-builder__group') as HTMLElement;
    expect(rootGroup.getAttribute('aria-label')).toBe('Root filter group (AND)');

    presenter.setLogic([], 'or');
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(rootGroup.getAttribute('aria-label')).toBe('Root filter group (OR)');
  });

  it('renders aria-label="role=group" on expression containers', () => {
    const initial = createFilterGroup('and', [createFilterExpression('name', 'contains', 'foo')]);
    const { hostEl } = basicSetup(initial);
    const expr = hostEl.querySelector('.cngx-filter-builder__expression') as HTMLElement;
    expect(expr.getAttribute('role')).toBe('group');
    expect(expr.getAttribute('aria-label')).toBe('Filter: Name contains');
  });
});

describe('CngxFilterBuilder — slot-context reference stability', () => {
  it('addFilterButtonContext returns the same reference for content-equal paths', () => {
    const { fixture } = basicSetup();
    const builder = fixture.componentInstance.builder() as unknown as {
      addFilterButtonContext(path: readonly number[]): unknown;
    };
    const a = builder.addFilterButtonContext([0, 1]);
    const b = builder.addFilterButtonContext([0, 1]);
    expect(b).toBe(a);
  });

  it('removeButtonContext caches by (path, label) tuple', () => {
    const { fixture } = basicSetup();
    const builder = fixture.componentInstance.builder() as unknown as {
      removeButtonContext(path: readonly number[], label: string): unknown;
    };
    const a = builder.removeButtonContext([0], 'Remove');
    const b = builder.removeButtonContext([0], 'Remove');
    const c = builder.removeButtonContext([0], 'Different');
    expect(b).toBe(a);
    expect(c).not.toBe(a);
  });

  it('logicToggleContext rebuilds when group.logic changes', () => {
    const { fixture } = basicSetup();
    const builder = fixture.componentInstance.builder() as unknown as {
      logicToggleContext(group: FilterGroup, path: readonly number[]): unknown;
    };
    const groupAnd = createFilterGroup('and');
    const groupOr = createFilterGroup('or');
    const a = builder.logicToggleContext(groupAnd, []);
    const b = builder.logicToggleContext(groupAnd, []);
    const c = builder.logicToggleContext(groupOr, []);
    expect(b).toBe(a);
    expect(c).not.toBe(a);
  });
});

describe('CngxFilterBuilder — child path stability', () => {
  it('childPath returns the same reference when (parent, child, index) is unchanged', () => {
    const { fixture } = basicSetup();
    const builder = fixture.componentInstance.builder() as unknown as {
      childPath(parent: readonly number[], child: FilterGroup, index: number): readonly number[];
      readonly rootPath: readonly number[];
    };
    const child = createFilterGroup('and');
    const a = builder.childPath(builder.rootPath, child, 0);
    const b = builder.childPath(builder.rootPath, child, 0);
    expect(b).toBe(a);
  });

  it('childPath rebuilds when index changes', () => {
    const { fixture } = basicSetup();
    const builder = fixture.componentInstance.builder() as unknown as {
      childPath(parent: readonly number[], child: FilterGroup, index: number): readonly number[];
      readonly rootPath: readonly number[];
    };
    const child = createFilterGroup('and');
    const a = builder.childPath(builder.rootPath, child, 0);
    const b = builder.childPath(builder.rootPath, child, 1);
    expect(b).not.toBe(a);
    expect([...b]).toEqual([1]);
  });
});

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value">
      <ng-template cngxFilterBuilderGroupTemplate let-group="group" let-isRoot="isRoot">
        <div data-custom-group [attr.data-is-root]="isRoot">CUSTOM GROUP: {{ group.logic }}</div>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderGroupTemplate],
})
class GroupTemplateSlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createFilterGroup('and', [createFilterExpression('name', 'eq', 'x')]);
}

describe('CngxFilterBuilder — group template slot', () => {
  it('replaces the default recursive group body when supplied', () => {
    const fixture = TestBed.createComponent(GroupTemplateSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    const custom = el.querySelector('[data-custom-group]');
    expect(custom).toBeTruthy();
    expect(custom?.getAttribute('data-is-root')).toBe('true');
    expect(custom?.textContent).toContain('and');
    expect(el.querySelector('.cngx-filter-builder__group')).toBeNull();
  });
});

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value">
      <ng-template cngxFilterBuilderExpressionTemplate let-expression="expression" let-fieldDef="fieldDef">
        <span data-custom-expr>{{ fieldDef?.label }}: {{ expression.value }}</span>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderExpressionTemplate],
})
class ExpressionTemplateSlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createFilterGroup('and', [createFilterExpression('name', 'eq', 'foo')]);
}

describe('CngxFilterBuilder — expression template slot', () => {
  it('replaces the default expression rendering when supplied', () => {
    const fixture = TestBed.createComponent(ExpressionTemplateSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    const custom = el.querySelector('[data-custom-expr]');
    expect(custom).toBeTruthy();
    expect(custom?.textContent).toContain('Name: foo');
    expect(el.querySelector('.cngx-filter-builder__expression')).toBeNull();
  });
});

describe('CngxFilterBuilder — two-way binding', () => {
  it('flows mutator writes back into the consumer value model', () => {
    const { fixture, host, presenter } = basicSetup();
    presenter.addExpression([], createFilterExpression('name', 'eq', 'foo'));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.value.filters).toHaveLength(1);
  });
});

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value">
      <ng-template cngxFilterBuilderAddFilterButton let-add="add" let-label="label">
        <button type="button" data-custom-add-filter (click)="add()">{{ label }} (custom)</button>
      </ng-template>
      <ng-template cngxFilterBuilderAddGroupButton let-add="add" let-label="label">
        <button type="button" data-custom-add-group (click)="add()">{{ label }} (custom)</button>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderAddFilterButton, CngxFilterBuilderAddGroupButton],
})
class AddButtonSlotsHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createEmptyFilterRoot();
}

describe('CngxFilterBuilder — action button slots', () => {
  it('renders the consumer-supplied addFilterButton and addGroupButton in the empty fallback', () => {
    const fixture = TestBed.createComponent(AddButtonSlotsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-custom-add-filter]')).toBeTruthy();
    expect(el.querySelector('[data-custom-add-group]')).toBeTruthy();
  });

  it('still invokes addExpression when the custom add-filter button is clicked', () => {
    const fixture = TestBed.createComponent(AddButtonSlotsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    const btn = el.querySelector('[data-custom-add-filter]') as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.componentInstance.value.filters).toHaveLength(1);
  });
});

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value">
      <ng-template cngxFilterBuilderRemoveButton let-remove="remove" let-label="label">
        <button type="button" data-custom-remove (click)="remove()">{{ label }} (custom)</button>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderRemoveButton],
})
class RemoveButtonSlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createFilterGroup('and', [createFilterExpression('name', 'eq', 'x')]);
}

describe('CngxFilterBuilder — remove button slot', () => {
  it('renders the consumer-supplied removeButton on each expression', () => {
    const fixture = TestBed.createComponent(RemoveButtonSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-custom-remove]')).toBeTruthy();
  });
});

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="value">
      <ng-template cngxFilterBuilderLogicToggle let-logic="logic">
        <span data-custom-logic-toggle>{{ logic }}</span>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderLogicToggle],
})
class LogicToggleSlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createFilterGroup('or', [createFilterExpression('name', 'eq', 'x')]);
}

describe('CngxFilterBuilder — logic toggle slot', () => {
  it('renders the consumer-supplied logicToggle template with the current logic in context', () => {
    const fixture = TestBed.createComponent(LogicToggleSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    const custom = el.querySelector('[data-custom-logic-toggle]');
    expect(custom).toBeTruthy();
    expect(custom?.textContent?.trim()).toBe('or');
  });
});

@Component({
  template: `
    <cngx-filter-builder
      [fields]="fields()"
      [(value)]="value"
      [cngxFilterBuilderState]="loadingState"
    >
      <ng-template cngxFilterBuilderLoading>
        <span data-custom-loading>loading-custom</span>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderLoading],
})
class LoadingSlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createEmptyFilterRoot();
  readonly loadingState = createLoadingState();
}

describe('CngxFilterBuilder — loading slot', () => {
  it('renders the consumer-supplied loading template when state.status is loading', () => {
    const fixture = TestBed.createComponent(LoadingSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-custom-loading]')).toBeTruthy();
    expect(el.textContent).not.toContain('No filters defined');
  });

  it('renders the default loading text when no slot is supplied', () => {
    @Component({
      template: `<cngx-filter-builder [fields]="fields()" [(value)]="value" [cngxFilterBuilderState]="state"></cngx-filter-builder>`,
      imports: [CngxFilterBuilder],
    })
    class Host {
      readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
      value: FilterGroup = createEmptyFilterRoot();
      readonly state = createLoadingState();
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Loading filters');
  });
});

@Component({
  template: `
    <cngx-filter-builder
      [fields]="fields()"
      [(value)]="value"
      [cngxFilterBuilderState]="errorState"
    >
      <ng-template cngxFilterBuilderError let-error="error">
        <span data-custom-error>error-custom: {{ error }}</span>
      </ng-template>
    </cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder, CngxFilterBuilderError],
})
class ErrorSlotHost {
  readonly fields = signal<readonly FilterFieldDef[]>(FIELDS);
  value: FilterGroup = createEmptyFilterRoot();
  readonly errorState = createErrorState('boom');
}

describe('CngxFilterBuilder — error slot', () => {
  it('renders the consumer-supplied error template with the error in context', () => {
    const fixture = TestBed.createComponent(ErrorSlotHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const el = fixture.nativeElement as HTMLElement;
    const custom = el.querySelector('[data-custom-error]');
    expect(custom).toBeTruthy();
    expect(custom?.textContent).toContain('boom');
  });
});
