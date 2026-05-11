import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CngxLabel } from './label.directive';
import { CngxInput } from '@cngx/forms/input';
import { CngxHint } from './hint.directive';
import { CngxError } from './error.directive';
import { CngxFieldErrors } from './field-errors.component';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import { createMockField, mockValidationError, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor, ErrorMessageMap } from './models';

// ── Full integration host ────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Email</label>
      <input cngxInput placeholder="test@example.com" />
      <span cngxHint>Business address</span>
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxInput, CngxHint, CngxFieldErrors],
})
class FullHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

// ── Manual error host ────────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <label cngxLabel>Password</label>
      <input cngxInput type="password" />
      <div cngxError>Manual error</div>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxInput, CngxError],
})
class ManualErrorHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'password' }).accessor);
}

// ── Minimal host (just input) ────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput],
})
class MinimalHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'name' }).accessor);
}

// ── Multiple fields host ─────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="emailField()">
      <label cngxLabel>Email</label>
      <input cngxInput />
    </cngx-form-field>
    <cngx-form-field [field]="passwordField()">
      <label cngxLabel>Password</label>
      <input cngxInput type="password" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxLabel, CngxInput],
})
class MultiFieldHost {
  emailField = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
  passwordField = signal<CngxFieldAccessor>(createMockField({ name: 'password' }).accessor);
}

const MESSAGES: ErrorMessageMap = {
  required: () => 'Required.',
  email: () => 'Invalid email.',
};

