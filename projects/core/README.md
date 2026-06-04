# @cngx/core

Angular-only tokens and utilities. No CDK, no Material dependencies.

## Secondary Entry Points

### @cngx/core/tokens

DI tokens and providers for application-wide concerns.

- `ENVIRONMENT` / `provideEnvironment()` -- typed environment token
- `WINDOW` / `provideWindow()` / `injectWindow()` -- SSR-safe window access

### @cngx/core/utils

Pure utilities and the async state system's type foundation.

#### AsyncStatus / CngxAsyncState

The canonical async state interface used by all cngx feedback components.

```typescript
type AsyncStatus = 'idle' | 'loading' | 'pending' | 'refreshing' | 'success' | 'error';

interface CngxAsyncState<T> {
  readonly status: Signal<AsyncStatus>;
  readonly data: Signal<T | undefined>;
  readonly error: Signal<unknown>;
  readonly progress: Signal<number | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly isPending: Signal<boolean>;
  readonly isRefreshing: Signal<boolean>;
  readonly isBusy: Signal<boolean>;
  readonly isFirstLoad: Signal<boolean>;
  readonly isEmpty: Signal<boolean>;
  readonly hasData: Signal<boolean>;
  readonly isSettled: Signal<boolean>;
  readonly lastUpdated: Signal<Date | undefined>;
}
```

#### buildAsyncStateView

Shared kernel for building `CngxAsyncState<T>` from source signals. Used by all
async state factories (`createManualState`, `createAsyncState`, `injectAsyncState`)
and state producers (`CngxAsyncClick`, `CngxActionButton`).

```typescript
import { buildAsyncStateView } from '@cngx/core/utils';

const state = buildAsyncStateView<MyData>({
  status: myStatusSignal,
  data: myDataSignal,
  error: myErrorSignal,
  progress: myProgressSignal,       // optional, defaults to undefined
  isFirstLoad: myFirstLoadSignal,   // optional, defaults to false
  lastUpdated: myLastUpdatedSignal, // optional, defaults to undefined
});
```

No injection context required -- uses only `computed()`. All 13 fields of
`CngxAsyncState<T>` are derived from the provided source signals.

`isFirstLoad` is an explicit optional parameter (not derived from other fields).
Callers that track `hadSuccess` pass their own computed; mutation producers omit
it (defaults to `computed(() => false)`).

#### Other Utilities

- `coerceBooleanProperty`, `coerceNumberProperty` -- value coercion
- `memoize()` -- function memoization
- `parseKeyCombo()`, `matchesKeyCombo()` -- keyboard shortcut parsing
- `hasTransition()`, `onTransitionDone()` -- CSS transition detection
- `nextUid()` -- unique ID generator
