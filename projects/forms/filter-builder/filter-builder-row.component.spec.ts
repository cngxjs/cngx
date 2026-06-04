import { ApplicationRef, Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CngxSelect } from '@cngx/forms/select';
import { describe, expect, it } from 'vitest';

import { CngxFilterRow } from './filter-builder-row.component';
import { createFilterExpression } from './filter-builder.helpers';
import type { FilterExpression, FilterFieldDef } from './filter-builder.types';

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];

@Component({
  standalone: true,
  template: `
    <cngx-filter-row
      [fields]="fields"
      [(value)]="expression"
    ></cngx-filter-row>
  `,
  imports: [CngxFilterRow],
})
class StandaloneHost {
  readonly fields = FIELDS;
  readonly expression = signal<FilterExpression | null>(
    createFilterExpression('name', 'eq', 'foo'),
  );
  readonly row = viewChild.required(CngxFilterRow);
}

describe('CngxFilterRow', () => {
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

  it('renders an empty-state field picker when [(value)] is null and fields are available', () => {
    @Component({
      standalone: true,
      template: `
        <cngx-filter-row [fields]="fields" [(value)]="expression"></cngx-filter-row>
      `,
      imports: [CngxFilterRow],
    })
    class NullHost {
      readonly fields = FIELDS;
      readonly expression = signal<FilterExpression | null>(null);
    }

    const fixture = TestBed.createComponent(NullHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    const emptyHolder = fixture.debugElement.query(
      By.css('.cngx-filter-builder__expression--empty'),
    );
    expect(emptyHolder).not.toBeNull();
    expect(emptyHolder.queryAll(By.directive(CngxSelect))).toHaveLength(1);
  });

  it('seeds a fresh expression with the chosen field plus default operator when the empty-state field-picker fires', () => {
    @Component({
      standalone: true,
      template: `
        <cngx-filter-row [fields]="fields" [(value)]="expression"></cngx-filter-row>
      `,
      imports: [CngxFilterRow],
    })
    class NullHost {
      readonly fields = FIELDS;
      readonly expression = signal<FilterExpression | null>(null);
    }

    const fixture = TestBed.createComponent(NullHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const fieldSelect = fixture.debugElement.query(By.directive(CngxSelect))
      .componentInstance as CngxSelect<string>;
    fieldSelect.value.set('age');
    fixture.detectChanges();
    TestBed.flushEffects();

    const seeded = fixture.componentInstance.expression();
    expect(seeded).not.toBeNull();
    expect(seeded?.field).toBe('age');
    expect(seeded?.operator).toBeTruthy();
    expect(seeded?.value).toBeUndefined();
  });

  it('renders nothing when [(value)] is null and no fields are provided', () => {
    @Component({
      standalone: true,
      template: `
        <cngx-filter-row [fields]="[]" [(value)]="expression"></cngx-filter-row>
      `,
      imports: [CngxFilterRow],
    })
    class NoFieldsHost {
      readonly expression = signal<FilterExpression | null>(null);
    }

    const fixture = TestBed.createComponent(NoFieldsHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.debugElement.query(By.css('.cngx-filter-builder__expression'))).toBeNull();
  });

  it('auto-seeds when fields has exactly one entry and [(value)] is null', async () => {
    const oneField: readonly FilterFieldDef[] = [
      { key: 'role', label: 'Role', editorType: 'string' },
    ];

    @Component({
      standalone: true,
      template: `
        <cngx-filter-row [fields]="fields" [(value)]="expression"></cngx-filter-row>
      `,
      imports: [CngxFilterRow],
    })
    class SingleFieldHost {
      readonly fields = oneField;
      readonly expression = signal<FilterExpression | null>(null);
    }

    const fixture = TestBed.createComponent(SingleFieldHost);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    TestBed.flushEffects();

    const seeded = fixture.componentInstance.expression();
    expect(seeded).not.toBeNull();
    expect(seeded?.field).toBe('role');
    expect(fixture.debugElement.query(By.css('.cngx-filter-builder__expression--empty'))).toBeNull();
    expect(fixture.debugElement.query(By.css('.cngx-filter-builder__field-select'))).toBeNull();
    const selects = fixture.debugElement.queryAll(By.directive(CngxSelect));
    expect(selects).toHaveLength(1);
  });

  it('hides the field-select when fields has exactly one entry and a value is bound', () => {
    const oneField: readonly FilterFieldDef[] = [
      { key: 'role', label: 'Role', editorType: 'string' },
    ];

    @Component({
      standalone: true,
      template: `
        <cngx-filter-row [fields]="fields" [(value)]="expression"></cngx-filter-row>
      `,
      imports: [CngxFilterRow],
    })
    class BoundSingleFieldHost {
      readonly fields = oneField;
      readonly expression = signal<FilterExpression | null>(
        createFilterExpression('role', 'eq', 'Engineer'),
      );
    }

    const fixture = TestBed.createComponent(BoundSingleFieldHost);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.debugElement.query(By.css('.cngx-filter-builder__field-select'))).toBeNull();
    const selects = fixture.debugElement.queryAll(By.directive(CngxSelect));
    expect(selects).toHaveLength(1);
  });

  it('does not re-seed after Remove writes null in single-field mode', async () => {
    const oneField: readonly FilterFieldDef[] = [
      { key: 'role', label: 'Role', editorType: 'string' },
    ];

    @Component({
      standalone: true,
      template: `
        <cngx-filter-row [fields]="fields" [(value)]="expression"></cngx-filter-row>
      `,
      imports: [CngxFilterRow],
    })
    class SingleFieldHost {
      readonly fields = oneField;
      readonly expression = signal<FilterExpression | null>(null);
    }

    const fixture = TestBed.createComponent(SingleFieldHost);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.componentInstance.expression()?.field).toBe('role');

    fixture.componentInstance.expression.set(null);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(fixture.componentInstance.expression()).toBeNull();
  });
});
