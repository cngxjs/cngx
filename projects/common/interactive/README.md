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

### Types

```typescript
type AsyncAction = () => Promise<unknown> | Observable<unknown>;
type AsyncStatus = 'idle' | 'loading' | 'pending' | 'refreshing' | 'success' | 'error';
```

## CngxPressable

Instant press feedback via CSS class on `pointerdown`. Click feedback fires too late - press feedback is immediate (0ms latency). The class is removed on `pointerup` with an optional delay to prevent a visual flash on quick taps.

The directive only toggles the `cngx-pressed` class. All visual treatment (scale, opacity, color) is the consumer's CSS.

```html
<button cngxPressable>Click me</button>
```

```css
.cngx-pressed { transform: scale(0.97); }
```

## CngxLongPress

Detects long-press gestures via Pointer Events. Fires after the pointer is held for the threshold duration without moving beyond a distance limit. Cancels on scroll (prevents accidental triggers).

```html
<div cngxLongPress (longPressed)="showContextMenu($event)"
     #lp="cngxLongPress" [class.holding]="lp.longPressing()">
  Long press me
</div>
```

### Notes

- Pointer events on `document` for up/move - captures gestures that drift outside the element.
- Cancels on: `pointerup`, `pointercancel`, `pointerleave`, or movement > `moveThreshold` px.
- Uses `Math.hypot` for Euclidean distance (diagonal movement measured correctly).

## CngxKeyboardShortcut

Declarative keyboard shortcut handler. No global event listener service - each directive manages its own subscription, cleaned up via `takeUntilDestroyed`.

Supports `mod` as a platform-aware modifier (`Meta` on macOS, `Ctrl` elsewhere). Uses `parseKeyCombo` and `matchesKeyCombo` from `@cngx/core/utils`.

```html
<button [cngxKeyboardShortcut]="'mod+s'" (shortcutTriggered)="save()">
  Save
</button>
```

### Notes

- `global` scope ignores events from `<input>`, `<textarea>`, `<select>`, and `contenteditable` elements.
- `self` scope only fires when the host element (or a descendant) has focus.
- `preventDefault()` is called on matching events.
- Combo string is memoised - re-parsed only when the input changes.

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
- No `DestroyRef` cleanup - the subscription is unmanaged. If the component is
  destroyed mid-flight, the subscription completes silently.

## CngxSlider / CngxRangeSlider

Headless `role="slider"` directives with full APG keyboard (Arrow / Page / Home / End)
and pointer-drag. The value is a `model()`, so it binds two-way and works with Angular
Signal Forms' `[control]` directive without any forms import. The directive publishes the
thumb position as the inherited `--cngx-slider-fraction` custom property (0..1); the skin
reads it to place the fill and thumb. Default styling ships as Track-B CSS in
`@cngx/themes/cngx.css`.

```html
<label id="vol-label">Volume</label>
<div cngxSlider class="cngx-slider" aria-labelledby="vol-label" [(value)]="volume" [min]="0" [max]="100">
  <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
  <span class="cngx-slider__thumb"></span>
</div>
```

Use `CngxRangeSlider` for a two-thumb range. It owns a `model<[number, number]>()` tuple
and provides `CNGX_SLIDER_RANGE`; each `[cngxSliderThumb]="'start' | 'end'"` child is an
independent focusable slider, clamped to its sibling so the thumbs can never cross.

```html
<div cngxRangeSlider role="group" aria-label="Price range" [(value)]="price" [min]="0" [max]="1000">
  <span class="cngx-slider__track"></span>
  <span cngxSliderThumb="start" aria-label="Minimum"></span>
  <span cngxSliderThumb="end" aria-label="Maximum"></span>
</div>
```

`createSliderCore()` is the shared pure factory both directives instantiate - hand it the
value/min/max/step signals and it returns the clamped value, the track fraction, the
`aria-valuetext` string, and the keyboard/pointer write helpers.

## Other Exports

`CngxClickOutside`, `CngxDisclosure`, `CngxNavLink`, `CngxNavLabel`, `CngxNavBadge`,
`CngxNavGroup`, `CngxNavGroupRegistry`, `CngxSearch`, `CngxSpeak`, `CngxSwipeDismiss`,
`CngxHoverable`, `CNGX_NAV_CONFIG`, `provideNavConfig`, `injectNavConfig`
