# CngxNavRail

A narrow, always-collapsed column of navigation rows for apps whose primary
navigation never expands.

## Import

```typescript
import { CngxNavRail } from '@cngx/ui/nav-rail';
import {
  CngxNavFooter,
  CngxNavGroup,
  CngxNavGroupContent,
  CngxNavHeader,
  CngxNavIcon,
  CngxNavLink,
  CngxNavMark,
} from '@cngx/common/interactive';
```

## Rail or sidenav

| Need | Reach for |
|-|-|
| Navigation that is only ever a rail | `cngx-nav-rail` |
| Navigation that also opens to full width (mini mode, peek on hover, overlay on small screens) | `cngx-sidenav` with `[collapsed]` |

`cngx-nav-rail` has no open state, no backdrop and no focus trap. It is a
`navigation` landmark with rows in it. `@cngx/ui/nav-rail` imports nothing from
`@cngx/ui/sidenav`.

## Quick start

```html
<cngx-nav-rail>
  <cngx-nav-header>
    <img cngxNavMark src="/logo.svg" alt="" />
  </cngx-nav-header>

  <a cngxNavLink routerLink="/inbox" routerLinkActive #inbox="routerLinkActive"
     [active]="inbox.isActive">
    <cngx-icon cngxNavIcon><mat-icon>inbox</mat-icon></cngx-icon>
    Inbox
  </a>

  <button type="button" cngxNavGroup #reports="cngxNavGroup">
    <cngx-icon cngxNavIcon><mat-icon>bar_chart</mat-icon></cngx-icon>
    Reports
  </button>
  <div [cngxNavGroupContent]="reports">
    <div>
      <a cngxNavLink [depth]="1" routerLink="/reports/weekly">Weekly</a>
      <a cngxNavLink [depth]="1" routerLink="/reports/monthly">Monthly</a>
    </div>
  </div>

  <cngx-nav-footer>
    <img cngxNavMark src="/avatar.png" alt="" />
  </cngx-nav-footer>
</cngx-nav-rail>
```

The rows are the nav atoms of `@cngx/common/interactive`, skinned by
`cngx-nav.css` (loaded by `cngx.css`). The rail sets their tokens and its own
width; it adds no row markup of its own.

## Looks

`labelPlacement` picks one of two looks, reflected as `data-label-placement`
on the host.

- `'end'` (default) - icon only. Each row keeps its full label; the label
  starts at the row's inline-end padding edge and clips there, so it paints
  nothing but stays the accessible name. A tooltip shows the label on hover
  (after 300ms, see Configuration) and at once on keyboard focus. `[tooltip]`
  or `withNavRailTooltip(false)` switches it off.
- `'below'` - the icon stacked over a short, centred, wrapping label. No
  tooltip.

In both looks a badge sits on the icon's top inline-end corner, and section
labels (`cngxNavLabel`) keep their text for assistive technology but paint
nothing, in every colour mode.

A row without `cngxNavIcon` draws its first letter in the icon box, as in the
sidenav.

### Side

`side` names the edge the rail sits on, `'start'` (default) or `'end'`,
reflected as `data-side` on the host. It is logical: `'end'` is the right edge
in LTR and the left edge under `dir="rtl"`. `side` does not move the rail; its
place is its DOM order (put it after the content for an end rail). It turns
the side-dependent parts: the border goes on the rail's inner edge, and the
group flyout and the label tooltip open away from the rail, into the page.

Unbound, `[ariaLabel]` names an end rail by the `endAriaLabel` copy (English:
`Secondary navigation`) instead of `ariaLabel`, so a start rail and an end rail
on one page never share a landmark name. A lone end rail that is the main
navigation names itself through `[ariaLabel]`.

```html
<main>...</main>
<cngx-nav-rail side="end" ariaLabel="Tools">...</cngx-nav-rail>
```

## Slots

