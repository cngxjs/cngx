<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# The Three Pillars

> **Zustand wird abgeleitet, nicht verwaltet - und Kommunikation ist Architektur, kein Nachgedanke.**

CNGX rests on three non-negotiable rules. Every directive, component, and PR is auditable against them.

A pillar violation is a functional defect, not a stylistic preference. There is no "low severity" tier.

---

## 1. Ableitung statt Verwaltung - Derivation over Management

State is never "synced"; it is projected. Every derived value is a `computed()` from a single source of truth.

Manual state management (event handlers or effects mirroring one signal into another) is the primary source of bugs and is strictly forbidden.

If a value can be calculated via a formula, it belongs in a `computed`.

<aside class="cc-warning">

**Warning.** If you find yourself writing `effect(() => other.set(self()))`, the design is flawed. Use `computed()` or `linkedSignal()` instead.

</aside>

### Anti-pattern

```typescript
readonly active = signal<string | undefined>(undefined);

constructor() {
  effect(() => {
    const fromInput = this.activeInput();
    if (fromInput !== undefined) {
      this.active.set(fromInput); // manual sync via effect
    }
  });
}
```

Obscures precedence, risks circularity, and splits the source of truth across two slots.

### Pattern

The canonical "controlled + uncontrolled" pattern, taken from `CngxSort` in `projects/common/data/sort/sort.directive.ts`:

```typescript
readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
private readonly sortsState = signal<SortEntry[]>([]);

// Derivation: the rule "controlled input wins, otherwise fall back to internal state"
// IS the definition of the value. No effect, no sync, no mirror signal.
readonly active = computed(() => this.activeInput() ?? this.sortsState()[0]?.active);
```

The directive is both controlled and uncontrolled by construction, with zero synchronization logic.

The same shape powers `directionInput` / `direction`, and is repeated throughout the codebase wherever a binding may be controlled or uncontrolled.

### Operational rules

- **`signal()`** is for **owned writable state** only - a slot that this component is the exclusive writer of.
- **`computed()`** is for **every derived value**, including ARIA attributes (`aria-busy`, `aria-disabled`, `aria-invalid`), disabled states, visibility flags, and panel view discriminators.
- **`linkedSignal()`** is the only sanctioned way to "reset" or "branch" writable state based on a source signal.

    Real example: `CngxAlertStack` collapses `expanded` back to `false` when the alert count drops to `maxVisible` (`projects/ui/feedback/alert/alert-stack.ts`). Return objects/arrays from `linkedSignal` only with an explicit `equal` function, otherwise every recomputation looks dirty and downstream effects loop.

- **`effect()`** is strictly for **imperative side effects** that exit the reactive graph: DOM measurement, calling a service, manual focus management.

    Never put `effect()` in `ngOnInit` (NG0203) - declare in field init or constructor.

- **`untracked()`** is mandatory around every external service call inside an effect.

    Services like `CngxToaster`, `CngxAlerter`, and `CngxBanner` read their own internal dedup signals. Without `untracked()` your effect silently subscribes to them and any `.update()` they trigger loops back. See `mat-stepper.directive.ts` for a real bidirectional-sync example.

- **No `effect()` that writes a signal.** The single documented exception (`CngxAsyncContainer`) is itself wrapped in a transition guard. Everything else uses `computed()` or `linkedSignal()`.

---

## 2. Kommunikation als First-Class Concern - Communication is Architecture

State changes are never silent. Every transition must be communicated:

- Visually
- Semantically
- To assistive technology (AT)

In CNGX, A11y is part of the `computed()` graph from day one, not a post-production audit task.

### Anti-pattern

```typescript
// A11y as an afterthought / audit item
ngOnChanges(changes: SimpleChanges) {
  if (changes['disabled']) {
    this.el.nativeElement.setAttribute('aria-disabled', String(this.disabled));
  }
}
```

Communication as audit: bolted on, conditional, prone to drifting out of sync with the actual state.

### Pattern

