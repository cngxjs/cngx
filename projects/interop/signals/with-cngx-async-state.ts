import { signalStoreFeature, withProps } from '@ngrx/signals';
import { createManualState, type ManualAsyncState } from '@cngx/common/data';
import type { CngxAsyncState } from '@cngx/core/utils';

/**
 * Store members contributed by `withCngxAsyncState(key)`.
 *
 * - `<key>State` — the read-only `CngxAsyncState<T>` view, for `[state]`
 *   bindings and the `CngxToastOn` / `CngxAlertOn` / `CngxBannerOn` bridges.
 * - `<key>Sink` — the writable `ManualAsyncState<T>` that `tapAsyncState`
 *   drives.
 *
 * @category interop/signals
 */
export type CngxAsyncStateProps<Key extends string, T> = {
  readonly [K in Key as `${K}State`]: CngxAsyncState<T>;
} & {
  readonly [K in Key as `${K}Sink`]: ManualAsyncState<T>;
};

/**
 * `@ngrx/signals` store feature that grants a store a `CngxAsyncState`-shaped
 * slice with zero hand-written status flags.
 *
 * The element type is supplied up front and the key is inferred from the
 * argument, so the two contributed members carry the literal key:
 * `withCngxAsyncState<User[]>()('users')` adds `usersState` (the read-only
 * `CngxAsyncState<User[]>` view) and `usersSink` (the writable
 * `ManualAsyncState<User[]>`). Drive the status with the existing
 * `tapAsyncState` operator — no new state machine, no manual `isLoading`
 * boolean. Both members are the same underlying `createManualState` instance,
 * exposed under a read type and a write type.
 *
 * The `<T>()` / `(key)` split is deliberate: TypeScript cannot infer the
 * literal key while `T` is given explicitly in one call, so a single-call
 * form collapses the key to a `string` index signature. Currying keeps the
 * key literal — and therefore the store members concretely named.
 *
 * ```typescript
 * export const UsersStore = signalStore(
 *   withCngxAsyncState<User[]>()('users'),
 *   withMethods((store) => {
 *     const http = inject(HttpClient);
 *     return {
 *       load: () =>
 *         http.get<User[]>('/api/users').pipe(
 *           tapAsyncState(store.usersSink),
 *           takeUntilDestroyed(),
 *         ).subscribe(),
 *     };
 *   }),
 * );
 * // store.usersState.status(), store.usersState.data() — derived, no flags
 * ```
 *
 * @category interop/signals
 */
export function withCngxAsyncState<T = unknown>() {
  return <Key extends string>(key: Key) =>
    signalStoreFeature(
      withProps(() => {
        const manual = createManualState<T>();
        return {
          [`${key}State`]: manual,
          [`${key}Sink`]: manual,
        } as CngxAsyncStateProps<Key, T>;
      }),
    );
}
