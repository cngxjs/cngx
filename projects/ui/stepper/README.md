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