Bind ARIA attributes declaratively on the host through `computed()` signals.

Consumers typically derive `disabled` externally as `computed(() => parentDisabled() || fieldDisabled())` and forward it in. The `CNGX_CONTROL_VALUE` contract documents this shape (`projects/common/interactive/control-value/control-value.token.ts`).

```typescript
@Directive({
  selector: '[cngxThing]',
  host: {
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-busy]': 'ariaBusy()',
  },
})
export class CngxThing {
  readonly disabled = input(false);
  readonly busy = input(false);
  readonly describedBy = input<string | null>(null);

  // A11y as a live projection of state
  protected readonly ariaDisabled = computed(() => (this.disabled() ? 'true' : null));
  protected readonly ariaBusy = computed(() => (this.busy() ? 'true' : null));
}
```

The semantic state and the visual state share the same `computed()`. They cannot drift because there is only one source of truth.

<aside class="cc-note">

**Note.** Members read by templates or host bindings must be `protected`, not `private`. Private members are inaccessible to the generated view code.

</aside>

Real-world references:

- `CngxOption` (`projects/common/interactive/listbox/`) binds `role="option"`, `aria-selected`, and `aria-disabled` as reactive host bindings.
- `CngxButtonToggleGroup` (`projects/common/interactive/button-toggle/`) computes `aria-disabled`, `aria-required`, `aria-invalid`, `aria-orientation`, `aria-busy`, and `aria-errormessage` from inputs plus optional field-host wiring.

### Operational rules

- **Persistent IDs.** `aria-describedby` and `aria-labelledby` IDs are always present in the DOM. Toggle visibility via `aria-hidden` or CSS on the target node, never by removing the ID reference. Screen readers cache lookups and a missing ID is announced as "blank".
- **Reactive Live Regions.** SR live regions (`CngxLiveRegion` in `@cngx/common/a11y`) are permanent DOM fixtures. Their content is reactive; never recreate or "re-inject" a region to fire a message.
- **Contextual Disabled.** The `disabled` state communicates *why* it is disabled via `aria-describedby` pointing to a hint/status element.
- **Total ARIA Coverage.** `aria-required`, `aria-invalid`, `aria-busy`, `aria-expanded`, `aria-selected`, and `aria-controls` are always part of the `computed()` graph.

    See `projects/forms/select/select-shell/` for the canonical combobox wiring (trigger carries `role="combobox"` with all six attributes reactive).

- **Focus Memory.** Popovers, Dialogs, and Menus store the trigger element as a signal on open and restore focus reactively on close.

    The shared atom is `CngxFocusRestore` (`projects/common/a11y/focus/focus-restore.directive.ts`), which captures `document.activeElement` on init and restores it on destroy with a fallback chain.

---

## 3. Komposition statt Konfiguration - Composition over Configuration

We build small, single-responsibility units. We reject "God-Components" that attempt to handle every use case via a forest of `@Input` flags.

If a feature has multiple responsibilities, it is implemented as multiple directives or as a sibling organism.

### Anti-pattern

```typescript
@Component({
  selector: 'cngx-mega-select',
})
export class CngxMegaSelect extends CngxBase {
  @Input() multiple = false;
  @Input() searchable = false;
  @Input() tree = false;
  @Input() reorderable = false;
}
```

The combinatorial explosion of flags makes the API opaque, the internal logic unmaintainable, and the bundle size bloated for simple use cases.

Two further problems:

- `extends CngxBase` couples the variants through inheritance.
- `@Input` decorators are forbidden in CNGX (use `input()` signals).

### Pattern

The select family is the canonical example. `@cngx/forms/select` ships six dedicated organisms, one per intent, instead of one monolith with a `[mode]` flag:

```html
<cngx-select [field]="f.single" [options]="opts" />
<cngx-multi-select [field]="f.many" [options]="opts" />
<cngx-combobox [field]="f.tags" [options]="opts" />
<cngx-typeahead [field]="f.search" [loadOptions]="search" />
<cngx-tree-select [field]="f.tree" [nodes]="tree" [nodeIdFn]="idFn" />
<cngx-reorderable-multi-select [field]="f.ordered" [options]="opts" />
```

