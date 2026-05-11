# Focus Management

Reactive focus directives for dynamic content and keyboard navigation. Handles autofocus on insertion, focus restoration, focus trapping, and keyboard-initiated focus visibility.

## Directives

### CngxAutofocus

Reactive autofocus for dynamically inserted elements. The native `autofocus` HTML attribute only works on page load; this directive handles dialogs, panels, and other dynamically rendered content.

#### Import

```typescript
import { CngxAutofocus } from '@cngx/common/a11y';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxAutofocus` | `boolean` | `true` | Whether to focus the element. When the input transitions from `false` to `true` after initialization, focus is reapplied. |
| `autofocusDelay` | `number` | `0` | Delay in milliseconds before focusing — useful during CSS transitions. |
| `autofocusOptions` | `FocusOptions` | `{}` | Options passed to the native `element.focus()` method. |

#### Example

```typescript
// Focus on insertion
@if (showSearch()) {
  <input cngxAutofocus placeholder="Search…" />
}

// Conditional focus with delay
<input [cngxAutofocus]="isActive()" [autofocusDelay]="200" />
```

#### Notes

Tests using `CngxAutofocus` must use `vi.useFakeTimers()` when a delay is specified, or they will fail due to timing issues.

---

### CngxFocusRestore

Captures the currently focused element on initialization and restores focus when the host element is destroyed. Prevents focus from falling to `<body>` when dynamic content closes (dialogs, panels, tabs).

#### Import

```typescript
import { CngxFocusRestore } from '@cngx/common/a11y';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `focusRestoreFallback` | `HTMLElement \| null` | `null` | Explicit fallback element when the stored element is no longer in the DOM. |
| `restoreOnDestroy` | `boolean` | `true` | Whether to restore focus when the host is destroyed. |

#### Methods

- `capture(): void` — Manually store the current focus target for later restoration.
- `restore(): void` — Manually restore focus to the stored element (or fallback).

#### Fallback Resolution

1. Stored element (if still in DOM and not `<body>`)
2. Explicit `fallback` input
3. Nearest focusable ancestor (`[tabindex>=0]`, `<a href>`, `<button>`, `<input>`, `<select>`, `<textarea>`)
4. No action (element is no longer available)

#### Example

```typescript
// Basic: restore on destroy
@if (panelOpen()) {
  <div cngxFocusRestore>
    Panel content…
    <button (click)="panelOpen.set(false)">Close</button>
  </div>
}

// With explicit fallback
<div cngxFocusRestore [focusRestoreFallback]="fallbackBtn">
  Dynamic content…
</div>
<button #fallbackBtn>Fallback target</button>
```

---

### CngxFocusTrap

Traps keyboard focus within the host element using Angular CDK's `FocusTrapFactory`. Tab and Shift+Tab cycle only within the host; configurable auto-focus on activation.

#### Import

```typescript
import { CngxFocusTrap } from '@cngx/common/a11y';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxFocusTrap` | `boolean` | `false` | Whether the trap is active. When `false`, Tab navigates normally. |
| `autoFocus` | `boolean` | `true` | Auto-focus the first tabbable element when the trap activates. |

#### Computed Signals (read-only)

- `isActive: Signal<boolean>` — Reflects the current enabled state.

#### Methods

- `focusFirst(): void` — Programmatically focus the first tabbable element.
- `focusLast(): void` — Programmatically focus the last tabbable element.

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

#### Import

```typescript
import { CngxFocusVisible } from '@cngx/common/a11y';
```

#### Signals (read-only)

- `focusVisible: Signal<boolean>` — `true` when focused via keyboard, `false` otherwise.

#### Example

```typescript
<button cngxFocusVisible #fv="cngxFocusVisible">
  @if (fv.focusVisible()) { Focus ring visible }
</button>
```

#### Styling

The `cngx-focus-visible` class is applied to the host element:

```scss
button[cngxFocusVisible].cngx-focus-visible {
  outline: 2px solid var(--cngx-focus-color, blue);
  outline-offset: 2px;
}
```

---

## Composition

These focus directives are orthogonal — they do not interfere with each other and can be combined:

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

---

## See Also

- [CngxRovingTabindex/CngxRovingItem](../roving/README.md) — WAI-ARIA roving tabindex for composite widgets
- [CngxDialog](../../dialog/src/dialog/README.md) — Native dialog with built-in focus management
- Compodoc API documentation: `npm run docs:serve`
