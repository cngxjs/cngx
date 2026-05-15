import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { describe, expect, it } from 'vitest';

import {
  adaptFormControl,
  CngxFormField,
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONTROL,
  type CngxFieldAccessor,
  type CngxFieldRef,
} from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';

import { CngxFilterBuilder } from './filter-builder.component';
import { CngxFilterBuilderFormFieldControl } from './filter-builder-form-field-control.directive';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import {
  createEmptyFilterRoot,
  createFilterExpression,
  createFilterGroup,
} from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-filter-builder
        cngxFilterBuilderFormFieldControl
        [fields]="fields"
        [(value)]="value"
      />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxFilterBuilder, CngxFilterBuilderFormFieldControl],
})
class SignalFormsHost {
  readonly fields = FIELDS;
  value: FilterGroup = createEmptyFilterRoot();
  readonly _mock = createMockField<FilterGroup>({
    name: 'filter',
    value: createEmptyFilterRoot(),
  });
  readonly field: CngxFieldAccessor<FilterGroup> = this._mock.accessor;
  readonly ref: MockFieldRef<FilterGroup> = this._mock.ref;
  readonly builder = viewChild.required(CngxFilterBuilder);
}

/**
 * Stub `CngxFormFieldPresenter`. Provides only the surface
 * `CngxFilterBuilderPresenter` reads (`disabled`, `touched`, `describedBy`,
 * `required`, `invalid`) plus a `fieldState` whose `value` is a non-writable
 * `Signal` so the select-family field-sync writeback short-circuits — see
 * `projects/forms/select/shared/field-sync.ts`. Lets the spec exercise
 * `errorState()` against a non-empty tree without triggering the inner
 * `<cngx-select>` value-bleed when an outer `<cngx-form-field>` is in scope.
 */
class StubFormFieldPresenter {
  readonly disabledSignal = signal(false);
  readonly touchedSignal = signal(false);
  readonly disabled = this.disabledSignal.asReadonly();
  readonly touched = this.touchedSignal.asReadonly();
  readonly required = signal(false).asReadonly();
  readonly invalid = signal(false).asReadonly();
  readonly describedBy = signal('cngx-stub-hint cngx-stub-error').asReadonly();
  readonly errorId = signal('cngx-stub-error').asReadonly();
  readonly labelId = signal('cngx-stub-label').asReadonly();
  readonly inputId = signal('cngx-stub-input').asReadonly();
  readonly pending = signal(false).asReadonly();
  readonly readonly = signal(false).asReadonly();
  readonly hidden = signal(false).asReadonly();
  readonly errors = signal([]).asReadonly();
  readonly errorSummary = signal([]).asReadonly();
  readonly showError = signal(false).asReadonly();

  readonly fieldState: Signal<CngxFieldRef> = computed(() => ({
    name: signal('stub').asReadonly(),
    value: signal(null).asReadonly() as unknown as Signal<unknown>,
    errors: signal([]).asReadonly(),
    touched: this.touchedSignal.asReadonly(),
    dirty: signal(false).asReadonly(),
    invalid: signal(false).asReadonly(),
    valid: signal(true).asReadonly(),
    required: signal(false).asReadonly(),
    disabled: this.disabledSignal.asReadonly(),
    pending: signal(false).asReadonly(),
    hidden: signal(false).asReadonly(),
    readonly: signal(false).asReadonly(),
    disabledReasons: signal([]).asReadonly(),
    pattern: signal([]).asReadonly(),
    errorSummary: signal([]).asReadonly(),
    submitting: signal(false).asReadonly(),
    markAsTouched: () => this.touchedSignal.set(true),
    markAsDirty: () => undefined,
    focusBoundControl: () => undefined,
    reset: () => undefined,
  } as unknown as CngxFieldRef));
}