describe('CngxFormField', () => {
  // ── Component basics ───────────────────────────────────────────

  describe('component', () => {
    it('renders as display:contents (invisible wrapper)', () => {
      const mock = createMockField({ name: 'test' });
      TestBed.configureTestingModule({ imports: [MinimalHost] });
      const fixture = TestBed.createComponent(MinimalHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();

      const formFieldEl = fixture.debugElement.query(By.directive(CngxFormField))
        .nativeElement as HTMLElement;
      expect(getComputedStyle(formFieldEl).display).toBe('contents');
    });

    it('hosts CngxFormFieldPresenter as hostDirective', () => {
      const mock = createMockField({ name: 'test' });
      TestBed.configureTestingModule({ imports: [MinimalHost] });
      const fixture = TestBed.createComponent(MinimalHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();

      const presenter = fixture.debugElement
        .query(By.directive(CngxFormField))
        .injector.get(CngxFormFieldPresenter);
      expect(presenter).toBeTruthy();
      expect(presenter.name()).toBe('test');
    });
  });

  // ── Full integration ───────────────────────────────────────────

  describe('full integration', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<FullHost>>;
    let ref: MockFieldRef;
    let labelEl: HTMLLabelElement;
    let inputEl: HTMLInputElement;
    let hintEl: HTMLSpanElement;
    let errorsEl: HTMLElement;

    beforeEach(() => {
      const mock = createMockField({ name: 'email', required: true });
      ref = mock.ref;

      TestBed.configureTestingModule({
        imports: [FullHost],
        providers: [{ provide: CNGX_ERROR_MESSAGES, useValue: MESSAGES }],
      });
      fixture = TestBed.createComponent(FullHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      labelEl = fixture.debugElement.query(By.directive(CngxLabel)).nativeElement;
      inputEl = fixture.debugElement.query(By.directive(CngxInput)).nativeElement;
      hintEl = fixture.debugElement.query(By.directive(CngxHint)).nativeElement;
      errorsEl = fixture.debugElement.query(By.directive(CngxFieldErrors)).nativeElement;
    });

    it('links label to input via for/id', () => {
      expect(labelEl.getAttribute('for')).toBe('cngx-email-input');
      expect(inputEl.id).toBe('cngx-email-input');
    });

    it('links input to label via aria-labelledby', () => {
      expect(inputEl.getAttribute('aria-labelledby')).toBe('cngx-email-label');
      expect(labelEl.id).toBe('cngx-email-label');
    });

    it('links input to hint and error via aria-describedby', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint cngx-email-error');
      expect(hintEl.id).toBe('cngx-email-hint');
      expect(errorsEl.id).toBe('cngx-email-error');
    });

    it('all IDs are deterministic from field name', () => {
      expect(inputEl.id).toBe('cngx-email-input');
      expect(labelEl.id).toBe('cngx-email-label');
      expect(hintEl.id).toBe('cngx-email-hint');
      expect(errorsEl.id).toBe('cngx-email-error');
    });

    it('hides errors initially (untouched)', () => {
      expect(errorsEl.getAttribute('aria-hidden')).toBe('true');
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('shows errors after touch + invalid', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(errorsEl.getAttribute('aria-hidden')).toBeNull();
      expect(errorsEl.getAttribute('role')).toBe('alert');
      expect(errorsEl.textContent?.trim()).toBe('Required.');
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');
      expect(inputEl.getAttribute('aria-errormessage')).toBe('cngx-email-error');
    });

    it('sets aria-required on input', () => {
      expect(inputEl.getAttribute('aria-required')).toBe('true');
    });

    it('sets aria-busy during async validation', () => {
      ref.pending.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-busy')).toBe('true');
    });

    it('disables input when field is disabled', () => {
      ref.disabled.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.disabled).toBe(true);
    });

    it('full lifecycle: pristine → dirty → touched → error → fixed', () => {
      // Pristine
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
      expect(errorsEl.getAttribute('aria-hidden')).toBe('true');

      // User types (dirty)
      ref.dirty.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();

      // User blurs (touched), field invalid
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('email')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');
      expect(errorsEl.textContent?.trim()).toBe('Invalid email.');

      // User fixes the value
      ref.invalid.set(false);
      ref.errors.set([]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
      expect(errorsEl.getAttribute('aria-hidden')).toBe('true');
      expect(errorsEl.textContent?.trim()).toBe('');
    });
  });

  // ── Manual error template ──────────────────────────────────────

  describe('manual error (CngxError)', () => {
    it('uses CngxError for manual error rendering', () => {
      const mock = createMockField({ name: 'password' });
      TestBed.configureTestingModule({ imports: [ManualErrorHost] });
      const fixture = TestBed.createComponent(ManualErrorHost);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const errorEl = fixture.debugElement.query(By.directive(CngxError))
        .nativeElement as HTMLElement;
      expect(errorEl.id).toBe('cngx-password-error');
      expect(errorEl.getAttribute('aria-hidden')).toBe('true');
      expect(errorEl.textContent?.trim()).toBe('Manual error');

      mock.ref.touched.set(true);
      mock.ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorEl.getAttribute('aria-hidden')).toBeNull();
      expect(errorEl.getAttribute('role')).toBe('alert');
    });
  });

  // ── Multiple fields (ID isolation) ─────────────────────────────

  describe('multiple fields', () => {
    it('generates unique IDs per field', () => {
      const emailMock = createMockField({ name: 'email' });
      const pwMock = createMockField({ name: 'password' });

      TestBed.configureTestingModule({ imports: [MultiFieldHost] });
      const fixture = TestBed.createComponent(MultiFieldHost);
      fixture.componentInstance.emailField.set(emailMock.accessor);
      fixture.componentInstance.passwordField.set(pwMock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const inputs = fixture.debugElement.queryAll(By.directive(CngxInput));
      expect(inputs[0].nativeElement.id).toBe('cngx-email-input');
      expect(inputs[1].nativeElement.id).toBe('cngx-password-input');

      const labels = fixture.debugElement.queryAll(By.directive(CngxLabel));
      expect(labels[0].nativeElement.id).toBe('cngx-email-label');
      expect(labels[1].nativeElement.id).toBe('cngx-password-label');
    });

    it('error states are independent per field', () => {
      const emailMock = createMockField({ name: 'email' });
      const pwMock = createMockField({ name: 'password' });

      TestBed.configureTestingModule({ imports: [MultiFieldHost] });
      const fixture = TestBed.createComponent(MultiFieldHost);
      fixture.componentInstance.emailField.set(emailMock.accessor);
      fixture.componentInstance.passwordField.set(pwMock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      // Only email is invalid
      emailMock.ref.touched.set(true);
      emailMock.ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();

      const inputs = fixture.debugElement.queryAll(By.directive(CngxInput));
      expect(inputs[0].nativeElement.getAttribute('aria-invalid')).toBe('true');
      expect(inputs[1].nativeElement.getAttribute('aria-invalid')).toBeNull();
    });
  });
});
