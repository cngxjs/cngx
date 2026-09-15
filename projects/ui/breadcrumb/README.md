# CngxBreadcrumbBar

Breadcrumb bar organism. `<cngx-breadcrumb [items]="...">` renders a trail
through the headless `@cngx/common/interactive` trio (`CngxBreadcrumb` /
`CngxBreadcrumbItem` / `CngxBreadcrumbSeparator`): the bar forwards inputs and
owns the skin, the trio owns collapse, terminal marking and the landmark a11y.
Collapsed crumbs surface in a `CngxBreadcrumbOverflow` dropdown; lateral
navigation per crumb is a `CngxBreadcrumbSiblings` dropdown. Router integration
is opt-in via two sync directives - the base components never import
`@angular/router`.

## Import

```typescript
import { CngxBreadcrumbBar, CngxBreadcrumbRouterSync, type CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxBreadcrumbBar, type CngxBreadcrumbCrumb } from '@cngx/ui/breadcrumb';

@Component({
  selector: 'app-example',
  template: `<cngx-breadcrumb [items]="crumbs" />`,
  imports: [CngxBreadcrumbBar],
})
export class ExampleComponent {
  protected readonly crumbs: CngxBreadcrumbCrumb[] = [
    { label: 'Home', href: '/' },
    { label: 'Catalog', href: '/catalog' },
    { label: 'Books' },
  ];
}
```

The last crumb is the current page: it renders without `href` and carries
`aria-current="page"`, derived from position. Keep `href` unique across the
trail - the bar tracks crumbs by `href ?? label`; a duplicate collides on the
track key (NG0955).

## Collapse and overflow

Set `[maxVisible]` and the trail collapses its middle, keeping the first crumb
and the last `maxVisible - 1`. When anything is collapsed the bar auto-renders
a `<cngx-breadcrumb-overflow>` after the first crumb: an ellipsis trigger plus
a `CngxPopoverPanel` hosting a `CngxMenu` of the collapsed crumbs. It reads the
collapse set through the `CNGX_BREADCRUMB` DI contract and self-hides when
nothing is collapsed.

The default overflow row lists the label and does not navigate. Project
`*cngxBreadcrumbOverflowItem` on the bar to render a navigable row; the
`<li cngxMenuItem>` shell stays library-owned:

```html
<cngx-breadcrumb [items]="crumbs" [maxVisible]="3">
  <ng-template cngxBreadcrumbOverflowItem let-crumb>
    <a [href]="hrefFor(crumb)">{{ crumb.resolvedLabel() }}</a>
  </ng-template>
</cngx-breadcrumb>
```

## Responsive collapse

`responsive` derives `maxVisible` from the bar's own width - a
`CngxResizeObserver` hostDirective feeds the pure `resolveBreadcrumbTier`:

```html
<cngx-breadcrumb [items]="crumbs" responsive />
```

Default tiers: >= 640px shows 6, >= 440px shows 4, below that 2. Override with
`[responsiveTiers]` (`CngxBreadcrumbWidthTier[]`, any order); an explicit
`[maxVisible]` always wins over the width-derived value. Until the observer's
first measurement the cap stays `undefined` - a narrow mount never
mis-collapses on a zero-width first read.

## Router-driven trail

Add `cngxRouterSync` and the trail derives from the activated route tree -
every route whose `data['breadcrumb']` is a non-empty string contributes a
crumb:

```html
<cngx-breadcrumb cngxRouterSync />
```

```typescript
{ path: 'catalog', data: { breadcrumb: 'Catalog' }, children: [
  { path: 'books', data: { breadcrumb: 'Books', icon: 'book' } },
] }
```

The directive provides `CNGX_BREADCRUMB_ITEMS_SOURCE` (via `useExisting`), and
the bar's `computed` lets the source win over `[items]` - it never writes the
bar's input. `[dataKey]` and `[iconKey]` override the route-data keys per
instance (`data[iconKey]` rides onto `crumb.icon`). A componentless route
reusing the parent URL collapses into one crumb, deepest label wins. Without
`@angular/router` the directive dev-warns once and stays an empty source.

## Sibling dropdowns

`CngxBreadcrumbSiblings` lists the alternatives at one trail level - a chevron
trigger revealing a `role="list"` of native `<a href>` anchors, self-hiding
when there are no rows. The active level renders `aria-current="page"` and no
link. Three ways to feed it:

- **Declarative**: a non-empty `crumb.siblings` array makes the bar auto-render
  the dropdown for that crumb. No wiring.
- **Accessory slot**: project `*cngxBreadcrumbItemAccessory` on the bar; it
  renders after every crumb's link and wins over the declarative auto-render
  for all crumbs.
- **Router-driven**: `<cngx-breadcrumb-siblings cngxRouterSync [depth]="1" />`
  enumerates the sibling routes at `depth` from the static route config,
  marking the active child `current`. Parameterized siblings (`:id`) emit their
  path pattern verbatim - supply `[siblings]` directly when links need resolved
  params.

Project `*cngxBreadcrumbSiblingItem` to replace the default sibling row.

