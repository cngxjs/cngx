import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  CNGX_ERROR_MESSAGES,
  CNGX_FORM_FIELD_CONFIG,
  provideErrorMessages,
  provideFormField,
  withConstraintHints,
  withErrorMessages,
} from './form-field.token';
import type { ErrorMessageMap } from './models';

describe('form-field tokens', () => {
  // ── CNGX_ERROR_MESSAGES ────────────────────────────────────────

  describe('CNGX_ERROR_MESSAGES', () => {
    it('has an empty object as default', () => {
      TestBed.configureTestingModule({});
      const messages = TestBed.inject(CNGX_ERROR_MESSAGES);
      expect(messages).toEqual({});
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
      expect(config.constraintHints?.lengthRange(8, 64)).toBe('8–64 characters');
    });

    it('applies withConstraintHints with custom formatters', () => {
      const custom = { lengthRange: (min: number, max: number) => `${min} to ${max}` };
      TestBed.configureTestingModule({
        providers: [provideFormField(withConstraintHints(custom))],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.constraintHints?.lengthRange(8, 64)).toBe('8 to 64');
      // Non-overridden formatters fall back to English defaults
      expect(config.constraintHints?.minLength(8)).toBe('Min. 8 characters');
    });

    it('applies withErrorMessages and provides CNGX_ERROR_MESSAGES', () => {
      const msgs: ErrorMessageMap = { required: () => 'Required' };
      TestBed.configureTestingModule({
        providers: [provideFormField(withErrorMessages(msgs))],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.errorMessages).toEqual(msgs);

      const errorMsgs = TestBed.inject(CNGX_ERROR_MESSAGES);
      expect(errorMsgs).toEqual(msgs);
    });

    it('composes multiple features', () => {
      const msgs: ErrorMessageMap = { email: () => 'Invalid' };
      TestBed.configureTestingModule({
        providers: [provideFormField(withErrorMessages(msgs), withConstraintHints())],
      });
      const config = TestBed.inject(CNGX_FORM_FIELD_CONFIG);
      expect(config.errorMessages).toEqual(msgs);
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
      expect(Object.keys(config.errorMessages!)).toEqual(['required', 'email']);
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
      expect(errorMsgs).toEqual(msgs);
    });
  });
});
