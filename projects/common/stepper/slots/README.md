# Stepper Slots

Structural directives that swap individual pieces of the cngx stepper skin without forking the organism. Each slot is an `ng-template` discovered via `contentChild()` on `<cngx-stepper>` / `<cngx-mat-stepper>`, cascading through `CNGX_STEPPER_CONFIG.templates.<key>` before falling back to the library default. The button shell, `aria-current` / `aria-controls` / `aria-busy` wiring, and the visibility gates stay library-owned; the slot replaces the glyph or markup inside.

## Import

```ts
import {
  CngxStepIndicator,
  CngxStepBadge,
  CngxStepBusySpinner,
  CngxStepRejection,
  CngxStepGroupHeader,
  CngxStepperEmpty,
} from '@cngx/common/stepper';
```

## Slots

| Selector | Context | Replaces |
|-|-|-|
| `ng-template[cngxStepIndicator]` | `CngxStepIndicatorContext` | The numbered / checkmark / error glyph inside each step button. Context exposes `position`, `node`, `active`, `status`, `busy`. |
| `ng-template[cngxStepBadge]` | `CngxStepBadgeContext` | The error badge that appears when `errorAggregator?.shouldShow()` is truthy. Context exposes `count`, `node`. Falls back to `CNGX_STEPPER_GLYPHS.errorBadge`. |
| `ng-template[cngxStepBusySpinner]` | `CngxStepBusySpinnerContext` | The pending-commit overlay on the in-flight target step. Renders only while `presenter.intendedStepIndex()` matches this step with `commitState.status() === 'pending'`. Context exposes `node`. |
| `ng-template[cngxStepRejection]` | `CngxStepRejectionContext` | The decoration on the step a rolled-back commit was rejected FROM. Renders only when `presenter.lastFailedIndex()` matches. Context exposes `failedIndex`, `originLabel`, `node`. Symmetric with the tabs `cngxTabRejectionIcon` slot. Falls back to `CNGX_STEPPER_GLYPHS.rejectionIcon`. |
| `ng-template[cngxStepGroupHeader]` | `CngxStepGroupHeaderContext` | The label markup inside a `kind === 'group'` row. The `role="group"` + `aria-roledescription` shell stays library-owned. Context exposes `group`, `expanded` (reserved), `status`. |
| `ng-template[cngxStepperEmpty]` | `void` | The placeholder rendered when `flatSteps()` is empty. Honest-Absence default: no markup. |

`createStepperTemplateBindings(opts)` wires the per-instance / config / `null` cascade in one place. Organisms (`<cngx-stepper>`, `<cngx-mat-stepper>`) call it from a field-init block; consumers do not.

## Quick start

```html
<cngx-stepper [(activeStepIndex)]="active" aria-label="Checkout">
  <ng-template cngxStepIndicator let-position let-status="status">
    @if (status === 'success') {
      <cngx-icon><mat-icon>check</mat-icon></cngx-icon>
    } @else if (status === 'error') {
      <cngx-icon><mat-icon>priority_high</mat-icon></cngx-icon>
    } @else {
      <span>{{ position }}</span>
    }
  </ng-template>

  <ng-template cngxStepBadge let-count="count">
    <span class="my-badge-pill">{{ count }}</span>
  </ng-template>

  <ng-template cngxStepBusySpinner>
    <cngx-progress-spinner size="sm" />
  </ng-template>

  <ng-template cngxStepRejection let-originLabel="originLabel">
    <cngx-icon><mat-icon>undo</mat-icon></cngx-icon>
    @if (originLabel) {
      <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
    }
  </ng-template>

  <ng-template cngxStepGroupHeader let-group="group" let-status="status">
    <h4 [class.is-error]="status === 'error'">{{ group.label() }}</h4>
  </ng-template>

  <ng-template cngxStepperEmpty>
    <cngx-empty-state heading="No steps configured yet" />
  </ng-template>

  <div cngxStep label="Cart">…</div>
  <div cngxStep label="Address">…</div>
  <div cngxStep label="Pay">…</div>
</cngx-stepper>
```

For app-wide defaults, register the same `TemplateRef`s on `CNGX_STEPPER_CONFIG.templates` via `withStepIndicatorTemplate(...)`, `withStepBadgeTemplate(...)`, `withStepBusySpinnerTemplate(...)`, `withStepRejectionTemplate(...)`, `withStepGroupHeaderTemplate(...)`, `withStepperEmptyTemplate(...)` inside `provideStepperConfig(...)`. A per-instance `ng-template` always wins.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for context-type members and the cascade factory signature.
- `@cngx/common/stepper` entry README for the host contracts, presenter, config cascade, and i18n.
