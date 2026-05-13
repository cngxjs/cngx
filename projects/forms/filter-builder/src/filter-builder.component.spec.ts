import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { CngxFilterBuilder } from './filter-builder.component';
import { CngxFilterBuilderEmpty } from './filter-builder-slots';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import { createEmptyFilterRoot, createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

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

describe('CngxFilterBuilder — two-way binding', () => {
  it('flows mutator writes back into the consumer value model', () => {
    const { fixture, host, presenter } = basicSetup();
    presenter.addExpression([], createFilterExpression('name', 'eq', 'foo'));
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(host.value.filters).toHaveLength(1);
  });
});
