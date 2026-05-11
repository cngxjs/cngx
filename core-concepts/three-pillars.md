# The Three Pillars

cngx rests on three non-negotiable rules. Every directive, every component, every PR is auditable against them. A pillar violation is a defect, not a stylistic preference.

## 1. Ableitung statt Verwaltung — Derivation over Management

Every derived value is a `computed()` from a single source of truth. No manual sync, no subscriptions for local state, no event handlers that mirror one signal into another.

If you can write down a formula that produces the value, the value is a `computed`. If you find yourself writing `effect(() => other.set(self()))`, the design is wrong.

### Anti-pattern

```typescript
readonly active = signal<string | undefined>(undefined);

constructor() {
  effect(() => {
    const fromInput = this.activeInput();
    if (fromInput !== undefined) {
      this.active.set(fromInput);
    }
  });
}
```

This is *management*: an effect writing a signal to mirror another signal. It re-runs, it can loop, it splits the source of truth across two slots, and it makes the actual rule (input wins when present) invisible.

### Pattern

```typescript
readonly activeInput = input<string | undefined>(undefined, { alias: 'cngxSortActive' });
private readonly activeState = signal<string | undefined>(undefined);
readonly active = computed(() => this.activeInput() ?? this.activeState());
```

The rule is now the type signature. Controlled input wins by construction. The component is both controlled and uncontrolled with zero state-sync code.

### Operational rules

- `signal()` for **owned writable state** only — a slot that this component is the sole writer of.
- `computed()` for **every derived value**, including A11y attributes, disabled state, visible/highlighted flags, and panel views.
- `effect()` only for **imperative side effects** that leave the reactive graph: DOM measurement, calling a service, focusing an element. Wrap any service call inside an effect in `untracked()` so the service's internal signal reads do not register as effect dependencies.
- Never write a signal inside a `computed()`. Never write the same signal an effect reads (use `linkedSignal` for transition tracking).

## 2. Kommunikation als First-Class Concern — Communication is Architecture

Every state change is actively communicated — visually, semantically, and to assistive technology. A11y attributes live in the `computed()` graph from day one. Silent state changes are a communication failure.

### Anti-pattern

```typescript
ngOnChanges(changes: SimpleChanges) {
  if (changes['disabled']) {
    this.el.nativeElement.setAttribute('aria-disabled', String(this.disabled));
    if (this.disabled) {
      this.announce('Field disabled');
    }
  }
}
```

This is communication as audit: bolted on, conditional, easy to forget, drifting out of sync with the visual state.

### Pattern

```typescript
readonly disabled = computed(() => this.disabledInput() || this.parentDisabled());

readonly hostAria = computed(() => ({
  'aria-disabled': this.disabled() ? 'true' : null,
  'aria-describedby': this.describedBy(),
  'aria-busy': this.busy() ? 'true' : null,
}));
```

The ARIA state is the visual state — derived from the same `computed`. They cannot drift, because there is nothing to keep in sync.

### Operational rules

- `aria-describedby` IDs are always present in the DOM. Visibility toggles via `aria-hidden` on the referenced element, not by removing the ID.
- SR live regions are always rendered. Their content is reactive — never recreate the region per message.
- `disabled` communicates **why** through `aria-describedby` (a hint element on the same screen).
- `aria-required`, `aria-invalid`, `aria-busy`, `aria-expanded`, `aria-selected`, `aria-controls` are all `computed()`.
- Focus restores to the trigger after a popover/dialog/menu closes — the trigger element is stored as a signal at open time and read back from the `closed` effect.

## 3. Komposition statt Konfiguration — Composition over Configuration

Small focused units, one directive per responsibility. No God-Components. No options objects. No inheritance hierarchies that share behavior by extending a base class.

If a feature has more than one job, it is more than one directive. If two components share behavior, they share a `hostDirective` — not a base class.

### Anti-pattern

```typescript
@Component({
  selector: 'cngx-mega-select',
  template: '...',
})
export class CngxMegaSelect extends CngxBaseFormControl {
  @Input() options: any[] = [];
  @Input() multiple = false;
  @Input() searchable = false;
  @Input() reorderable = false;
  @Input() tree = false;
  @Input() async: AsyncConfig = {};
}
```

One component covering single, multi, combobox, typeahead, tree, and reorderable variants via flag combinations. The cartesian product is unboundable, the API surface is opaque, and every consumer template branches on flags.

### Pattern

```typescript
// Separate components per mode — never a [multiple] flag.
<cngx-select [options]="opts" [(value)]="picked" />
<cngx-multi-select [options]="opts" [(values)]="picked" />
<cngx-combobox [options]="opts" [(values)]="picked" />
<cngx-typeahead [options]="opts" [(value)]="picked" />
<cngx-tree-select [nodes]="tree" [(values)]="picked" [nodeIdFn]="byId" />
<cngx-reorderable-multi-select [options]="opts" [(values)]="picked" />
<cngx-action-select [options]="opts" [action]="save" />
<cngx-action-multi-select [options]="opts" [action]="save" />
```

Eight components, eight APIs, each one named for what it does. Shared logic lives in `createSelectCore()` (a factory), in `hostDirectives` (`CngxActiveDescendant`, `CngxListbox`, …), and in DI tokens (`CNGX_SELECTION_CONTROLLER_FACTORY`, `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`, …). Nothing is shared by inheritance.

### Operational rules

- No class inheritance for component logic. Ever. `hostDirectives` are the sharing mechanism.
- No options objects as public inputs. Each concern is its own input (`[panelClass]`, `[panelWidth]`, `[disabled]`, …).
- DI tokens for every controller (selection, commit, tree, display-binding, focus). Default factory is `providedIn: 'root'`; consumers swap via `providers`/`viewProviders` for telemetry, audit logging, server-synced state.
- Bridge directives — not adapters — translate between layers. `[cngxBindField]` reads from the presenter, never injects the concrete control.
- New behavior starts as an atom (one directive, one responsibility, no CDK/Material). Molecules and organisms compose atoms; they do not re-implement.

## Quick audit

When reviewing a directive or component, ask:

1. **Derivation:** Is every output value a `computed` from inputs? If a writable signal exists, is this component the sole writer?
2. **Communication:** Are all ARIA attributes part of the `computed` graph? Are there any silent state transitions?
3. **Composition:** Is this one responsibility? Could a flag input become a separate directive?

A "no" on any of the three is a finding, regardless of how minor it looks in isolation. Pillar violations do not have a "small" severity tier — they get fixed before merge.
