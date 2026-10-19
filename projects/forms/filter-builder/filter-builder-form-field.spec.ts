import { Component, DestroyRef, inject, viewChild } from '@angular/core';
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
} from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '@cngx/forms/field/testing';
import { CngxSelect } from '@cngx/forms/select';
import { mousePick } from '@cngx/testing';

import { CngxFilterBuilder } from './filter-builder.component';
import { CngxFilterBuilderFormFieldControl } from './filter-builder-form-field-control.directive';
import { CngxFilterBuilderPresenter } from './filter-builder-presenter.directive';
import {
  createEmptyFilterRoot,
  createFilterExpression,
  createFilterGroup,
} from './filter-builder.helpers';
import type { FilterFieldDef, FilterGroup } from './filter-builder.types';

// jsdom does not implement the Popover API - polyfill so the inner select panels can open.
function polyfillPopover(): void {
  const proto = HTMLElement.prototype as unknown as {
    showPopover?: () => void;
    hidePopover?: () => void;
    togglePopover?: (force?: boolean) => boolean;
  };
  if (typeof proto.showPopover !== 'function') {
    proto.showPopover = function (this: HTMLElement) {
      this.dispatchEvent(new Event('beforetoggle', { bubbles: false }));
      this.setAttribute('data-popover-open', 'true');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('data-popover-open');
      this.dispatchEvent(new Event('toggle', { bubbles: false }));
    };
    proto.togglePopover = function (this: HTMLElement) {
      if (this.hasAttribute('data-popover-open')) {
        (this as HTMLElement & { hidePopover: () => void }).hidePopover();
        return false;
      }
      (this as HTMLElement & { showPopover: () => void }).showPopover();
      return true;
    };
  }
}

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

// Incomplete expression (operator/value missing) inside a real Signal-Forms
// form-field. Used to exercise errorState() and the #98 no-value-bleed
// regression without the previous non-writable-presenter stub: the
// CNGX_SELECT_DISABLE_FIELD_SYNC provider on the form-field-control directive
// now keeps the inner selects from receiving the FilterGroup.
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
class PopulatedSignalFormsHost {
  readonly fields = FIELDS;
  readonly _tree: FilterGroup = createFilterGroup('and', [
    createFilterExpression('name', 'eq', undefined),
  ]);
  value: FilterGroup = this._tree;
  readonly _mock = createMockField<FilterGroup>({ name: 'filter', value: this._tree });
  readonly field: CngxFieldAccessor<FilterGroup> = this._mock.accessor;
  readonly ref: MockFieldRef<FilterGroup> = this._mock.ref;
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

describe('CngxFilterBuilder - form-field bridge', () => {
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

  it('does not write the FilterGroup into inner selects when wrapped in a form-field (#98)', () => {
    TestBed.configureTestingModule({ imports: [PopulatedSignalFormsHost] });
    const fixture = TestBed.createComponent(PopulatedSignalFormsHost);
    // The bleed manifested during change detection as the inner field-select's
    // valueChange firing with the FilterGroup object; rendering must not throw.
    expect(() => {
      fixture.detectChanges();
      TestBed.flushEffects();
    }).not.toThrow();

    const fieldSelect = fixture.debugElement
      .query(By.css('.cngx-filter-builder__field-select'))
      .injector.get(CngxSelect);
    // Stays the scalar field key, not the whole FilterGroup tree.
    expect(fieldSelect.value()).toBe('name');
    expect(fieldSelect.value()).not.toBe(fixture.componentInstance.value);
  });

  it('an inner select pick leaves the composite untouched', async () => {
    polyfillPopover();
    TestBed.configureTestingModule({ imports: [PopulatedSignalFormsHost] });
    const fixture = TestBed.createComponent(PopulatedSignalFormsHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const selectDe = fixture.debugElement.query(By.css('.cngx-filter-builder__field-select'));
    const select = selectDe.injector.get(CngxSelect);
    const selectEl = selectDe.nativeElement as HTMLElement;
    const owner = selectEl.querySelector<HTMLElement>('[role="combobox"]')!;
    owner.focus();
    select.open();
    fixture.detectChanges();
    TestBed.flushEffects();
    await Promise.resolve();

    const age = Array.from(selectEl.querySelectorAll<HTMLElement>('[role="option"]')).find((el) =>
      el.textContent?.includes('Age'),
    )!;
    mousePick(age);
    fixture.detectChanges();
    TestBed.flushEffects();
    await Promise.resolve();

    expect(select.value()).toBe('age');
    expect(fixture.componentInstance.ref.touched()).toBe(false);
    owner.blur();
  });

  describe('inner pickers detached from the surrounding field', () => {
    function mountPopulated() {
      TestBed.configureTestingModule({ imports: [PopulatedSignalFormsHost] });
      const fixture = TestBed.createComponent(PopulatedSignalFormsHost);
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      const builderDe = fixture.debugElement.query(By.directive(CngxFilterBuilderFormFieldControl));
      const outer = fixture.debugElement
        .query(By.directive(CngxFormField))
        .injector.get(CngxFormFieldPresenter);
      return { fixture, builder: builderDe.nativeElement as HTMLElement, outer };
    }

    it('no inner control carries the outer field id, label or invalid state', () => {
      const { fixture, builder, outer } = mountPopulated();
      fixture.componentInstance.ref.touched.set(true);
      fixture.componentInstance.ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.detectChanges();
      const inner = Array.from(
        builder.querySelectorAll<HTMLElement>('[role="combobox"], input, select, textarea'),
      );
      expect(inner.length).toBeGreaterThan(0);
      for (const el of inner) {
        expect(el.id).not.toBe(outer.inputId());
        expect(el.getAttribute('aria-labelledby')).not.toBe(outer.labelId());
        expect(el.getAttribute('aria-invalid')).not.toBe('true');
      }
      fixture.nativeElement.remove();
    });

    it('marks the field touched only when focus leaves the builder', () => {
      const { fixture, builder } = mountPopulated();
      const pickers = builder.querySelectorAll<HTMLElement>('[role="combobox"]');
      expect(pickers.length).toBeGreaterThan(1);
      pickers[0].dispatchEvent(
        new FocusEvent('focusout', { bubbles: true, relatedTarget: pickers[1] }),
      );
      TestBed.flushEffects();
      expect(fixture.componentInstance.ref.touched()).toBe(false);

      const outside = document.createElement('button');
      document.body.appendChild(outside);
      pickers[1].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: outside }));
      TestBed.flushEffects();
      expect(fixture.componentInstance.ref.touched()).toBe(true);
      outside.remove();
      fixture.nativeElement.remove();
    });

    it('points the label for at the builder', () => {
      const { builder, outer, fixture } = mountPopulated();
      expect(document.getElementById(outer.controlId())).toBe(builder);
      fixture.nativeElement.remove();
    });
  });

