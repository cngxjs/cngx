# @cngx/common/stepper

Level-2 directive-only logic for stepper / wizard flows. Zero `@Component`, zero `.html`, zero `.css` — those live in `@cngx/ui/stepper` (CNGX-standard skin) and `@cngx/ui/mat-stepper` (Material twin).

## What it does

Ships the **brain** that both stepper organisms compose: the presenter directive that owns active-step state, linear/non-linear navigation, async commit lifecycle, and a register/unregister contract for content-projected step atoms. Plus a router-sync directive for URL deep-linking, a config cascade for app-wide defaults, an i18n bundle, and a commit-handler factory for swappable async-commit semantics.

The presenter is a pure-derivation host directive — every visible piece of state (step tree, flat projection, active id, orientation, linear flag) is a `Signal<T>` derived from inputs and the registered atom set. Group nodes nest; flat-projection indices are computed once via `flattenStepTree` and cached.

## Exports

### Directives

| Export | Selector | Description |
|-|-|-|
| `CngxStepperPresenter` | `[cngxStepper]` | The brain. Owns active step, linear, orientation, commit lifecycle. Composed via `hostDirectives` by `<cngx-stepper>` and `<cngx-mat-stepper>` — never instantiated directly by consumers. |
| `CngxStep` | `[cngxStep]` | Step atom — registers itself with the enclosing presenter (or `CngxStepGroup`) at construction time, unregisters on destroy. Carries `id`, `label`, `disabled`, `state`, optional `errorAggregator`. |
| `CngxStepGroup` | `[cngxStepGroup]` | Group atom — nests child `cngxStep`s under a labelled cluster. Aggregates child status (`success` / `error` / `pending`) for the strip's group-header rendering. |
| `CngxStepLabel` | `ng-template[cngxStepLabel]` | Per-step label override (replaces the default `node.label()` text rendering). |
| `CngxStepContent` | `ng-template[cngxStepContent]` | Per-step panel body. The cngx-side organisms render this template inside the step's panel region. |
| `CngxStepperRouterSync` | `[cngxStepperRouterSync]` | Bidirectional URL deep-linking. Toggleable between `'fragment'` (default, `#step=<id>`) and `'queryParam'` (`?step=<id>`) via the `[mode]` Input or the `withStepperRouterSync` config feature. Optional `(syncError)` Output for router-rejection observers. |

### Tokens

| Export | Description |
|-|-|
| `CNGX_STEPPER_HOST` | The presenter contract. Injected by atoms (`CngxStep` / `CngxStepGroup`) for register/unregister + read-only state access. Provided via `useExisting` by `<cngx-stepper>` and `<cngx-mat-stepper>`. |
| `CNGX_STEP_GROUP_HOST` | Group-scoped variant of the host contract. `CngxStep` injects this with optional fallback to `CNGX_STEPPER_HOST` so steps can register against a parent group OR the root presenter. |
| `CNGX_STEP_PANEL_HOST` | Rendering-surface contract for organisms. Provides `flatSteps` / `activeStepIndex` / `activeStepId` Signals plus `labelTemplateFor(id)` / `contentTemplateFor(id)` template lookups. |
| `CNGX_STEPPER_CONFIG` | App-wide stepper configuration token (defaults, ARIA labels, fallback labels, router-sync mode). |
| `CNGX_STEPPER_I18N` | I18n bundle token (default English; consumers override via `provideStepperI18n`). |
| `CNGX_STEPPER_COMMIT_HANDLER_FACTORY` | Pluggable async-commit handler factory. Default: `createStepperCommitHandler`. Override for telemetry / retry / offline-queue without forking. |

### Configuration cascade

Resolution priority: per-instance Input → `viewProviders` → root provider → library default.

