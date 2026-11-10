import { describe, expect, it } from 'vitest';

import { type CngxOutcomeToastInputs, resolveOutcomeToast } from './outcome-toast';

interface InputValues {
  toastSuccess?: string;
  toastError?: string;
  toastErrorDetail?: boolean;
  toastSuccessDuration?: number;
  toastErrorDuration?: number | 'persistent';
}

function inputs(overrides: InputValues = {}): CngxOutcomeToastInputs {
  const values: InputValues = { toastSuccess: 'Saved', toastError: 'Failed', ...overrides };
  return {
    toastSuccess: () => values.toastSuccess,
    toastError: () => values.toastError,
    toastErrorDetail: () => values.toastErrorDetail ?? false,
    toastSuccessDuration: () => values.toastSuccessDuration,
    toastErrorDuration: () => values.toastErrorDuration,
  };
}

const detailOf = (error: unknown) => (error instanceof Error ? error.message : undefined);
const i18n = { errorWithDetail: (message: string, detail: string) => `${message}: ${detail}` };

describe('resolveOutcomeToast', () => {
  it('resolves a success toast with the duration left to the toaster when unbound', () => {
    expect(resolveOutcomeToast(inputs(), 'success', undefined, detailOf, i18n)).toEqual({
      message: 'Saved',
      severity: 'success',
      duration: undefined,
    });
  });

  it('passes a bound success duration through', () => {
    const toast = resolveOutcomeToast(
      inputs({ toastSuccessDuration: 1200 }),
      'success',
      undefined,
      detailOf,
      i18n,
    );
    expect(toast?.duration).toBe(1200);
  });

  it('resolves nothing for an outcome without a message', () => {
    expect(
      resolveOutcomeToast(
        inputs({ toastSuccess: undefined }),
        'success',
        undefined,
        detailOf,
        i18n,
      ),
    ).toBeUndefined();
    expect(
      resolveOutcomeToast(inputs({ toastError: '' }), 'error', new Error('x'), detailOf, i18n),
    ).toBeUndefined();
  });

  it('resolves an error toast without the detail unless toastErrorDetail is set', () => {
    expect(resolveOutcomeToast(inputs(), 'error', new Error('boom'), detailOf, i18n)).toEqual({
      message: 'Failed',
      severity: 'error',
      duration: undefined,
    });
  });

  it('composes the error detail through errorWithDetail', () => {
    const toast = resolveOutcomeToast(
      inputs({ toastErrorDetail: true, toastErrorDuration: 'persistent' }),
      'error',
      new Error('boom'),
      detailOf,
      i18n,
    );
    expect(toast).toEqual({ message: 'Failed: boom', severity: 'error', duration: 'persistent' });
  });

  it('keeps the bare message when the detail mapper yields nothing or the error is nullish', () => {
    const on = inputs({ toastErrorDetail: true });
    expect(resolveOutcomeToast(on, 'error', 'not an Error', detailOf, i18n)?.message).toBe(
      'Failed',
    );
    expect(resolveOutcomeToast(on, 'error', undefined, detailOf, i18n)?.message).toBe('Failed');
  });
});
