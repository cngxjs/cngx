<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Instrumentation Pattern

> **Take any Material organism, attach the matching cngx presenter via host directive, and the brain becomes cngx-shaped without rewriting the visual chrome.**

This document defines the **Instrumentation Pattern**, the primary strategy used by CNGX to enhance, synchronize, and "infect" third-party components (specifically Angular Material) with Signal-native logic without breaking their internal templates or incurring heavy migration costs.

CNGX does not attempt to replace Angular Material; it **instruments** it.

Most libraries fail by trying to wrap Material components in "Thin Shells." This breaks Material's internal `ContentChildren` queries, interferes with DI hierarchies, and creates a "Transclusion Deadlock" where the library and the consumer fight over the same DOM space.

CNGX solves this by separating the **Logic (Presenter)** from the **Rendering (Host)** and connecting them via an **Attribute Directive (the Bridge)**.

---

## The Core Concept: Presenter vs. Host

The pattern relies on three distinct layers:

|Piece|Role|Sheriff Level|Location|
|:-|:-|:-|:-|
|**Presenter (Brain)**|A headless directive owning all signals, state machines, and a11y derivations.|2|`@cngx/common/<feature>`|
|**Host (Hardware)**|The third-party component providing the DOM and styles (`MatStepper`, `MatTabGroup`).|-|`@angular/material`|
|**Bridge (Instrument)**|An attribute directive that attaches the presenter to the host and bidirectionally syncs them.|4|`@cngx/ui/mat-*`|

---

## Two Token Families, One Pattern

The Bridge wires presenter and host together through two distinct kinds of DI tokens. Conflating them is a common source of confusion.

- **Contract tokens** describe a shape a component *provides* for its children to consume. They are non-optional handshakes inside a single composition tree. Examples: `CNGX_STEPPER_HOST` (the presenter exposes itself), `CNGX_TAB_GROUP_HOST`, `CNGX_FORM_FIELD_CONTROL`, `CNGX_STATEFUL`. The Bridge does not override these - it injects them.
- **Instrumentation tokens** are factories the consumer *overrides* application-wide to swap a default strategy. They are how the Bridge (and every other organism) stays open for extension without inheritance. Examples: `CNGX_SELECTION_CONTROLLER_FACTORY`, `CNGX_TREE_CONTROLLER_FACTORY`, `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`, `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`, `CNGX_HIERARCHICAL_NAV_STRATEGY`, `CNGX_MAT_STEP_HANDLE_FACTORY`. Override at `bootstrapApplication` via `{ provide: <TOKEN>, useValue: <impl> }`.

The Bridge itself reads contract tokens (`CNGX_STEPPER_HOST`) and depends on instrumentation tokens (`CNGX_MAT_STEP_HANDLE_FACTORY`).

The presenter `provides` the contract token via `useExisting`.

---

## Reference Implementation: `[cngxMatStepper]`

The Material Stepper is a "closed society" (hard inheritance, strict child queries). Wrapping it in a CNGX-component would be brittle.

Instead, we use a Bridge directive that sits on the same element as `<mat-stepper>`.

### 1. The Headless Presenter (`@cngx/common/stepper`)

`CngxStepperPresenter` owns `activeStepIndex` (model), `linear`, `orientation`, the step registry, and the `commitAction` async-commit lifecycle. It has zero dependency on `@angular/material`.

It provides itself under two contract tokens so children compose without explicit wiring:

```typescript
@Directive({
  selector: '[cngxStepper]',
  exportAs: 'cngxStepper',
  standalone: true,
  providers: [
    { provide: CNGX_STEPPER_HOST, useExisting: CngxStepperPresenter },
    { provide: CNGX_STATEFUL,     useExisting: CngxStepperPresenter },
  ],
})
export class CngxStepperPresenter implements CngxStepperHost { ... }
```

`CNGX_STATEFUL` is what lets `[cngxToastOn]`, `[cngxBannerOn]`, and `[cngxAlertOn]` compose as children without an explicit `[state]` binding.

### 2. The Bridge (`@cngx/ui/mat-stepper`)

`CngxMatStepperBridge` (selector `[cngxMatStepper]`) attaches to existing Material markup.

The class name is **Bridge**, not "Stepper". `CngxMatStepper` is the sibling-additive *wrapper component* (`<cngx-mat-stepper>`) that authors fresh Material markup. Both share the same presenter via `hostDirectives`.

