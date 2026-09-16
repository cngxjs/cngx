# @cngx/interop

Bridges from external async ecosystems into the `CngxAsyncState` contract. Each adapter takes a foreign async shape - a TanStack Query result, an NgRx SignalStore - and projects it onto the same signal view that `createManualState` and `injectAsyncState` produce, so every cngx feedback and async surface (`[state]` bindings, `*cngxAsync`, the `CngxToastOn` / `CngxAlertOn` / `CngxBannerOn` transition bridges) consumes it natively. The `from*` naming marks the direction: these bridge from an external shape into cngx, never the other way around.

## When you reach for it

Your data layer already lives in TanStack Query or an NgRx SignalStore and you want cngx async surfaces without hand-written `isLoading` flags or a translation service in between.

## Entry points

| Entry | What it ships |
|-|-|
| `@cngx/interop/query` | `fromQuery` - projects any `CngxQueryLike<T>` onto `CngxAsyncState<T>`. A `CreateQueryResult` from `@tanstack/angular-query-experimental` satisfies the interface structurally, so a real query result binds directly. |
| `@cngx/interop/signals` | `withCngxAsyncState` - an `@ngrx/signals` store feature that contributes a `<key>State` (read-only `CngxAsyncState<T>`) / `<key>Sink` (writable `ManualAsyncState<T>`) pair per key. Plus the `CngxAsyncStateProps` mapped type. |

The primary `@cngx/interop` entry exports only the version constant. There is nothing to import from here in application code - pick a secondary entry.

## Quick Start

### `@cngx/interop/query`

```typescript
import { injectQuery } from '@tanstack/angular-query-experimental';
import { fromQuery } from '@cngx/interop/query';

private readonly query = injectQuery(() => ({
  queryKey: ['users', this.filter()],
  queryFn: () => fetchUsers(this.filter()),
}));

readonly users = fromQuery(this.query);
// users.status(), users.data(), users.isFirstLoad() - all work
// <cngx-async-container [state]="users"> - direct binding
```

No injection context required - `fromQuery` is pure `computed()`. Bind `dataUpdatedAt` (part of `CngxQueryLike`) for an exact first-load latch and a populated `lastUpdated`.

### `@cngx/interop/signals`

```typescript
import { signalStore, withMethods } from '@ngrx/signals';
import { withCngxAsyncState } from '@cngx/interop/signals';
import { tapAsyncState } from '@cngx/common/data';

export const UsersStore = signalStore(
  withCngxAsyncState<User[]>()('users'),
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      load: () =>
        http.get<User[]>('/api/users').pipe(
          tapAsyncState(store.usersSink),
          takeUntilDestroyed(),
        ).subscribe(),
    };
  }),
);
// store.usersState.status(), store.usersState.data() - derived, no flags
```

The `<T>()` / `(key)` currying keeps the key literal, so the contributed members are concretely named (`usersState`, `usersSink`). Key collisions with existing store members are not guarded - NgRx warns in dev mode; pick keys that do not shadow existing state or props.

## Mental model

Derived, not managed. Neither adapter runs an effect or keeps a status flag in sync:

- `fromQuery` maps TanStack's `status` / `fetchStatus` pair onto the cngx `AsyncStatus` union in a `computed()` and hands the query's own `data` / `error` signals to `buildAsyncStateView` - the same kernel every other cngx async producer uses. A background refetch over retained data reads as `refreshing`, a retry out of error reads as busy again.
- `withCngxAsyncState` wraps one `createManualState` per key. The `Sink` is the write side that `tapAsyncState` drives from your streams; the `State` is the read side your templates bind. Both are the same underlying instance, exposed under a write type and a read type.

## See also

- `@cngx/core/utils` - the `CngxAsyncState<T>` contract, `AsyncStatus`, `buildAsyncStateView`.
- `@cngx/common/data` - `createManualState`, `tapAsyncState`, `injectAsyncState`, `CngxAsync`.
- Function signatures and the status-mapping table in the **API** tab.
