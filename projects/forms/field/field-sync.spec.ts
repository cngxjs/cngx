import { Component, computed, model, signal, viewChild, type ModelSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { createMockField } from './testing/public-api';
import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from './form-field.token';
import { createFieldSync } from './field-sync';

/** Minimal numeric control that wires its `value` model to the field. */
@Component({
  selector: 'test-numeric-control',
  standalone: true,
  template: '',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: NumericControl }],
})
class NumericControl implements CngxFormFieldControl {
  readonly value: ModelSignal<number> = model<number>(0);
  readonly id = signal('test-numeric');
  readonly focused = signal(false);
  readonly empty = computed(() => this.value() === 0);
  readonly disabled = signal(false);
  readonly errorState = signal(false);

  constructor() {
    createFieldSync<number>({
      componentValue: this.value,
      valueEquals: Object.is,
      coerceFromField: (v) => (typeof v === 'number' ? v : 0),
    });
  }
}

describe('createFieldSync', () => {
  it('is a no-op without a surrounding form field', () => {
    @Component({ template: '<test-numeric-control />', imports: [NumericControl] })
    class Host {
      readonly control = viewChild.required(NumericControl);
    }
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(fixture.componentInstance.control().value()).toBe(0);
  });

  it('syncs field -> control and control -> field', () => {
    const { accessor, ref } = createMockField<number>({ name: 'rating', value: 0 });

    @Component({
      template: `
        <cngx-form-field [field]="field">
          <test-numeric-control />
        </cngx-form-field>
      `,
      imports: [CngxFormField, NumericControl],
    })
    class Host {
      readonly control = viewChild.required(NumericControl);
      readonly field = accessor;
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();

    ref.value.set(4);
    TestBed.flushEffects();
    expect(fixture.componentInstance.control().value()).toBe(4);

    fixture.componentInstance.control().value.set(2);
    TestBed.flushEffects();
    expect(ref.value()).toBe(2);
  });
});
