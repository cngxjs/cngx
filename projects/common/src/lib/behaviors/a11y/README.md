# @cngx/common — a11y Behaviors

Declarative, Signal-first accessibility directives that wrap or replace
Angular CDK's imperative a11y utilities.

## Why not just use the CDK directly?

Angular CDK's `@angular/cdk/a11y` provides powerful primitives — `FocusTrap`,
`FocusMonitor`, `LiveAnnouncer`, `AriaDescriber` — but they follow an
**imperative, service-injected, Observable-based** API style designed before
Angular Signals existed. Consumers must inject services, manage subscriptions,
and call methods manually.

CNGX a11y directives provide a **declarative, Signal-first** layer:

| CDK / Native | CNGX | Difference |
|-|-|-|
| `FocusTrap` (CDK) | `CngxFocusTrap` | Declarative `[enabled]`/`[autoFocus]` inputs instead of imperative `focusTrap.enabled = true`. Auto-cleanup via `DestroyRef`. |
| `FocusMonitor` (CDK service) | `CngxFocusVisible` | No service injection, no Observable subscription. Pure host bindings — `(pointerdown)` + `(focusin)` — expose a `focusVisible()` signal. Drop onto any element. |
| `LiveAnnouncer` (CDK service) | `CngxLiveRegion` | No service injection, no `announce()` calls. Bind `[politeness]` and change the element content — screen readers pick it up via `aria-live`. Declarative ARIA attributes via host bindings. |
| N/A | `CngxAriaExpanded` | Manages `aria-expanded` + `aria-controls` as a pair. Simpler than manual attribute binding for disclosure patterns. |
| `prefers-reduced-motion` (CSS) | `CngxReducedMotion` | Reactive Signal for `prefers-reduced-motion` media query. Use in TypeScript logic (e.g., skip animations), not just CSS. Adds `cngx-reduced-motion` class to host. |

## Design principles

- **Host bindings over document listeners** — events scoped to the element, not global.
- **Signals over Observables** — `focusVisible()`, `prefersReducedMotion()` are all signals.
- **No service injection** — drop a selector onto an element, done.
- **exportAs for template access** — `#fv="cngxFocusVisible"` gives template code direct signal access.
- **Composable** — combine directives freely: `cngxLiveRegion [cngxSpeak]="message()"`.

## Directives

### CngxFocusTrap

Wraps CDK `FocusTrap`. Traps Tab/Shift+Tab within the host element.

```html
<div cngxFocusTrap [enabled]="isOpen()" [autoFocus]="true"
     (keydown.escape)="close()">
  ...modal content...
</div>
```

**Inputs:** `enabled` (boolean), `autoFocus` (boolean, default true)
**Methods:** `focusFirst()`, `focusLast()`

### CngxFocusVisible

Tracks keyboard vs pointer focus. Adds `cngx-focus-visible` CSS class on
keyboard focus only.

```html
<button cngxFocusVisible #fv="cngxFocusVisible"
        [class.custom-ring]="fv.focusVisible()">
  Click me or Tab to me
</button>
```

**Signals:** `focusVisible()` (boolean)

CDK equivalent: `FocusMonitor.monitor(el).subscribe(origin => ...)` — requires
service injection, subscription management, and manual cleanup.

### CngxLiveRegion

Configures the host as an ARIA live region.

```html
<div cngxLiveRegion [politeness]="'assertive'">
  {{ statusMessage() }}
</div>
```

**Inputs:** `politeness` ('polite' | 'assertive' | 'off'), `atomic` (boolean),
`relevant` (string)

CDK equivalent: `LiveAnnouncer.announce(msg, politeness)` — imperative service
call, no DOM binding, creates a hidden aria-live element instead of decorating
your own.

### CngxAriaExpanded

Manages `aria-expanded` and `aria-controls` attributes as a pair.

```html
<button [cngxAriaExpanded]="isOpen()" [ariaControls]="'panel-1'">
  Toggle
</button>
```

**Inputs:** `cngxAriaExpanded` (boolean), `ariaControls` (string)

### CngxReducedMotion

Reflects the `prefers-reduced-motion` media query as a signal.

```html
<div cngxReducedMotion #rm="cngxReducedMotion">
  @if (rm.prefersReducedMotion()) {
    Animations disabled
  }
</div>
```

**Signals:** `prefersReducedMotion()` (boolean)
**CSS class:** `cngx-reduced-motion` added to host when active
