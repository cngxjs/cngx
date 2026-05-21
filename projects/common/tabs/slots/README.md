# Tabs Slots

Structural template slots that drop into the cngx tabs presenter to customise tab-level accessories. Each slot is an `ng-template` directive that replaces a library default through a 3-stage cascade: per-instance template > `CNGX_TABS_CONFIG.templates.<key>` > built-in glyph or render. The visibility gate stays library-owned, so slots only render when the presenter says the underlying state demands them.

## Import

```ts
import {
  CngxTabBusySpinner,
  CngxTabErrorBadge,
  CngxTabRejectionIcon,
} from '@cngx/common/tabs';
```

## Slots

| Directive | Selector | Renders when | Context fields |
|-|-|-|-|
| `CngxTabBusySpinner` | `ng-template[cngxTabBusySpinner]` | tab is the in-flight commit target (`intendedIndex` matches, status `pending`) | `tab`, `intendedIndex` |
| `CngxTabErrorBadge` | `ng-template[cngxTabErrorBadge]` | tab's `errorAggregator?.shouldShow()` is `true` | `tab` |
| `CngxTabRejectionIcon` | `ng-template[cngxTabRejectionIcon]` | tab matches `presenter.lastFailedIndex()` | `failedIndex`, `originLabel` |

`tab` is a `CngxTabHandle` with the per-tab id, label, disabled signal, and aggregator signals. `originLabel` is the safe-harbour tab that the commit rolled back to; `undefined` for the synchronous-rejection edge case.

Each slot is consumed exactly once by the `<cngx-tab-group>` skin. `[cngxMatTabs]` does not read them: Material owns the rendered tab-button chrome through its own MDC template (see `tabs-accepted-debt §9`).

## Quick start

```html
<cngx-tab-group [(activeId)]="active">
  <ng-template cngxTabBusySpinner>
    <my-spinner size="sm" />
  </ng-template>

  <ng-template cngxTabErrorBadge let-tab="tab">
    <span class="badge-pill">{{ tab.errorAggregator()?.count() }}</span>
  </ng-template>

  <ng-template
    cngxTabRejectionIcon
    let-failedIndex="failedIndex"
    let-originLabel="originLabel"
  >
    <my-icon name="rollback" />
    @if (originLabel) {
      <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
    }
  </ng-template>

  <cngx-tab id="overview" label="Overview">
    <ng-template cngxTabContent>...</ng-template>
  </cngx-tab>
  <cngx-tab id="settings" label="Settings">
    <ng-template cngxTabContent>...</ng-template>
  </cngx-tab>
</cngx-tab-group>
```

For app-wide defaults skip the per-instance directive and feed templates through `provideTabsConfig(withTabBusySpinnerTemplate(...), withTabErrorBadgeTemplate(...), withTabRejectionIconTemplate(...))`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for context types, host tokens, and config features.
- `@cngx/common/tabs` entry README for the presenter, host contracts, and overflow surface.
