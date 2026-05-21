# Mat Tabs Decorations

Slot-template family for the `[cngxMatTabs]` decoration projectors. `[cngxMatTabs]` already projects rejection state and per-tab aggregator state onto Material's tab buttons (CSS class flag plus an SR-only descriptor span wired through `aria-describedby`). The directives in this folder let consumers swap the descriptor markup without rewriting the AT contract: cngx owns the span, its id, and the token-list append; the slot owns the phrasing.

## Import

```ts
import {
  CngxMatTabAggregatorContent,
  CngxMatTabRejectionContent,
} from '@cngx/ui/mat-tabs';
```

Both directives are standalone. The half-wired-slot sink type ships from the same entry as `CngxMatTabHalfWiredSlotSink` and is wired via `provideMatTabsConfig(withHalfWiredSlotSink(fn))`.

## Quick start

```html
<mat-tab-group cngxMatTabs [commitAction]="save" [(activeIndex)]="active">
  <ng-template
    cngxMatTabRejectionContent
    let-originLabel="originLabel"
    let-fallbackText="fallbackText"
  >
    <span class="brand-icon" aria-hidden="true"></span>
    {{ fallbackText }}
  </ng-template>

  <ng-template
    cngxMatTabAggregatorContent
    let-count="count"
    let-label="label"
  >
    {{ label }}: {{ count }} validation issue(s)
  </ng-template>

  <mat-tab label="Profile" [cngxMatTabError]="profileErrors">...</mat-tab>
  <mat-tab label="Settings" [cngxMatTabError]="settingsErrors">...</mat-tab>
</mat-tab-group>
```

The slot template renders inside the library-owned `<span class="cngx-sr-only">`. Cngx still applies the CSS class flag (`cngx-mat-tab--error` / `cngx-mat-tab--has-errors`) on the matching `.mat-mdc-tab` button and still manages the `aria-describedby` token. Unbound slots fall back to the i18n `textContent` path.

## Decoration family

|Directive|Selector|Context fields|Drives|
|-|-|-|-|
|`CngxMatTabRejectionContent`|`ng-template[cngxMatTabRejectionContent]`|`failedHandleId`, `originLabel`, `fallbackText`|Sticky rejection descriptor after `commitAction` rejects a tab change|
|`CngxMatTabAggregatorContent`|`ng-template[cngxMatTabAggregatorContent]`|`count`, `label`, `announcement`|Per-tab descriptor when a bound `[cngxMatTabError]` aggregator's `shouldShow()` flips true|

Both slots are single-template-per-host (Material owns the button chrome; the cngx descriptor span is the only consumer-visible seam). Cascade order on the rejection slot: per-instance template > `CNGX_MAT_TABS_CONFIG.templates.rejection` (planned) > library i18n fallback.

The rejection projector destroys and remounts the embedded view on every `descriptorText` re-emission (typical when the rollback origin label resolves a tick later than the failed handle id). Keep slot templates cheap; lift heavy state outside.

The aggregator projector emits a half-wired diagnostic when exactly one of `*cngxMatTabAggregatorContent` or the host `ViewContainerRef` is supplied. Override the default dev-mode `console.warn` via `provideMatTabsConfig(withHalfWiredSlotSink(fn))` for production telemetry.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for slot contexts, tokens, and the config-feature surface.
- `@cngx/ui/mat-tabs` entry README for the directive contract, sticky-error skin, and smart overflow.
