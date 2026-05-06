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
