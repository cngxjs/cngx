import {
  Component,
  computed,
  DestroyRef,
  inject,
  model,
  signal,
  VERSION,
  viewChild,
  type ModelSignal,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { debounce, form } from '@angular/forms/signals';
import { createMockField } from './testing/public-api';
import { CngxFormField } from './form-field.component';
import { CNGX_FORM_FIELD_CONTROL, type CngxFormFieldControl } from './form-field.token';
import { createFieldSync } from './field-sync';
import { adaptFormControl } from './form-control-adapter';

// `debounce(path, 'blur')` arrives in Signal Forms 21.2; 21.1 debounces by
// milliseconds only. The lagging-value row needs a field value that waits for
// blur, so it runs only where Signal Forms can express that.
const SIGNAL_FORMS_HAS_BLUR_DEBOUNCE = Number(VERSION.major) > 21 || Number(VERSION.minor) >= 2;
// Typed for 21.1 too, whose `debounce` only takes milliseconds.
const ON_BLUR = 'blur' as never;

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

/** Control that always asserts its own value via `shouldSkipFieldValue` (default 7). */
@Component({
  selector: 'test-seeding-control',
  standalone: true,
  template: '',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: SeedingControl }],
})
class SeedingControl implements CngxFormFieldControl {
  readonly value: ModelSignal<number> = model<number>(7);
  readonly id = signal('test-seeding');
  readonly focused = signal(false);
  readonly empty = computed(() => false);
  readonly disabled = signal(false);
  readonly errorState = signal(false);

  constructor() {
    createFieldSync<number>({
      componentValue: this.value,
      valueEquals: Object.is,
      coerceFromField: (v) => (typeof v === 'number' ? v : Number(v)),
      shouldSkipFieldValue: (v) => !Number.isFinite(typeof v === 'number' ? v : Number(v)),
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

  it('shouldSkipFieldValue skips reading an absent field but still seeds it', () => {
    const { accessor, ref } = createMockField<number>({ name: 'volume' });
    ref.value.set(undefined as unknown as number);

    @Component({
      template: `
        <cngx-form-field [field]="field">
          <test-seeding-control />
        </cngx-form-field>
      `,
      imports: [CngxFormField, SeedingControl],
    })
    class Host {
      readonly control = viewChild.required(SeedingControl);
      readonly field = accessor;
    }

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    TestBed.flushEffects();

    // Read skipped: the control kept its own value against the absent field.
    expect(fixture.componentInstance.control().value()).toBe(7);
    // Write forced: the absent field was seeded with the control value.
    expect(ref.value()).toBe(7);

    // A present (finite) field reads through normally.
    ref.value.set(3);
    TestBed.flushEffects();
    expect(fixture.componentInstance.control().value()).toBe(3);
  });

  describe('on an adapted Reactive Forms control', () => {
    it('keeps the control pristine when the mount seed writes the control value', () => {
      @Component({
        template: `
          <cngx-form-field [field]="field">
            <test-seeding-control />
          </cngx-form-field>
        `,
        imports: [CngxFormField, SeedingControl],
      })
      class Host {
        readonly control = new FormControl<number>(Number.NaN);
        readonly field = adaptFormControl(this.control, 'volume', inject(DestroyRef));
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(fixture.componentInstance.control.value).toBe(7);
      expect(fixture.componentInstance.control.pristine).toBe(true);
    });
  });

  describe('on a real Signal Forms field', () => {
    it('marks the field dirty on a user change, never on the mount seed', () => {
      @Component({
        template: `
          <cngx-form-field [field]="f.rating">
            <test-numeric-control />
          </cngx-form-field>
        `,
        imports: [CngxFormField, NumericControl],
      })
      class Host {
        readonly control = viewChild.required(NumericControl);
        readonly model = signal({ rating: 3 });
        readonly f = form(this.model);
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;
      expect(host.control().value()).toBe(3);
      expect(host.f.rating().dirty()).toBe(false);

      host.control().value.set(5);
      TestBed.flushEffects();

      expect(host.model().rating).toBe(5);
      expect(host.f.rating().dirty()).toBe(true);
    });

    it('leaves the field pristine when a forced seed writes the control value', () => {
      @Component({
        template: `
          <cngx-form-field [field]="f.volume">
            <test-seeding-control />
          </cngx-form-field>
        `,
        imports: [CngxFormField, SeedingControl],
      })
      class Host {
        readonly model = signal<{ volume: number }>({ volume: Number.NaN });
        readonly f = form(this.model);
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(fixture.componentInstance.model().volume).toBe(7);
      expect(fixture.componentInstance.f.volume().dirty()).toBe(false);
    });

    it.runIf(SIGNAL_FORMS_HAS_BLUR_DEBOUNCE)('keeps the user value on the control while a debounced field value lags', () => {
      @Component({
        template: `
          <cngx-form-field [field]="f.rating">
            <test-numeric-control />
          </cngx-form-field>
        `,
        imports: [CngxFormField, NumericControl],
      })
      class Host {
        readonly control = viewChild.required(NumericControl);
        readonly model = signal({ rating: 1 });
        readonly f = form(this.model, (p) => debounce(p.rating, ON_BLUR));
      }

      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      TestBed.flushEffects();
      const host = fixture.componentInstance;

      host.control().value.set(4);
      TestBed.flushEffects();
      fixture.detectChanges();

      expect(host.control().value()).toBe(4);
      expect(host.f.rating().controlValue()).toBe(4);
      expect(host.model().rating).toBe(1);
      expect(host.f.rating().dirty()).toBe(true);

      host.f.rating().markAsTouched();
      TestBed.flushEffects();

      expect(host.model().rating).toBe(4);
      expect(host.control().value()).toBe(4);
    });
  });
});
