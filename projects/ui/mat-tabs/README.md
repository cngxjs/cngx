# @cngx/ui/mat-tabs

Material instrumentation directive for `<mat-tab-group>`. One attribute
upgrade - composes `CngxTabGroupPresenter` via `hostDirectives`, so
consumers gain commit-action lifecycle, `CNGX_STATEFUL` provision (and
therefore `<cngx-toast-on />` / `<cngx-banner-on />` composition), and
the cngx tab-handle registry without rewriting their template.

```html
<mat-tab-group cngxMatTabs [commitAction]="save" [(activeIndex)]="active">
  <mat-tab label="Profile">…</mat-tab>
  <mat-tab label="Settings">…</mat-tab>
</mat-tab-group>
```

See compodocx for the full API surface (inputs, outputs, methods).

## Styling

The Material sticky-error skin (`.cngx-mat-tab--error`) is shipped as a
**standalone stylesheet asset**, not bundled via component metadata -
Angular only honours `styleUrls` on `@Component`, not on `@Directive`,
and `[cngxMatTabs]` instruments raw `<mat-tab-group>` (no template
surface of its own). The consumer imports the file once in the app's
global stylesheet:

```css
/* examples/src/styles.scss or your equivalent global stylesheet */
@import '@cngx/ui/mat-tabs/styles/mat-tabs.css';
```

Or via the Angular CLI `angular.json` `styles` array:

```json
{
  "architect": {
    "build": {
      "options": {
        "styles": ["src/styles.css", "node_modules/@cngx/ui/mat-tabs/styles/mat-tabs.css"]
      }
    }
  }
}
```

This is the same shipping pattern as Angular Material's prebuilt
themes (`@angular/material/prebuilt-themes/*.css`).

### CSS custom properties

A rejected tab is colour only: the label takes the reason colour (no
outline, no surface) and a bare stroke icon follows the label, a red
alert triangle for a failed commit and an amber slashed circle for a
refused one. A tab whose `[cngxMatTabError]` aggregator holds errors
gets an alert icon after the label as well (`1.15em`, stroke 2, before
the rejection icon when both show). Override per instance or globally
via `--cngx-mat-tab-*`:

|Variable|Default|Purpose|
|-|-|-|
|`--cngx-mat-tab-error-color`|danger mixed 75% toward text|Failed label and icon colour|
|`--cngx-mat-tab-refused-color`|warning mixed 70% toward text|Refused icon colour|
|`--cngx-mat-tab-refused-text-color`|warning mixed 55% toward text|Refused label colour|
|`--cngx-mat-tab-has-errors-color`|`--cngx-color-danger`|Has-errors icon colour|
|`--cngx-mat-tab-rejection-icon-size`|`1.15em`|Rejection icon size|
|`--cngx-mat-tab-has-errors-icon-size`|`1.15em`|Has-errors icon size|
|`--cngx-mat-tab-rejection-icon-gap`|`0.25rem`|Gap between label and icons|
|`--cngx-mat-tab-error-font-weight`|`600`|Label weight bump on a rejected tab|

The colours derive from `--cngx-color-danger`, `--cngx-color-warning`
and `--cngx-color-text` per colour scheme (light, dark,
`[data-color-scheme]` islands), so labels hold 4.5:1 and icons 3:1 in
both. `@cngx/themes` maps them to `--mat-sys-error` and
`--mat-sys-tertiary`. Under forced colors the label colour is lost, so
a rejected tab draws a 2px `CanvasText` outline and the icons paint the
system text colour.

### Decoration lifecycle

`[cngxMatTabs]` projects the `presenter.lastFailedIndex()` signal onto
the matching `.mat-mdc-tab` button via `Renderer2`:

- **Set** when a commit does not land (both optimistic and pessimistic
  modes): a refusal (`commitAction` answered `false`) or a failure
  (it threw, rejected or errored). `presenter.lastOutcome()` tells the
  two apart; the descriptor reads the refused copy for a refusal and
  the rolled-back copy for a failure, and the
  `*cngxMatTabRejectionContent` context carries `reason`.
- **Cleared** on the next successful re-pick of the same tab.
- **Cleared** on programmatic `presenter.clearLastFailed()` call.

The decoration adds `class="cngx-mat-tab--error"` and an SR-only
descriptor span referenced from the tab's `aria-describedby` (no
`aria-invalid`: it is form-field vocabulary, not a tab state). For a richer announcement phrase, compose
`<cngx-toast-on />` next to `[cngxMatTabs]` on the `<mat-tab-group>`
element; the bridge reads the same `CNGX_STATEFUL` source as the
decoration and reacts to failures only (a refusal leaves the commit
state at `'idle'`).