```typescript
@Directive({
  selector: '[cngxMatStepper]',
  exportAs: 'cngxMatStepperDirective',
  standalone: true,
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs:  ['activeStepIndex', 'linear', 'orientation', 'commitAction', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
  ],
})
export class CngxMatStepperBridge {
  private readonly matStepper = inject(MatStepper, { self: true });
  // Inject the contract token, NOT the concrete class. Lets the
  // wrapper component swap presenter implementations later.
  private readonly presenter  = inject(CNGX_STEPPER_HOST);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector   = inject(Injector);

  private readonly matSteps     = contentChildren(MatStep, { descendants: true });
  private readonly setupsByStep = new Map<MatStep, CngxMatStepHandleSetup>();
  // Consumer-overridable handle factory.
  private readonly createHandle = inject(CNGX_MAT_STEP_HANDLE_FACTORY);

  constructor() {
    // Track only `matSteps()`; all writes run under untracked().
    effect(() => {
      const steps = this.matSteps();
      untracked(() => this.syncHandles(steps));
    });

    // Bidirectional presenter <-> MatStepper.selectedIndex sync via
    // the shared Level-2 helper in @cngx/common/data.
    createMatStepperBidirectionalSync({
      matStepper: this.matStepper,
      presenter:  this.presenter,
      injector:   this.injector,
      destroyRef: this.destroyRef,
    });
  }
}
```

The bidirectional sync lives in `@cngx/common/data` (`createMaterialBidirectionalSync`) and is reused by `[cngxMatTabs]`. It installs:

1. A presenter -> Material `effect()` that tracks `presenterIndex` and writes `selectedIndex` under `untracked()`, with a read-equality guard that suppresses redundant writes.
2. A Material -> presenter `selectionChange$` subscription (via `takeUntilDestroyed`) that forwards into `presenter.select(idx)`, equality-guarded against `presenterIndex()` so a re-entrant emission drops.
3. A Material-eager-advance reconciliation: Material's MDC click handler advances `selectedIndex` *synchronously* before the subscription fires. When the presenter holds its index (pessimistic-commit reject, or any future contract that refuses a select), the post-callback divergence is detected and Material is force-written back to the presenter's authoritative index.

### 3. The Consumer Story: "The Trojan Horse"

The developer does not rewrite their template. They upgrade existing Material markup by adding **exactly one attribute**:

```html
<!-- Native Material markup remains. CNGX adds Signal power and async gating. -->
<mat-stepper cngxMatStepper [commitAction]="saveStep">
  <mat-step label="Customer Data">...</mat-step>
  <mat-step label="Payment">...</mat-step>
</mat-stepper>
```

Because the presenter provides `CNGX_STATEFUL`, transition bridges compose as siblings of `<mat-stepper>` without an explicit `[state]` binding:

```html
<mat-stepper cngxMatStepper [commitAction]="saveStep">...</mat-stepper>
<cngx-toast-on transition="success->idle" message="Saved." />
<cngx-banner-on status="error" />
```

---

## Why Instrumentation Wins over Wrapping

|Feature|Wrapping (`<cngx-mat-tabs>`)|Instrumentation (`[cngxMatTabs]`)|
|:-|:-|:-|
|**Migration Tax**|High (rename tags, move content)|**Zero (add one attribute)**|
|**Shadow DOM**|Risk of breaking `ContentChildren`|**None (Bridge sits on the same node)**|
|**Logic Source**|Divergent / forked|**Unified (same presenter as the headless twin)**|
|**Maintenance**|Brittle (breaks on Material HTML changes)|**Robust (relies on Material public API)**|

Both shapes ship side by side:

- `<cngx-mat-stepper>` for fresh markup.
- `[cngxMatStepper]` for adoption.

They share the presenter, so a migration from one to the other is mechanical.

---

## The Decompose Contract

The Instrumentation Pattern is the ultimate expression of the **Atomic Decompose** strategy. Because the logic is entirely encapsulated in the Level-2 presenter, the "Skin" (Material) is irrelevant to the brain.

- **For CNGX-native components:** `ng decompose` ejects the HTML/CSS so the consumer owns the skin.
- **For Material components:** The consumer **already owns the skin** (the Material tags in their HTML). They simply use the CNGX Bridge directive as a "software update" for their existing UI hardware.

---

## Operational Rules

