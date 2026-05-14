import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxSelect } from '@cngx/forms/select';
import { describe, expect, it } from 'vitest';

import { CngxFilterExpressionRow } from './filter-builder-expression-row.component';
import { createFilterExpression } from './filter-builder.helpers';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];

@Component({
  standalone: true,
  template: `
    <cngx-filter-expression-row
      [fields]="fields"
      [(value)]="expression"
    ></cngx-filter-expression-row>
  `,
  imports: [CngxFilterExpressionRow],
})
class StandaloneHost {
  readonly fields = FIELDS;
  readonly expression = signal<FilterExpression | null>(
    createFilterExpression('name', 'eq', 'foo'),
  );
  readonly row = viewChild.required(CngxFilterExpressionRow);
}

describe('CngxFilterExpressionRow — standalone mode', () => {
  it('mounts without a CNGX_FILTER_BUILDER_HOST provider', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.componentInstance.row()).toBeTruthy();
    expect(fixture.debugElement.queryAll(By.directive(CngxSelect))).toHaveLength(2);
  });

  it('emits value updates through [(value)] when the field-select changes', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const fieldSelect = fixture.debugElement.queryAll(By.directive(CngxSelect))[0]
      .componentInstance as CngxSelect<string>;
    fieldSelect.value.set('age');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.expression()?.field).toBe('age');
  });

  it('emits value updates through [(value)] when the operator-select changes', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const operatorSelect = fixture.debugElement.queryAll(By.directive(CngxSelect))[1]
      .componentInstance as CngxSelect<string>;
    operatorSelect.value.set('contains');
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.expression()?.operator).toBe('contains');
  });

  it('emits value updates through [(value)] when the text input fires (input)', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const input = fixture.debugElement.query(By.css('input[type="text"]'))
      .nativeElement as HTMLInputElement;
    input.value = 'bar';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.expression()?.value).toBe('bar');
  });

  it('clears the bound value to null when the remove button is clicked', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.expression()).toBeNull();
  });

  it('renders nothing when [(value)] is null', () => {
    @Component({
      standalone: true,
      template: `
        <cngx-filter-expression-row [fields]="fields" [(value)]="expression"></cngx-filter-expression-row>
      `,
      imports: [CngxFilterExpressionRow],
    })
    class NullHost {
      readonly fields = FIELDS;
      readonly expression = signal<FilterExpression | null>(null);
    }

    const fixture = TestBed.createComponent(NullHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.debugElement.query(By.css('.cngx-filter-builder__expression'))).toBeNull();
  });
});
