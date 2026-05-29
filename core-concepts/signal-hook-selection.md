<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Signal Hook Selection

A reference card. Given a situation, which signal primitive do you reach for? Six hooks, two helpers, one table.

For the *why* behind each pattern - equality functions, untracked rationale, transition trackers, controlled-vs-uncontrolled - read `signal-first-internals.md`. This page is the scan-it-in-30-seconds lookup.

## TL;DR

|Hook|Purpose|CNGX use|Forbidden in|
|-|-|-|-|
|`signal(initial)`|Owned writable state.|Private backing state where the directive is the sole writer.|Any value a `computed()` could derive.|
|`computed(fn)`|Derive a value.|Every derived value - ARIA flags, view models, controlled+uncontrolled merges, equality-keyed lists.|Side effects. Service calls. DOM writes.|
|`linkedSignal({ source, computation, equal })`|Track a transition; remember the latest result across source changes.|Status pairs (`{ current, previous }`), tab-visibility maps, expanded-state with auto-reset on count change.|Plain derivation (use `computed`). Effects that *write* this signal (infinite loop).|
|`effect(fn, { onCleanup })`|Imperative side effect that leaves the reactive graph.|DOM measurement, focus, transition bridges, listener install + teardown.|`ngOnInit` (NG0203). Writing signals. Unwrapped service calls.|
|`afterNextRender(fn)`|One-shot post-binding callback. Outside the reactive graph.|Dev-mode binding checks, post-mount init that needs `viewChild` resolved.|Anywhere you need re-fire on input changes.|
|`afterRender(fn)` / `afterRenderEffect(fn)`|Reactive DOM read after every render.|Geometry sync, host-element measurement that must follow layout.|Hot paths without a guard - fires every CD cycle.|

Two helpers that exist only to support the above:

- `untracked(fn)` - read a signal inside an `effect` without registering a dependency. Mandatory around service calls.
- `model<T>()` - two-way bindable input. The replacement for `input() + output()` when `[(value)]` is part of the API.

## Decision tree

1. **Need a value the consumer sets?** -> `input()`, or `model()` if `[(x)]` is part of the API.
2. **Need an owned writable value?** -> `signal()` (private).
3. **Need a derived value?**
   - From one or more sources, no memory across changes -> `computed()`.
   - With memory across source changes (transition tracking, reset-on-count) -> `linkedSignal()`.
4. **Need a side effect?**
   - Reactive, recurring, leaves the graph (DOM write, service call, listener) -> `effect()`.
   - One-shot after first render -> `afterNextRender()`.
   - Every render (geometry, host measurement) -> `afterRender()` / `afterRenderEffect()`.

If the answer wants two of those, pick the lowest one on the list. Most "I need an effect to set a signal" cases are actually `computed()` or `linkedSignal()`.

## signal()

`signal<T>(initial: T): WritableSignal<T>`

Owned writable state. Make it `private readonly` - it is implementation detail, not API. The public surface is a `computed()` over it, or `.asReadonly()` when no derivation is needed.

The canonical controlled-vs-uncontrolled pattern in `projects/common/data/sort/sort.directive.ts:61-64`:

```typescript
private readonly sortsState = signal<SortEntry[]>([]);
readonly active = computed(() => this.activeInput() ?? this.sortsState()[0]?.active);
```

The state signal is private. The public read is a `computed()` that merges input + state. Writing to `sortsState` is internal; reading `active` is the public API.

**Failure mode.** A public `signal()` exposed directly leaks the writer. Consumers can `.set()` it, bypassing every invariant the directive maintains. If the consumer should write, that is `model()`.

## computed()

`computed<T>(fn: () => T, options?: { equal: (a: T, b: T) => boolean }): Signal<T>`

Every derived value. ARIA attributes, view models, resolved templates, controlled+uncontrolled merges, async-state derivations.

For object or array values, pass an explicit `equal`. The default `Object.is` is rarely correct - a `computed` that returns `[...x]` allocates a fresh array every read and cascades through every downstream consumer. See `projects/core/utils/build-async-state-view.ts` for the canonical async-state derivation, and `signal-first-internals.md` for the four equality shapes (identity-per-entry, structural-per-entry with `compareWith`, pair equality, flat-tree equality).