1.  **Strict self-injection:** Bridge directives inject the Material host with `inject(Target, { self: true })`. The presenter is reached via its contract token (`inject(CNGX_STEPPER_HOST)`), not the concrete class - this keeps the Bridge swappable.
2.  **No Material in the presenter:** Level-2 presenters must never import from `@angular/material`. All Signal -> Material property mapping happens inside the Level-4 Bridge.
3.  **The `untracked()` rule:** Every write to a Material component property inside an `effect()` must be wrapped in `untracked()`. Material components read signals internally (especially in v21+); a bare write creates an infinite presenter <-> Material loop. The same rule applies to transition bridges that call services (`untracked(() => toaster.open(...))`).
4.  **Read-equality guards:** Bidirectional sync wraps both the presenter -> Material write and the Material -> presenter forward in an equality guard against the *other* side. Without them, every emission re-enters and the loop never settles.
5.  **Hardware-agnostic API:** The Bridge re-exposes presenter inputs/outputs via `hostDirectives` `inputs` / `outputs` forwarding. The list is identical between `<cngx-stepper>`, `<cngx-mat-stepper>`, and `[cngxMatStepper]` - one API across native, native-Material, and Material-adoption shapes.
6.  **Pessimistic gating belongs to the presenter:** The Bridge does not gate Material writes by commit status. The presenter holds `activeStepIndex` at the origin during a pessimistic-pending commit, so the equality guard alone suppresses Material's eager advance. The reconciliation step (rule 4) snaps Material back to the held index.

<aside class="cc-note">

**Note.** An explicit "pending gate" was tried and dropped - it broke optimistic-mode UX.

</aside>

---

## Instrumentation Tokens in the Wild

The Bridge pattern is the visible tip. The same factory-override style surfaces throughout CNGX wherever a default strategy needs to stay swappable:

- `CNGX_SELECTION_CONTROLLER_FACTORY` (`@cngx/core/utils`) - swap the default selection controller across the entire select family.
- `CNGX_TREE_CONTROLLER_FACTORY`, `CNGX_TREE_CONFIG` (`@cngx/common/interactive`) - tree controller and tree behaviour configuration.
- `CNGX_SELECT_COMMIT_CONTROLLER_FACTORY`, `CNGX_ARRAY_COMMIT_HANDLER_FACTORY`, `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`, `CNGX_DISPLAY_BINDING_FACTORY`, `CNGX_TRIGGER_FOCUS_FACTORY`, `CNGX_TEMPLATE_REGISTRY_FACTORY`, `CNGX_DISMISS_HANDLER_FACTORY`, `CNGX_PANEL_RENDERER_FACTORY`, `CNGX_ACTION_HOST_BRIDGE_FACTORY`, `CNGX_CHIP_REMOVAL_HANDLER_FACTORY`, `CNGX_LOCAL_ITEMS_BUFFER_FACTORY`, `CNGX_FLAT_NAV_STRATEGY` (`@cngx/forms/select/shared`) - the 13 override slots that make the six select organisms decompose-ready.
- `CNGX_HIERARCHICAL_NAV_STRATEGY`, `CNGX_CHIP_STRIP_ROVING_FACTORY`, `CNGX_MENU_ANNOUNCER_FACTORY` (`@cngx/common/interactive`).
- `CNGX_MAT_STEP_HANDLE_FACTORY`, `CNGX_MAT_TAB_HANDLE_FACTORY`, `CNGX_TABS_COMMIT_HANDLER_FACTORY`, `CNGX_ORGANISM_SCROLL_SYNC_FACTORY`, `CNGX_DOM_ANCHOR_RETRY_FACTORY`, `CNGX_DIRECTIVE_BY_ID_MAP_FACTORY` (tabs / stepper).
- `CNGX_FILTER_BUILDER_STATE_FACTORY`, `CNGX_FILTER_BUILDER_TEMPLATE_REGISTRY_FACTORY` (`@cngx/forms/filter-builder`).

Contract tokens that a component provides for its children (not overridable - they are handshakes):

- `CNGX_STEPPER_HOST`, `CNGX_TAB_GROUP_HOST`, `CNGX_TAB_PANEL_HOST`, `CNGX_STEP_PANEL_HOST`, `CNGX_STEP_GROUP_HOST`.
- `CNGX_FORM_FIELD_CONTROL`, `CNGX_FORM_FIELD_HOST`, `CNGX_STATEFUL`.
- `CNGX_SELECT_PANEL_HOST`, `CNGX_SELECT_PANEL_VIEW_HOST`, `CNGX_TREE_SELECT_PANEL_HOST`, `CNGX_SELECT_SHELL_SEARCH_HOST`.
- `CNGX_FILTER_BUILDER_HOST`, `CNGX_CHIP_GROUP_HOST`, `CNGX_MAT_TABS_REGISTRY_HOST`.
- `CNGX_OPTION_FILTER_HOST`, `CNGX_OPTION_INTERACTION_HOST`, `CNGX_OPTION_STATUS_HOST`.

---

## Summary

Instrumentation adds a Signal-native control layer to existing Material markup via one attribute directive.

The presenter stays headless and reusable, the Material host keeps its template, the consumer changes one attribute on the tag they already had, and the entire surface stays open for extension through factory-override tokens.