| Export | Description |
|-|-|
| `provideStepperConfig(...features)` | App-wide registration. |
| `provideStepperConfigAt(...features)` | Component-scoped via `viewProviders`. |
| `injectStepperConfig()` | Read the resolved config in directives / components. |
| `withDefaultOrientation('horizontal' \| 'vertical')` | Default orientation when `[orientation]` is unbound. |
| `withStepperLinear(boolean)` | Default linear-mode flag. |
| `withStepperCommitMode('optimistic' \| 'pessimistic')` | Default commit mode. |
| `withStepperRouterSync(mode, paramName?)` | Default router-sync `mode` + `paramName`. |
| `withStepperAriaLabels({ stepperRegion?, ... })` | App-wide ARIA-label overrides (consumer locale). |
| `withStepperFallbackLabels({ groupRoleDescription?, stepRoleDescription?, ... })` | App-wide role-description overrides. |

### I18n

| Export | Description |
|-|-|
| `provideStepperI18n(bundle)` | Provide a localised i18n bundle (defaults are English). |
| `injectStepperI18n()` | Read the resolved i18n bundle in directives / components. |
| `CngxStepperI18n` | The bundle interface (`stepperLabel`, `selectedStep(label, idx, count)`, `stepCompleted`, `stepErrored`, …). |

### Utilities

| Export | Description |
|-|-|
| `flattenStepTree(nodes)` | DFS flatten a `CngxStepNode` tree, assigning `flatIndex` to `step` nodes (groups receive `-1`). |
| `stepTreeEqual(a, b)` | Structural equality for the step tree (id + kind + parentId + nested). |
| `flatStepsEqual(a, b)` | Structural equality for the flat projection (depth + flatIndex aware). |
| `stepNodesEqual(a, b)` | Per-node structural equality (id + kind + parentId; tolerates synthetic `-1` indices). |
| `createStepperCommitHandler({ controller })` | Factory for the async-commit state-machine adapter. Default `CNGX_STEPPER_COMMIT_HANDLER_FACTORY`. |

## Usage

The Level-2 surface is consumed exclusively by Level-4 organisms (`<cngx-stepper>` / `<cngx-mat-stepper>`). Consumers do NOT instantiate `CngxStepperPresenter` directly. They use one of the organisms and project `<cngxStep>` atoms:

```ts
import { CngxStep, CngxStepContent } from '@cngx/common/stepper';
import { CngxStepper } from '@cngx/ui/stepper';

@Component({
  imports: [CngxStepper, CngxStep, CngxStepContent],
  template: `
    <cngx-stepper [(activeStepIndex)]="active" aria-label="Wizard">
      <div cngxStep label="Profile">
        <ng-template cngxStepContent>Profile content…</ng-template>
      </div>
      <div cngxStep label="Confirm">
        <ng-template cngxStepContent>Confirm content…</ng-template>
      </div>
    </cngx-stepper>
  `,
})
class WizardCmp {
  protected readonly active = signal(0);
}
```

## Architecture notes

- **Pillar 1** (`Ableitung statt Verwaltung`): every derived value is a `computed()`; the only writable slot is the active-step model + a registry `WritableSignal<readonly CngxStepRegistration[]>` mutated only by `register`/`unregister`.
- **Pillar 2** (`Kommunikation als First-Class`): host contracts (`CNGX_STEPPER_HOST` / `CNGX_STEP_PANEL_HOST`) expose ARIA-relevant state as `Signal<T>` so organisms can wire reactive `aria-current` / `aria-busy` / `aria-describedby` from day one.
- **Pillar 3** (`Komposition statt Konfiguration`): step content is content-projected (`<cngxStep>` atoms), not configured via an options array. Organisms compose the presenter via `hostDirectives` rather than extending it.
- **Memory hygiene**: every atom registers a `DestroyRef.onDestroy` unregister hook; the router-sync directive uses `takeUntilDestroyed` for its `NavigationEnd` stream.

## See also

- `@cngx/ui/stepper` — `<cngx-stepper>` CNGX-standard organism
- `@cngx/ui/mat-stepper` — `<cngx-mat-stepper>` Material-twin organism
- `.internal/architektur/stepper-accepted-debt.md` — tracked architectural debt (single §1: native `<mat-step>` adoption is structurally impossible via Angular content projection)
