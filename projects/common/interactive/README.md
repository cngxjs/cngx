# @cngx/common/interactive

Click, gesture, navigation, speech, and async action directives.

## CngxAsyncClick

Async click handler with loading state, auto-disable, and success/error feedback.
Place on any clickable element. Executes the provided async action on click,
tracks pending/succeeded/failed state, auto-disables during execution, and resets
feedback after a configurable duration.

```html
<button [cngxAsyncClick]="saveAction" #ac="cngxAsyncClick">
  @if (ac.pending()) { Saving... }
  @else if (ac.succeeded()) { Saved! }
  @else if (ac.failed()) { Failed }
  @else { Save }
</button>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxAsyncClick` | `AsyncAction` | required | Async action: `() => Promise \| Observable` |
| `feedbackDuration` | `number` | `2000` | Duration in ms to show success/error state before reset |
| `enabled` | `boolean` | `true` | When `false`, clicks are ignored |
| `succeededAnnouncement` | `string` | `'Action succeeded'` | Label announced to screen readers on success |
| `failedAnnouncement` | `string` | `'Action failed'` | Label announced to screen readers on failure |

### Signals

| Signal | Type | Description |
|-|-|-|
| `pending` | `boolean` | `true` while the action is executing |
| `succeeded` | `boolean` | `true` for `feedbackDuration` ms after success |
| `failed` | `boolean` | `true` for `feedbackDuration` ms after failure |
| `error` | `unknown` | Error value from a failed action (cleared on reset) |
| `status` | `AsyncStatus` | Discriminated lifecycle status: `'idle'`, `'pending'`, `'success'`, `'error'` |
| `announcement` | `string` | Screen reader announcement for the current state |
| `state` | `CngxAsyncState<unknown>` | Full async state view — bind to any `[state]` consumer |

### State Producer

`CngxAsyncClick` exposes a `state: CngxAsyncState<unknown>` property that plugs
directly into the cngx feedback system. Any component that accepts `[state]` can
be wired to it:

```html
<button [cngxAsyncClick]="save" #btn="cngxAsyncClick">Save</button>

<!-- Wire to toast -->
<div [cngxToastOn]="btn.state" toastSuccess="Saved" toastError="Failed"></div>

<!-- Wire to alert -->
<cngx-alert [state]="btn.state" severity="error" title="Save failed" />
```

Because `CngxAsyncClick` is a mutation trigger (not a data query), several
state fields have fixed values:

| Field | Value | Reason |
|-|-|-|
| `data` | always `undefined` | Mutations don't produce visible data |
| `isFirstLoad` | always `false` | Mutations never show skeleton |
| `isEmpty` | always `true` | No data payload |
| `progress` | always `undefined` | No progress tracking |
| `lastUpdated` | set on success | Persists across feedback resets |

### CSS Classes

| Class | When |
|-|-|
| `cngx-async--pending` | Action is executing |
| `cngx-async--success` | Success feedback window |
| `cngx-async--error` | Error feedback window |

### ARIA

- `aria-busy="true"` when pending
- `aria-disabled="true"` when pending
- Native `disabled` attribute set on `<button>`, `<input>`, `<select>`, `<textarea>` when pending

### Selector

`[cngxAsyncClick]` -- exportAs `"cngxAsyncClick"`

### Notes

- Built-in double-click guard: clicks are ignored while `pending()` is `true`.
- Accepts both `Promise` and `Observable` return types. Observables are converted via `firstValueFrom`.
- Feedback timer is cleared on destroy.
- Guards against state updates after directive destruction.

### Types

```typescript
type AsyncAction = () => Promise<unknown> | Observable<unknown>;
type AsyncStatus = 'idle' | 'loading' | 'pending' | 'refreshing' | 'success' | 'error';
```

---

## CngxPressable

Instant press feedback via CSS class on `pointerdown`. Click feedback fires too late — press feedback is immediate (0ms latency). The class is removed on `pointerup` with an optional delay to prevent a visual flash on quick taps.

The directive only toggles the `cngx-pressed` class. All visual treatment (scale, opacity, color) is the consumer's CSS.

```html
<button cngxPressable>Click me</button>
```

```css
.cngx-pressed { transform: scale(0.97); }
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `pressableReleaseDelay` | `number` | `80` | Minimum ms the pressed class stays active |

### Signals

| Signal | Type | Description |
|-|-|-|
| `pressed` | `boolean` | Whether the element is currently pressed |

### CSS Classes

| Class | When |
|-|-|
| `cngx-pressed` | Pointer is down (for at least `releaseDelay` ms) |

### ARIA

No ARIA attributes — purely visual class-based feedback. Consumer applies `aria-pressed` if semantically appropriate.

### Selector

`[cngxPressable]` -- exportAs `"cngxPressable"`

---

## CngxLongPress

Detects long-press gestures via Pointer Events. Fires after the pointer is held for the threshold duration without moving beyond a distance limit. Cancels on scroll (prevents accidental triggers).

```html
<div cngxLongPress (longPressed)="showContextMenu($event)"
     #lp="cngxLongPress" [class.holding]="lp.longPressing()">
  Long press me
</div>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `threshold` | `number` | `500` | Hold time in ms to trigger |
| `enabled` | `boolean` | `true` | Whether the directive is active |
| `moveThreshold` | `number` | `10` | Max pointer movement in px before cancel |

### Outputs

| Output | Type | Description |
|-|-|-|
| `longPressed` | `PointerEvent` | Emitted when the long-press completes |

### Signals

| Signal | Type | Description |
|-|-|-|
| `longPressing` | `boolean` | `true` while the hold timer is running |

### ARIA

