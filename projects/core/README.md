# @cngx/core

Angular-only tokens and utilities. No CDK, no Material dependencies.

## Primary Entry (`@cngx/core`)

The bare specifier ships the theming preference axes and the bidi surface.

### Preference axes

Each axis is the same triple: a token, a `provide*`/`inject*` pair, and (where
a subtree override makes sense) a host directive stamping a `data-*` attribute
the CSS foundation reacts to.

- `CNGX_DENSITY` / `provideDensity()` / `injectDensity()` + `CngxDensity`
- `CNGX_TEXT_SCALE` / `provideTextScale()` / `injectTextScale()`
- `CNGX_TOUCH_TARGET` / `provideTouchTargets()` / `injectTouchTargets()` + `CngxTouchTarget`
- `CNGX_MOTION` / `provideMotion()` / `injectMotion()` + `CngxMotionScope`
- `CNGX_CONTRAST` / `provideContrast()` / `injectContrast()` + `CngxContrast`

### provideA11yPreferences

The writable-preference feature set: `provideA11yPreferences(withDensity(),
withTextScale(), withMotion(), withContrast(), withPersistence())` wires the
axes as user-settable signals, `injectA11yPreferences()` reads them, and
`CNGX_A11Y_STORAGE` swaps the persistence backend.

### Bidi and inline navigation

- `CNGX_DIRECTION` / `provideDirection()` / `provideDirectionAt()` / `injectDirection()` -- the document/subtree direction as a signal
- `CngxDir` -- subtree direction override directive
- `resolveInlineStep()` / `resolveInlineArrowKey()` -- map arrow keys to logical inline steps under RTL
- `resolveStepFrom()` / `resolveBoundaryStep()` -- shared keyboard step resolution (`CngxStepScan`)

## Secondary Entry Points

### @cngx/core/tokens

DI tokens and providers for application-wide concerns.

- `ENVIRONMENT` / `provideEnvironment()` -- typed environment token
- `WINDOW` / `provideWindow()` / `injectWindow()` -- SSR-safe window access
- `CNGX_FORM_FIELD_CONTROL` -- contract a custom control provides so `<cngx-form-field>` can discover it
- `CNGX_FORM_FIELD_HOST` -- host surface a sub-component reads instead of injecting the concrete field class

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
  isEmpty: myIsEmptySignal,         // optional, overrides the data-shape derivation
});
```

No injection context required -- uses only `computed()`. All 13 fields of
`CngxAsyncState<T>` are derived from the provided source signals. `isEmpty`
is shape-derived by default (`null`/`undefined` or an empty array counts as
empty); pass the optional source when emptiness is a domain rule the shape
cannot express (an aggregate whose `data` array is never length 0, a paged
result with `total: 0`).

`isFirstLoad` is an explicit optional parameter (not derived from other fields).
Callers that track `hadSuccess` pass their own computed; mutation producers omit
it (defaults to `computed(() => false)`).

#### Other Utilities

- `coerceBooleanProperty`, `coerceNumberProperty` -- value coercion
- `memoize()` -- function memoization
- `parseKeyCombo()`, `matchesKeyCombo()` -- keyboard shortcut parsing
- `hasTransition()`, `onTransitionDone()` -- CSS transition detection
- `nextUid()` -- unique ID generator

## Theming

### Typography units

Library `font-size` is always root-relative -- `rem`, `em`, or `%`, never `px`.
A root-relative size lets the browser user-font-size setting and page zoom scale
all text for free (WCAG 1.4.4 Resize Text, 1.4.10 Reflow); a single `px`
`font-size` literal silently opts that node out. `font-size: 0` glyph/whitespace
resets are allowed -- they carry no `px`.

Enforcement is a source-scan guard, `theming/font-size-unit-coverage.spec.ts`,
which fails on any `px` in a `font-size:` value or a `--*font-size*`-named token
definition across shipped `projects/**/*.css`. The guard keys on the `font-size`
name: a `px` that reaches `font-size` through a differently-named length token
(e.g. a `--*-glyph-size` custom property or a registered `@property` with a `px`
`initial-value`) is out of its heuristic and stays a manifest-review
responsibility -- the same caveat the touch-target guard carries. This rem-only
baseline is the precondition for the future global `[data-text-size]` S/M/L
switch: a strict root-relative baseline lets that switch ride one root-font-size
multiplier instead of a per-token rule.
