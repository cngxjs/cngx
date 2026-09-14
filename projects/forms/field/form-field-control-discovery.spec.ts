import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxCheckbox } from '@cngx/common/interactive';
import { CngxInput } from '@cngx/forms/input';
import { CngxFormField } from './form-field.component';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CngxLabel } from './label.component';
import { createMockField, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>E-Mail</label>
      <input cngxInput />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxInput],
})
class InputHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Terms</label>
      <cngx-checkbox>Accept the terms</cngx-checkbox>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxCheckbox],
})
class CheckboxHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'terms' }).accessor);
}

// Cross-lib integration witnesses for the CNGX_FORM_FIELD_CONTROL discovery
// query: a same-lib reference control (CngxInput) and a Level-2 atom from
// @cngx/common/interactive (CngxCheckbox) discovered through the Level-1
// token alone.
describe('CNGX_FORM_FIELD_CONTROL discovery integration', () => {
  describe('CngxInput (same-lib reference control)', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<InputHost>>;
    let presenter: CngxFormFieldPresenter;
    let fieldEl: HTMLElement;
    let labelEl: HTMLLabelElement;
    let inputEl: HTMLInputElement;
    let ref: MockFieldRef;

    beforeEach(() => {
      const mock = createMockField({ name: 'email' });
      ref = mock.ref;
      TestBed.configureTestingModule({ imports: [InputHost] });
      fixture = TestBed.createComponent(InputHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const fieldDebug = fixture.debugElement.query(By.directive(CngxFormField));
      presenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      fieldEl = fieldDebug.nativeElement;
      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
      inputEl = fixture.debugElement.query(By.directive(CngxInput)).nativeElement;
    });

    function flush() {
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('discovers the input through the token', () => {
      expect(presenter.control()).toBe(
        fixture.debugElement.query(By.directive(CngxInput)).injector.get(CngxInput),
      );
    });

    it('associates the label with the input id', () => {
      expect(inputEl.id).toBe('cngx-email-input');
      expect(labelEl.getAttribute('for')).toBe('cngx-email-input');
    });

    it('toggles cngx-field--focused on input focus and blur', () => {
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(false);

      inputEl.dispatchEvent(new Event('focus'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(true);

      inputEl.dispatchEvent(new Event('blur'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--focused')).toBe(false);
    });

    it('toggles cngx-field--empty on value edits', () => {
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);

      inputEl.value = 'user@example.com';
      inputEl.dispatchEvent(new Event('input'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(false);

      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);
    });

    it('leaves the control-side pull channel untouched', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint');

      ref.invalid.set(true);
      ref.touched.set(true);
      flush();
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint cngx-email-error');
    });
  });

  describe('CngxCheckbox (cross-lib Level-2 atom)', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<CheckboxHost>>;
    let presenter: CngxFormFieldPresenter;
    let fieldEl: HTMLElement;
    let labelEl: HTMLLabelElement;
    let checkbox: CngxCheckbox;
    let checkboxEl: HTMLElement;
    let ref: MockFieldRef;

    beforeEach(() => {
      const mock = createMockField({ name: 'terms' });
      ref = mock.ref;
      TestBed.configureTestingModule({ imports: [CheckboxHost] });
      fixture = TestBed.createComponent(CheckboxHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const fieldDebug = fixture.debugElement.query(By.directive(CngxFormField));
      presenter = fieldDebug.injector.get(CngxFormFieldPresenter);
      fieldEl = fieldDebug.nativeElement;
      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
      const checkboxDebug = fixture.debugElement.query(By.directive(CngxCheckbox));
      checkbox = checkboxDebug.componentInstance;
      checkboxEl = checkboxDebug.nativeElement;
    });

    function flush() {
      TestBed.flushEffects();
      fixture.detectChanges();
    }

    it('discovers the checkbox through the Level-1 token', () => {
      expect(presenter.control()).toBe(checkbox);
    });

    it('points the label for-target at the checkbox host id instead of a dangling reference', () => {
      const hostId = checkboxEl.getAttribute('id');
      expect(hostId).toMatch(/^cngx-checkbox-/);
      expect(labelEl.getAttribute('for')).toBe(hostId);
      // Before the discovery query the label dangled at the non-existent
      // deterministic id - locked here as the documented cleanup.
      expect(labelEl.getAttribute('for')).not.toBe('cngx-terms-input');
    });

    it('tracks the field showError through the CNGX_FORM_FIELD_HOST cascade into --error', () => {
      expect(checkbox.errorState()).toBe(false);
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(false);

      ref.invalid.set(true);
      ref.touched.set(true);
      flush();
      expect(checkbox.errorState()).toBe(true);
      expect(presenter.controlErrorState()).toBe(true);
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(true);

      ref.invalid.set(false);
      flush();
      expect(checkbox.errorState()).toBe(false);
      expect(fieldEl.classList.contains('cngx-field--error')).toBe(false);
    });

    it('reports empty until the checkbox is checked', () => {
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(true);

      checkbox.value.set(true);
      flush();
      expect(fieldEl.classList.contains('cngx-field--empty')).toBe(false);
    });
  });
});