| Slot | Position |
|-|-|
| `cngx-nav-header` / `[cngxNavHeader]` | above the rows, does not scroll |
| default content | the rows, scrolls on overflow |
| `cngx-nav-footer` / `[cngxNavFooter]` | below the rows, does not scroll |

Put `[cngxNavMark]` in the header or footer: it sits at the row icon x, so a
logo or avatar lines up with the icons.

## Groups as flyouts

A `cngxNavGroup` with its `cngxNavGroupContent` opens as a flyout beside the
head, in both looks. The flyout is a native `popover="manual"` positioned with
CSS anchor positioning at the head's inline end, or its inline start on an
end-side rail (flips at the viewport edge).

- `aria-expanded` on the head stays the one state; the flyout is open exactly
  while the group is.
- It is a disclosure, not a menu: the links keep their link role and Tab walks
  them in DOM order, head first.
- Escape on the head or inside the flyout closes it and moves focus to the
  head; an Escape elsewhere on the page is left alone. Focus moving outside
  the head and the flyout, or a press outside both, closes it. It also
  closes when the rail turns `inert`, for example under a modal dialog.

CSS anchor positioning has no fallback here. In a browser without it the
flyout opens at the popover's default position.

## Accessibility

- The host is a `navigation` landmark. Its name is `[ariaLabel]` or, unbound,
  the `navRail` section of the language pack (English: `Navigation`, or
  `Secondary navigation` for `side="end"`). Name it apart from any other
  navigation landmark on the page.
- The clipped label is the row's accessible name; the tooltip is
  `aria-hidden` and only repeats it visually.
- Mark the active row with `[active]` on `cngxNavLink`; it sets
  `aria-current="page"`.

## i18n

```typescript
import { provideNavRailI18n, withNavRailI18nLabels } from '@cngx/ui/nav-rail';

bootstrapApplication(App, {
  providers: [provideNavRailI18n(withNavRailI18nLabels({ ariaLabel: 'Hauptnavigation' }))],
});
```

Resolution order: `[ariaLabel]`, then `CNGX_NAV_RAIL_I18N` (`ariaLabel`, or
`endAriaLabel` for an end-side rail), then the English default. `withNavRailI18nLabels` also takes a `Signal`, so the name follows a
language switch.

## Configuration

```typescript
import {
  provideNavRailConfig,
  withNavRailLabelPlacement,
  withNavRailSide,
  withNavRailTooltipDelay,
} from '@cngx/ui/nav-rail';

bootstrapApplication(App, {
  providers: [
    provideNavRailConfig(
      withNavRailLabelPlacement('below'),
      withNavRailSide('end'),
      withNavRailTooltipDelay(500),
    ),
  ],
});
```

| Feature | Key | Default |
|-|-|-|
| `withNavRailLabelPlacement(placement)` | `labelPlacement` | `'end'` |
| `withNavRailSide(side)` | `side` | `'start'` |
| `withNavRailTooltip(enabled)` | `tooltip` | `true` (only the `'end'` look has a tooltip) |
| `withNavRailTooltipDelay(ms)` | `tooltipDelay` | `300` |

`[labelPlacement]`, `[side]` and `[tooltip]` win over the config, the config over the
default. With the tooltip off, no tooltip element exists and no listener is
attached; flipping it at runtime sets the tooltip up or tears it down.
`provideNavRailConfigAt(...)` in a component's `viewProviders` merges over the
parent scope. `injectNavRailConfig()` returns the configuration in scope;
`injectNavRailTooltip` reads `tooltipDelay` from it, so the delay reaches every
organism that calls it.

## Theming

Rail tokens (`nav-rail.css`):

| Token | Default |
|-|-|
| `--cngx-nav-rail-size` | `2 * (row inset + row inline padding) + icon size + border width`, so the icon box sits centred |
| `--cngx-nav-rail-below-size` | `5rem` |
| `--cngx-nav-rail-below-font-size` | `0.75rem` |
| `--cngx-nav-rail-bg` | `--cngx-color-surface` |
| `--cngx-nav-rail-border-color` | `--cngx-color-border`, the border on the rail's inner edge |
| `--cngx-nav-rail-border-width` | `1px`, the border on the rail's inner edge |