@Component({
  template: `
    <cngx-form-field [field]="field">
      <cngx-filter-builder
        cngxFilterBuilderFormFieldControl
        [fields]="fields"
        [(value)]="value"
      />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxFilterBuilder, CngxFilterBuilderFormFieldControl],
})
class ReactiveFormsHost {
  readonly fields = FIELDS;
  readonly control = new FormControl<FilterGroup>(createEmptyFilterRoot(), { nonNullable: true });
  readonly field: CngxFieldAccessor = adaptFormControl(this.control, 'filter', inject(DestroyRef));
  value: FilterGroup = this.control.value;
}

function setupSignalFormsHost(): {
  fixture: ReturnType<typeof TestBed.createComponent<SignalFormsHost>>;
  ref: MockFieldRef<FilterGroup>;
} {
  TestBed.configureTestingModule({ imports: [SignalFormsHost] });
  const fixture = TestBed.createComponent(SignalFormsHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture, ref: fixture.componentInstance.ref };
}

function setupReactiveFormsHost(): {
  fixture: ReturnType<typeof TestBed.createComponent<ReactiveFormsHost>>;
} {
  TestBed.configureTestingModule({ imports: [ReactiveFormsHost] });
  const fixture = TestBed.createComponent(ReactiveFormsHost);
  fixture.detectChanges();
  TestBed.flushEffects();
  return { fixture };
}

describe('CngxFilterBuilder — form-field bridge', () => {
  it('registers CngxFilterBuilderPresenter as CNGX_FORM_FIELD_CONTROL via the opt-in directive', () => {
    const { fixture } = setupSignalFormsHost();
    const builderEl = fixture.debugElement.query(
      By.directive(CngxFilterBuilderFormFieldControl),
    );
    const resolved = builderEl.injector.get(CNGX_FORM_FIELD_CONTROL);
    const presenter = builderEl.injector.get(CngxFilterBuilderPresenter);
    expect(resolved).toBe(presenter);
  });

  it('mirrors field.disabled() onto presenter.disabled() through CngxFormFieldPresenter', () => {
    const { fixture, ref } = setupSignalFormsHost();
    const presenter = fixture.debugElement
      .query(By.directive(CngxFilterBuilderFormFieldControl))
      .injector.get(CngxFilterBuilderPresenter);

    expect(presenter.disabled()).toBe(false);
    ref.disabled.set(true);
    TestBed.flushEffects();
    expect(presenter.disabled()).toBe(true);
  });

  it('reflects presenter.disabled() onto the cngx-filter-builder host as aria-disabled', () => {
    const { fixture, ref } = setupSignalFormsHost();
    const builderEl = fixture.debugElement.query(By.directive(CngxFilterBuilder))
      .nativeElement as HTMLElement;
    expect(builderEl.getAttribute('aria-disabled')).toBeNull();

    ref.disabled.set(true);
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(builderEl.getAttribute('aria-disabled')).toBe('true');
  });

  it('toggles presenter.focused() on host (focusin) / (focusout)', () => {
    const { fixture } = setupSignalFormsHost();
    const builderEl = fixture.debugElement.query(
      By.directive(CngxFilterBuilderFormFieldControl),
    );
    const presenter = builderEl.injector.get(CngxFilterBuilderPresenter);
    const host = builderEl.nativeElement as HTMLElement;

    expect(presenter.focused()).toBe(false);
    host.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    TestBed.flushEffects();
    expect(presenter.focused()).toBe(true);

    host.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    TestBed.flushEffects();
    expect(presenter.focused()).toBe(false);
  });

  it('errorState() AND-gates incomplete expressions with the form-field touched flag', () => {
    const stub = new StubFormFieldPresenter();
    TestBed.configureTestingModule({
      providers: [{ provide: CngxFormFieldPresenter, useValue: stub }],
    });
    @Component({
      template: `<div cngxFilterBuilderPresenter [fields]="fields" [(value)]="value"></div>`,
      imports: [CngxFilterBuilderPresenter],
    })
    class PresenterOnlyHost {
      readonly fields = FIELDS;
      value: FilterGroup = createFilterGroup('and', [
        createFilterExpression('name', 'eq', undefined),
      ]);
    }
    TestBed.configureTestingModule({ imports: [PresenterOnlyHost] });
    const fixture = TestBed.createComponent(PresenterOnlyHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const presenter = fixture.debugElement
      .query(By.directive(CngxFilterBuilderPresenter))
      .injector.get(CngxFilterBuilderPresenter);

    expect(presenter.errorState()).toBe(false);
    stub.touchedSignal.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(presenter.errorState()).toBe(true);
  });

  it('exposes the form-field presenter\'s describedBy / required / invalid through the ambient injector', () => {
    const { fixture, ref } = setupSignalFormsHost();
    const formFieldPresenter = fixture.debugElement
      .query(By.directive(CngxFilterBuilderFormFieldControl))
      .injector.get(CngxFormFieldPresenter);

    ref.required.set(true);
    ref.invalid.set(true);
    TestBed.flushEffects();

    expect(formFieldPresenter.describedBy()).toContain('cngx-filter-');
    expect(formFieldPresenter.required()).toBe(true);
    expect(formFieldPresenter.invalid()).toBe(true);
  });

  it('Signal Forms field accessor returns the same MockFieldRef instance across calls', () => {
    const { fixture, ref } = setupSignalFormsHost();
    const accessor = fixture.componentInstance.field;
    expect(accessor()).toBe(ref);
    ref.value.set(createFilterGroup('and', [createFilterExpression('age', 'eq', 30)]));
    expect(accessor().value()).toBe(ref.value());
  });

  it('exercises the adaptFormControl(new FormControl(createEmptyFilterRoot())) Reactive Forms path', () => {
    const { fixture } = setupReactiveFormsHost();
    const host = fixture.componentInstance;
    const presenter = fixture.debugElement
      .query(By.directive(CngxFilterBuilderFormFieldControl))
      .injector.get(CngxFilterBuilderPresenter);

    expect(host.field().value()).toEqual(createEmptyFilterRoot());

    const next = createFilterGroup('and', [createFilterExpression('age', 'gt', 21)]);
    host.control.setValue(next);
    TestBed.flushEffects();
    expect(host.field().value()).toBe(next);
    expect(host.control.value).toBe(next);

    host.control.disable();
    TestBed.flushEffects();
    expect(presenter.disabled()).toBe(true);
  });
});
