# Focus Management

Reactive focus directives for dynamic content and keyboard navigation. Handles autofocus on insertion, focus restoration, focus trapping, and keyboard-initiated focus visibility.

## Directives

### CngxAutofocus

Reactive autofocus for dynamically inserted elements. The native `autofocus` HTML attribute only works on page load; this directive handles dialogs, panels, and other dynamically rendered content.

#### Notes

Tests using `CngxAutofocus` must use `vi.useFakeTimers()` when a delay is specified, or they will fail due to timing issues.

---

### CngxFocusRestore

Captures the currently focused element on initialization and restores focus when the host element is destroyed. Prevents focus from falling to `<body>` when dynamic content closes (dialogs, panels, tabs).

#### Fallback Resolution

1. Stored element (if still in DOM and not `<body>`)
2. Explicit `fallback` input
3. Nearest focusable ancestor (`[tabindex>=0]`, `<a href>`, `<button>`, `<input>`, `<select>`, `<textarea>`)
4. No action (element is no longer available)

### CngxFocusTrap

Traps keyboard focus within the host element using Angular CDK's `FocusTrapFactory`. Tab and Shift+Tab cycle only within the host; configurable auto-focus on activation.

#### Example

```typescript
// Modal dialog
<div cngxFocusTrap [enabled]="isOpen()" [autoFocus]="true"
     tabindex="-1" role="dialog" aria-modal="true"
     (keydown.escape)="isOpen.set(false)">
  <input placeholder="First input" />
  <button (click)="isOpen.set(false)">Close</button>
</div>

// Drawer / sidebar
<nav cngxFocusTrap [enabled]="drawerOpen()" tabindex="-1">
  <a href="/home">Home</a>
  <a href="/settings">Settings</a>
</nav>
```

#### Notes

The trap uses Angular CDK's imperative API; this directive handles state synchronization and lifecycle cleanup internally.

---

### CngxFocusVisible

Tracks keyboard-initiated focus and applies the `cngx-focus-visible` CSS class. Removes the class when focus is lost or when focus was initiated by pointer interaction.

---

## Composition

These focus directives are orthogonal - they do not interfere with each other and can be combined:

```typescript
// Dialog with autofocus, focus trap, and focus restoration
<dialog [cngxFocusTrap]="dlg.isOpen()" [autoFocus]="true"
        cngxFocusRestore #dlg="cngxDialog">
  <input cngxAutofocus [autofocusDelay]="100" />
  …
</dialog>
```

### Common Patterns

- **Modal dialog**: `CngxFocusTrap` (required for accessibility) + `CngxFocusRestore` (recommended)
- **Overlay panel**: `CngxAutofocus` (on first input) + `CngxFocusRestore` (on close)
- **Nested modals**: Each modal independently applies `CngxFocusTrap` and `CngxFocusRestore`

---

## Accessibility

All focus directives maintain strict WCAG compliance:

- **Focus visible**: Keyboard users always see which element has focus
- **Focus management**: Focus returns to the trigger element after dismissal (WCAG 2.1 SC 2.4.3)
- **Focus trap**: Modal dialogs prevent focus escape (WCAG 2.1 SC 2.4.3)
- **Semantic HTML**: Native focusable elements only; no artificial focus management
