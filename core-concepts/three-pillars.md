# The Three Pillars

CNGX rests on three non-negotiable rules. Every directive, component, and PR is auditable against them. A pillar violation is a functional defect, not a stylistic preference.

## 1. Ableitung statt Verwaltung - Derivation over Management

State is never "synced"; it is projected. Every value is a `computed()` from a single source of truth. Manual state management (event handlers mirroring one signal into another) is the primary source of bugs and is strictly forbidden.

If a value can be calculated via a formula, it belongs in a `computed`. If you find yourself writing `effect(() => other.set(self()))`, the design is flawed.

### Anti-pattern

```typescript
readonly active = signal<string | undefined>(undefined);

constructor() {
  effect(() => {
    const fromInput = this.activeInput();
    if (fromInput !== undefined) {
      this.active.set(fromInput); // Management: manual sync via effect
    }
  });
}
```

This design is fragile: it obscures the precedence rules, risks circularity, and splits the source of truth across two disconnected slots.

### Pattern

```typescript
readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
private readonly activeState = signal<string | undefined>(undefined);

// Derivation: The rule (Input wins) is the definition of the value.
readonly active = computed(() => this.activeInput() ?? this.activeState());
```

The component is now both controlled and uncontrolled by construction, with zero synchronization logic.

### Operational rules

- **`signal()`** is for **owned writable state** only - a slot that this component is the exclusive writer of.
- **`computed()`** is for **every derived value**, including A11y attributes, disabled states, visibility flags, and panel view discriminators.
- **`linkedSignal()`** is the only sanctioned way to "reset" or "branch" state based on a source signal (e.g., clearing a selection when the underlying data source changes).
- **`effect()`** is strictly for **imperative side effects** that exit the reactive graph: DOM measurement, calling a service, or manual focus management.
- **`untracked()`** is mandatory for every external service call inside an effect to prevent implementation details of that service (e.g., internal signal reads) from leaking into your dependency graph.

---

## 2. Kommunikation als Architektur - Communication is Architecture

State changes are never silent. Every transition must be communicated visually, semantically, and to assistive technology (AT). In CNGX, A11y is a functional requirement of the logic layer, not a post-production audit task.

### Anti-pattern

```typescript
// A11y as an afterthought/audit item
ngOnChanges(changes: SimpleChanges) {
  if (changes['disabled']) {
    this.el.nativeElement.setAttribute('aria-disabled', String(this.disabled));
  }
}
```

This is communication as an audit: bolted on, conditional, and prone to drifting out of sync with the actual state.

### Pattern

```typescript
readonly disabled = computed(() => this.disabledInput() || this.parentDisabled());

// A11y as a live projection of state
readonly hostAria = computed(() => ({
  'aria-disabled': this.disabled() ? 'true' : null,
  'aria-describedby': this.describedBy(),
  'aria-busy': this.busy() ? 'true' : null,
}));
```

The semantic state and the visual state are the same `computed`. They cannot drift because there is only one source of truth.

### Operational rules

- **Persistent IDs:** `aria-describedby` and `aria-labelledby` IDs must always be present in the DOM. Toggle visibility via `aria-hidden` or CSS on the target, never by removing the ID reference.
- **Reactive Live Regions:** SR live regions are permanent fixtures. Their content is reactive; never recreate or "re-inject" a region to fire a message.
- **Contextual Disabled:** The `disabled` state should communicate _why_ it is disabled via `aria-describedby` pointing to a hint/status element.
- **Total ARIA Coverage:** `aria-required`, `aria-invalid`, `aria-busy`, `aria-expanded`, `aria-selected`, and `aria-controls` are always part of the `computed()` graph.
- **Focus Memory:** Popovers, Dialogs, and Menus must store the trigger element as a signal on open and restore focus reactively upon closing.

---

## 3. Komposition statt Konfiguration - Composition over Configuration

We build small, single-responsibility units. We reject "God-Components" that attempt to handle every use case via a forest of `@Input` flags. If a feature has multiple responsibilities, it is implemented as multiple directives.

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

### Pattern

```typescript
// Specialized organisms for specific intents.
<cngx-select />
<cngx-multi-select />
<cngx-combobox />
<cngx-reorderable-select />
```

Shared logic is never shared by inheritance. It is shared via **Factories** (e.g., `createSelectionController`), **DI Tokens** (e.g., `CNGX_COMMIT_HANDLER`), and **`hostDirectives`** (Level 2 Atoms).

### Operational rules

- **No Class Inheritance:** We use `hostDirectives` to compose behavior. Base classes are a legacy pattern that creates rigid coupling.
- **No Options Objects:** Every configuration concern must be a discrete, typed input. Options objects hide dependencies and break template type-checking.
- **Swap-points via DI:** Every logic controller (Selection, Commit, Tree, Navigation) must be provided via a factory token. This allows consumers to swap implementation (e.g., adding telemetry or offline-sync) without forking the component.
- **Atom-First Development:** New behavior always starts as a Level 2 Atom (headless directive). Molecules and Organisms compose these atoms; they do not re-implement their logic.

---

## Quick audit

During every review, ask:

1. **Derivation:** Is there any manual state syncing? Could this signal write be a `computed`?
2. **Communication:** Is the ARIA state a 1:1 projection of the visual state? Does a screen reader "see" every transition?
3. **Composition:** Is the component trying to do too much? Should this flag be a separate directive or a different component altogether?

**Pillar violations have no "low severity" tier. They are defects that must be resolved before merge.**
