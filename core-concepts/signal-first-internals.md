<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Signal-First Internals

> **The cngx internals are signal-shaped from the inside out: input/output, computed graphs, hostDirectives, untracked at service boundaries.**

CNGX is built on Angular Signals. Not "uses Signals where convenient" - built on them.

Every reactive value flowing through a directive is a `Signal<T>`. RxJS exists at the boundary; the interior is signal-only.

This chapter is the operational manual: which primitive to use when, which rules are non-negotiable, and which patterns recur across the library.

---

## The four primitives

|Primitive|When to use|When **not** to use|
|-|-|-|
|`signal(initial)`|Owned writable state where this component is the sole writer.|Anywhere a `computed` would express the same value.|
|`computed(fn)`|Every derived value. ARIA attributes, disabled state, visible flags, panel views, resolved templates.|Side effects (DOM writes, service calls).|
|`effect(fn)`|Imperative side effects that leave the reactive graph (DOM measurement, focusing, calling a service).|Writing a signal to mirror another signal - use `computed` or `linkedSignal`.|
|`linkedSignal({ source, computation })`|Tracking a transition between two states (idle → loading → success) where the latest state needs to be remembered across source changes.|A simple derivation - use `computed`. A simple write - use `signal`.|

---

## Inputs and outputs

CNGX never uses decorators for inputs/outputs. They are signal-based across the entire library:

```typescript
readonly label = input<string | undefined>(undefined);
readonly required = model<boolean>(false);
readonly value = model<T | undefined>(undefined);
readonly selectionChange = output<CngxSelectChange<T>>();
```

### `input<T>()` for one-way bindings

The CNGX atoms use the plain `input<boolean>(false)` form for boolean flags - no `transform: coerceBooleanProperty` wrapper.

`coerceBooleanProperty` is exported from `@cngx/core/utils` for consumer code, but the library itself relies on Angular's built-in attribute coercion. See `CngxSidenav.resizable`, `CngxLoadingIndicator.loading`, `CngxSkeletonContainer.shimmer`.

### `input.required<T>()` only when the consumer must provide

Never on a directive that injects an optional fallback.

A directive whose `[state]` may auto-discover from `CNGX_STATEFUL` must use optional `input<T | undefined, T | '' | undefined>(undefined, { transform: v => typeof v === 'string' ? undefined : v })` so that a bare attribute (`<div cngxToastOn>` - empty-string binding) is treated as "not bound" and triggers the DI fallback.

See `CngxToastOn.state`, `CngxAlertOn.state`, `CngxBannerOn.state`.

### `model<T>()` for two-way bindable atoms

`[value]`, `(valueChange)`, and `[(value)]` all work identically.

CNGX uses `model()` not only for the primary value but also for **bridge-writable** mirrors like `CngxButtonToggleGroup.disabled` / `.required` / `.invalid`, so the Signal-Forms / RF adapters can drive those flags from outside without a parallel API.

### `output<T>()` for events

Event handlers in component code use the `handle` prefix (`handleKeydown`, `handleBlur`).

---

## Equality functions

A `computed` that emits a fresh reference on every recomputation will cascade into every downstream consumer, even when the value is structurally identical.

CNGX routes around this with explicit `equal` functions on every hot `computed`. The canonical shape is in `createSelectionController` (`projects/core/utils/selection-controller.ts`):

```typescript
const selected = computed<readonly T[]>(() => values().slice(), {
  equal: (a, b) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) return false;
    }
    return true;
  },
});
```

### Common shapes

- **Identity per entry** for read-only arrays: length + `Object.is` per index. Prevents cascades when the array is re-emitted with the same element references. Used by `createSelectionController.selected`.
- **Structural per entry** with `compareWith` for option arrays: length + pairwise `compareWith(a[i].value, b[i].value)`. Prevents cascades when a server refetch produces fresh option objects with unchanged values. Used by `CngxMultiSelect.selected`.
- **Pair equality** for transition pairs: `a.current === b.current && a.previous === b.previous`. Used by `createTransitionTracker` so a `linkedSignal` storing `{ current, previous }` only emits on actual status transitions.
- **Flat-tree equality** (`flatEq`) for visible-node arrays: length + per-index `id`/`level`/`expandable` comparison. Used by `createTreeController` so re-flattening on every membership change does not re-render every row.

