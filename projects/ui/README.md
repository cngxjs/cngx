# @cngx/ui

Finished, styled Angular components that compose headless directives from
`@cngx/common` with opinionated rendering. These are the "organism" layer —
ready to drop into an application without additional template work.

## Theming

Every component supports two theming paths:

1. **CSS Custom Properties** — override `--cngx-*` variables on any parent
   element. Works without Angular Material.

2. **Material Theme SCSS** — each component ships a `*-theme.scss` file with
   `base()`, `color($theme)`, `density($theme)`, and `theme($theme)` mixins
   that map Material design tokens to the CSS custom properties.

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/src/lib/speak/speak-button-theme' as speak;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include speak.theme($theme);
}
```

M3 themes use `var(--mat-sys-*)` tokens. M2 themes derive from the palette.
Density scales sizes from default (0) to compact (-4).

## Components

### CngxMatPaginator

Material paginator wrapper that connects to `CngxPaginate` (headless,
`@cngx/common`) via `[cngxPaginateRef]`.

```html
<div cngxPaginate #pg="cngxPaginate" [total]="items().length">
  <!-- table / list -->
</div>
<cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[5, 10, 25]" />
```

**Inputs:** `cngxPaginateRef` (required, CngxPaginate instance), `pageSizeOptions` (number[])

### CngxSpeakButton

Ready-made speaker button that connects to `CngxSpeak` (headless,
`@cngx/common`) via `[speakRef]`.

```html
<span [cngxSpeak]="text" #tts="cngxSpeak">{{ text }}</span>
<cngx-speak-button [speakRef]="tts" />
```

**Inputs:** `speakRef` (required, CngxSpeak instance)

**CSS Custom Properties:**

| Variable | Default | Description |
|-|-|-|
| `--cngx-speak-btn-size` | `28px` | Button width and height |
| `--cngx-speak-btn-icon-size` | `14px` | SVG icon size |
| `--cngx-speak-btn-radius` | `4px` | Border radius |
| `--cngx-speak-btn-border-width` | `1px` | Border width |
| `--cngx-speak-btn-bg` | `--cngx-surface` / `#fff` | Background color |
| `--cngx-speak-btn-color` | `--cngx-text-secondary` / `#666` | Icon color |
| `--cngx-speak-btn-active-color` | `--cngx-accent` / `#f5a623` | Icon color while speaking or on hover |
| `--cngx-speak-btn-transition` | `0.15s` | Color transition duration |

**Material theme:** `@use '@cngx/ui/src/lib/speak/speak-button-theme'`

### CngxSkeletonContainer

Skeleton loading container with built-in placeholder repetition. Wraps the
headless `CngxSkeleton` atom with template projection so the consumer doesn't
need `@if`/`@for` boilerplate.

```html
<cngx-skeleton [loading]="loading()" [count]="3">
  <ng-template cngxSkeletonPlaceholder let-i let-last="last">
    <div class="skeleton-card" [style.width]="last ? '60%' : '100%'"></div>
  </ng-template>
  <app-real-content />
</cngx-skeleton>
```

**Inputs:** `loading` (boolean), `shimmer` (boolean, respects `prefers-reduced-motion`), `count` (number)

**Template:** project `<ng-template cngxSkeletonPlaceholder>` for loading state; default `<ng-content>` for loaded state. Context: `$implicit` (index), `index`, `count`, `first`, `last`.

**CSS Classes:** `cngx-skeleton`, `cngx-skeleton--loading`, `cngx-skeleton--shimmer`

**Selector:** `cngx-skeleton` -- exportAs `"cngxSkeletonContainer"`

### CngxActionButton

Action button molecule with built-in async status communication. Composes
`CngxAsyncClick` internally, adding template projection for pending/succeeded/failed
states, an `aria-live` region for screen reader announcements, optional toast
integration, and a `state` property for downstream feedback consumers.

```html
<!-- Minimal -->
<cngx-action-button [action]="save">Save</cngx-action-button>

<!-- With template slots -->
<cngx-action-button [action]="save">
  Save
  <ng-template cngxPending><mat-spinner diameter="18" /> Saving...</ng-template>
  <ng-template cngxSucceeded>Saved!</ng-template>
  <ng-template cngxFailed let-err>{{ err }} -- retry?</ng-template>
</cngx-action-button>

<!-- With toast feedback -->
<cngx-action-button [action]="save" toastSuccess="Saved" toastError="Save failed">
  Save
</cngx-action-button>

<!-- Downstream state binding -->
<cngx-action-button [action]="save" #btn="cngxActionButton">Save</cngx-action-button>
<cngx-alert [state]="btn.state" severity="error" title="Details" />
```

