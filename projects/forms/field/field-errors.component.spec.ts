import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxFieldErrors } from './field-errors.component';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import { createMockField, mockValidationError, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor, ErrorMessageMap } from './models';

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <cngx-field-errors>
        <ng-template let-message="message" let-kind="kind">
          <span class="custom-error">[{{ kind }}] {{ message }}</span>
        </ng-template>
      </cngx-field-errors>
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxFieldErrors],
})
class CustomTplHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <cngx-field-errors />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxFieldErrors],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

const ERROR_MESSAGES: ErrorMessageMap = {
  required: () => 'This field is required.',
  minLength: (e) => `Minimum ${(e as unknown as { minLength: number }).minLength} characters.`,
  email: () => 'Invalid email address.',
};

describe('CngxFieldErrors', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  let host: TestHost;
  let errorsEl: HTMLElement;
  let ref: MockFieldRef;

  function setup(messages: ErrorMessageMap = ERROR_MESSAGES) {
    const mock = createMockField({ name: 'email' });
    ref = mock.ref;

    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [{ provide: CNGX_ERROR_MESSAGES, useValue: messages }],
    });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    host.field.set(mock.accessor);
    fixture.detectChanges();
    TestBed.flushEffects();

    errorsEl = fixture.debugElement.query(By.directive(CngxFieldErrors)).nativeElement;
  }

  // ── Basic ARIA ─────────────────────────────────────────────────

  describe('ARIA attributes', () => {
    beforeEach(() => setup());

    it('sets id to error ID', () => {
      expect(errorsEl.id).toBe('cngx-email-error');
    });

    it('has aria-live=polite', () => {
      expect(errorsEl.getAttribute('aria-live')).toBe('polite');
    });

    it('is aria-hidden when no errors visible', () => {
      expect(errorsEl.getAttribute('aria-hidden')).toBe('true');
    });

    it('has no role when errors hidden', () => {
      expect(errorsEl.getAttribute('role')).toBeNull();
    });

    it('removes aria-hidden when showError', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.getAttribute('aria-hidden')).toBeNull();
    });

    it('sets role=alert when showError', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.getAttribute('role')).toBe('alert');
    });
  });

  // ── Error rendering with registry ──────────────────────────────

  describe('error message rendering', () => {
    beforeEach(() => setup());

    it('renders no messages when untouched', () => {
      ref.errors.set([mockValidationError('required')]);
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('');
    });

    it('renders messages from registry when showError', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('This field is required.');
    });

    it('renders multiple errors', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required'), mockValidationError('email')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      const items = errorsEl.querySelectorAll('p');
      expect(items.length).toBe(2);
      expect(items[0].textContent?.trim()).toBe('This field is required.');
      expect(items[1].textContent?.trim()).toBe('Invalid email address.');
    });

    it('passes error object to message function', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('minLength', undefined, { minLength: 8 })]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('Minimum 8 characters.');
    });

    it('falls back to error.message when kind not in registry', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('custom', 'Custom error message')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('Custom error message');
    });

    it('falls back to error.kind when no message and no registry entry', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('unknownError')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('unknownError');
    });

    it('clears messages when errors resolve', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('This field is required.');

      ref.invalid.set(false);
      ref.errors.set([]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('');
    });
  });

  // ── Without error message registry ─────────────────────────────

  describe('without error message registry', () => {
    beforeEach(() => setup({}));

    it('falls back to error message or kind', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      ref.errors.set([mockValidationError('required', 'Field required')]);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(errorsEl.textContent?.trim()).toBe('Field required');
    });
  });

  // ── Custom template ────────────────────────────────────────────

  describe('custom template', () => {
    it('renders errors through custom template', () => {
      const mock = createMockField({ name: 'email' });

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [CustomTplHost],
        providers: [{ provide: CNGX_ERROR_MESSAGES, useValue: ERROR_MESSAGES }],
      });
      const fix = TestBed.createComponent(CustomTplHost);
      fix.componentInstance.field.set(mock.accessor);
      fix.detectChanges();
      TestBed.flushEffects();

      mock.ref.touched.set(true);
      mock.ref.invalid.set(true);
      mock.ref.errors.set([mockValidationError('required'), mockValidationError('email')]);
      fix.detectChanges();
      TestBed.flushEffects();

      const el = fix.debugElement.query(By.directive(CngxFieldErrors)).nativeElement as HTMLElement;
      const items = el.querySelectorAll('.custom-error');
      expect(items.length).toBe(2);
      expect(items[0].textContent).toContain('required');
      expect(items[0].textContent).toContain('This field is required.');
      expect(items[1].textContent).toContain('email');
    });
  });
});