<aside class="cc-note">

**Note.** If a `computed` is read by another `computed` or by a template `@if`, it needs an `equal`. The default `Object.is` is rarely correct for CNGX's shapes.

</aside>

---

## Effect rules

Effects are sharp tools. The non-negotiable rules:

1. **Constructor or field init only.** Never in `ngOnInit` - Angular throws `NG0203` because the injection context is no longer active and `effect()` cannot resolve its `Injector`.
2. **Side effects only.** An effect that writes a signal is almost always wrong. Use `computed` to derive, or `linkedSignal` if you need transition memory.
3. **Wrap service calls in `untracked()`.** Service methods read signals internally; without `untracked()`, those reads register as effect dependencies and re-fire the effect on every internal change, producing an infinite loop. The transition bridges (`CngxToastOn`, `CngxBannerOn`, `CngxAlertOn`) all follow this rule.
4. **Use `onCleanup` for subscriptions.** When an effect installs a listener (RxJS subscription, `setTimeout`, DOM event, `ResizeObserver`, `IntersectionObserver`), the cleanup callback removes it. Effects re-run; without cleanup, listeners stack up. See `CngxInfiniteScroll`, `CngxIntersectionObserverDirective`, `CngxScrollSpy`, `CngxSidenav` (media-query + global-hotkey).
5. **Use `afterNextRender` for one-shot dev-mode checks**, never `effect()`. An `effect()` lives for the directive's full lifetime and re-runs on every dependency read; a config-validation check ("did the consumer bind a state?") fires exactly once after the first render. See `CngxToastOn`, `CngxAlertOn`, `CngxBannerOn`. Do not pair it with fake timers and `whenStable`.

### Cleanup pattern

Real cleanup pattern from `projects/forms/select/shared/ad-activation-dispatcher.ts`:

```typescript
effect((onCleanup) => {
  const lb = options.listboxRef();
  if (!lb) return;
  const sub = lb.ad.activated.subscribe((raw: unknown) => {
    untracked(() => {
      // option lookup + commit / activate dispatch
    });
  });
  onCleanup(() => sub.unsubscribe());
});
```

---

## Transition tracker

`createTransitionTracker(source)` (from `@cngx/core/utils`) is the canonical pattern for reacting to **changes** in an `AsyncStatus` signal, not values.

It returns a `StatusTransition` object with two memoised signals:

```typescript
export interface StatusTransition {
  readonly current: Signal<AsyncStatus>;
  readonly previous: Signal<AsyncStatus>;
}
```

### Consumer shape

Consumer code reads both, compares, and dispatches:

```typescript
const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');

effect(() => {
  const status = tracker.current();
  const previous = tracker.previous();
  if (status === previous) return;       // no transition - bail out
  untracked(() => {
    if (status === 'success') this.toast.show('Saved');
  });
});
```

This is the exact pattern in `CngxToastOn`, `CngxAlertOn`, `CngxBannerOn`, `CngxActionButton`, `CngxTabsPresenter`, `CngxStepperPresenter`, and the recycler.

### Internal equality

Internally, the tracker uses `linkedSignal<AsyncStatus, { current, previous }>` with a **structural** `equal` on the pair (`a.current === b.current && a.previous === b.previous`).

`linkedSignal` defaults to `Object.is`, which compares object identity. Without the override, every recomputation would allocate a fresh `{ current, previous }` literal and downstream effects would re-fire on every status read.

The structural `equal` short-circuits those re-runs and is what makes the tracker safe to read from a side-effecting `effect()`.

---

## linkedSignal

`linkedSignal({ source, computation })` is for the rare case where you need to track a transition and remember the latest result across source changes.

Real CNGX examples:

