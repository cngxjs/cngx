# Focus Management

Reactive focus directives for dynamic content and keyboard navigation. Handles autofocus on insertion, focus restoration, focus trapping, and keyboard-initiated focus visibility.

## Directives

### CngxAutofocus

Reactive autofocus for dynamically inserted elements. The native `autofocus` HTML attribute only works on page load; this directive handles dialogs, panels, and other dynamically rendered content.

#### Notes

Tests using `CngxAutofocus` must use `vi.useFakeTimers()` when a delay is specified, or they will fail due to timing issues.

---

### CngxFocusRestore

Captures the currently focused element on initialization and restores focus when the host element is destroyed while focus is inside it or on `<body>`; focus the user moved elsewhere stays put. Prevents focus from falling to `<body>` when dynamic content closes (dialogs, panels, tabs).

#### Inputs

| Input | Default | Purpose |
|-|-|-|
| `restoreOnDestroy` | `true` | Restore when the host is destroyed. Set `false` to skip the destroy path. |
| `fallback` | `null` | Element to focus when the stored element is gone. |
| `[cngxFocusRestoreWhile]` | unbound | Open state of a surface that stays in the DOM while closed: `false -> true` captures the focused element, `true -> false` restores it. While bound, destroying the host restores only when it is engaged. |

`capture()` and `restore()` (via `#r="cngxFocusRestore"`) store and restore manually.

```html
<aside cngxFocusRestore [cngxFocusRestoreWhile]="open()">…</aside>
```

#### Destroy rule

Destroy and the `true -> false` edge restore only when focus was lost: it is inside the host or on `<body>`. Focus the user moved elsewhere in the meantime stays where it is.

#### Fallback Resolution

1. Stored element (if still in DOM, not `<body>` and not inside the host)
2. Explicit `fallback` input
3. Nearest focusable ancestor matching `CNGX_FOCUSABLE_SELECTOR` (`<a href>`, enabled form controls, `<details>` summary, editable content, `[tabindex]` other than `-1`)
4. No action (element is no longer available)

### CngxFocusTrap

Traps keyboard focus within the host element using Angular CDK's `FocusTrapFactory`. Tab and Shift+Tab cycle only within the host; configurable auto-focus on activation.

#### Example

```html
<!-- Modal dialog -->
<div cngxFocusTrap [enabled]="isOpen()" [autoFocus]="true"
     tabindex="-1" role="dialog" aria-modal="true"
     (keydown.escape)="isOpen.set(false)">
  <input placeholder="First input" />
  <button (click)="isOpen.set(false)">Close</button>
</div>

<!-- Drawer / sidebar -->
<nav cngxFocusTrap [enabled]="drawerOpen()" tabindex="-1">
  <a href="/home">Home</a>
  <a href="/settings">Settings</a>
</nav>
```

#### API

Via `#trap="cngxFocusTrap"`: `isActive()` is the effective enabled state; `focusFirst()` / `focusLast()` move focus to the first / last tabbable element after the next render.

#### Notes

The trap uses Angular CDK's imperative API; this directive handles state synchronization and lifecycle cleanup internally. Traps do not coordinate: when they nest, enable only the innermost one.

---

### CngxFocusVisible

Tracks keyboard-initiated focus and applies the `cngx-focus-visible` CSS class. Removes the class when focus is lost or when focus was initiated by pointer interaction.

---

## Composition

These focus directives are orthogonal - they do not interfere with each other and can be combined:

```html
<!-- Panel with autofocus, focus trap, and focus restoration -->
@if (panelOpen()) {
  <div role="dialog" aria-modal="true" tabindex="-1"
       cngxFocusTrap [enabled]="true" [autoFocus]="false"
       cngxFocusRestore
       (keydown.escape)="panelOpen.set(false)">
    <input [cngxAutofocus]="true" [autofocusDelay]="100" />
    …
  </div>
}
```

### Common Patterns

- **Modal dialog**: `CngxFocusTrap` (required for accessibility) + `CngxFocusRestore` (recommended)
- **Overlay panel**: `CngxAutofocus` (on first input) + `CngxFocusRestore` (on close)
- **Nested modals**: Each modal independently applies `CngxFocusTrap` and `CngxFocusRestore`

### Driver tokens

A directive that composes `CngxFocusTrap` or `CngxFocusRestore` as a host directive can provide `CNGX_FOCUS_TRAP_DRIVER` / `CNGX_FOCUS_RESTORE_DRIVER` on its own element (`useExisting`) to drive them from its own state instead of their inputs. `CngxDrawerSurface` provides both, `CngxPopoverSheet` the trap driver.

---

## Accessibility

All focus directives maintain strict WCAG compliance:

- **Focus visible**: Keyboard users always see which element has focus
- **Focus management**: Focus returns to the trigger element after dismissal (WCAG 2.1 SC 2.4.3)
- **Focus trap**: Modal dialogs prevent focus escape (WCAG 2.1 SC 2.4.3)
- **Semantic HTML**: Native focusable elements only; no artificial focus management
