# Sidebar

`CngxSidebar` is the brain of a persistent side region. Unlike a drawer, which opens over or beside the content for a moment, a sidebar stays in the layout and reserves inline space. It collapses to a narrow rail or out of the layout, and a collapsed sidebar can peek at full size over the content without reflowing it.

The directive owns state, ARIA and the reserved size. It knows no nav model and no rail representation: what the rail shows is up to the consumer.

## Import

```typescript
import { CngxPanelToggle, CngxSidebar } from '@cngx/common/layout';
```

## Quick start

```html
<button type="button" [cngxPanelToggle]="sidebar" label="Navigation"></button>

<div class="shell">
  <nav cngxSidebar #sidebar="cngxSidebar" [(collapsed)]="collapsed" [role]="null">
    <a href="/inbox">
      <cngx-icon name="inbox" />
      @if (sidebar.expanded()) { <span>Inbox</span> }
    </a>
  </nav>
  <main>…</main>
</div>
```

```css
.shell {
  display: flex;
}
```

The host is a flex item: its `inline-size` is set from the state, so the sibling content lane follows.

## States

| `collapsed` | `collapsedAs` | peek | `data-sidebar-state` | Reserved size |
|-|-|-|-|-|
| `false` | any | - | `expanded` | `--cngx-sidebar-size` |
| `true` | `rail` | no | `rail` | `--cngx-sidebar-rail-size` |
| `true` | `hidden` | no | `hidden` | `0`, host `inert` + `aria-hidden` |
| `true` | any | yes | `peek` | the rest size; the host overlays at full size |

A peek starts when the pointer rests on a collapsed sidebar (`CngxHoverIntent`, gated by `expandOnHover`, delays via `expandDelay` / `collapseDelay`) or on `peek()`. It ends on Escape, when focus leaves the host, or when the pointer leaves. `pin()` turns it into the expanded state.

A collapsed rail stays operable: nothing in it is made `inert`.

## API

| Member | Kind | Description |
|-|-|-|
| `collapsed` | `model<boolean>` | Collapsed rest vs. expanded. Two-way. |
| `collapsedAs` | `input<'rail' \| 'hidden'>` | How a collapsed sidebar rests. Default `rail`. |
| `expandOnHover` | `input<boolean>` | Hover peeks a collapsed sidebar. Default `true`. |
| `expandDelay` / `collapseDelay` | `input<number>` | Hover dwell in ms (from `CngxHoverIntent`). |
| `role` | `input<string \| null>` | Landmark role. Default `complementary`; `null` keeps the implicit role of a `<nav>` / `<aside>`. |
| `label` | `input<string>` | Accessible name. Falls back to `CNGX_LAYOUT_I18N.sidebarRegion`. |
| `expanded` | `Signal<boolean>` | Full size: expanded or peeked. |
| `peeked` | `Signal<boolean>` | Collapsed and currently peeking. |
| `state` | `Signal<CngxSidebarState>` | `expanded`, `rail`, `hidden` or `peek`. |
| `toggle()` / `peek()` / `unpeek()` / `pin()` | methods | State changes. |

## Panel trigger

`CngxSidebar` implements `CngxPanelTarget` and provides `CNGX_PANEL_TARGET`. A `[cngxPanelTrigger]="sidebar"` gets `aria-controls` from the host id (a static `id`, else a generated one) and `aria-expanded` from `expanded()`; a click toggles `collapsed`. `action="peek"` peeks instead.

`button[cngxPanelToggle]="sidebar"` is the icon-button form with its own glyph: a sidebar is an inline panel on the start side, so it shows the panel frame in both states (mirrored under RTL) and the state lives in the name and `aria-expanded`. Use `[cngxPanelTrigger]` on any element with its own content.

## Theming

| Custom property | Default | Purpose |
|-|-|-|
| `--cngx-sidebar-size` | `16rem` | Expanded and peek size. |
| `--cngx-sidebar-rail-size` | `3.5rem` | Rail size. |
| `--cngx-sidebar-peek-z-index` | `2` | Stacking of the peeked host over the content. |

Set them on the host or any ancestor. Skins key off `[data-sidebar-state]`.
