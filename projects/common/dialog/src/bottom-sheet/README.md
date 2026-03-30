# Bottom Sheet

Bottom-positioned dialog variant with optional swipe-to-dismiss support.

## Directive

### CngxBottomSheet

Molecule combining `CngxDialog` with bottom sheet positioning and swipe gesture support. Applied alongside `cngxDialog` on the same `<dialog>` element.

#### Import

```typescript
import { CngxBottomSheet } from '@cngx/common/dialog';
import { CngxSwipeDismiss } from '@cngx/common/interactive';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `showHandle` | `boolean` | `true` | Whether to show the drag handle bar at the top (rendered via CSS `::before` pseudo-element). |

#### Composition with CngxSwipeDismiss

When both `cngxBottomSheet` and `cngxSwipeDismiss` are on the same element, the directive auto-wires the swipe event to `dialogRef.dismiss()` — no manual binding needed.

#### CSS Class

- `cngx-bottom-sheet` — Applied to the host for styling

#### Example

```typescript
// Basic bottom sheet with swipe-to-dismiss
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'"
        #sheet="cngxDialog">
  <h2 cngxDialogTitle>Share</h2>
  <button [cngxDialogClose]="'copy'">Copy Link</button>
  <button [cngxDialogClose]="'email'">Email</button>
  <button cngxDialogClose>Cancel</button>
</dialog>

<button (click)="sheet.open()">Share</button>

// Static bottom sheet (no swipe)
<dialog cngxDialog cngxBottomSheet #sheet="cngxDialog">
  <p>Content positioned at the bottom.</p>
  <button [cngxDialogClose]="true">Close</button>
</dialog>
```

---

## Styling

Bottom sheet positioning and animations are handled via CSS. Basic setup:

```scss
dialog[cngxBottomSheet] {
  // Position at bottom
  margin: 0;
  max-width: 100%;
  width: 100%;
  border-radius: var(--cngx-bottom-sheet-radius, 12px 12px 0 0);

  // Positioning
  margin-top: auto;
  max-height: var(--cngx-bottom-sheet-max-height, 80vh);
  overflow-y: auto;

  // Drag handle (when showHandle=true)
  &::before {
    content: '';
    display: block;
    width: 40px;
    height: 4px;
    background: var(--cngx-bottom-sheet-handle-bg, #ccc);
    border-radius: 2px;
    margin: 8px auto;
  }

  // Animations
  &.cngx-dialog--opening {
    animation: slideUp 0.3s ease-out;
  }

  &.cngx-dialog--closing {
    animation: slideDown 0.2s ease-in;
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.4);
  }
}
```

---

## Accessibility

Bottom sheets follow standard dialog accessibility:

- **ARIA labels**: `aria-labelledby` + `aria-describedby` set via `CngxDialogTitle` and `CngxDialogDescription`
- **Keyboard dismiss**: Escape closes the sheet
- **Focus management**: Focus returns to trigger on close
- **Gesture labels**: SR users are informed of swipe-to-dismiss via dynamic content

---

## Gestures

### Swipe-to-Dismiss

Use `[cngxSwipeDismiss]` to enable gesture closing:

```typescript
// Swipe down to dismiss
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'">
  …
</dialog>

// Swipe up to dismiss
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'up'">
  …
</dialog>

// Swipe in any direction
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="true">
  …
</dialog>
```

When a swipe is detected, `CngxBottomSheet` automatically calls `dialogRef.dismiss()`.

---

## Common Patterns

### Share Sheet

```typescript
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'" #sheet="cngxDialog">
  <h2 cngxDialogTitle>Share</h2>
  <button [cngxDialogClose]="'copy'">Copy Link</button>
  <button [cngxDialogClose]="'email'">Email</button>
  <button [cngxDialogClose]="'whatsapp'">WhatsApp</button>
  <button cngxDialogClose>Cancel</button>
</dialog>

<button (click)="sheet.open()">
  <i class="icon-share"></i>
</button>

// Handle result
@if (sheet.result() === 'copy') {
  <span>Copied to clipboard!</span>
}
```

### Filtering Panel

```typescript
<dialog cngxDialog cngxBottomSheet #filters="cngxDialog">
  <h2 cngxDialogTitle>Filters</h2>
  <label>
    <input type="checkbox" [(ngModel)]="showOnSale" />
    On Sale
  </label>
  <button [cngxDialogClose]="true">Apply</button>
</dialog>

<button (click)="filters.open()">Filters</button>
```

### Mobile Menu

```typescript
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'" #menu="cngxDialog">
  <nav>
    <a [cngxDialogClose]="'home'" href="/home">Home</a>
    <a [cngxDialogClose]="'settings'" href="/settings">Settings</a>
  </nav>
</dialog>

<button (click)="menu.open()">Menu</button>
```

---

## Material Theme

A Material theme mixin is available in `bottom-sheet-theme.scss`:

```scss
@use '@cngx/common/dialog/bottom-sheet-theme' as bottom-sheet;

html {
  @include bottom-sheet.theme($theme);
}
```

Sets surface color, border-radius (top corners only), drag handle styling, and shadow from the Material palette.

---

## See Also

- [CngxDialog](../dialog/README.md) — Base dialog directive
- [CngxSwipeDismiss](../../interactive/README.md) — Swipe gesture detection
- Compodoc API documentation: `npm run docs:serve`
