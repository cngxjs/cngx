import { TestBed } from '@angular/core/testing';
import { signalStore } from '@ngrx/signals';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { tapAsyncState } from '@cngx/common/data';
import { withCngxAsyncState } from './with-cngx-async-state';

const UsersStore = signalStore({ providedIn: 'root' }, withCngxAsyncState<number[]>()('users'));

describe('withCngxAsyncState', () => {
  let store: InstanceType<typeof UsersStore>;

  beforeEach(() => {
    store = TestBed.inject(UsersStore);
  });

  it('starts idle with a derived state view and no flags', () => {
    expect(store.usersState.status()).toBe('idle');
    expect(store.usersState.data()).toBeUndefined();
    expect(store.usersState.isEmpty()).toBe(true);
    expect(store.usersState.isFirstLoad()).toBe(true);
  });

  it('walks loading -> success as tapAsyncState drives the sink', () => {
    const source = new Subject<number[]>();
    source.pipe(tapAsyncState(store.usersSink)).subscribe();

    expect(store.usersState.status()).toBe('loading');
    expect(store.usersState.isLoading()).toBe(true);

    source.next([1, 2, 3]);

    expect(store.usersState.status()).toBe('success');
    expect(store.usersState.data()).toEqual([1, 2, 3]);
    expect(store.usersState.isEmpty()).toBe(false);
    expect(store.usersState.hasData()).toBe(true);
    expect(store.usersState.isSettled()).toBe(true);
    expect(store.usersState.isFirstLoad()).toBe(false);
  });

  it('walks loading -> error and exposes the error', () => {
    const source = new Subject<number[]>();
    const failure = new Error('load failed');
    // tapAsyncState re-throws on error; swallow it so the test observes the
    // state transition rather than an unhandled error.
    source.pipe(tapAsyncState(store.usersSink)).subscribe({ error: () => undefined });

    expect(store.usersState.status()).toBe('loading');

    source.error(failure);

    expect(store.usersState.status()).toBe('error');
    expect(store.usersState.error()).toBe(failure);
    expect(store.usersState.isSettled()).toBe(true);
    expect(store.usersState.isLoading()).toBe(false);
  });

  it('exposes state and sink as the same underlying manual state', () => {
    store.usersSink.setSuccess([9]);

    expect(store.usersState.status()).toBe('success');
    expect(store.usersState.data()).toEqual([9]);
  });

  it('walks success -> refreshing -> success on a re-subscribe with data present', () => {
    store.usersSink.setSuccess([1]);
    expect(store.usersState.status()).toBe('success');

    // tapAsyncState reads the sink's isFirstLoad: data already landed, so a
    // re-subscribe reports refreshing, not loading - content stays visible.
    const source = new Subject<number[]>();
    source.pipe(tapAsyncState(store.usersSink)).subscribe();

    expect(store.usersState.status()).toBe('refreshing');
    expect(store.usersState.data()).toEqual([1]);

    source.next([1, 2]);
    expect(store.usersState.status()).toBe('success');
    expect(store.usersState.data()).toEqual([1, 2]);
  });

  it('reset() returns the pair to idle and clears data and the first-load latch', () => {
    store.usersSink.setSuccess([7]);
    expect(store.usersState.isFirstLoad()).toBe(false);

    store.usersSink.reset();

    expect(store.usersState.status()).toBe('idle');
    expect(store.usersState.data()).toBeUndefined();
    expect(store.usersState.isEmpty()).toBe(true);
    expect(store.usersState.isFirstLoad()).toBe(true);
  });

  it('a duplicate key keeps state and sink paired (NgRx last-wins)', () => {
    // Two features under the same key: NgRx dev-mode warns and the LAST
    // feature's props win wholesale. The invariant that must survive is the
    // pairing - state and sink always come from the same manual instance.
    const DupStore = signalStore(
      { providedIn: 'root' },
      withCngxAsyncState<number[]>()('items'),
      withCngxAsyncState<number[]>()('items'),
    );
    const dup = TestBed.inject(DupStore);

    dup.itemsSink.setSuccess([5]);
    expect(dup.itemsState.status()).toBe('success');
    expect(dup.itemsState.data()).toEqual([5]);
  });
});