**Inputs:**

| Input | Type | Default | Description |
|-|-|-|-|
| `action` | `AsyncAction` | required | Async action to execute on click |
| `feedbackDuration` | `number` | `2000` | Duration in ms to show feedback state |
| `enabled` | `boolean` | `true` | When `false`, clicks are ignored |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button type attribute |
| `variant` | `ActionButtonVariant` | `'primary'` | Visual variant (`'primary'`, `'secondary'`, `'ghost'`) |
| `pendingLabel` | `string` | -- | Fallback text while pending (when no `cngxPending` template) |
| `succeededLabel` | `string` | -- | Fallback text after success (when no `cngxSucceeded` template) |
| `failedLabel` | `string` | -- | Fallback text after failure (when no `cngxFailed` template) |
| `succeededAnnouncement` | `string` | -- | SR announcement on success (falls back to `succeededLabel`) |
| `failedAnnouncement` | `string` | -- | SR announcement on failure (falls back to `failedLabel`) |
| `externalState` | `CngxAsyncState<unknown>` | -- | External state override for visual status |
| `toastSuccess` | `string` | -- | Toast message on success (requires `CngxToaster`) |
| `toastError` | `string` | -- | Toast message on error (requires `CngxToaster`) |
| `toastErrorDetail` | `boolean` | `false` | Append error message to error toast |
| `toastSuccessDuration` | `number` | `3000` | Success toast duration in ms |
| `toastErrorDuration` | `number \| 'persistent'` | `'persistent'` | Error toast duration |

**State producer:** `readonly state: CngxAsyncState<unknown>` -- the effective
lifecycle state (internal or external). Bind to any `[state]` consumer.

**Toast integration:** When `toastSuccess` or `toastError` inputs are set and
`CngxToaster` is provided (via `provideFeedback(withToasts())` or `provideToasts()`),
toasts fire automatically on status transitions. If `CngxToaster` is not provided,
toast inputs are silently ignored. Do not combine with `[cngxToastOn]` on the same
element -- a dev-mode warning is emitted if both are active.

**Template directives:** `cngxPending`, `cngxSucceeded`, `cngxFailed` (project `<ng-template>` for each state)

**CSS Classes:** `cngx-action-button`, `cngx-action-button--{variant}`

**Selector:** `cngx-action-button` -- exportAs `"cngxActionButton"`

### CngxSidenav

Declarative sidebar organism with dual-sidebar support, responsive mode
switching, mini/rail mode, resize handle, and keyboard shortcut toggle.

```html
<cngx-sidenav-layout>
  <cngx-sidenav position="start" [(opened)]="navOpen" mode="side"
                [resizable]="true" shortcut="mod+b" width="240px">
    <cngx-sidenav-header>Workspace</cngx-sidenav-header>
    <a cngxNavLink [active]="true">Dashboard</a>
    <a cngxNavLink>Settings</a>
    <cngx-sidenav-footer>v1.0</cngx-sidenav-footer>
  </cngx-sidenav>
  <cngx-sidenav-content>
    <router-outlet />
  </cngx-sidenav-content>
</cngx-sidenav-layout>
```

**Modes:** `'over'` (overlay + backdrop), `'push'` (pushes content), `'side'` (permanent), `'mini'` (collapsed rail, expands on hover)

**CngxSidenav inputs:**

| Input | Type | Default | Description |
|-|-|-|-|
| `ariaLabel` | `string` | — | Accessible label for the complementary landmark |
| `position` | `'start' \| 'end'` | `'start'` | Logical position (flips in RTL) |
| `mode` | `SidenavMode` | `'over'` | Interaction mode |
| `responsive` | `string` | — | CSS media query; matches = `'side'`, else falls back to `mode` |
| `width` | `string` (model) | `'280px'` | Panel width, two-way `[(width)]` for resize |
| `miniWidth` | `string` | `'56px'` | Collapsed rail width in mini mode |
| `expandOnHover` | `boolean` | `true` | Expand mini rail on mouse hover |
| `resizable` | `boolean` | `false` | Show drag handle for user resize |
| `minWidth` | `string` | `'120px'` | Min width constraint during resize |
| `maxWidth` | `string` | `'600px'` | Max width constraint during resize |
| `shortcut` | `string` | — | Keyboard shortcut, e.g. `'mod+b'` (`mod` = Cmd on Mac, Ctrl elsewhere) |

**CngxSidenav signals:** `opened` (model), `expanded` (mini hover state), `effectiveMode`, `effectiveWidth`, `resizing`, `isOverlay`
**Methods:** `open()`, `close()`, `toggle()`, `expand()`, `collapse()`

