# @cngx/ui/mat-tabs

Material instrumentation directive for `<mat-tab-group>`. One attribute
upgrade — composes `CngxTabGroupPresenter` via `hostDirectives`, so
consumers gain commit-action lifecycle, `CNGX_STATEFUL` provision (and
therefore `<cngx-toast-on />` / `<cngx-banner-on />` composition), and
the cngx tab-handle registry without rewriting their template.

```html
<mat-tab-group cngxMatTabs [commitAction]="save" [(activeIndex)]="active">
  <mat-tab label="Profile">…</mat-tab>
  <mat-tab label="Settings">…</mat-tab>
</mat-tab-group>
```

See compodoc for the full API surface (inputs, outputs, methods).

## Styling

The Material sticky-error skin (`.cngx-mat-tab--error`) is shipped as a
**standalone stylesheet asset**, not bundled via component metadata —
Angular only honours `styleUrls` on `@Component`, not on `@Directive`,
and `[cngxMatTabs]` instruments raw `<mat-tab-group>` (no template
surface of its own). The consumer imports the file once in the app's
global stylesheet:

```css
/* dev-app/src/styles.css or your equivalent global stylesheet */
@import '@cngx/ui/mat-tabs/styles/mat-tabs.css';
```

Or via the Angular CLI `angular.json` `styles` array:

```json
{
  "architect": {
    "build": {
      "options": {
        "styles": [
          "src/styles.css",
          "node_modules/@cngx/ui/mat-tabs/styles/mat-tabs.css"
        ]
      }
    }
  }
}
```

This is the same shipping pattern as Angular Material's prebuilt
themes (`@angular/material/prebuilt-themes/*.css`).

### CSS custom properties

Theme via `--mat-sys-*` (Material design tokens) by default; override
per-instance or globally via `--cngx-mat-tab-error-*`:

| Variable | Default | Purpose |
|-|-|-|
| `--cngx-mat-tab-error-color` | `var(--mat-sys-error, #c62828)` | Foreground / outline colour |
| `--cngx-mat-tab-error-outline` | `2px solid currentColor` | Full `outline` shorthand |
| `--cngx-mat-tab-error-outline-offset` | `1px` | Gap between outline and tab edge |
| `--cngx-mat-tab-error-font-weight` | `600` | Label-glyph weight bump |

Three-tier fallback: consumer override → Material design token →
hard-coded `#c62828`. Consumers theming the rest of their Material
surface inherit the rejection skin automatically.

### Decoration lifecycle

`[cngxMatTabs]` projects the `presenter.lastFailedIndex()` signal onto
the matching `.mat-mdc-tab` button via `Renderer2`:

- **Set** on commit reject (both optimistic and pessimistic modes).
- **Cleared** on the next successful re-pick of the same tab.
- **Cleared** on programmatic `presenter.clearLastFailed()` call.

The decoration adds `class="cngx-mat-tab--error"` and
`aria-invalid="true"` — consumers using AT pick up the standard ARIA
signal automatically. For a richer announcement phrase, compose
`<cngx-toast-on />` next to `[cngxMatTabs]` on the `<mat-tab-group>`
element; the bridge reads the same `CNGX_STATEFUL` source as the
decoration.

## Per-tab error aggregation

`[cngxMatTabError]` binds a `CngxErrorAggregatorContract` to a
single `<mat-tab>`. The contract carries its own reactive surface
(`shouldShow`, `announcement` are Signals); consumers pass the
aggregator instance directly — no outer Signal wrapper required.
When the bound aggregator's `shouldShow()` flips `true` the
matching Material tab button gains:

- A `cngx-mat-tab--has-errors` class — visual badge (`!` glyph at
  the trailing-top corner of the button).
- A child `<span class="cngx-sr-only" id="<handle-id>-errors">`
  carrying the aggregator's `announcement()` phrase.
- An `aria-describedby` token referencing that span — the directive
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
commit-action rejection lifecycle — a tab can carry both
`--error` and `--has-errors` simultaneously, and the CSS skin offsets
the `--has-errors` badge slightly when both classes co-occur so the
two signals read as distinct.

### CSS custom properties

| Variable | Default | Purpose |
|-|-|-|
| `--cngx-mat-tab-has-errors-color` | `var(--mat-sys-error, #c62828)` | Badge background |
| `--cngx-mat-tab-has-errors-glyph-color` | `var(--mat-sys-on-error, #ffffff)` | Badge glyph foreground |
| `--cngx-mat-tab-has-errors-glyph-size` | `16px` | Badge diameter + font sizing |
| `--cngx-mat-tab-has-errors-glyph-offset` | `4px` | Top + trailing offset (single-state) |
| `--cngx-mat-tab-has-errors-glyph-offset-stacked` | `6px` | Top + trailing offset when both `--error` + `--has-errors` co-occur |
| `--cngx-mat-tab-has-errors-font-weight` | `700` | Glyph stroke weight |

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
DOM; cngx handle ids never appear on the buttons). All four
selector couplings are tracked under `tabs-accepted-debt §5`.

```html
<!-- Just add cngxMatTabs — overflow is automatic. -->
<mat-tab-group cngxMatTabs [(activeIndex)]="active">
  <mat-tab label="Profile">…</mat-tab>
  <mat-tab label="Settings">…</mat-tab>
  <!-- … many more tabs that overflow the viewport … -->
</mat-tab-group>
```

Material's built-in horizontal scroll buttons remain visible and
functional; consumers who want pure cngx overflow can hide the
Material pagination via theme-level CSS in their own stylesheet.

### CSS custom properties

The skin is targeted by the `cngx-mat-tabs-more` class on the
mounted molecule's host element. Three-tier fallback: consumer
override → Material design token → hard-coded value.

| Variable | Default | Purpose |
|-|-|-|
| `--cngx-mat-tabs-more-bg` | `var(--mat-app-background-color, #ffffff)` | Background fill of the More affordance — should match the page surface so scrolled tabs fade out cleanly. |
| `--cngx-mat-tabs-more-shadow` | `-8px 0 8px -4px rgba(0,0,0,0.1)` | Inline-start fade gradient simulating the scroll-mask. |
| `--cngx-mat-tabs-more-z` | `2` | Stack order above the strip but below Material's pagination buttons. |
| `--cngx-mat-tabs-more-top` | `0` | Trailing-edge offsets — rarely overridden; useful for asymmetric headers. |
| `--cngx-mat-tabs-more-right` | `0` | |
| `--cngx-mat-tabs-more-bottom` | `0` | |

### Idempotent positioning

The directive's afterNextRender block sets `position: relative` on
`.mat-mdc-tab-header` only when the header's computed `position` is
not already a positioning context (`relative` / `absolute` /
`fixed` / `sticky`). Consumers who themed the header with their own
non-static positioning keep their value — the directive does not
overwrite.
