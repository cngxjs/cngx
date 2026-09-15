import { describe, expect, it } from 'vitest';

import { createMockField, mockValidationError } from '@cngx/forms/field/testing';

describe('createMockField', () => {
  it('returns an accessor that yields the writable ref', () => {
    const { accessor, ref } = createMockField();
    expect(accessor()).toBe(ref);
  });

  it('applies defaults for an empty options object', () => {
    const { ref } = createMockField();
    expect(ref.name()).toBe('test');
    expect(ref.value()).toBe('');
    expect(ref.required()).toBe(false);
    expect(ref.disabled()).toBe(false);
    expect(ref.touched()).toBe(false);
    expect(ref.dirty()).toBe(false);
    expect(ref.invalid()).toBe(false);
    expect(ref.valid()).toBe(true);
  });

  it('honors provided options and mirrors errors into errorSummary', () => {
    const errors = [mockValidationError('required', 'Required')];
    const { ref } = createMockField<string>({
      name: 'email',
      value: 'a@b.c',
      required: true,
      invalid: true,
      errors,
    });
    expect(ref.name()).toBe('email');
    expect(ref.value()).toBe('a@b.c');
    expect(ref.required()).toBe(true);
    expect(ref.invalid()).toBe(true);
    expect(ref.valid()).toBe(false);
    expect(ref.errors()).toBe(errors);
    expect(ref.errorSummary()).toBe(errors);
  });

  it('markAsTouched and markAsDirty flip the interaction signals', () => {
    const { ref } = createMockField();
    ref.markAsTouched();
    ref.markAsDirty();
    expect(ref.touched()).toBe(true);
    expect(ref.dirty()).toBe(true);
  });

  describe('reset', () => {
    it('clears touched and dirty while leaving the value when called with no argument', () => {
      const { ref } = createMockField<string>({ value: 'keep' });
      ref.markAsTouched();
      ref.markAsDirty();
      ref.reset();
      expect(ref.touched()).toBe(false);
      expect(ref.dirty()).toBe(false);
      expect(ref.value()).toBe('keep');
    });

    it('honors the value argument like the real CngxFieldRef contract', () => {
      const { ref } = createMockField<string>({ value: 'old' });
      ref.markAsDirty();
      ref.reset('fresh');
      expect(ref.value()).toBe('fresh');
      expect(ref.dirty()).toBe(false);
    });
  });
});

describe('mockValidationError', () => {
  it('builds a validation error with kind and message', () => {
    const err = mockValidationError('minlength', 'Too short');
    expect(err.kind).toBe('minlength');
    expect(err.message).toBe('Too short');
  });

  it('spreads extra properties onto the error', () => {
    const err = mockValidationError('range', 'Out of range', { min: 1, max: 9 });
    expect((err as unknown as { min: number }).min).toBe(1);
    expect((err as unknown as { max: number }).max).toBe(9);
  });
});