## Icons

`*cngxBreadcrumbIcon` renders inside every crumb link, before the label. The
crumb's `icon` is an opaque token - cngx ships no icon set and resolves no
names; the slot renders it with any icon system:

```html
<cngx-breadcrumb [items]="crumbs" skin="iconlabel">
  <ng-template cngxBreadcrumbIcon let-crumb>
    <mat-icon aria-hidden="true">{{ crumb.icon }}</mat-icon>
  </ng-template>
</cngx-breadcrumb>
```

## Skins

`skin` reflects onto `[data-skin]`; each look is an independent `@scope` paint
block over identical DOM, ARIA and collapse behaviour. Pure paint skins:
`classic` (default), `plain`, `contained`, `pill`, `ribbon`, `editorial`,
`header`, `metro`, `toolbar`, `chips`. Content skins additionally consume the
projected icon slot (`iconlabel`, `path`, `icononly`, `shell`) - `record` also
the accessory slot. Cascade: `[skin]` input, then `config.skin`, then `'classic'`.

## Configuration

```typescript
provideBreadcrumbConfig(
  withBreadcrumbAriaLabels({ bar: 'Navigation trail' }),
  withBreadcrumbDataKey('crumb'),
  withBreadcrumbIconKey('glyph'),
  withBreadcrumbSkin('pill'),
);
```

Root, or scoped to a subtree with `provideBreadcrumbConfigAt` in
`viewProviders`, where features deep-merge onto the parent config. Resolution:
per-instance input, then the scoped provider, then root, then the library
defaults (English; supply your locale through the cascade). Read the resolved
config with `injectBreadcrumbConfig()`.

## Accessibility

- The bar is a `<nav>` landmark; `[label]` names it (default "Breadcrumb").
- Terminal crumb: `aria-current="page"`, no `href` - derived from position.
- Separators are `aria-hidden="true"`, so AT reads a clean list of crumbs.
- Overflow and siblings triggers carry configurable `aria-label`s
  (`[triggerLabel]`, `[menuLabel]`); the siblings trigger reflects open state
  on `aria-expanded`.
- Sibling rows are native anchors - keyboard activation, screen-reader link
  roles and middle-click work without a command-menu layer.
- Touch targets floor to `--cngx-target-min` on coarse pointers.

## CSS custom properties

| Property | Default | Description |
|-|-|-|
| `--cngx-breadcrumb-gap` | `var(--cngx-space-sm, 0.5rem)` | Gap between crumbs, density-tracking |
| `--cngx-breadcrumb-link-color` | `inherit` | Crumb link color |
| `--cngx-breadcrumb-link-decoration` | `underline` | Crumb link text-decoration |
| `--cngx-breadcrumb-current-color` | `inherit` | Terminal crumb color |
| `--cngx-breadcrumb-current-weight` | `600` | Terminal crumb font-weight |
| `--cngx-breadcrumb-separator` | `'\203A'` (`'\2039'` under RTL) | Separator glyph in skin paint |
| `--cngx-breadcrumb-separator-color` | `inherit` | Separator color |
| `--cngx-breadcrumb-overflow-trigger-width` | `32px` | Ellipsis trigger width |
| `--cngx-breadcrumb-overflow-trigger-height` | `26px` | Ellipsis trigger height |
| `--cngx-breadcrumb-overflow-menu-min-width` | `11.875rem` | Collapsed-crumb menu min width |
| `--cngx-breadcrumb-siblings-trigger-size` | `22px` | Chevron trigger box |
| `--cngx-breadcrumb-siblings-menu-min-width` | `11.25rem` | Sibling list min width |
| `--cngx-breadcrumb-siblings-item-current-color` | `var(--cngx-color-primary, ...)` | Active sibling row color |

Beyond these, `--cngx-breadcrumb-overflow-*` and `--cngx-breadcrumb-siblings-*`
cover the trigger/row colors, hover/open states, paddings and radii; each skin
owns a `--cngx-breadcrumb-<skin>-*` family (bg, color, hover, active, radius,
font-size), registered via `@property` and assigned adaptively from
`--cngx-color-*` inside its `@scope`. Full list on the compodocx Theming tab.

## Material Theme

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/breadcrumb-theme' as breadcrumb;

html {
  @include breadcrumb.theme($theme);
}
```

One include aligns the base bar (link, current, separator, gap) plus the
overflow and siblings triggers and rows with `--mat-sys-*`. The dropdown
surfaces are `CngxPopoverPanel` chrome (popover-panel bridge), and the skins
self-assign from `--cngx-color-*` in their own `@scope` - neither is
re-declared here.

## See Also

- [CngxBreadcrumb / CngxBreadcrumbItem / CngxBreadcrumbSeparator](../../common/interactive/) - the headless trio for hand-composed trails
- [CngxPopoverPanel](../../common/popover/) - the dropdown surface both menus render into
- [API on compodocx](https://cngxjs.github.io/cngx/)
- Tests: `projects/ui/breadcrumb/breadcrumb-bar.component.spec.ts`, `breadcrumb-router-sync.directive.spec.ts`