Shared logic is never shared by inheritance. It is shared via three mechanisms:

- **Factories** that return controllers: `createSelectionController<T>` (`projects/core/utils/selection-controller.ts`), `createCommitController<T>`, `createArrayCommitHandler<T>`, `createTransitionTracker`.
- **DI tokens** for swap-points. The select family alone declares 18 override tokens, including `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`, `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`, `CNGX_SELECTION_CONTROLLER_FACTORY`, `CNGX_SELECT_PANEL_HOST`, and `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`.

    See `projects/forms/select/ARCHITECTURE.md` for the full table.

- **`hostDirectives`** for behaviour atoms. `CngxStepper` and `CngxTabGroup` compose `CngxRovingTabindex` and `CngxFocusRestore` via `hostDirectives`; `CngxMatStepper` composes `CngxStepperPresenter` the same way.

    Never inject a concrete parent component class. Use a token with `useExisting`.

### Operational rules

- **No Class Inheritance.** CNGX components never `extend` a shared base. Behaviour is composed through `hostDirectives` and shared via factory functions. Inheritance is rejected at review.
- **No Options Objects.** Every configuration concern is a discrete, typed `input()`. Options objects hide dependencies, defeat template type-checking, and break the controlled/uncontrolled pattern.
- **No Decorators on Members.** `@Input()`, `@Output()`, `@HostBinding()`, `@ViewChild()`, `@Inject()` are forbidden. Use `input()`, `output()`, the `host` metadata, `viewChild()`, and `inject()`.
- **No `ControlValueAccessor`.** Level-3 controls provide `CNGX_FORM_FIELD_CONTROL` directly. CVA-based form controls are wrapped with `[cngxBindField]`.

    Signal Forms is the default integration (`[field]="f.x"`); Reactive Forms goes through `adaptFormControl(control, name, destroyRef)`.

- **Swap-points via DI.** Every logic controller (Selection, Commit, Tree, Navigation, Hierarchical Strategy) is provided via a factory token.

    Consumers swap implementations (telemetry, offline-sync, custom selection semantics) without forking the component. Tokens use the `CNGX_*_FACTORY` naming convention.

- **Atom-First Development.** New behaviour starts as an atom: a headless directive in `@cngx/common` with a single responsibility (e.g. `CngxFocusTrap`, `CngxRovingTabindex`, `CngxActiveDescendant`, `CngxAriaExpanded`, `CngxLiveRegion`).

    Molecules compose atoms; organisms compose molecules and atoms. Only organisms are decompose-eligible; atoms and molecules are terminal units.
- **Two-way bindings use `model()`.** Bindable state on atoms is `model<T>()`, never `input()` + `output()` pairs.
- **Bridge inputs are optional, not required.** Directives that inject `CNGX_STATEFUL` (or equivalent) as an optional fallback **must not** use `input.required()`.

    The empty-string attribute case (`<div cngxToastOn>`) needs to read as "not bound" so the DI fallback fires. Use `input<T | undefined, T | '' | undefined>(undefined, { transform: v => typeof v === 'string' ? undefined : v })`.

---

## Quick audit

During every review, ask:

1. **Derivation.** Is there any manual state syncing? Could this signal write be a `computed()` or `linkedSignal()`? Is every external service call inside an `effect()` wrapped in `untracked()`?
2. **Communication.** Is the ARIA state a 1:1 projection of the visual state? Are describedby IDs always present? Does a screen reader "see" every transition? Does focus restore on close?
3. **Composition.** Is the component trying to do too much? Should this flag be a separate organism? Is shared logic a factory / DI token / `hostDirective` rather than a base class? Are atoms reused instead of re-implemented?

<aside class="cc-danger">

**Important.** Pillar violations are defects that must be resolved before merge.

</aside>
