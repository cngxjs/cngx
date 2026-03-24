import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField, CNGX_FORM_FIELD_CONTROL, type CngxFieldAccessor } from '@cngx/forms/field';
import { createMockField, type MockFieldRef } from '../../field/src/testing/mock-field';
import { CngxInput } from './input.directive';

// ── With form field parent ──────────────────────────────────────────

@Component({
  template: `
    <cngx-form-field [field]="field()">
      <input cngxInput placeholder="test" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxInput],
})
class HostWithFormField {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

// ── Standalone (no form field parent) ───────────────────────────────

@Component({
  template: `<input cngxInput id="standalone" placeholder="standalone" />`,
  imports: [CngxInput],
})
class HostStandalone {}

describe('CngxInput', () => {
  describe('with CngxFormField parent', () => {
    let fixture: ReturnType<typeof TestBed.createComponent<HostWithFormField>>;
    let inputEl: HTMLInputElement;
    let directive: CngxInput;
    let ref: MockFieldRef;

    beforeEach(() => {
      const mock = createMockField({ name: 'email' });
      ref = mock.ref;

      TestBed.configureTestingModule({ imports: [HostWithFormField] });
      fixture = TestBed.createComponent(HostWithFormField);
      fixture.componentInstance.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      const debugEl = fixture.debugElement.query(By.directive(CngxInput));
      inputEl = debugEl.nativeElement;
      directive = debugEl.injector.get(CngxInput);
    });

    // ── ID ────────────────────────────────────────────────────────

    it('sets id from presenter', () => {
      expect(inputEl.id).toBe('cngx-email-input');
    });

    it('updates id when field name changes', () => {
      ref.name.set('password');
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.id).toBe('cngx-password-input');
    });

    // ── aria-describedby ─────────────────────────────────────────

    it('sets aria-describedby to hint + error IDs', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBe('cngx-email-hint cngx-email-error');
    });

    // ── aria-labelledby ──────────────────────────────────────────

    it('sets aria-labelledby to label ID', () => {
      expect(inputEl.getAttribute('aria-labelledby')).toBe('cngx-email-label');
    });

    // ── aria-invalid ─────────────────────────────────────────────

    it('does not set aria-invalid when field is valid', () => {
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('does not set aria-invalid when invalid but untouched', () => {
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('sets aria-invalid when touched and invalid', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-invalid')).toBe('true');
    });

    // ── aria-required ────────────────────────────────────────────

    it('does not set aria-required when not required', () => {
      expect(inputEl.getAttribute('aria-required')).toBeNull();
    });

    it('sets aria-required when field is required', () => {
      ref.required.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-required')).toBe('true');
    });

    // ── aria-busy ────────────────────────────────────────────────

    it('does not set aria-busy when not pending', () => {
      expect(inputEl.getAttribute('aria-busy')).toBeNull();
    });

    it('sets aria-busy when async validation is pending', () => {
      ref.pending.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-busy')).toBe('true');
    });

    // ── aria-errormessage ────────────────────────────────────────

    it('does not set aria-errormessage when no error', () => {
      expect(inputEl.getAttribute('aria-errormessage')).toBeNull();
    });

    it('sets aria-errormessage to error ID when showError', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-errormessage')).toBe('cngx-email-error');
    });

    // ── aria-readonly ────────────────────────────────────────────

    it('does not set aria-readonly when not readonly', () => {
      expect(inputEl.getAttribute('aria-readonly')).toBeNull();
    });

    it('sets aria-readonly when field is readonly', () => {
      ref.readonly.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.getAttribute('aria-readonly')).toBe('true');
    });

    // ── disabled ─────────────────────────────────────────────────

    it('is not disabled by default', () => {
      expect(inputEl.disabled).toBe(false);
    });

    it('becomes disabled when field is disabled', () => {
      ref.disabled.set(true);
      fixture.detectChanges();
      TestBed.flushEffects();
      expect(inputEl.disabled).toBe(true);
    });

    // ── Focus tracking ───────────────────────────────────────────

    it('tracks focus state', () => {
      expect(directive.focused()).toBe(false);

      inputEl.dispatchEvent(new FocusEvent('focus'));
      expect(directive.focused()).toBe(true);

      inputEl.dispatchEvent(new FocusEvent('blur'));
      expect(directive.focused()).toBe(false);
    });

    // ── Empty tracking ───────────────────────────────────────────

    it('tracks empty state', () => {
      expect(directive.empty()).toBe(true);

      inputEl.value = 'hello';
      inputEl.dispatchEvent(new Event('input'));
      expect(directive.empty()).toBe(false);

      inputEl.value = '';
      inputEl.dispatchEvent(new Event('input'));
      expect(directive.empty()).toBe(true);
    });

    // ── CNGX_FORM_FIELD_CONTROL token ────────────────────────────

    it('provides CNGX_FORM_FIELD_CONTROL', () => {
      const debugEl = fixture.debugElement.query(By.directive(CngxInput));
      const control = debugEl.injector.get(CNGX_FORM_FIELD_CONTROL);
      expect(control).toBe(directive);
    });

    // ── errorState ───────────────────────────────────────────────

    it('errorState mirrors showError', () => {
      expect(directive.errorState()).toBe(false);

      ref.touched.set(true);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(directive.errorState()).toBe(true);
    });

    // ── Smart autocomplete ───────────────────────────────────────

    it('auto-sets autocomplete=email for email field', () => {
      expect(inputEl.getAttribute('autocomplete')).toBe('email');
    });

    // ── Smart spellcheck ─────────────────────────────────────────

    it('auto-disables spellcheck for email field', () => {
      expect(inputEl.getAttribute('spellcheck')).toBe('false');
    });
  });

  // ── Standalone mode (no parent) ────────────────────────────────

  describe('standalone (no CngxFormField parent)', () => {
    let inputEl: HTMLInputElement;
    let directive: CngxInput;

    beforeEach(() => {
      TestBed.configureTestingModule({ imports: [HostStandalone] });
      const fixture = TestBed.createComponent(HostStandalone);
      fixture.detectChanges();
      TestBed.flushEffects();

      const debugEl = fixture.debugElement.query(By.directive(CngxInput));
      inputEl = debugEl.nativeElement;
      directive = debugEl.injector.get(CngxInput);
    });

    it('does not crash without presenter', () => {
      expect(directive).toBeTruthy();
    });

    it('uses native id when no presenter', () => {
      expect(directive.id()).toBe('standalone');
    });

    it('does not set aria-describedby without presenter', () => {
      expect(inputEl.getAttribute('aria-describedby')).toBeNull();
    });

    it('does not set aria-invalid without presenter', () => {
      expect(inputEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('does not set aria-required without presenter', () => {
      expect(inputEl.getAttribute('aria-required')).toBeNull();
    });

    it('still tracks focus', () => {
      expect(directive.focused()).toBe(false);
      inputEl.dispatchEvent(new FocusEvent('focus'));
      expect(directive.focused()).toBe(true);
    });

    it('still tracks empty', () => {
      expect(directive.empty()).toBe(true);
      inputEl.value = 'text';
      inputEl.dispatchEvent(new Event('input'));
      expect(directive.empty()).toBe(false);
    });
  });
});
