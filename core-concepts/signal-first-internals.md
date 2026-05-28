<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Signal-First Internals

CNGX is built on Angular Signals. Not "uses Signals where convenient" - built on them. Every reactive value flowing through a directive is a `Signal<T>`. RxJS exists at the boundary; the interior is signal-only.

This chapter is the operational manual: which primitive to use when, which rules are non-negotiable, and which patterns recur across the library.

## The four primitives

| Primitive                               | When to use                                                                                                                              | When **not** to use                                                           |
|-|-|-|
| `signal(initial)`                       | Owned writable state where this component is the sole writer.                                                                            | Anywhere a `computed` would express the same value.                           |
| `computed(fn)`                          | Every derived value. ARIA attributes, disabled state, visible flags, panel views, resolved templates.                                    | Side effects (DOM writes, service calls).                                     |
| `effect(fn)`                            | Imperative side effects that leave the reactive graph (DOM measurement, focusing, calling a service).                                    | Writing a signal to mirror another signal - use `computed` or `linkedSignal`. |
| `linkedSignal({ source, computation })` | Tracking a transition between two states (idle → loading → success) where the latest state needs to be remembered across source changes. | A simple derivation - use `computed`. A simple write - use `signal`.          |

## Inputs and outputs

CNGX never uses decorators for inputs/outputs. They are signal-based across the entire library:

```typescript
readonly label = input<string>('');
readonly required = input<boolean, boolean | string>(false, {
  transform: coerceBooleanProperty,
});
readonly value = model<T | undefined>(undefined);
readonly selectionChange = output<CngxSelectChange<T>>();
```

- `input<T>()` for one-way bindings.
- `input.required<T>()` only when the consumer **must** provide a value. Never on a directive that injects an optional fallback - a directive whose `[state]` may auto-discover from `CNGX_STATEFUL` must use optional `input<T | undefined, T | '' | undefined>(undefined, { transform: v => typeof v === 'string' ? undefined : v })` so that a bare attribute (`<div cngxToastOn>` → empty-string binding) is treated as "not bound" and triggers the DI fallback.
- `model<T>()` for two-way bindable atoms - `[value]`, `(valueChange)`, and `[(value)]` all work identically.
- `output<T>()` for events. Event handlers in component code use the `handle` prefix (`handleKeydown`, `handleBlur`).

## Equality functions

A `computed` that emits a fresh reference on every recomputation will cascade into every downstream consumer, even when the value is structurally identical. CNGX routes around this with explicit `equal` functions on every hot `computed`:

```typescript
readonly selected = computed<readonly CngxSelectOptionDef<T>[]>(
  () => this.deriveSelected(),
  { equal: (a, b) => a.length === b.length && a.every((x, i) => Object.is(x, b[i])) },
);
```

Common shapes:

- **Identity per entry** for option arrays: length + `Object.is` per index. Prevents cascades when options are re-emitted with the same references.
- **Structural per entry** for option arrays with `compareWith`: length + pairwise `compareWith`. Prevents cascades when a server refetch produces fresh option objects with unchanged values.
- **Set equality** for `expandedIds` / `selectedIds`: same size + every key present. Prevents `tree.expandAll()` from emitting when the tree is already fully expanded.

If a `computed` is read by another `computed` or by a template `@if`, it needs an `equal`. The default `Object.is` is rarely correct for CNGX's shapes.

## Effect rules

Effects are sharp tools. The non-negotiable rules:

1. **Constructor or field init only.** Never in `ngOnInit` - Angular throws `NG0203` because `inject()` is no longer available outside the injection context.
2. **Side effects only.** An effect that writes a signal is almost always wrong. Use `computed` to derive, or `linkedSignal` if you need transition memory.
3. **Wrap service calls in `untracked()`.** Service methods read signals internally; without `untracked()`, those reads register as effect dependencies and re-fire the effect on every internal change, producing an infinite loop. The transition bridges (`CngxToastOn`, `CngxBannerOn`, `CngxAlertOn`) all follow this rule.
4. **Use `onCleanup` for subscriptions.** When an effect installs a listener (subscription, `setTimeout`, DOM event), the cleanup callback removes it. Effects re-run; without cleanup, listeners stack up.

```typescript
constructor() {
  effect((onCleanup) => {
    const ref = this.listboxRef();
    if (!ref) return;
    const sub = ref.activated.subscribe((event) => {
      untracked(() => this.handleActivation(event));
    });
    onCleanup(() => sub.unsubscribe());
  });
}
```

## Transition tracker

`createTransitionTracker(source)` (from `@cngx/core/utils`) is the canonical pattern for reacting to **changes** in a status signal, not values. It returns a `Signal<StatusTransition | null>` that emits exactly one transition per status change.

```typescript
const tracker = createTransitionTracker(() => state().status);
effect(() => {
  const t = tracker();
  if (t?.kind === 'success') {
    untracked(() => toast.show('Saved'));
  }
});
```

Internally, the tracker uses `linkedSignal` with a **structural** `equal` function on the `{ current, previous }` pair. `linkedSignal` defaults to `Object.is` equality, which compares object identity - without the override, every recomputation would produce a fresh `{ current, previous }` literal and the downstream effect would re-fire on every `data`/`error` change even when the status itself was unchanged. The structural `equal` short-circuits those re-runs and is what makes the tracker safe to read from a side-effecting `effect()`.

## linkedSignal

`linkedSignal({ source, computation })` is for the rare case where you need to track a transition and remember the latest result across source changes. Common uses:

- **Transition tracker** (above): remembers the last status to compute the next transition.
- **Caret-position memory** in async-container: remembers where the user was reading while the underlying data refetches.
- **Last-selected memory** in keyboard nav: remembers the last activated option when the panel reopens.

The rule: `linkedSignal` reads from `source`, runs `computation` when `source` changes, and is **writable** between source emissions. Writing it does not change `source`. Reading it gives you "the latest computed value plus any manual override since."

Never use `linkedSignal` for a value that a `computed` could express directly. The mental model is "a signal that resets on source change," not "a derived value."

## Untracked

`untracked(() => …)` is how you read a signal without registering it as a dependency:

```typescript
effect(() => {
  const status = state().status; // tracked
  if (status === 'success') {
    const message = untracked(() => this.template().successMessage());
    this.toast.show(message);
  }
});
```

Use it for:

- Service calls inside an effect (mandatory).
- Reading "the current value" of a signal during an event handler where you do not want the handler to be a reactive computation.
- Reading template state inside a transition handler so it does not become part of the transition trigger.

## What public is vs protected vs private

CNGX components have a strict access discipline because templates and host bindings have visibility rules:

| Modifier             | Used for                                                                                                               |
|-|-|
| `readonly` (public)  | Public API - inputs, outputs, public signals/methods, anything a consumer reads or writes via the directive reference. |
| `protected readonly` | Members accessed from the component's own template or host bindings. Templates cannot access `private`.                |
| `private readonly`   | Implementation-only - internal signals, derived state used inside component methods.                                   |

**Never** make a template- or host-accessed member `public` unless it is intentional public API. The schematic-decompose extractor reads access modifiers and copies only the public surface; misclassified `public` members leak into the decomposed output.

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
private readonly x = input<T>(v);                     // NG1053 - input cannot be private
input<T>(v).asReadonly()                              // no such method on InputSignal
```

If you find yourself reaching for any of the above, stop - there is a signal-native alternative for each one.