**Failure mode.** Writing a signal from inside a `computed()` is undefined behavior - `computed()` is pure-derivation. Side effects belong in `effect()`. Allocating a fresh object without `equal` is a silent reactivity-loop trigger.

## linkedSignal()

`linkedSignal<S, T>({ source, computation, equal }): WritableSignal<T>`

A writable signal that resets to `computation(source(), prev)` whenever `source` changes. The mental model is "derived, but writable between source emissions" - not "a value computed from a source."

The canonical use is `createTransitionTracker` in `projects/core/utils/transition-tracker.ts:40-47`:

```typescript
const state = linkedSignal<AsyncStatus, { current: AsyncStatus; previous: AsyncStatus }>({
  source,
  computation: (current, prev) => ({ current, previous: prev?.value.current ?? 'idle' }),
  equal: (a, b) => a.current === b.current && a.previous === b.previous,
});
```

Without the structural `equal`, every recomputation allocates a fresh `{ current, previous }` literal and downstream effects re-fire on every status read - this hung the `CngxToastOn` / `CngxAlertOn` / `CngxBannerOn` specs for 15 minutes before the fix.

Other real uses: `CngxTabOverflow.visibilityState` (a `ReadonlyMap<tabId, visible>` that prunes stale ids on source change), `CngxAlertStack.expanded` (auto-resets to `false` when the alert count drops, otherwise writable).

**Failure mode - the infinite-loop trap.** A `linkedSignal` MUST NOT be written from inside an `effect()` that also reads it. The write retriggers the effect; the effect rewrites; the graph never settles. See `feedback_linkedsignal_in_effects` and the `CngxAsyncContainer` exception note - the only place in CNGX that gets away with it is the announcement layer, and only because it does not use `createTransitionTracker`.

## effect()

`effect(fn: (onCleanup: (cb: () => void) => void) => void): EffectRef`

Imperative side effects that leave the reactive graph. DOM measurement, focus, calling a service, installing a listener.

Non-negotiable rules (full discussion in `signal-first-internals.md`):

1. **Constructor or field init only.** Never in `ngOnInit` - throws NG0203.
2. **Side effects only.** Effects must not write signals. Use `computed()` to derive or `linkedSignal()` for transition memory.
3. **Wrap service calls in `untracked()`.** Service methods read signals internally; without `untracked()` those reads become effect deps and re-fire on every internal change.
4. **Use `onCleanup` for subscriptions, timers, observers.**

The transition-bridge pattern in `projects/ui/feedback/toast/toast-on.directive.ts:125-150` is the canonical shape - tracker read at the top, early-exit guard, `untracked(() => { ... })` around every service call and option read.

The content-children gate in `projects/common/interactive/listbox/listbox.directive.ts:143-155` is the canonical "wait until inputs are bound" pattern - `afterNextRender` flips an `initialized` signal, the effect early-returns until it is true.

**Failure mode.** `effect()` in `ngOnInit` -> NG0203 at runtime. Unwrapped service call -> infinite loop the moment the service's internal dedup signal moves. Missing `onCleanup` on a listener -> handlers stack up across effect re-runs.

## afterNextRender()

`afterNextRender(fn: () => void): void`

One-shot callback that runs after the next render. Outside the reactive graph - no deps, no re-fire, no dead node.

Used for two things in CNGX:

- **Dev-mode binding checks.** `projects/ui/feedback/toast/toast-on.directive.ts:110-121` checks "did the consumer bind a state, or is there a DI fallback?" exactly once after the first render. `effect(() => untracked(...))` works but leaves a dead node in the graph for the directive's lifetime - `afterNextRender` is cleaner.
- **Post-mount gates.** `projects/common/interactive/listbox/listbox.directive.ts:144` flips an `initialized` signal once content children resolve, so the option-marking effect can early-return until then.

**Failure mode.** Used where you need re-fire on input changes - `afterNextRender` fires once, never again. Combined with `vi.useFakeTimers()` and `fixture.whenStable()` in tests - the fake-timer scheduler stalls. The current test pattern is `TestBed.tick()` / `TestBed.flushEffects()`, no fake timers in bridge specs. See `feedback_afternextrender_in_zoneless_tests`.

## afterRender() / afterRenderEffect()

