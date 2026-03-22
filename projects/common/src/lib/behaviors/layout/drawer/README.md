# @cngx/common — Drawer System

Headless drawer/sidebar system composed of three directives. The consumer
provides all styling — the directives only manage state, CSS classes, a11y
attributes, and keyboard/click-outside handling.

## Architecture

```
CngxDrawer          — state owner (open/close/toggle, Escape key)
  CngxDrawerPanel   — sliding panel (position, mode, focus trap, click-outside)
  CngxDrawerContent — content area (shifted class when open)
```

No ancestor injection. The panel and content receive an explicit reference
to the drawer via input — same pattern as `CngxSortHeader` with `[cngxSortRef]`.

## Quick Start

```html
<div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
  <button [cngxAriaExpanded]="drawer.opened()" (click)="drawer.toggle()">
    Menu
  </button>

  <div [cngxBackdrop]="drawer.opened()" (backdropClick)="drawer.close()"></div>

  <nav [cngxDrawerPanel]="drawer" position="left"
       [enabled]="drawer.opened()" [autoFocus]="true">
    <a href="/home">Home</a>
    <a href="/settings">Settings</a>
  </nav>

  <main [cngxDrawerContent]="drawer">
    Page content
  </main>
</div>
```

## Directives

### CngxDrawer

State owner. Holds open/close state, handles Escape key. Supports
controlled (`[cngxDrawerOpened]`) and uncontrolled modes.

**Selector:** `[cngxDrawer]`
**Export:** `cngxDrawer`
**Inputs:** `cngxDrawerOpened` (boolean | undefined — controlled mode)
**Signals:** `opened` (boolean — resolved state, controlled wins)
**Outputs:** `openedChange` (boolean), `closed` (void)
**Methods:** `open()`, `close()`, `toggle()`
**Host classes:** `cngx-drawer--opened`
**Host events:** `(keydown.escape)` calls `close()`

#### Controlled vs Uncontrolled

```html
<!-- Uncontrolled: drawer owns state internally -->
<div cngxDrawer #d="cngxDrawer">
  <button (click)="d.toggle()">Menu</button>
</div>

<!-- Controlled: parent signal owns state -->
<div cngxDrawer [cngxDrawerOpened]="sidebarOpen()"
     (openedChange)="sidebarOpen.set($event)">
</div>
```

### CngxDrawerPanel

The sliding panel. Reads state from an explicit `[cngxDrawerPanel]` reference.
Composes `CngxFocusTrap` as a `hostDirective`.

**Selector:** `[cngxDrawerPanel]`
**Export:** `cngxDrawerPanel`
**Inputs:**
- `cngxDrawerPanel` (CngxDrawer, required — the drawer ref)
- `position` (`'left'` | `'right'` | `'top'` | `'bottom'`, default `'left'`)
- `mode` (`'over'` | `'push'` | `'side'`, default `'over'`)
- `closeOnClickOutside` (boolean, default `true`)

**Host directives:** `CngxFocusTrap` (exposes `enabled`, `autoFocus` inputs)
**Signals:** `isOpen` (boolean — from drawer ref; always `true` in `side` mode)
**Host classes:** `cngx-drawer-panel`, `cngx-drawer-panel--open`, `cngx-drawer-panel--{position}`, `cngx-drawer-panel--{mode}`
**Host attrs:** `role="complementary"`, `aria-hidden` (not set in `side` mode)

#### Modes

| Mode | Behavior | Use case |
|-|-|-|
| `over` | Panel overlays content (absolute positioned) | Mobile nav, temporary panels |
| `push` | Panel pushes content aside (in flexbox flow) | App-style layout with collapsible sidebar |
| `side` | Always visible, no toggle | Desktop permanent sidebar |

#### Click-outside behavior

The click-outside listener checks against the **drawer container** element
(not just the panel), so toggle buttons and other controls inside the drawer
container don't accidentally trigger a close. Only clicks truly outside the
`[cngxDrawer]` element dismiss the panel.

Uses `click` event (not `pointerdown`) to avoid race conditions with toggle
buttons — element handlers fire first during bubbling, so `isOpen()` already
reflects the toggle by the time the document listener runs.

### CngxDrawerContent

Marks the main content area. Adds a CSS class when the drawer is open.

**Selector:** `[cngxDrawerContent]`
**Export:** `cngxDrawerContent`
**Inputs:** `cngxDrawerContent` (CngxDrawer, required — the drawer ref)
**Signals:** `isOpen` (boolean)
**Host classes:** `cngx-drawer-content`, `cngx-drawer-content--shifted`

## Composing with other atoms

The drawer system is designed to compose with existing cngx atoms:

| Atom | Purpose | Who wires it |
|-|-|-|
| `CngxAriaExpanded` | `aria-expanded` on trigger button | Consumer |
| `CngxFocusTrap` | Trap focus inside open panel | hostDirective (consumer binds `[enabled]`) |
| `CngxScrollLock` | Prevent body scroll when open | Consumer |
| `CngxBackdrop` | Overlay + inert sibling toggling | Consumer |
| `CngxSwipeDismiss` | Swipe-to-close gesture | Consumer |
| `CngxReducedMotion` | Disable transitions | Consumer (CSS-level) |

None of these are auto-injected. The consumer wires each one explicitly.

## CSS Custom Properties (recommended)

The directives set classes but no styles. Recommended tokens for consumers:

| Token | Default | Purpose |
|-|-|-|
| `--cngx-drawer-width` | 280px | Panel width (left/right) |
| `--cngx-drawer-height` | 280px | Panel height (top/bottom) |
| `--cngx-drawer-transition-duration` | 300ms | Slide animation |
| `--cngx-drawer-transition-easing` | ease-in-out | Timing function |
| `--cngx-drawer-backdrop-color` | rgba(0,0,0,0.5) | Backdrop overlay |
| `--cngx-drawer-z-index` | 1000 | Panel stacking |

## Responsive pattern

Combine `CngxMediaQuery` with the `mode` input for responsive sidebars:

```html
<div cngxMediaQuery="(min-width: 1024px)" #desktop="cngxMediaQuery"></div>

<div cngxDrawer #drawer="cngxDrawer">
  <nav [cngxDrawerPanel]="drawer" position="left"
       [mode]="desktop.matches() ? 'side' : 'over'">
    ...
  </nav>
  <main [cngxDrawerContent]="drawer">...</main>
</div>
```

On desktop (1024px+), the sidebar is always visible (`side` mode).
On mobile, it becomes an overlay drawer (`over` mode) with toggle button.
