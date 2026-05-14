import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, expect, it } from 'vitest';

import { CngxFilterBuilder } from './filter-builder.component';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import { createFilterExpression, createFilterGroup } from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];

@Component({
  template: `
    <cngx-filter-builder
      #builder="cngxFilterBuilder"
      [fields]="fields"
      [(value)]="value"
    ></cngx-filter-builder>
  `,
  imports: [CngxFilterBuilder],
})
class Host {
  readonly fields = FIELDS;
  value = signal<FilterGroup>(
    createFilterGroup('and', [
      createFilterExpression('name', 'eq', 'foo'),
      createFilterExpression('age', 'eq', 1),
    ]),
  );
  readonly builder = viewChild.required(CngxFilterBuilder, { read: CngxFilterBuilderPresenter });
}

function setup(): {
  fixture: ReturnType<typeof TestBed.createComponent<Host>>;
  host: Host;
  directive: CngxFilterBuilderPresenter;
} {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.flushEffects();
  const host = fixture.componentInstance;
  return { fixture, host, directive: host.builder() };
}

describe('CngxFilterBuilder — DOM identity across content edits', () => {
  it('setValue preserves the host element of every expression row', () => {
    const { fixture, directive } = setup();
    const before = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);
    expect(before).toHaveLength(2);

    directive.setValue([0], 'bar');
    fixture.detectChanges();
    TestBed.flushEffects();

    const after = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);
    expect(after).toHaveLength(2);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it('setField on one row does not destroy sibling DOM', () => {
    const { fixture, directive } = setup();
    const before = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);

    directive.setField([1], 'name');
    fixture.detectChanges();
    TestBed.flushEffects();

    const after = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it('addExpression appends a new row and leaves existing rows mounted', () => {
    const { fixture, directive } = setup();
    const before = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);

    directive.addExpression([], createFilterExpression('age', 'gt', 18));
    fixture.detectChanges();
    TestBed.flushEffects();

    const after = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);
    expect(after).toHaveLength(3);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
  });

  it('removeNode drops the targeted row and leaves siblings mounted', () => {
    const { fixture, directive } = setup();
    const before = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);

    directive.removeNode([0]);
    fixture.detectChanges();
    TestBed.flushEffects();

    const after = fixture.debugElement
      .queryAll(By.css('.cngx-filter-builder__expression'))
      .map((d) => d.nativeElement as HTMLElement);
    expect(after).toHaveLength(1);
    expect(after[0]).toBe(before[1]);
  });
});