## Per-tab error aggregation

`[cngxMatTabError]` binds a `CngxErrorAggregatorContract` to a
single `<mat-tab>`. The contract carries its own reactive surface
(`shouldShow`, `announcement` are Signals); consumers pass the
aggregator instance directly - no outer Signal wrapper required.
When the bound aggregator's `shouldShow()` flips `true` the
matching Material tab button gains:

- A `cngx-mat-tab--has-errors` class and an `aria-hidden`
  `<span class="cngx-mat-tab__error-badge">` with the alert icon,
  right after the label.
- A child `<span class="cngx-sr-only" id="<handle-id>-errors">`
  carrying the aggregator's `announcement()` phrase.
- An `aria-describedby` token referencing that span - the directive
  preserves any prior `aria-describedby` value and appends only its
  own token.

```html
<mat-tab-group cngxMatTabs [(activeIndex)]="active">
  <mat-tab label="Profile" [cngxMatTabError]="profileErrors">
    <form [formGroup]="profileForm">…</form>
  </mat-tab>
  <mat-tab label="Settings" [cngxMatTabError]="settingsErrors">…</mat-tab>
</mat-tab-group>
```

The aggregators come from `injectErrorAggregator()` (in
`@cngx/common/interactive`). The visual is **independent** of the
commit-action rejection lifecycle - a tab can carry both
`--error` and `--has-errors` simultaneously, and the CSS skin offsets
the `--has-errors` badge slightly when both classes co-occur so the
two signals read as distinct.

### Direct error flag

When one value already says "this tab is invalid", skip the
aggregator: `[cngxMatTabErrorFlag]` takes a `string | boolean`. It
lands the same `--has-errors` class, descriptor span and
`aria-describedby` token as `[cngxMatTabError]`. The descriptor text
resolves aggregator `announcement()` -> the flag's string -> the
`tabHasErrors(count)` phrase from `CNGX_TABS_I18N`, so a bare `true`
still reads "1 error". `false` or `''` clears everything. On
`<nav mat-tab-nav-bar cngxMatTabNav>` the `[error]` input of
`[cngxMatTabLink]` does the same for `.mat-mdc-tab-link`.

```html
<mat-tab label="Profile" [cngxMatTabErrorFlag]="nameInvalid() ? 'Name is required' : false">
  …
</mat-tab>
```

## Smart overflow

`[cngxMatTabs]` ships a smart overflow story: when Material's tab
strip overflows the available width, a `<cngx-tab-overflow>` "More"
button appears at the trailing edge of `.mat-mdc-tab-header`,
listing the hidden tabs in a `<cngx-popover>` panel. Picking a
hidden tab routes through `presenter.selectById(...)` so the cngx
commit-action lifecycle, rejection decoration, and aggregator
visuals all stay coherent across the click.

**Consumer wiring: none.** The molecule is created programmatically
via `ViewContainerRef.createComponent` inside the directive's
constructor and physically anchored inside `.mat-mdc-tab-header`
via `Renderer2.appendChild` in an `afterNextRender` block. The
directive provides a Material-specific
`CngxTabOverflowDomAdapter` (`createCngxMatTabOverflowDomAdapter`)
on its `providers` array so the molecule's `IntersectionObserver`
attaches against `.mat-mdc-tab-label-container` (Material's
IO-friendly scroll viewport) and resolves per-tab buttons by
positional index into `.mat-mdc-tab` (Material owns the rendered
DOM; cngx handle ids never appear on the buttons).

Material's built-in horizontal scroll buttons (`<` / `>`) remain
visible alongside the More button. The More button is laid out as a
flex sibling of `.mat-mdc-tab-label-container` inside
`.mat-mdc-tab-header`, so the available width is split across the
pagination arrows, the label-container, and the More button - and
the `IntersectionObserver` rooted on the label-container picks up
the new container width automatically (`hiddenTabs` re-derives as
the container shrinks).

Consumers who prefer the More popover as the only overflow affordance
(no Material pagination arrows) can hide them with a one-line
theme-level override:

```css
/* AFTER importing @cngx/ui/mat-tabs/styles/mat-tabs.css */
.mat-mdc-tab-header:has(cngx-tab-overflow) .mat-mdc-tab-header-pagination {
  display: none;
}
```

### Idempotent positioning

The directive's afterNextRender block sets `position: relative` on
`.mat-mdc-tab-header` only when the header's computed `position` is
not already a positioning context (`relative` / `absolute` /
`fixed` / `sticky`). Consumers who themed the header with their own
non-static positioning keep their value - the directive does not
overwrite.
