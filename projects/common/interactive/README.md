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

Finished slider components - the 90% API. Drop in `<cngx-slider>`, bind `[(value)]`, done:
the component renders the track, fill, and thumb and wires full APG keyboard (Arrow / Page /
Home / End) and pointer-drag. The value is a `model<number>()`, so it binds two-way and
works with Signal Forms via `[control]`; the `cngx-form-field` integration is `CngxSliderField`
in `@cngx/forms`. `showValue` floats the formatted value above the thumb.

```html
<label id="vol">Volume</label>
<cngx-slider aria-labelledby="vol" [(value)]="volume" [min]="0" [max]="100" [step]="5" showValue />
```

`<cngx-range-slider>` is the two-thumb range over a `model<[number, number]>()` tuple. It
paints the orange fill band between the thumbs and clamps each to the other so they never
cross.

```html
<cngx-range-slider aria-label="Price" [(value)]="price" [min]="0" [max]="1000" [step]="10" showValue />
```

### Headless directives (bring your own skin)

When the default skin is not what you want, the headless `[cngxSliderTrack]` /
`[cngxRangeSliderTrack]` directives give you the same `role="slider"` brain on your own
element. They publish `--cngx-slider-fraction` (and, for range,
`--cngx-slider-start/end-fraction`) so your markup positions the thumb and fill; default
Track-B styling for the BEM skin ships in `@cngx/themes/cngx.css`.

```html
<div cngxSliderTrack class="cngx-slider" aria-label="Level" [(value)]="level" [min]="0" [max]="100">
  <span class="cngx-slider__track"><span class="cngx-slider__fill"></span></span>
  <span class="cngx-slider__thumb"></span>
</div>
```

For a headless range, host two `[cngxSliderThumb]="'start' | 'end'"` children inside
`[cngxRangeSliderTrack]`. `createSliderCore()` is the shared pure factory under all of them -
hand it the value/min/max/step signals and it returns the clamped value, track fraction,
`aria-valuetext`, and the keyboard/pointer write helpers.

## CngxAccordion / CngxAccordionPanel

A coordinating accordion over the existing expansion and roving atoms. `CngxAccordion`
owns one open-set signal and arbitrates single- vs multi-open (`[multi]`); each
`CngxAccordionPanel` header is a button that toggles its `panelId` and derives
`aria-expanded` from that one signal - no panel-owned state, no sibling syncing. The
container pins `CngxRovingTabindex` to the vertical axis for arrow-key header navigation,
so the header buttons must be direct children of the `cngxAccordion` element. Default
chrome ships as Track-B CSS in `@cngx/themes/cngx.css`.

```html
<div cngxAccordion #acc="cngxAccordion" [multi]="false">
  <button cngxAccordionPanel panelId="a" controls="region-a">Section A</button>
  <div role="region" id="region-a" [hidden]="!acc.isOpen('a')">…</div>
  <button cngxAccordionPanel panelId="b" controls="region-b">Section B</button>
  <div role="region" id="region-b" [hidden]="!acc.isOpen('b')">…</div>
</div>
```

`aria-multiselectable` reflects `[multi]`; `CNGX_ACCORDION` is the token panels inject to
reach the coordinator.

## CngxBreadcrumb / CngxBreadcrumbItem / CngxBreadcrumbSeparator

A linear breadcrumb over a `<nav>` landmark. `CngxBreadcrumb` names the landmark and, when
the trail exceeds `[maxVisible]`, derives which middle crumbs collapse (keeping the first
and the last `maxVisible - 1`) and exposes them via `collapsedItems()` / `hasCollapsed()`.
`CngxBreadcrumbItem` marks the terminal crumb `aria-current="page"` from its position - the
terminal crumb may be a `<span>` or an `<a [attr.href]="null">`, both derive it identically;
`CngxBreadcrumbSeparator` marks glyphs `aria-hidden`. Default chrome ships as Track-B CSS
in `@cngx/themes/cngx.css`.

```html
<nav cngxBreadcrumb [maxVisible]="4" #bc="cngxBreadcrumb">
  <ol>
    <li><a cngxBreadcrumbItem href="/">Home</a></li>
    <li cngxBreadcrumbSeparator>/</li>
    <li><span cngxBreadcrumbItem>Current page</span></li>
  </ol>
</nav>
```

Render the collapsed crumbs in an ellipsis `CngxMenu` (drive it from `bc.hasCollapsed()`),
and truncate long labels with `CngxTruncate`.

The collapse rule is a swappable DI factory. `createBreadcrumbCollapse()` is the default
(keep the first crumb + the last `maxVisible - 1`); override
`CNGX_BREADCRUMB_COLLAPSE_STRATEGY` in `providers` (app-wide) or `viewProviders` (per `<nav>`)
to change which indices fold - width-aware, keep-first-N, mobile parent-only - without
forking. The strategy is a pure `(total, maxVisible) => ReadonlySet<number>`.

```ts
@Component({
  viewProviders: [{
    provide: CNGX_BREADCRUMB_COLLAPSE_STRATEGY,
    useValue: (total, maxVisible) => keepFirstTwoAndLastTwo(total, maxVisible),
  }],
})
```

## Other Exports

`CngxClickOutside`, `CngxDisclosure`, `CngxNavLink`, `CngxNavLabel`, `CngxNavBadge`,
`CngxNavGroup`, `CngxNavGroupRegistry`, `CngxSearch`, `CngxSpeak`, `CngxSwipeDismiss`,
`CngxHoverable`, `CNGX_NAV_CONFIG`, `provideNavConfig`, `injectNavConfig`
