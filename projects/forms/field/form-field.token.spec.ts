import { computed, isSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { coerceSignal } from '@cngx/core/utils';
import { describe, expect, it } from 'vitest';
import {
  CNGX_ERROR_MESSAGES,
  CNGX_FORM_FIELD_CONFIG,
  provideErrorMessages,
  provideFormField,
  injectFormFieldConfig,
  provideFormFieldAt,
  withConstraintHints,
  withErrorMessages,
  withFieldSkin,
  withRequiredMarker,
} from './form-field.token';
import type { ErrorMessageMap } from './models';
import { mockValidationError } from './testing/mock-field';

describe('form-field tokens', () => {
  // ── CNGX_ERROR_MESSAGES ────────────────────────────────────────

  describe('CNGX_ERROR_MESSAGES', () => {
    it('has an empty object as default', () => {
      TestBed.configureTestingModule({});
      const messages = TestBed.inject(CNGX_ERROR_MESSAGES);
      expect(isSignal(messages)).toBe(true);
      expect(messages()).toEqual({});
    });
  });

  // ── CNGX_FORM_FIELD_CONFIG ─────────────────────────────────────

  describe('CNGX_FORM_FIELD_CONFIG', () => {
    it('has an empty object as default', () => {
      TestBed.configureTestingModule({});
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config).toEqual({});
    });
  });

  // ── provideFormField ───────────────────────────────────────────

  describe('provideFormField', () => {
    it('provides empty config with no features', () => {
      TestBed.configureTestingModule({
        providers: [provideFormField()],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config).toEqual({});
    });

    it('applies withConstraintHints with English defaults', () => {
      TestBed.configureTestingModule({
        providers: [provideFormField(withConstraintHints())],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.constraintHints).toBeTruthy();
      expect(coerceSignal(config.constraintHints)()?.lengthRange(8, 64)).toBe('8–64 characters');
    });

    it('applies withConstraintHints with custom formatters', () => {
      const custom = { lengthRange: (min: number, max: number) => `${min} to ${max}` };
      TestBed.configureTestingModule({
        providers: [provideFormField(withConstraintHints(custom))],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      const hints = coerceSignal(config.constraintHints)();
      expect(hints?.lengthRange(8, 64)).toBe('8 to 64');
      // Non-overridden formatters fall back to English defaults
      expect(hints?.minLength(8)).toBe('Min. 8 characters');
    });

    it('applies withErrorMessages and provides CNGX_ERROR_MESSAGES', () => {
      const msgs: ErrorMessageMap = { required: () => 'Required' };
      TestBed.configureTestingModule({
        providers: [provideFormField(withErrorMessages(msgs))],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(coerceSignal(config.errorMessages)()).toEqual(msgs);

      const errorMsgs = TestBed.inject(CNGX_ERROR_MESSAGES);
      expect(errorMsgs()).toEqual(msgs);
    });

    it('composes multiple features', () => {
      const msgs: ErrorMessageMap = { email: () => 'Invalid' };
      TestBed.configureTestingModule({
        providers: [provideFormField(withErrorMessages(msgs), withConstraintHints())],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(coerceSignal(config.errorMessages)()).toEqual(msgs);
      expect(config.constraintHints).toBeTruthy();
    });

    it('merges error messages from multiple withErrorMessages calls', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFormField(
            withErrorMessages({ required: () => 'Required' }),
            withErrorMessages({ email: () => 'Invalid email' }),
          ),
        ],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(Object.keys(coerceSignal(config.errorMessages)()!)).toEqual(['required', 'email']);
    });

    it('lets a later withErrorMessages override an earlier kind', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFormField(
            withErrorMessages({ required: () => 'Required', email: () => 'Invalid' }),
            withErrorMessages({ required: () => 'Needed' }),
          ),
        ],
      });
      const map = TestBed.inject(CNGX_ERROR_MESSAGES)();
      expect(map['required']?.(mockValidationError('required'))).toBe('Needed');
      expect(map['email']?.(mockValidationError('email'))).toBe('Invalid');
    });

    it('follows a Signal passed to withErrorMessages', () => {
      const lang = signal<'en' | 'de'>('en');
      const messages = computed(() => ({
        required: () => (lang() === 'de' ? 'Pflichtfeld' : 'Required'),
      }));
      TestBed.configureTestingModule({
        providers: [
          provideFormField(
            withErrorMessages({ email: () => 'Invalid' }),
            withErrorMessages(messages),
          ),
        ],
      });
      const map = TestBed.inject(CNGX_ERROR_MESSAGES);
      expect(map()['required']?.(mockValidationError('required'))).toBe('Required');
      lang.set('de');
      expect(map()['required']?.(mockValidationError('required'))).toBe('Pflichtfeld');
      expect(map()['email']?.(mockValidationError('email'))).toBe('Invalid');
    });

    it('follows a Signal passed to withConstraintHints and keeps the other defaults', () => {
      const lang = signal<'en' | 'de'>('en');
      const formatters = computed(() =>
        lang() === 'de' ? { lengthRange: (min: number, max: number) => `${min} bis ${max}` } : {},
      );
      TestBed.configureTestingModule({
        providers: [provideFormField(withConstraintHints(formatters))],
      });
      const hints = coerceSignal(TestBed.inject(CNGX_FORM_FIELD_CONFIG).constraintHints);
      expect(hints()?.lengthRange(8, 64)).toBe('8–64 characters');
      lang.set('de');
      expect(hints()?.lengthRange(8, 64)).toBe('8 bis 64');
      expect(hints()?.minLength(8)).toBe('Min. 8 characters');
    });

    it('keeps the merged messages reference on an equal recompute', () => {
      const tick = signal(0);
      const required = () => 'Required';
      const messages = computed(() => (tick(), { required }));
      TestBed.configureTestingModule({
        providers: [provideFormField(withErrorMessages(messages))],
      });
      const map = TestBed.inject(CNGX_ERROR_MESSAGES);
      const first = map();
      tick.set(1);
      expect(map()).toBe(first);
    });

    it('applies withFieldSkin', () => {
      TestBed.configureTestingModule({
        providers: [provideFormField(withFieldSkin('fill'))],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.skin).toBe('fill');
    });

    it('leaves skin undefined without withFieldSkin', () => {
      TestBed.configureTestingModule({
        providers: [provideFormField(withConstraintHints())],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.skin).toBeUndefined();
    });
  });

  // ── provideErrorMessages (convenience) ─────────────────────────

  describe('provideErrorMessages', () => {
    it('provides error messages directly', () => {
      const msgs: ErrorMessageMap = { required: () => 'Needed' };
      TestBed.configureTestingModule({
        providers: [provideErrorMessages(msgs)],
      });
      const errorMsgs = TestBed.inject(CNGX_ERROR_MESSAGES);
      expect(errorMsgs()).toEqual(msgs);
    });

    it('follows a Signal map', () => {
      const msgs = signal<ErrorMessageMap>({ required: () => 'Required' });
      TestBed.configureTestingModule({
        providers: [provideErrorMessages(msgs)],
      });
      const errorMsgs = TestBed.inject(CNGX_ERROR_MESSAGES);
      msgs.set({ required: () => 'Pflichtfeld' });
      expect(errorMsgs()['required']?.(mockValidationError('required'))).toBe('Pflichtfeld');
    });
  });

  // ── provideFormFieldAt / injectFormFieldConfig ─────────────────

  describe('provideFormFieldAt', () => {
    it('merges features the same way as the environment tier', () => {
      TestBed.configureTestingModule({
        providers: [provideFormFieldAt(withFieldSkin('bare'), withRequiredMarker('*'))],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.skin).toBe('bare');
      expect(config.requiredMarker).toBe('*');
    });

    it('provides CNGX_ERROR_MESSAGES when the feature set carries messages', () => {
      const msgs: ErrorMessageMap = { required: () => 'Required' };
      TestBed.configureTestingModule({
        providers: [provideFormFieldAt(withErrorMessages(msgs))],
      });
      expect(TestBed.inject(CNGX_ERROR_MESSAGES)()).toEqual(msgs);
    });

    it('shadows an app-wide provideFormField rather than merging into it', () => {
      // The case the tier exists for: a fill app with a bare sub-tree.
      TestBed.configureTestingModule({
        providers: [
          provideFormField(withFieldSkin('fill'), withRequiredMarker('*')),
          provideFormFieldAt(withFieldSkin('bare')),
        ],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.skin).toBe('bare');
      // Replace, not merge - the sub-tree drops what it does not re-state.
      expect(config.requiredMarker).toBeUndefined();
    });
  });

  describe('injectFormFieldConfig', () => {
    it('reads the resolved config', () => {
      TestBed.configureTestingModule({
        providers: [provideFormField(withFieldSkin('fill'))],
      });
      expect(TestBed.runInInjectionContext(() => injectFormFieldConfig()).skin).toBe('fill');
    });

    it('returns the empty library default with no provider', () => {
      TestBed.configureTestingModule({});
      expect(TestBed.runInInjectionContext(() => injectFormFieldConfig())).toEqual({});
    });
  });
});
