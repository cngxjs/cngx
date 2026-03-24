import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { beforeEach, describe, expect, it } from 'vitest';
import { CngxFormField } from './form-field.component';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONFIG, DEFAULT_HINT_FORMATTERS } from './form-field.token';
import { createMockField, mockValidationError, type MockFieldRef } from './testing/mock-field';
import type { CngxFieldAccessor } from './models';

@Component({
  template: `<cngx-form-field [field]="field()"></cngx-form-field>`,
  imports: [CngxFormField],
})
class TestHost {
  field = signal<CngxFieldAccessor>(createMockField({ name: 'email' }).accessor);
}

describe('CngxFormFieldPresenter', () => {
  let ref: MockFieldRef;
  let presenter: CngxFormFieldPresenter;
  let fixture: ReturnType<typeof TestBed.createComponent<TestHost>>;
  let host: TestHost;

  function setup(opts: Parameters<typeof createMockField>[0] = {}) {
    const mock = createMockField({ name: 'email', ...opts });
    TestBed.configureTestingModule({ imports: [TestHost] });
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    host.field.set(mock.accessor);
    fixture.detectChanges();
    TestBed.flushEffects();
    presenter = fixture.debugElement.query(By.directive(CngxFormFieldPresenter)).injector.get(CngxFormFieldPresenter);
    ref = mock.ref;
    return { mock, presenter, ref };
  }

  // ── ID Registry ──────────────────────────────────────────────────

  describe('ID registry', () => {
    beforeEach(() => setup());

    it('generates inputId from field name', () => {
      expect(presenter.inputId()).toBe('cngx-email-input');
    });

    it('generates labelId from field name', () => {
      expect(presenter.labelId()).toBe('cngx-email-label');
    });

    it('generates hintId from field name', () => {
      expect(presenter.hintId()).toBe('cngx-email-hint');
    });

    it('generates errorId from field name', () => {
      expect(presenter.errorId()).toBe('cngx-email-error');
    });

    it('describedBy contains both hint and error IDs', () => {
      expect(presenter.describedBy()).toBe('cngx-email-hint cngx-email-error');
    });

    it('updates IDs when field name changes', () => {
      ref.name.set('username');
      TestBed.flushEffects();
      expect(presenter.inputId()).toBe('cngx-username-input');
      expect(presenter.labelId()).toBe('cngx-username-label');
      expect(presenter.hintId()).toBe('cngx-username-hint');
      expect(presenter.errorId()).toBe('cngx-username-error');
      expect(presenter.describedBy()).toBe('cngx-username-hint cngx-username-error');
    });
  });

  // ── State derivations ────────────────────────────────────────────

  describe('state derivations', () => {
    beforeEach(() => setup());

    it('reads required from field state', () => {
      expect(presenter.required()).toBe(false);
      ref.required.set(true);
      TestBed.flushEffects();
      expect(presenter.required()).toBe(true);
    });

    it('reads disabled from field state', () => {
      expect(presenter.disabled()).toBe(false);
      ref.disabled.set(true);
      TestBed.flushEffects();
      expect(presenter.disabled()).toBe(true);
    });

    it('reads pending from field state', () => {
      expect(presenter.pending()).toBe(false);
      ref.pending.set(true);
      TestBed.flushEffects();
      expect(presenter.pending()).toBe(true);
    });

    it('reads touched from field state', () => {
      expect(presenter.touched()).toBe(false);
      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.touched()).toBe(true);
    });

    it('reads dirty from field state', () => {
      expect(presenter.dirty()).toBe(false);
      ref.dirty.set(true);
      TestBed.flushEffects();
      expect(presenter.dirty()).toBe(true);
    });

    it('reads invalid from field state', () => {
      expect(presenter.invalid()).toBe(false);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.invalid()).toBe(true);
    });

    it('reads valid from field state', () => {
      expect(presenter.valid()).toBe(true);
      ref.valid.set(false);
      TestBed.flushEffects();
      expect(presenter.valid()).toBe(false);
    });

    it('reads hidden from field state', () => {
      expect(presenter.hidden()).toBe(false);
      ref.hidden.set(true);
      TestBed.flushEffects();
      expect(presenter.hidden()).toBe(true);
    });

    it('reads readonly from field state', () => {
      expect(presenter.readonly()).toBe(false);
      ref.readonly.set(true);
      TestBed.flushEffects();
      expect(presenter.readonly()).toBe(true);
    });

    it('reads submitting from field state', () => {
      expect(presenter.submitting()).toBe(false);
      ref.submitting.set(true);
      TestBed.flushEffects();
      expect(presenter.submitting()).toBe(true);
    });

    it('reads errors from field state', () => {
      expect(presenter.errors()).toEqual([]);
      const err = mockValidationError('required', 'Required');
      ref.errors.set([err]);
      TestBed.flushEffects();
      expect(presenter.errors()).toEqual([err]);
    });

    it('reads disabledReasons from field state', () => {
      expect(presenter.disabledReasons()).toEqual([]);
      ref.disabledReasons.set([{ message: 'Fill password first' }]);
      TestBed.flushEffects();
      expect(presenter.disabledReasons()).toEqual([{ message: 'Fill password first' }]);
    });
  });

  // ── showError gate ───────────────────────────────────────────────

  describe('showError', () => {
    beforeEach(() => setup());

    it('is false when untouched and valid', () => {
      expect(presenter.showError()).toBe(false);
    });

    it('is false when touched but valid', () => {
      ref.touched.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);
    });

    it('is false when invalid but untouched', () => {
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);
    });

    it('is true when touched AND invalid', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);
    });

    it('becomes false when field becomes valid again', () => {
      ref.touched.set(true);
      ref.invalid.set(true);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(true);

      ref.invalid.set(false);
      TestBed.flushEffects();
      expect(presenter.showError()).toBe(false);
    });
  });

  // ── Constraint metadata ──────────────────────────────────────────

  describe('constraint metadata', () => {
    it('reads minLength', () => {
      setup({ minLength: 8 });
      expect(presenter.minLength()).toBe(8);
    });

    it('reads maxLength', () => {
      setup({ maxLength: 64 });
      expect(presenter.maxLength()).toBe(64);
    });

    it('reads min', () => {
      setup({ min: 0 });
      expect(presenter.min()).toBe(0);
    });

    it('reads max', () => {
      setup({ max: 100 });
      expect(presenter.max()).toBe(100);
    });

    it('minLength/maxLength are undefined when not set', () => {
      setup();
      expect(presenter.minLength()).toBeUndefined();
      expect(presenter.maxLength()).toBeUndefined();
    });
  });

  // ── constraintHints ──────────────────────────────────────────────

  describe('constraintHints', () => {
    it('returns empty when constraintHints feature is not enabled', () => {
      setup({ minLength: 8, maxLength: 64 });
      expect(presenter.constraintHints()).toEqual([]);
    });

    it('returns length range when both min and max length set', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { constraintHints: DEFAULT_HINT_FORMATTERS } }],
      });
      const mock = createMockField({ name: 'pw', minLength: 8, maxLength: 64 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement.query(By.directive(CngxFormFieldPresenter)).injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['8–64 characters']);
    });

    it('returns min-only hint', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { constraintHints: DEFAULT_HINT_FORMATTERS } }],
      });
      const mock = createMockField({ name: 'pw', minLength: 8 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement.query(By.directive(CngxFormFieldPresenter)).injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['Min. 8 characters']);
    });

    it('returns max-only hint', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { constraintHints: DEFAULT_HINT_FORMATTERS } }],
      });
      const mock = createMockField({ name: 'pw', maxLength: 64 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement.query(By.directive(CngxFormFieldPresenter)).injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['Max. 64 characters']);
    });

    it('returns numeric range hints for min/max', () => {
      TestBed.configureTestingModule({
        imports: [TestHost],
        providers: [{ provide: CNGX_FORM_FIELD_CONFIG, useValue: { constraintHints: DEFAULT_HINT_FORMATTERS } }],
      });
      const mock = createMockField({ name: 'age', min: 18, max: 99 });
      fixture = TestBed.createComponent(TestHost);
      host = fixture.componentInstance;
      host.field.set(mock.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();
      presenter = fixture.debugElement.query(By.directive(CngxFormFieldPresenter)).injector.get(CngxFormFieldPresenter);

      expect(presenter.constraintHints()).toEqual(['18–99']);
    });
  });

  // ── Field switching ──────────────────────────────────────────────

  describe('field switching', () => {
    it('reacts when the field accessor is replaced', () => {
      setup({ name: 'email' });
      expect(presenter.name()).toBe('email');

      const mock2 = createMockField({ name: 'username', required: true });
      host.field.set(mock2.accessor);
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(presenter.name()).toBe('username');
      expect(presenter.inputId()).toBe('cngx-username-input');
      expect(presenter.required()).toBe(true);
    });
  });
});