- **`createTransitionTracker`** (above): the prior `AsyncStatus` is read from `prev?.value.current` to produce the next `{ current, previous }` pair.
- **`CngxTabOverflow.visibilityState`** (`projects/ui/tabs/tab-overflow.component.ts`): a `ReadonlyMap<tabId, visible>` whose `source` is the live tabs array. When tabs come and go, the `computation` prunes stale ids out of the map without losing observed-but-still-live entries.
- **`CngxAlertStack.expanded`** (`projects/ui/feedback/alert/alert-stack.ts`): a `boolean` that auto-resets to `false` when the alert count drops back below `maxVisible`, but is otherwise writable from user "show more" / "show less" actions.
- **`CngxStepper.stepsRollup`** / **`CngxTabGroupAnnouncements`**: snapshot the previously-active index across `source` updates so the announcement layer can describe "moved from step 2 to step 3" reactively, without storing a `let previousIndex` outside the reactive graph.

### The rule

`linkedSignal` reads from `source`, runs `computation` when `source` changes, and is **writable** between source emissions.

Writing it does not change `source`. Reading it gives you "the latest computed value plus any manual override since."

### The infinite-loop trap

<aside class="cc-danger">

**Warning.** A `linkedSignal` MUST NOT be written from inside an `effect()` that also reads it. The write retriggers the effect, the effect rewrites, and the graph never settles.

This is `feedback_linkedsignal_in_effects` from the project memory. If you find yourself reaching for `linkedSignal` to bridge an effect's write back into a derived value, the correct fix is almost always `computed` with the right `equal` (so reads short-circuit) or a separate `signal` driven from a DOM event handler.

</aside>

Never use `linkedSignal` for a value that a `computed` could express directly. The mental model is "a signal that resets on source change," not "a derived value."

---

## Untracked

`untracked(() => …)` is how you read a signal without registering it as a dependency.

The transition bridges use it as the standard pattern. The only tracked reads are the `current`/`previous` pair; everything else (the state, the input messages, the service call) lives inside `untracked`:

```typescript
const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');

effect(() => {
  // Tracked - the bridge only re-fires on actual status transitions.
  const status = tracker.current();
  const previous = tracker.previous();
  if (status === previous) return;

  untracked(() => {
    const s = this.effectiveState();
    if (!s) return;
    if (status === 'success') {
      const msg = this.toastSuccess();        // untracked - opt-in message change
      if (msg) this.toastService.show({ message: msg, severity: 'success' });
    }
  });
});
```

### When to reach for it

Use it for:

- Service calls inside an effect (mandatory - service methods read signals internally; without `untracked`, every read inside the service registers as a dependency).
- Reading "the current value" of a signal during an event handler where you do not want the handler to be a reactive computation.
- Reading template / input state inside a transition handler so message-text changes do not re-fire the bridge.

---

## Controlled vs uncontrolled

CNGX directives that own internal state but also accept a controlled input use a single `computed()` to merge them. The input wins when bound; the state signal is the fallback.

This is a one-line pattern, repeated across the library:

```typescript
// projects/common/data/sort/sort.directive.ts
readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
private readonly sortsState = signal<SortEntry[]>([]);
readonly active = computed(() => this.activeInput() ?? this.sortsState()[0]?.active);
```

Real CNGX examples:

- `CngxSort.active` / `.direction`
- `CngxDrawer.opened`
- `CngxStepperPresenter.linear` / `.orientation` / `.commitMode`
- `CngxRouterSync.mode` / `.paramName`
- `CngxPopoverPanel.showClose` / `.showArrow`
- `CngxPopoverTrigger.haspopup`
- `CngxTreeSelect.resolvedId`

The pattern composes naturally with DI-provided config: `inputValue ?? this.config.defaultX ?? fallback`. This is how stepper / drawer pick up app-wide defaults without giving up per-instance control.

<aside class="cc-note">

**Note.** This differs from `model()` two-way binding. `model()` is for atoms whose primary value the consumer owns; the controlled/uncontrolled pattern is for state the directive can autonomously manage but a parent may opt to drive.