Flyout tokens (`cngx-nav.css`): `--cngx-nav-flyout-bg`, `-color`,
`-border-color`, `-border-width`, `-shadow`, `-radius`, `-padding`, `-min-inline-size`,
`-offset`. The rail sets `--cngx-nav-flyout-offset` so the flyout clears the
rail edge. The tooltip uses the `cngx-tooltip` skin; `cngx-nav.css` places it
`--cngx-nav-tooltip-offset` (default `--cngx-space-sm`) past the row, so the
placement also reaches an organism that calls `injectNavRailTooltip` without
loading `nav-rail.css`.

Row tokens (`--cngx-nav-link-*`, `--cngx-nav-icon-size`) come from the nav
atoms and follow density.

### Material

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/nav-rail-theme' as nav-rail;

html {
  @include nav-rail.theme($theme);
}
```

`theme()` bridges the rail surface (`surface`), the flyout (`surface-container`,
level 2), the stacked label size (`label-medium`) and the rows, header and
footer. The aggregate `@cngx/themes/material/theme` includes the rail through
`nav-rail.surface()`, since its sidenav bridge already covers the rows. The
label tooltip takes `tooltip-theme`.

## A rail beside a secondary sidebar

Apps with many sections often pair a rail of sections with a sidebar of the
pages in the current section. Put the rail and a `cngx-sidenav-layout` side
by side; the sidenav carries the section's pages and can collapse on its own.

```html
<div class="shell">
  <cngx-nav-rail ariaLabel="Sections">
    <a cngxNavLink routerLink="/mail" [active]="section() === 'mail'">
      <cngx-icon cngxNavIcon><mat-icon>mail</mat-icon></cngx-icon>
      Mail
    </a>
    <a cngxNavLink routerLink="/calendar" [active]="section() === 'calendar'">
      <cngx-icon cngxNavIcon><mat-icon>event</mat-icon></cngx-icon>
      Calendar
    </a>
  </cngx-nav-rail>

  <cngx-sidenav-layout>
    <cngx-sidenav mode="side" [opened]="true" ariaLabel="Mail">
      <a cngxNavLink routerLink="/mail/inbox">Inbox</a>
      <a cngxNavLink routerLink="/mail/sent">Sent</a>
    </cngx-sidenav>
    <cngx-sidenav-content>
      <router-outlet />
    </cngx-sidenav-content>
  </cngx-sidenav-layout>
</div>
```

```css
.shell {
  display: flex;
  block-size: 100dvh;
}

.shell > cngx-sidenav-layout {
  flex: 1 1 auto;
  min-inline-size: 0;
}
```

Give the two landmarks different names, as above.

## Lower-level pieces

`CngxNavRail` is built on two injection functions you can call in your own
organism:

Both are behind swap tokens: `CNGX_NAV_RAIL_TOOLTIP_FACTORY` and
`CNGX_NAV_RAIL_FLYOUT_FACTORY` default to the two functions; `cngx-nav-rail`
calls the provided factory in its own injection context. Provide `() => {}` to
drop one. The tooltip factory receives `railed` with the `[tooltip]` switch
already folded in. Both take one sources object, and `side` (`'start'` or
`'end'`) tells them which way to open.

- `injectNavRailTooltip({ railed, side })` - the label tooltip for clipped rows;
  while `railed()` is `false` no tooltip element or listener exists.
- `injectNavRailFlyout({ railed, side, groups, groupElements, contents, contentElements })` -
  nav groups as anchored flyouts while `railed()` is `true`; `groups` and
  `contents` are your content queries for `CngxNavGroup` and
  `CngxNavGroupContent`, `groupElements` and `contentElements` the same
  queries with `read: ElementRef`.