  it('errorState() AND-gates incomplete expressions with the form-field touched flag', () => {
    TestBed.configureTestingModule({ imports: [PopulatedSignalFormsHost] });
    const fixture = TestBed.createComponent(PopulatedSignalFormsHost);
    fixture.detectChanges();
    TestBed.flushEffects();

    const presenter = fixture.debugElement
      .query(By.directive(CngxFilterBuilderPresenter))
      .injector.get(CngxFilterBuilderPresenter);

    expect(presenter.errorState()).toBe(false);
    fixture.componentInstance.ref.touched.set(true);
    fixture.detectChanges();
    TestBed.flushEffects();
    expect(presenter.errorState()).toBe(true);
  });

  it('exposes the form-field presenter\'s describedBy / required / invalid through the ambient injector', () => {
    const { fixture, ref } = setupSignalFormsHost();
    // Read from the field element: the builder's viewProviders null the
    // presenter for its own view, which DebugElement lookups on the host see.
    const formFieldPresenter = fixture.debugElement
      .query(By.directive(CngxFormField))
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

@Component({
  template: `<div cngxFilterBuilderFormFieldControl></div>`,
  imports: [CngxFilterBuilderFormFieldControl],
})
class OrphanControlHost {}

@Component({
  template: `<div cngxFilterBuilderPresenter [fields]="fields">
    <div cngxFilterBuilderFormFieldControl></div>
  </div>`,
  imports: [CngxFilterBuilderPresenter, CngxFilterBuilderFormFieldControl],
})
class AncestorPresenterHost {
  readonly fields = FIELDS;
}

describe('CngxFilterBuilderFormFieldControl placement (CNGX2019)', () => {
  it('throws CNGX2019 without a filter-builder presenter', () => {
    expect(() => TestBed.createComponent(OrphanControlHost).detectChanges()).toThrow(
      expect.objectContaining({
        name: 'CngxRuntimeError',
        code: 'CNGX2019',
        message: expect.stringMatching(
          /^CNGX2019: \[cngxFilterBuilderFormFieldControl\] must be placed on <cngx-filter-builder> or an element with \[cngxFilterBuilderPresenter\]\./,
        ),
      }),
    );
  });

  it('throws CNGX2019 when the presenter sits on an ancestor', () => {
    expect(() => TestBed.createComponent(AncestorPresenterHost).detectChanges()).toThrow(
      expect.objectContaining({ code: 'CNGX2019', message: expect.stringMatching(/^CNGX2019: /) }),
    );
  });

  it('does not throw on <cngx-filter-builder>', () => {
    expect(() => setupSignalFormsHost()).not.toThrow();
  });
});