**Slot components:** `CngxSidenavHeader`, `CngxSidenavFooter` (projected into named slots)
**Layout:** `CngxSidenavLayout` (container, manages backdrop + scroll lock), `CngxSidenavContent` (main area)

**CSS Custom Properties:**

| Variable | Default | Description |
|-|-|-|
| `--cngx-sidenav-width` | `280px` | Panel width |
| `--cngx-sidenav-mini-width` | `56px` | Mini mode rail width |
| `--cngx-sidenav-bg` | M3 surface-container | Background |
| `--cngx-sidenav-color` | M3 on-surface | Text color |
| `--cngx-sidenav-border-color` | M3 outline-variant | Border color |
| `--cngx-sidenav-padding` | density-dependent | Header/footer padding |
| `--cngx-sidenav-header-bg` | M3 surface-container-low | Header background |
| `--cngx-sidenav-footer-bg` | M3 surface-container-low | Footer background |
| `--cngx-sidenav-backdrop-bg` | M3 scrim | Backdrop color |
| `--cngx-sidenav-backdrop-opacity` | `0.5` | Backdrop opacity |
| `--cngx-sidenav-transition-duration` | `0.25s` | Animation duration |
| `--cngx-sidenav-resize-handle-width` | `4px` | Resize handle hit area |
| `--cngx-sidenav-resize-handle-color` | M3 primary | Handle highlight color |
| `--cngx-sidenav-expanded-shadow` | `4px 0 12px rgba(0,0,0,0.1)` | Mini expanded shadow |

**Nav link theming** (applied inside sidenavs via `sidenav.theme()`):

| Variable | Description |
|-|-|
| `--cngx-nav-link-color` | Default text color |
| `--cngx-nav-link-hover-color` | Hover text color |
| `--cngx-nav-link-active-color` | Active text color |
| `--cngx-nav-link-active-bg` | Active background (M3 secondary-container) |
| `--cngx-nav-link-radius` | Border radius (default 8px) |
| `--cngx-nav-link-padding` | Padding (density-dependent) |

**Animated nav group expand/collapse:**

Replace `@if` with the `.cngx-nav-group-content` wrapper for smooth height animation
via the CSS `grid-template-rows: 0fr/1fr` trick (no `@angular/animations` needed):

```html
<button cngxNavGroup #group="cngxNavGroup" [controls]="'items'">Settings</button>
<div class="cngx-nav-group-content"
     [class.cngx-nav-group-content--open]="group.disclosure.opened()">
  <div id="items" role="group">
    <a cngxNavLink [depth]="1">General</a>
    <a cngxNavLink [depth]="1">Security</a>
  </div>
</div>
```

**Material theme:** `@use '@cngx/ui/sidenav/sidenav-theme'` — includes nav-link theme automatically

### CngxToaster — Toast API (`@cngx/ui/feedback`)

Programmatic toast service. Not `providedIn: 'root'` — provide via
`provideFeedback(withToasts())` or `provideToasts()`.

#### ToastConfig

```typescript
this.toaster.show({
  message: 'Saved',                    // Required — sole text when title not set
  title: 'Save successful',            // Optional — bold primary text
  description: 'Profile updated.',     // Optional — secondary text below title
  severity: 'success',                 // 'info' | 'success' | 'warning' | 'error'
  duration: 5000,                      // ms or 'persistent'
  action: { label: 'Undo', handler: () => this.undo() },
  dismissible: true,                   // default: true
  content: MyCustomToastBody,          // Optional — component as toast body
  contentInputs: { error: err },       // Inputs for the content component
});
```

**Layout rules:**
- `message` only (no `title`): single-line text (backwards-compatible)
- `title` + `description`/`message`: two-line layout (title bold, description muted)
- `title` + `content`: title above custom component
- `content` only: custom component fills the body

**A11y:** Avoid focusable elements (`<a>`, `<button>`) inside `content` components
— they are unreachable inside a `role="status"` live region.

**Dedup:** Toasts with same `message + severity + title` within `dedupWindow` (default
1000ms) are merged (count incremented). `description` is intentionally excluded from
dedup — same event with different context detail is still the same event.

#### Toast CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-toast-title-font-weight` | `600` | Title font weight |
| `--cngx-toast-title-color` | inherit | Title text color |
| `--cngx-toast-title-font-size` | `--cngx-toast-font-size` | Title font size |
| `--cngx-toast-description-color` | `#64748b` | Description text color (muted) |
| `--cngx-toast-description-font-size` | `0.8125rem` | Description font size |
| `--cngx-toast-description-line-height` | `1.4` | Description line height |
| `--cngx-toast-description-max-lines` | `3` | Line-clamp for description |
