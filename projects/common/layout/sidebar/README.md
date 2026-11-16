# Sidebar

`CngxSidebar` is the brain of a persistent side region. Unlike a drawer, which opens over or beside the content for a moment, a sidebar stays in the layout and reserves inline space. It collapses to a narrow rail or out of the layout, and a collapsed sidebar can peek at full size over the content without reflowing it.

The directive owns state, ARIA and the reserved size. The class `cngx-sidebar` adds the base skin from `@cngx/themes/cngx.css`: surface, border toward the content and peek shadow of the box. It sets nothing for the content: padding, header and the look of whatever sits inside are the content's or yours.

## Import

```typescript
import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';
```

## Quick start

```html
<button type="button" [cngxPanelToggle]="sidebar" label="Filters"></button>

<cngx-stack direction="row" gap="none">
  <aside cngxSidebar #sidebar="cngxSidebar" class="cngx-sidebar" [(collapsed)]="collapsed">
    …
  </aside>
  <main>…</main>
</cngx-stack>
```

The host is a flex item: its `inline-size` is set from the state, so the sibling content lane follows. The page shell, here a `cngx-stack` row, is yours.

## Rail

On the rail the sidebar keeps `--cngx-sidebar-rail-size` and clips what does not fit. It does not rearrange its content. Content that has a rail look of its own brings it: nav rows from `@cngx/common/interactive` crop to their icon box under `[cngxNavRailed]="sidebar.state() === 'rail'"`, which also adds the rail tooltip and group flyout (see the nav README, "On a rail of your own"). The nav SETs `--cngx-nav-railed-size` on that host, the rail width that centres the icon box without the border; size the rail from it on the host itself: `--cngx-sidebar-rail-size: calc(var(--cngx-nav-railed-size) + var(--cngx-sidebar-border-width, 1px))`. For a finished navigation sidebar with header, footer and router sync, use `cngx-sidenav` from `@cngx/ui/sidenav`.

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
| `--cngx-sidebar-bg` | `--cngx-color-surface` with a 3% text tint | Surface. |
| `--cngx-sidebar-border-color` | `--cngx-color-border` | Border on the side facing the content; none while hidden. |
| `--cngx-sidebar-border-width` | `1px` | Width of that border. |
| `--cngx-sidebar-peek-shadow` | `--cngx-shadow-md` | Shadow of a peek over the content. |

Set them on the host or any ancestor. Skins key off `[data-sidebar-state]` and `[data-sidebar-side]`.
