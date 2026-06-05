# @cngx/ui/stepper

CNGX-standard `<cngx-stepper>` organism. Composes the `CngxStepperPresenter` brain (from `@cngx/common/stepper`) with `CngxRovingTabindex` and `CngxFocusRestore` via `hostDirectives`. W3C step pattern compliant - `role="group"` + `aria-roledescription="stepper"` host, `role="region"` panels, reactive `aria-current` / `aria-busy` / `aria-describedby` on every step button.

## What it does

`<cngx-stepper>` is the cngx-native stepper skin: thin component, signals everywhere, full ARIA, optional commit-action lifecycle, optional router sync, optional error aggregation. Material consumers reach for `<cngx-mat-stepper>` (sibling `@cngx/ui/mat-stepper` entry) instead - both share the same `CngxStepperPresenter` brain.

The organism's body is template + reactive ARIA only. All state lives in the presenter (composed via `hostDirectives`). The component class is ~260 LOC; the template is ~70 lines; structural CSS lives in `styles/stepper-base.css`, thematic CSS in `stepper.component.css` - both routed through `--cngx-stepper-*` custom properties for theming.

## Exports

| Export | Selector | Description |
|-|-|-|
| `CngxStepper` | `cngx-stepper` | The organism. Composes `CngxStepperPresenter` (presenter brain), `CngxRovingTabindex` (keyboard nav), `CngxFocusRestore` (focus management) via `hostDirectives`. |
| `CngxProgressBarStepper` | `cngx-progress-bar-stepper` | Variant. Bar-style progress rendered via the embedded `<cngx-progress>` primitive. See [Progress-Bar Stepper](#progress-bar-stepper). |
| `CngxDotStepper` | `cngx-dot-stepper` | Variant. Mobile-first dot indicator. See [Dot Stepper](#dot-stepper). |
| `CngxTextStepper` | `cngx-text-stepper` | Variant. Inline `Step N of M` text. See [Text Stepper](#text-stepper). |

```html
<cngx-stepper [(activeStepIndex)]="active" aria-label="Wizard">
  <div cngxStep label="Profile">
    <ng-template cngxStepContent>Profile content…</ng-template>
  </div>
  <div cngxStepGroup label="Settings">
    <div cngxStep label="Notifications">…</div>
    <div cngxStep label="Security">…</div>
  </div>
  <div cngxStep label="Done">…</div>
</cngx-stepper>
```

`<cngxStep>` and `<cngxStepGroup>` atoms (from `@cngx/common/stepper`) register themselves with the enclosing presenter on construction. Group nodes nest steps; the strip renders both step buttons and group headers with `role="group"` + `aria-roledescription="step group"`.

## ARIA contract

The organism is W3C step-pattern compliant:

- Host element: `role="group"` + `aria-roledescription` (configurable via `withStepperFallbackLabels({ stepRoleDescription })`) + `aria-orientation` + `data-orientation` (for CSS hooks) + `aria-label` / `aria-labelledby`.
- Step button: `aria-current="step"` (when active) + `aria-controls="<step-id>-panel"` + `aria-disabled` (when disabled) + `aria-busy="true"` (during commit-action pending) + `aria-describedby="<step-id>-desc"` (always present; visibility via SR phrase).
- Step panel: `role="region"` + `aria-labelledby="<step-id>-header"` + `[hidden]="!isActive"`.
- Group header: `role="group"` + `aria-roledescription="step group"` + `data-step-depth` + `data-state` + `aria-describedby` (rolls up children's aggregated status).
- Live region: planned for Phase 3 commit-lifecycle SR announcements; deliberately NOT composed via `hostDirectives` because `CngxLiveRegion` would clobber the host's `role="group"` landmark.

## Skins

`<cngx-stepper>` ships five thematic skins selectable via the `[skin]` Input or the `withStepperSkin(...)` config feature. Structure, ARIA, slots, and keyboard behaviour are identical across all five; only the CSS layer driven by `[data-skin]` changes.

| Skin | Visual | Use case |
|-|-|-|
| `classic` | Numbered circles with connectors. The Phase A re-tuned default. | Default wizards, A11y-first flows. |
| `linear-minimal` | Label + 6px dot + dashed connector. | Long wizards on dense pages. |
| `stripe-status-rich` | Label + state pill (Done / In progress / Up next / Errored). | Sales / checkout flows where status legibility wins. |
| `path-chevron` | Boarding-pass chevron tiles. | High-identity branded flows. |
| `pill-segment` | iOS-style segmented control. | Compact toolbars. |

```ts
import { provideStepperConfig, withStepperSkin } from '@cngx/common/stepper';

bootstrapApplication(AppComponent, {
  providers: [provideStepperConfig(withStepperSkin('path-chevron'))],
});
```

Per-instance override:

```html
<cngx-stepper skin="linear-minimal" aria-label="Wizard">...</cngx-stepper>
```

Under 480px viewports the classic strip auto-collapses to `<cngx-text-stepper>` (default) or `<cngx-dot-stepper>`. Configure via `withStepperMobileCollapse('text' | 'dots' | 'off')`.

## Progress-Bar Stepper

`CngxProgressBarStepper` renders the active step ratio as a determinate `<cngx-progress>` bar. Thin Level-4 organism composing `CngxStepperPresenter` via `hostDirectives` plus the embedded `CngxProgress` primitive - no reinvented `<div role="progressbar">`. Material consumers inherit Material progress palette automatically via `@cngx/themes/material/feedback-theme`.

```ts
import { CngxStep } from '@cngx/common/stepper';
import { CngxProgressBarStepper } from '@cngx/ui/stepper';
```

```html
<cngx-progress-bar-stepper
  [(activeStepIndex)]="active"
  [showStepCount]="true"
  aria-label="Onboarding"
>
  <div cngxStep label="Account"></div>
  <div cngxStep label="Profile"></div>
  <div cngxStep label="Preferences"></div>
  <div cngxStep label="Finish"></div>
</cngx-progress-bar-stepper>
```

`[showStepCount]` appends a `Step N of M` caption sourced from `CngxStepperI18n.textStepperFormat`.

## Dot Stepper

`CngxDotStepper` renders one dot per step inside a `<div role="group" aria-roledescription="Step indicator">` per the W3C APG step-indicator pattern. The active dot carries `aria-current="step"`; arrow keys route through the presenter when `[linear]="false"`. Each dot uses `role="img"` with a `Step N of M` label - a name-permitting role, since this is sequential flow, not a tablist.

```ts
import { CngxStep } from '@cngx/common/stepper';
import { CngxDotStepper } from '@cngx/ui/stepper';
```

```html
<cngx-dot-stepper
  [(activeStepIndex)]="active"
  aria-label="Carousel slides"
  tabindex="0"
>
  <div cngxStep label="Slide 1"></div>
  <div cngxStep label="Slide 2"></div>
  <div cngxStep label="Slide 3"></div>
</cngx-dot-stepper>
```

Theming via `--cngx-dot-step-active-fill` / `--cngx-dot-step-completed-fill` / `--cngx-dot-step-upcoming-bg`. The Material bridge mixin maps each to the matching `--mat-sys-*` token.

## Text Stepper

`CngxTextStepper` is the smallest stepper - a single `<span aria-live="polite">` reading `Step N of M`. Pure typography inheritance from the consumer's context, no theme bridge required. `[showCurrentLabel]` appends the active step's label after the count.

```ts
import { CngxStep } from '@cngx/common/stepper';
import { CngxTextStepper } from '@cngx/ui/stepper';
```

```html
<header>
  <h3>Checkout</h3>
  <cngx-text-stepper [(activeStepIndex)]="active" [showCurrentLabel]="true">
    <div cngxStep label="Customer"></div>
    <div cngxStep label="Payment"></div>
    <div cngxStep label="Review"></div>
  </cngx-text-stepper>
</header>
```

Override the format via `withStepperI18nLabels({ textStepperFormat: (cur, total) => 'Schritt ' + cur + '/' + total })`.

## Swipe navigation (mobile)

Steppers are **indicators**, not carousels: they reflect `activeStepIndex`, they do not own the slide content. So swipe is not built in - you compose it. Wire `CngxSwipe` (from `@cngx/common/interactive`) onto the **content panel** and route the direction into the same two-way `activeStepIndex` signal. Because the gesture lives on the content, it works identically with any indicator variant (dot, text, progress-bar).

```ts
import { CngxSwipe, type SwipeDirection } from '@cngx/common/interactive';
import { CngxDotStepper } from '@cngx/ui/stepper';

readonly active = signal(0);

onSwipe(direction: SwipeDirection): void {
  if (direction === 'left') {
    this.active.update(i => Math.min(i + 1, this.lastIndex));
  } else if (direction === 'right') {
    this.active.update(i => Math.max(i - 1, 0));
  }
}
```

```html
<cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Slides">
  <div cngxStep label="Slide 1"></div>
  <div cngxStep label="Slide 2"></div>
  <div cngxStep label="Slide 3"></div>
</cngx-dot-stepper>

<!-- Swipe sits on the content, axis-pinned so a vertical scroll never fires it. -->
<section cngxSwipe axis="x" (swiped)="onSwipe($event)">…</section>
```

Keyboard navigation (arrow keys, Home / End) is built into the indicator and needs no wiring; swipe is the touch counterpart you add yourself.

**Caveat:** only wire swipe onto panels that are genuinely paged content (onboarding, galleries). Do not make a panel that holds real form fields swipe-navigable - a horizontal drag while editing inputs is ambiguous and fights native gestures. For form wizards, keep explicit Back / Next controls.

## Header navigation

`headerNavigation` decides whether the step headers are controls or pure indicators. It is a two-value policy - `'none'` or `'visited'` - that folds into the existing `linear` axis instead of adding a third mode.

|Value|Headers|Reachability|
|-|-|-|
|`'none'`|Inert labels (no button, no roving, no click). The footer is the only navigation.|n/a - headers never navigate|
|`'visited'` (default)|Focusable buttons|Gated by `linear`|

With `'visited'`, the `linear` flag does the rest:

- `linear="false"` (the default): every enabled header is clickable - free navigation, the old behaviour.
- `linear="true"`: only already-visited (completed) steps are reachable; forward-incomplete headers carry `aria-disabled="true"` and stay focusable so the gate is announced, not a silent no-op.

There is no separate `'free'` value - "free" is just `headerNavigation="visited"` with `linear="false"`.

```html
<!-- Footer-only wizard: headers are read-only indicators. -->
<cngx-stepper headerNavigation="none" [linear]="true" aria-label="Checkout">
  <div cngxStep label="Cart"></div>
  <div cngxStep label="Address"></div>
  <div cngxStep label="Payment"></div>
  <cngx-stepper-footer>
    <button cngxStepperFooterStart cngxStepperPrevious>Back</button>
    <button cngxStepperFooterEnd cngxStepperNext>Continue</button>
  </cngx-stepper-footer>
</cngx-stepper>
```

Set the app-wide default with `provideStepperConfig(withStepperHeaderNavigation('none'))`; the per-instance `[headerNavigation]` input wins over it.

While a commit is in flight (`commitAction` pending), the `'visited'` headers lock - they go `aria-disabled`, click and arrow-key navigation no-op - so the strip cannot supersede the pending transition. This matches the footer nav atoms (`cngxStepperPrevious` / `cngxStepperNext`), which disable on `busy()` too; the strip and the footer lock together during an async step.

### Migration

The default is `'visited'`. For non-linear steppers (`linear="false"`, the default) this is identical to previous behaviour - every header stays clickable. **Linear steppers change:** headers that used to be clickable-but-blocked are now marked `aria-disabled` and only visited steps are reachable. If you relied on always-clickable headers under `linear="true"`, set `[linear]="false"` (or keep `headerNavigation="visited"` and gate completion yourself).

## Error channels

A step can be flagged as in error through two independent channels. Both render the same error **state** on every skin (the indicator / badge / tile turns errored); the error **message** surfaces separately.

|Channel|How you flag it|Where the message appears|
|-|-|-|
|Validation|`[error]="true \| 'message'"` on `cngxStep`, or `[errorAggregator]` for multi-source forms|a row **below the strip** (every classic-style skin) via `*cngxStepError`; folded into the aggregate line on the `text` / `dot` / `progress-bar` mini variants|
|Commit / async|a `commitAction` that rejects (sets `lastFailedIndex`)|`*cngxStepRejection` decoration; `CngxToastOn` / `CngxBannerOn` transition bridges|

The message lives on its own row **below** the step strip, not inside a step. That is deliberate: a free-text message inside a horizontal (or column) strip item widens the shrink-to-fit step and tears the row; below the strip it has full width and wraps. The strip itself only ever carries the short state cue.

Only steps with a **real reason** show a message row - the bare `errored` state is already communicated by the indicator / badge, so a boolean `[error]="true"` adds no text-only noise. A reason is the direct `[error]` string or the first `errorAggregator` label.

The validation channel is the common case and needs no async machine. The simplest form is a single input:

```html
<cngx-stepper aria-label="Payment">
  <div cngxStep label="Card" [error]="cardInvalid() ? 'Card declined' : false"></div>
  <div cngxStep label="Review"></div>
</cngx-stepper>
```

`[error]="true"` puts the step in the error state (red indicator, no message); `[error]="'Card declined'"` does the same and supplies the message rendered below the strip. A string wins over an aggregator label, which wins over the i18n `errored` status word. No `<fieldset cngxErrorAggregator>` / `<input cngxErrorSource>` scaffolding is required to flag "this step is invalid" - the `errorAggregator` stays the path for genuine multi-source aggregation (per-source keys, labels, SR announcement).

Override the message presentation per instance with `*cngxStepError`, app-wide with `withStepErrorTemplate(...)`:

```html
<cngx-stepper aria-label="Payment">
  <div cngxStep label="Card" [error]="cardError()"></div>
  <ng-template cngxStepError let-message="message">
    <strong>{{ message }}</strong>
  </ng-template>
</cngx-stepper>
```

The commit / async channel is separate: a rejected `commitAction` decorates the rolled-back step (`*cngxStepRejection`) and flows its message through the `CngxToastOn` / `CngxBannerOn` transition bridges. The two channels never collide - validation owns `*cngxStepError`, commit owns `*cngxStepRejection`.
