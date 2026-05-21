# Tabs Announcements

Pure factory that bundles every AT-facing string a tab group emits: tablist `aria-label`, role descriptions, the polite live-region message that fires on commit transitions and selection changes, plus the verbose per-tab `aria-label` and status-phrase descriptor. One call, one bundle, no injection context required. The organism owns the signals; the factory just composes them.

## Import

```ts
import { createTabGroupAnnouncements } from '@cngx/common/tabs';
```

## Quick start

Default wiring inside a tab-group organism:

```ts
import { Directive, inject, input } from '@angular/core';
import {
  CNGX_TAB_GROUP_HOST,
  createTabGroupAnnouncements,
  injectTabsConfig,
  injectTabsI18n,
} from '@cngx/common/tabs';

@Directive({ selector: '[myTabGroup]' })
export class MyTabGroup {
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  protected readonly announcements = createTabGroupAnnouncements({
    presenter: inject(CNGX_TAB_GROUP_HOST),
    i18n: injectTabsI18n(),
    config: injectTabsConfig(),
    ariaLabel: this.ariaLabel,
    ariaLabelledBy: this.ariaLabelledBy,
  });
}
```

The bundle is the override surface. To swap an announcer (custom phrasing, telemetry mirror, vendor-specific verbosity), assign a different bundle to `announcements` and bind the same template slots:

```ts
protected readonly announcements: CngxTabGroupAnnouncements = createTerseAnnouncements({
  presenter: inject(CNGX_TAB_GROUP_HOST),
  i18n: injectTabsI18n(),
});
```

The shape (`tabsRoleDescription`, `tabPanelRoleDescription`, `resolvedAriaLabel`, `liveAnnouncement`, `statusPhrase`, `tabAriaLabel`) is the contract. Override per-string copy via `provideTabsI18n` + `withTabsI18nLabels` before reaching for a custom factory.

## Accessibility

The bundle splits announcements into four channels so AT does not double-read:

|-|-|
| Signal | Where it binds |
|-|-|
| `tabsRoleDescription` | `<div role="tablist" [attr.aria-roledescription]="...">` |
| `tabPanelRoleDescription` | `<div role="tabpanel" [attr.aria-roledescription]="...">` |
| `resolvedAriaLabel` | tablist `[attr.aria-label]` (returns `null` when `aria-labelledby` is bound; the two are mutually exclusive per WAI-ARIA) |
| `liveAnnouncement` | polite live region inside the tab group |
| `statusPhrase(tab)` | `cngx-sr-only` span next to the tab label (always rendered, empty when nothing wants reveal) |
| `tabAriaLabel(tab, pos)` | tab-button `[attr.aria-label]` - verbose "Tab 2 of 5: Settings" form |

`liveAnnouncement` is declarative, never imperative. It is empty between transitions so the region stays quiet on no-op ticks. The commit lifecycle drives three arms:

- **pending** -> `i18n.commitInFlight`
- **error** -> `i18n.commitRolledBackTo(originLabel)` when the origin tab resolves, else `i18n.commitFailedRetry`. Sync rejections collapse pending -> error in one flush, so the error arm reads the tracker unguarded - this keeps `commitAction = () => false` reachable.
- **success** -> `${previousTab|nextTab}: selectedTab(label, pos, count)` when the index moved, bare `selectedTab(...)` when it did not (initial mount, or commit-success landing on the same tab).

Direction prefixing uses one internal `linkedSignal` tracking the prior active index. The factory reads it once at construction to seed it (lazy `linkedSignal` semantics would otherwise drop the first direction prefix).

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full `CngxTabGroupAnnouncements` shape.
- `../README.md` - `@cngx/common/tabs` brain overview.
- `../tabs-config.ts` - `withTabsAriaLabels`, `withTabsFallbackLabels` (copy overrides without a custom factory).
- `../i18n/tabs-i18n.ts` - `provideTabsI18n`, `withTabsI18nLabels` (per-locale strings).
- `../tab-group-host.token.ts` - `CngxTabGroupHost` / `CngxTabHandle` contracts the factory reads from.