</aside>

---

## RxJS at the boundary

RxJS is allowed only at the IO boundary: HTTP, WebSocket, DOM streams, CDK internals (`MatTabGroup._stateChanges`, the popover scroll-strategy, etc.).

The interior is signal-only.

### Conversion rule

Take the `Observable` in, hand a `Signal` out. Two real shapes from CNGX:

- **`toSignal()` at the boundary.** `projects/ui/mat-tabs/material-bridge/handle.ts` reads `MatTab._stateChanges` (a Material-internal `Subject`) through `toSignal(...)` and exposes a signal-shaped handle to the CNGX side; the consumer never sees the Subject. The reverse direction uses `outputToObservable()` from `@angular/core/rxjs-interop` - `CngxMenu` pipes `ad.activated` through it because the menu's wiring is RxJS-shaped (`pipe(takeUntilDestroyed())`).
- **`takeUntilDestroyed()` for one-off DOM/RxJS subscriptions.** Used in `CngxMenu`, `CngxSidenavLayout`, and the `mat-tabs` registry where a single subscription wants the DestroyRef-bound teardown rather than the `effect(onCleanup)` shape.

### What you must not do

- Expose raw `Observable`s on the public surface of a CNGX directive.
- Build local component state on `BehaviorSubject`.
- Read `Observable | async` in a template.

The library's outputs are all `OutputEmitterRef` (the new `output()` shape), not `EventEmitter`. Consumers who want RxJS pipe-ergonomics convert with `outputToObservable()` themselves.

---

## What public is vs protected vs private

CNGX components have a strict access discipline because templates and host bindings have visibility rules:

- **`readonly` (public)** - public API: `input()`, `output()`, `model()`, public computed/signals/methods, anything a consumer reads or writes via the directive reference. All `input()`s in CNGX are public; templates and the compiler both require it.
- **`protected readonly`** - members accessed from the component's own template or host bindings. Templates and host-binding expressions cannot access `private`. Example: `CngxButtonToggleGroup.ariaBusy`, `CngxButtonToggleGroup.handleKeydown`.
- **`private readonly`** - implementation-only: internal signals (`signal()` backing state), derived state used inside component methods, view-child queries, injected helpers. Example: `CngxSort.sortsState`, `CngxButtonToggleGroup.focusedState`.

<aside class="cc-warning">

**Important.** Never make a template- or host-accessed member `public` unless it is intentional public API.

</aside>

The split matters because:

- The Angular compiler enforces it for host bindings and templates.
- `protected` and `private` members are not part of the directive's typed surface. A consumer reading `myDir.somePrivate` is a type error, which keeps the boundary honest and keeps the future decompose step (atoms eject the structural/thematic skin into the consumer; the brain stays via `hostDirectives`) reading off a stable contract.

---

## What NOT to do

Quick reference of patterns that fail review:

```typescript
class MyTable extends CngxBase { }                    // no inheritance
@Input() value = '';                                  // no decorators
ngOnInit() { effect(() => { ... }); }                 // NG0203
private _x$ = new BehaviorSubject(false);             // no BS for local state
constructor(@Inject(TOKEN) private svc: S) { }        // no constructor decorators
@Injectable({ providedIn: 'root' })                   // not for feature logic
readonly sortChange = this.matSort.sortChange;        // wrap CDK with toSignal()
<div *ngIf="x$ | async">                              // use @if (x())
private readonly hostClass = computed(...);           // host bindings need protected
describedBy = computed(() => hasError ? 'a b' : 'a'); // IDs always present; toggle aria-hidden
private readonly x = input<T>(v);                     // inputs must be public for the template / compiler to bind
input<T>(v).asReadonly()                              // no such method - InputSignal is already read-only
effect(() => state.set(other()));                     // effects don't write signals - use computed()
constructor() { effect(() => svc.save(value())); }    // wrap service calls in untracked()
linkedSignal({ source, computation });                // never write it from an effect that reads it
```

If you find yourself reaching for any of the above, stop - there is a signal-native alternative for each one.
