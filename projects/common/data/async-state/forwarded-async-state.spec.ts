import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';

import type { CngxAsyncState } from '@cngx/core/utils';

import { createForwardedAsyncState } from './forwarded-async-state';
import { createManualState } from './create-manual-state';

describe('createForwardedAsyncState', () => {
  it('reports a quiet idle snapshot when the source is undefined', () => {
    const fwd = createForwardedAsyncState<string>(() => undefined);
    expect(fwd.status()).toBe('idle');
    expect(fwd.data()).toBeUndefined();
    expect(fwd.error()).toBeUndefined();
    expect(fwd.isLoading()).toBe(false);
    expect(fwd.isBusy()).toBe(false);
    expect(fwd.hasData()).toBe(false);
    expect(fwd.isSettled()).toBe(false);
    // Empty / first-load default to true so a bridge sees a pristine slot.
    expect(fwd.isEmpty()).toBe(true);
    expect(fwd.isFirstLoad()).toBe(true);
  });

  it('forwards status and data from a live source', () => {
    const state = createManualState<string>();
    const fwd = createForwardedAsyncState<string>(() => state);
    state.setSuccess('payload');
    expect(fwd.status()).toBe('success');
    expect(fwd.data()).toBe('payload');
    expect(fwd.hasData()).toBe(true);
    expect(fwd.isSettled()).toBe(true);
  });

  it('tracks a changing source reference reactively', () => {
    const src = signal<CngxAsyncState<string> | undefined>(undefined);
    const fwd = createForwardedAsyncState<string>(() => src());
    expect(fwd.status()).toBe('idle');

    const state = createManualState<string>();
    state.set('loading');
    src.set(state);
    expect(fwd.status()).toBe('loading');
    expect(fwd.isLoading()).toBe(true);

    // Detaching the source falls back to idle again.
    src.set(undefined);
    expect(fwd.status()).toBe('idle');
    expect(fwd.isLoading()).toBe(false);
  });
});
