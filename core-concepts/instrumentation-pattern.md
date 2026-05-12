This document defines the **Instrumentation Pattern**, the primary strategy used by CNGX to enhance, synchronize, and "infect" third-party components (specifically Angular Material) with Signal-native logic without breaking their internal templates or incurring heavy migration costs.

# Instrumentation Pattern

CNGX does not attempt to replace Angular Material; it **instruments** it.

Most libraries fail by trying to wrap Material components in "Thin Shells." This breaks Material’s internal `ContentChildren` queries, interferes with DI hierarchies, and creates a "Transclusion Deadlock" where the library and the consumer fight over the same DOM space.

CNGX solves this by separating the **Logic (Brain)** from the **Rendering (Hardware)** and connecting them via an **Attribute Directive (The Driver)**.

## The Core Concept: Brain vs. Hardware

The pattern relies on three distinct layers:

| Piece                   | Role                                                                           | Level | Location            |
| :---------------------- | :----------------------------------------------------------------------------- | :---- | :------------------ |
| **Brain (Presenter)**   | A headless directive owning all Signals, state machines, and A11y derivations. | 2     | `@cngx/common`      |
| **Hardware**            | The third-party component providing the DOM and styles (e.g., `MatStepper`).   | -     | `@angular/material` |
| **Driver (Instrument)** | An attribute directive that attaches the Brain to the Hardware.                | 4     | `@cngx/ui/mat-*`    |

## Reference Implementation: `[cngxMatStepper]`

The Material Stepper is a "closed society" (hard inheritance, strict child queries). Wrapping it in a cngx-component would be brittle. Instead, we use an instrumentation directive.

### 1. The Headless Brain (`@cngx/common/stepper`)

The `CngxStepperPresenter` manages the `activeStepIndex`, `commitAction` (async gating), and `linear` logic. It is purely functional and has zero dependency on Material.

### 2. The Driver (`@cngx/ui/mat-stepper`)

The `CngxMatStepper` directive attaches directly to the existing Material markup.

```typescript
@Directive({
  selector: 'mat-stepper[cngxMatStepper], mat-vertical-stepper[cngxMatStepper]',
  hostDirectives: [
    {
      directive: CngxStepperPresenter,
      inputs: ['commitAction', 'linear', 'commitMode'],
      outputs: ['activeStepIndexChange'],
    },
  ],
})
export class CngxMatStepper {
  // 1. Gain direct access to the "Hardware" on the same element
  private hardware = inject(MatStepper, { self: true });
  private brain = inject(CngxStepperPresenter, { host: true });

  constructor() {
    // 2. Bidirectional Sync
    // We project the Brain's state onto the Hardware's API
    effect(() => {
      const targetIndex = this.brain.activeStepIndex();
      // Mandatory untracked() to prevent the effect from subscribing
      // to Material's internal signal-reads during the write.
      untracked(() => (this.hardware.selectedIndex = targetIndex));
    });
  }
}
```

### The Consumer Story: "The Trojan Horse"

The developer does not rewrite their template. They upgrade existing Material markup by adding **exactly one attribute**:

```html
<!-- Native Material markup remains. CNGX adds Signal power and Async gating. -->
<mat-stepper cngxMatStepper [commitAction]="saveStep">
  <mat-step label="Customer Data">...</mat-step>
  <mat-step label="Payment">...</mat-step>
</mat-stepper>
```

## Why Instrumentation Wins over Wrapping

| Feature           | Wrapping (`<cngx-mat-tabs>`)              | Instrumentation (`[cngxMatTabs]`)          |
| :---------------- | :---------------------------------------- | :----------------------------------------- |
| **Migration Tax** | High (Rename tags, move content)          | **Zero (Add one attribute)**               |
| **Shadow DOM**    | Risk of breaking `ContentChildren`        | **None ( 앉 sit on the same node)**        |
| **Logic Source**  | Divergent / Forked                        | **Unified (Same Presenter as Headless)**   |
| **Maintenance**   | Brittle (Breaks on Material HTML changes) | **Robust (Relies on Material Public API)** |

## The Decompose Contract

The Instrumentation Pattern is the ultimate expression of the **Atomic Decompose** strategy. Because the logic is entirely encapsulated in the Level 2 Presenter, the "Skin" (Material) is irrelevant to the Brain.

- **For cngx-native components:** `ng decompose` ejects the HTML/CSS so the user can own the "Skin."
- **For Material components:** The user **already owns the skin** (the Material tags in their HTML). They simply use the CNGX Instrumentation Directive as a "software update" for their existing UI hardware.

## Operational Rules

1.  **Strict Self-Injection:** Instrumentation directives must use `inject(Target, { self: true })`. This ensures they only affect the element they are explicitly placed on.
2.  **No Material in the Brain:** Level 2 Presenters must never import from `@angular/material`. All mapping from CNGX-Signals to Material-Properties happens inside the Level 4 Driver.
3.  **The Untracked Rule:** Every write to a Material component property inside an `effect()` must be wrapped in `untracked()`. Material components often read signals internally (especially in v21+); failing to use `untracked` will create infinite reactivity loops between CNGX and Material.
4.  **Hardware-Agnostic API:** The Instrument (Driver) should expose the Presenter's inputs/outputs via `hostDirectives` forwarding, maintaining a consistent API across both Headless and Material variants.
5.  **Pessimistic Gating:** When a `commitAction` is pending, the Instrument must "freeze" the Hardware state (e.g., by not writing to `selectedIndex`) until the Brain's state machine signals success.

### Summary

> "CNGX doesn't fight against the platform or the existing UI ecosystem. We use **Instrumentation** to provide a Signal-native architectural layer on top of proven UI libraries, ensuring maximum freedom and zero migration pain."