No ARIA attributes. Consumer is responsible for `aria-haspopup` or similar if the long-press opens a menu/context action.

### Selector

`[cngxLongPress]` -- exportAs `"cngxLongPress"`

### Notes

- Pointer events on `document` for up/move — captures gestures that drift outside the element.
- Cancels on: `pointerup`, `pointercancel`, `pointerleave`, or movement > `moveThreshold` px.
- Uses `Math.hypot` for Euclidean distance (diagonal movement measured correctly).

---

## CngxKeyboardShortcut

Declarative keyboard shortcut handler. No global event listener service — each directive manages its own subscription, cleaned up via `takeUntilDestroyed`.

Supports `mod` as a platform-aware modifier (`Meta` on macOS, `Ctrl` elsewhere). Uses `parseKeyCombo` and `matchesKeyCombo` from `@cngx/core/utils`.

```html
<button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="save()">
  Save
</button>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxKeyboardShortcut` | `string` | required | Combo string: `'mod+s'`, `'ctrl+shift+k'`, `'escape'` |
| `shortcutScope` | `'global' \| 'self'` | `'global'` | Where to listen |
| `enabled` | `boolean` | `true` | Whether the shortcut is active |

### Outputs

| Output | Type | Description |
|-|-|-|
| `shortcutTriggered` | `KeyboardEvent` | Emitted when the shortcut fires |

### ARIA

No ARIA attributes set by the directive. Consumer should add `aria-keyshortcuts` on the host element for discoverability (e.g. `aria-keyshortcuts="Control+S"`).

### Selector

`[cngxKeyboardShortcut]` -- exportAs `"cngxKeyboardShortcut"`

### Notes

- `global` scope ignores events from `<input>`, `<textarea>`, `<select>`, and `contenteditable` elements.
- `self` scope only fires when the host element (or a descendant) has focus.
- `preventDefault()` is called on matching events.
- Combo string is memoised — re-parsed only when the input changes.

---

## withRetry

Wraps an `AsyncAction` with automatic retry logic. Returns `[action, retryState]`.
The wrapped action retries on failure with configurable delay and backoff.

```typescript
const [saveWithRetry, retryState] = withRetry(
  () => this.http.post('/api/save', data),
  { maxAttempts: 3, delay: 1000, backoff: 'exponential' }
);
```

```html
<button [cngxAsyncClick]="saveWithRetry" #btn="cngxAsyncClick">
  @if (retryState.retrying()) {
    Retry {{ retryState.attempt() }}/{{ retryState.maxAttempts() }}...
  } @else {
    Save
  }
</button>

<!-- Bind retry state to toast -->
<ng-container [cngxToastOn]="retryState.state"
  toastSuccess="Saved" toastError="All retries failed" />
```

### RetryConfig

| Option | Type | Default | Description |
|-|-|-|-|
| `maxAttempts` | `number` | `3` | Maximum attempts (including first) |
| `delay` | `number` | `1000` | Base delay in ms between retries |
| `backoff` | `'linear' \| 'exponential'` | `'exponential'` | Delay growth strategy |

### RetryState

| Signal | Type | Description |
|-|-|-|
| `attempt` | `number` | Current attempt (1-based, `0` before first) |
| `maxAttempts` | `number` | Total attempts allowed |
| `retrying` | `boolean` | `true` during delay between retries |
| `exhausted` | `boolean` | `true` when all attempts failed |
| `lastError` | `unknown` | Error from last failed attempt |
| `state` | `CngxAsyncState<unknown>` | Full async state view for feedback system |

### State Mapping

| Phase | AsyncStatus |
|-|-|
| Before first call | `'idle'` |
| Attempt running | `'pending'` |
| Delay between retries | `'pending'` (retrying phase included) |
| Success | `'success'` |
| All attempts exhausted | `'error'` |

`reset()` clears all state back to `'idle'`.

---

## optimistic

Creates an optimistic update function for a signal. Sets the value immediately,
then confirms via an async action. On failure, rolls back to the last confirmed value.

```typescript
readonly name = signal('Alice');
readonly [updateName, nameState] = optimistic(
  this.name,
  (value) => this.http.put('/api/name', { name: value })
);
```

```html
<input [value]="name()" (change)="updateName($event.target.value)" />

<!-- Bind optimistic state to toast -->
<ng-container [cngxToastOn]="nameState.state" toastError="Update failed" />
@if (nameState.rolledBack()) { <span>Reverted</span> }
```

### OptimisticState

| Signal | Type | Description |
|-|-|-|
| `rolledBack` | `boolean` | Whether a rollback occurred |
| `error` | `unknown` | Error from last failed action |
| `state` | `CngxAsyncState<unknown>` | Full async state view for feedback system |

### State Mapping

| Phase | AsyncStatus |
|-|-|
| Before first call | `'idle'` |
| Observable in flight | `'pending'` |
| Server confirmed | `'success'` |
| Rollback | `'error'` |

### Notes

- Rapid successive calls cancel the previous in-flight Observable. Rollback always
  returns to the last server-confirmed value, not a stale optimistic value.
- No `DestroyRef` cleanup — the subscription is unmanaged. If the component is
  destroyed mid-flight, the subscription completes silently.

---

## Other Exports

`CngxClickOutside`, `CngxDisclosure`, `CngxNavLink`, `CngxNavLabel`, `CngxNavBadge`,
`CngxNavGroup`, `CngxNavGroupRegistry`, `CngxSearch`, `CngxSpeak`, `CngxSwipeDismiss`,
`CngxHoverable`, `CNGX_NAV_CONFIG`, `provideNavConfig`, `injectNavConfig`