`afterRender(fn: () => void): void` runs after every render. `afterRenderEffect(fn)` is the reactive variant - reads signals, re-runs when they change, in the post-render phase.

Used in CNGX for geometry sync where the DOM measurement must follow layout. Real callsites: `projects/forms/field/bind-field.directive.ts:83` and `projects/common/display/badge/badge.directive.ts:107` - both write host-element attributes after the browser has measured.

**Failure mode.** Used on a hot path without a guard - fires every CD cycle, every render, forever. If the work is one-shot, you wanted `afterNextRender`.

## untracked()

`untracked<T>(fn: () => T): T`

Reads signals inside `fn` without registering them as effect dependencies. The standard pattern around the body of a transition-bridge effect.

Use it for:

- **Service calls inside an `effect()`** - mandatory. Service methods read signals internally; without `untracked` every read inside the service becomes a dep.
- **Reading "the current value" of an input** during a transition handler so that input changes do not re-fire the bridge.
- **Reading option / template state** inside an effect where only the primary trigger should be tracked.

The canonical shape: tracker read at the top of the effect, early-exit guard, `untracked(() => { ... everything else })`. See `signal-first-internals.md` "Untracked" for the full example.

## model()

`model<T>(initial: T): ModelSignal<T>`

Two-way bindable input. `[value]`, `(valueChange)`, and `[(value)]` all work identically. The replacement for `input() + output()` when the consumer owns the value.

Used for the primary value on every two-way atom, and for bridge-writable mirrors. `CngxRovingTabindex.activeIndex` in `projects/common/a11y/roving/roving-tabindex.directive.ts:131` is the canonical roving-state model; `CngxRovingTabindex.orientation:127` is the bridge-writable shape - composite hosts (`CngxRadioGroup`) override it from their constructor regardless of the cosmetic orientation.

**When not to use `model()`.** When the directive owns the state and the consumer may optionally drive it. That is the controlled-vs-uncontrolled pattern (`signal()` + `computed()` merge), not `model()`. `model()` is for atoms where the consumer is the source of truth.

## Forbidden patterns

```typescript
ngOnInit() { effect(() => { ... }); }                  // NG0203 - injection context dead
effect(() => state.set(other()));                      // effects do not write signals
constructor() { effect(() => svc.save(value())); }     // wrap service calls in untracked()
effect(() => { linkedSig.set(...); linkedSig(); });    // infinite loop
private readonly value = input<T>(v);                  // inputs must be public
input<T>(v).asReadonly();                              // no such method - input is already read-only
computed(() => ({ ... }))                              // missing equal - cascades on every read
computed(() => [...x])                                 // missing equal - new array every read
afterNextRender(() => { ... });                        // in a place that needs re-fire on input change
afterRender(() => measureAndWriteEveryFrame());        // no guard, no condition - runs forever
readonly sortChange = this.matSort.sortChange;         // raw Observable on public API
private _x$ = new BehaviorSubject(false);              // BehaviorSubject for local state
input.required<T>({ alias: 'cngxFooOn' })              // required on a DI-fallback bridge - fails bare <div cngxFooOn>
```

The `linkedSignal`-in-effect-that-writes case is the most expensive failure in the library's history - 15-minute vitest hangs, 100% CPU. Two independent fixes are needed when it bites: an `equal` on the `linkedSignal` and `untracked` around the service call. Either one alone leaks. See the `CngxToastOn` / `CngxAlertOn` / `CngxBannerOn` history in `reference_signal_architecture` for the post-mortem.

## Test-mode caveats

- **Drain after-render queues with `TestBed.tick()` or `TestBed.flushEffects()`.** Both flush `afterNextRender` callbacks synchronously in zoneless tests.
- **Do not combine `vi.useFakeTimers()` with `fixture.whenStable()`** in specs that use `afterNextRender`. The fake-timer scheduler stalls and `whenStable()` resolves before the render callback fires. Old guidance was "do not use `afterNextRender` at all" - the current guidance is "use it, just do not use fake timers in the same spec."
- **`TestBed.flushEffects()` is the right hook after a signal mutation.** Effects do not run synchronously on `.set()` - they batch to the next microtask. Specs that read post-effect state must flush first.

For the full test patterns, see `signal-first-internals.md` and the bridge specs under `projects/ui/feedback/`.
