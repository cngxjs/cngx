import { describe, expect, it } from 'vitest';
import { EMPTY, Subject, of, throwError } from 'rxjs';

import { createManualState } from './create-manual-state';
import { tapAsyncState, tapHttpAsyncState } from './operators';

describe('tapAsyncState', () => {
  it('sets loading on first subscribe and success on next', () => {
    const state = createManualState<string>();
    of('a').pipe(tapAsyncState(state)).subscribe();
    expect(state.status()).toBe('success');
    expect(state.data()).toBe('a');
  });

  it('emits refreshing on a re-subscribe after data has landed', () => {
    const state = createManualState<string>();
    of('a').pipe(tapAsyncState(state)).subscribe();

    const source = new Subject<string>();
    source.pipe(tapAsyncState(state)).subscribe();
    expect(state.status()).toBe('refreshing');
    source.next('b');
    expect(state.status()).toBe('success');
    expect(state.data()).toBe('b');
  });

  it('an explicit options.status wins over the isFirstLoad pick', () => {
    const state = createManualState<string>();
    of('a').pipe(tapAsyncState(state)).subscribe();
    new Subject<string>().pipe(tapAsyncState(state, { status: 'pending' })).subscribe();
    expect(state.status()).toBe('pending');
  });

  it('sets error and rethrows on stream error', () => {
    const state = createManualState<string>();
    let caught: unknown;
    throwError(() => new Error('boom'))
      .pipe(tapAsyncState(state))
      .subscribe({ error: (err: unknown) => (caught = err) });
    expect(state.status()).toBe('error');
    expect(caught).toBeInstanceOf(Error);
  });

  it('unsubscribe mid-flight resets the sink to idle instead of leaving it busy', () => {
    const state = createManualState<string>();
    const source = new Subject<string>();
    const sub = source.pipe(tapAsyncState(state)).subscribe();
    expect(state.status()).toBe('loading');
    sub.unsubscribe();
    expect(state.status()).toBe('idle');
    expect(state.isBusy()).toBe(false);
  });

  it('an empty complete resets to idle, a settled stream keeps its result', () => {
    const state = createManualState<string>();
    EMPTY.pipe(tapAsyncState(state)).subscribe();
    expect(state.status()).toBe('idle');

    of('a').pipe(tapAsyncState(state)).subscribe();
    expect(state.status()).toBe('success');
  });
});

describe('tapHttpAsyncState', () => {
  it('extracts the response body and reports progress', () => {
    const state = createManualState<string>();
    of(
      { type: 1, loaded: 50, total: 100 },
      { type: 4, body: 'result' },
    )
      .pipe(tapHttpAsyncState(state))
      .subscribe();
    expect(state.status()).toBe('success');
    expect(state.data()).toBe('result');
  });

  it('cancellation before the response resets the sink to idle', () => {
    const state = createManualState<string>();
    const source = new Subject<unknown>();
    const sub = source.pipe(tapHttpAsyncState(state)).subscribe();
    expect(state.status()).toBe('loading');
    source.next({ type: 1, loaded: 10, total: 100 });
    sub.unsubscribe();
    expect(state.status()).toBe('idle');
  });
});
