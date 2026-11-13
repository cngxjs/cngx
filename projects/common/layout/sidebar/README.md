# Sidebar

`CngxSidebar` is the brain of a persistent side region. Unlike a drawer, which opens over or beside the content for a moment, a sidebar stays in the layout and reserves inline space. It collapses to a narrow rail or out of the layout, and a collapsed sidebar can peek at full size over the content without reflowing it.

The directive owns state, ARIA and the reserved size. The class `cngx-sidebar` adds the base skin from `@cngx/themes/cngx.css`: surface, border toward the content, sticky nav header and footer, peek shadow, and a rail that crops the nav rows instead of swapping them.

## Import

```typescript
import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';
import {
  CngxNavFooter,
  CngxNavHeader,
  CngxNavIcon,
  CngxNavLink,
  CngxNavName,
  CngxNavRailed,
} from '@cngx/common/interactive';
```

## Quick start

```html
<button type="button" [cngxPanelToggle]="sidebar" label="Navigation"></button>

<cngx-stack direction="row" gap="none">
  <nav
    cngxSidebar
    #sidebar="cngxSidebar"
    class="cngx-sidebar"
    [(collapsed)]="collapsed"
    [role]="null"
    [cngxNavRailed]="sidebar.state() === 'rail'"
    [cngxNavRailedSide]="sidebar.side()"
  >
    <cngx-nav-header><span cngxNavName>Acme</span></cngx-nav-header>
    <a cngxNavLink routerLink="/inbox"><cngx-icon cngxNavIcon><mat-icon>inbox</mat-icon></cngx-icon>Inbox</a>
    <cngx-nav-footer><span cngxNavName>Jane Doe</span></cngx-nav-footer>
  </nav>
  <main>…</main>
</cngx-stack>
```

The host is a flex item: its `inline-size` is set from the state, so the sibling content lane follows. The page shell, here a `cngx-stack` row, is yours.

## Rail

On the rail the skin crops the expanded sidebar: rows and group heads keep their place and clip their label, a row without an icon shows its first letter (`cngx-nav.css`), section labels paint nothing and the header and footer name fades out. Nothing is removed from the accessibility tree.

`[cngxNavRailed]` from `@cngx/common/interactive` adds the rail tooltip (the clipped label on focus and hover) and shows an open nav group as a flyout. Without it, a group head on the rail still opens, but its content shows inline at rail width.

## States

| `collapsed` | `collapsedAs` | peek | `data-sidebar-state` | Reserved size |
|-|-|-|-|-|
| `false` | any | - | `expanded` | `--cngx-sidebar-size` |
| `true` | `rail` | no | `rail` | `--cngx-sidebar-rail-size` |
| `true` | `hidden` | no | `hidden` | `0`, host `inert` + `aria-hidden` |
| `true` | any | yes | `peek` | the rest size; the host overlays at full size |

A peek starts when the pointer rests on a collapsed sidebar (`CngxHoverIntent`, gated by `expandOnHover`, delays via `expandDelay` / `collapseDelay`) or on `peek()`. It ends on Escape wherever focus is (a hover peek stays dismissible without moving focus, WCAG 1.4.13), on a press outside the host (the trigger whose `aria-controls` names the sidebar handles its own press), when focus leaves the host, or when the pointer leaves the host after resting on it. A `peek()` from an outside trigger whose pointer never enters stays until one of these happens. `pin()` turns it into the expanded state.

A collapsed rail stays operable: nothing in it is made `inert`.

## API

| Member | Kind | Description |
|-|-|-|
| `collapsed` | `model<boolean>` | Collapsed rest vs. expanded. Two-way. |
| `collapsedAs` | `input<'rail' \| 'hidden'>` | How a collapsed sidebar rests. Default `rail`. |
| `side` | `input<'start' \| 'end'>` | The edge the sidebar sits on, in the writing direction. Default `start`; `end` for an inspector after the content. A peek grows away from it. Also the `CngxPanelTarget` `side`. |
| `expandOnHover` | `input<boolean>` | Hover peeks a collapsed sidebar. Default `true`. |
| `expandDelay` / `collapseDelay` | `input<number>` | Hover dwell in ms (from `CngxHoverIntent`). |
| `role` | `input<string \| null>` | Landmark role. Default `complementary`; `null` keeps the implicit role of a `<nav>` / `<aside>`. |
| `label` | `input<string>` | Accessible name. Falls back to `CNGX_LAYOUT_I18N.sidebarRegion`. The resolved name is also the `CngxPanelTarget` `label`, so an icon-only `cngxPanelToggle` without its own `label` is named after the sidebar. |
| `expanded` | `Signal<boolean>` | Full size: expanded or peeked. |
| `peeked` | `Signal<boolean>` | Collapsed and currently peeking. |
| `state` | `Signal<CngxSidebarState>` | `expanded`, `rail`, `hidden` or `peek`. |
| `toggle()` / `peek()` / `unpeek()` / `pin()` | methods | State changes. |

## Panel trigger

`CngxSidebar` implements `CngxPanelTarget` and provides `CNGX_PANEL_TARGET`. A `[cngxPanelTrigger]="sidebar"` gets `aria-controls` from the host id (a static `id`, else a generated one) and `aria-expanded` from `expanded()`; a click toggles `collapsed`. `action="peek"` peeks instead.

`button[cngxPanelToggle]="sidebar"` is the icon-button form with its own glyph: a sidebar is an inline panel on the start side, so it shows the panel frame with a chevron that draws what a press does: pointing away from the column while collapsed (expand), toward it while expanded (collapse), mirrored under RTL. The name and `aria-expanded` carry the same state. Use `[cngxPanelTrigger]` on any element with its own content.

## Theming

| Custom property | Default | Purpose |
|-|-|-|
| `--cngx-sidebar-size` | `16rem` | Expanded and peek size. |
| `--cngx-sidebar-rail-size` | `3.5rem` | Rail size. |
| `--cngx-sidebar-peek-z-index` | `2` | Stacking of the peeked host over the content. |

Base skin tokens (`cngx-sidebar.css`, opt-in with `class="cngx-sidebar"`):

| Custom property | Default | Purpose |
|-|-|-|
| `--cngx-sidebar-bg` | `--cngx-color-surface` with a 3% text tint | Surface, also behind the sticky header and footer. |
| `--cngx-sidebar-border-color` | `--cngx-color-border` | Border on the side facing the content. |
| `--cngx-sidebar-border-width` | `1px` | Width of that border. |
| `--cngx-sidebar-peek-shadow` | `--cngx-shadow-md` | Shadow of a peek over the content. |

Set them on the host or any ancestor. Skins key off `[data-sidebar-state]` and `[data-sidebar-side]`.
