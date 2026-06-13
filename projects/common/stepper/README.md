# @cngx/common/stepper

Level-2 directive-only logic for stepper / wizard flows. Zero `@Component`, zero `.html`, zero `.css` - those live in `@cngx/ui/stepper` (CNGX-standard skin) and `@cngx/ui/mat-stepper` (Material twin).

## What it does

Ships the **brain** that both stepper organisms compose: the presenter directive that owns active-step state, linear/non-linear navigation, async commit lifecycle, and a register/unregister contract for content-projected step atoms. Plus a router-sync directive for URL deep-linking, a config cascade for app-wide defaults, an i18n bundle, and a commit-handler factory for swappable async-commit semantics.

The presenter is a pure-derivation host directive - every visible piece of state (step tree, flat projection, active id, orientation, linear flag) is a `Signal<T>` derived from inputs and the registered atom set. Group nodes nest; flat-projection indices are computed once via `flattenStepTree` and cached.

## Exports

### Directives

| Export | Selector | Description |
|-|-|-|
| `CngxStepperPresenter` | `[cngxStepper]` | The brain. Owns active step, linear, orientation, commit lifecycle. Composed via `hostDirectives` by `<cngx-stepper>` and `<cngx-mat-stepper>` - never instantiated directly by consumers. |
| `CngxStep` | `[cngxStep]` | Step atom - registers itself with the enclosing presenter (or `CngxStepGroup`) at construction time, unregisters on destroy. Carries `id`, `label`, `disabled`, `state`, optional `errorAggregator`. |
| `CngxStepGroup` | `[cngxStepGroup]` | Group atom - nests child `cngxStep`s under a labelled cluster. Aggregates child status (`success` / `error` / `pending`) for the strip's group-header rendering. |
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
| `withStepperDefaultOrientation('horizontal' \| 'vertical')` | Default orientation when `[orientation]` is unbound. |
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

## Config features (`with*`)

| Feature | Purpose |
|-|-|
| `withStepperSkin(name)` | Select the visual skin for `<cngx-stepper>`: `'classic'` (default) / `'linear-minimal'` / `'stripe-status-rich'` / `'path-chevron'` / `'pill-segment'`. Thematic only - structure, slots, ARIA, and keyboard behaviour are identical across skins. The Material twin `<cngx-mat-stepper>` ignores this setting. |
| `withStepperMobileCollapse(mode)` | Choose the auto-collapse target for narrow viewports (`max-width: 480px`): `'text'` (default, renders `<cngx-text-stepper>`) / `'dots'` (renders `<cngx-dot-stepper>`) / `'off'` (keep the classic strip on every viewport). The Material twin ignores this setting. |
| `withStepperHeaderNavigation(mode)` | Set the header-navigation policy: `'none'` (inert label headers, footer-only navigation) / `'visited'` (default - focusable header buttons gated by `linear`). Per-instance `[headerNavigation]` wins. |
| `withStepErrorTemplate(tpl)` | App-wide default for the `*cngxStepError` slot - the per-step validation message rendered in a row below the strip. Per-instance `*cngxStepError` directive wins. |
| `withStepperI18nLabels({ statusLabels })` | Override the per-state pill labels surfaced by the `stripe-status-rich` skin: `{ done, inProgress, upNext, errored }`. Partial overrides keep unset keys at the English default. |
| `withStepperI18nLabels({ textStepperFormat })` | Override the short format used by `CngxProgressBarStepper`'s caption and by `CngxTextStepper`. Signature: `(current: number, total: number) => string`; default `(c, t) => 'Step ' + c + ' of ' + t`. |

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import {
  provideStepperConfig,
  provideStepperI18n,
  withStepperSkin,
  withStepperMobileCollapse,
  withStepperI18nLabels,
} from '@cngx/common/stepper';

bootstrapApplication(AppComponent, {
  providers: [
    provideStepperConfig(
      withStepperSkin('path-chevron'),
      withStepperMobileCollapse('dots'),
    ),
    provideStepperI18n(
      withStepperI18nLabels({
        statusLabels: {
          done: 'Erledigt',
          inProgress: 'Laufend',
          upNext: 'Anstehend',
          errored: 'Fehler',
        },
      }),
    ),
  ],
});
```

`CngxStepperPresenter` also emits a dev-mode warning when a stepper has more than 6 leaf steps at the same depth with no `<cngx-step-group>` wrapper, guiding consumers toward logical grouping for better UX. The warning is one-shot per presenter instance (via `afterNextRender`) and no-ops in production builds.

## Header navigation

`headerNavigation` is a two-value policy - `'none'` or `'visited'` - that decides whether step headers are controls or pure indicators. It folds into the existing `linear` axis instead of adding a third value:

- `'none'`: headers render as inert labels (no `<button>`, no roving, no click); the footer is the sole navigation control.
- `'visited'` (default): headers are focusable buttons. `linear="false"` allows free click-through; `linear="true"` reaches only visited steps and marks forward-incomplete headers `aria-disabled` (focusable, so the gate is announced).

"Free navigation" is `'visited'` + `linear="false"` - there is no discrete `'free'` value. Resolve via the cascade: per-instance `[headerNavigation]` input ?? `withStepperHeaderNavigation(...)` config ?? `'visited'`. See `@cngx/ui/stepper` for the full table and migration note.

## Error channels

A step carries an error through two independent channels:

- **Validation** - a direct `[error]` input on `cngxStep` (`true` or a message string), or an `[errorAggregator]` for genuine multi-source forms. Both fold into the step's `state` (`'error'`) with no async machine. The state shows on every skin via the indicator / badge; the reason text surfaces in a row below the strip via the `*cngxStepError` slot (or the aggregate line on the text / dot / progress variants), but only for a real message - a bare `[error]="true"` shows state only. `[error]="'message'"` wins over the first aggregator label, which wins over the i18n `errored` word.
- **Commit / async** - a `commitAction` that rejects sets `lastFailedIndex`; the rolled-back step decorates via `*cngxStepRejection` and announces through the `CngxToastOn` / `CngxBannerOn` bridges.

The two never collide: validation owns `*cngxStepError`, commit owns `*cngxStepRejection`. The `[error]` input replaces the old `<fieldset cngxErrorAggregator><input cngxErrorSource>` boilerplate for the common "this step is invalid" case; the aggregator stays the power path. See `@cngx/ui/stepper` for the per-skin text-surface table.
