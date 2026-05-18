# Native Dialog

Signal-driven state machine for the native `<dialog>` element. Provides reactive state, typed results, deterministic focus management, full ARIA communication, and support for async submit actions.

## Directives

### CngxDialog

Applied as `dialog[cngxDialog]`. Implements the `DialogRef<T>` interface and manages the lifecycle of a native `<dialog>` element with full accessibility support.

#### Lifecycle Diagram

```text
closed
  ↓ open()
opening  [cngx-dialog--opening class applied]
  ↓ [CSS transition completes]
open  [cngx-dialog--open class applied]
  ↓ close(value) or dismiss()
closing  [cngx-dialog--closing class applied]
  ↓ [CSS transition completes]
closed
```

### CngxDialogTitle

Marks an element as the dialog's title for ARIA labelling.

#### Notes

- The title text is announced via `aria-live` when the dialog transitions to `'open'`
- The ID is automatically derived from the parent dialog's ID (e.g., `cngx-dialog-0-title`)

### CngxDialogDescription

Marks an element as the dialog's description for ARIA.

### CngxDialogClose

Trigger for closing or dismissing the dialog.

#### Behavior

- With a value: `[cngxDialogClose]="'confirmed'"` calls `dialogRef.close('confirmed')`
- Without a value: `cngxDialogClose` (static attribute) calls `dialogRef.dismiss()`
- Auto-sets `type="button"` on `<button>` hosts to prevent accidental form submission
- Auto-sets `aria-label="Close dialog"` for icon-only buttons

## Accessibility

Dialog is fully WCAG 2.1 Level AA compliant:

- **ARIA labelling**: `aria-labelledby` + `aria-describedby` always set (Title + Description)
- **ARIA modal**: `aria-modal="true"` on modal dialogs
- **Keyboard navigation**: Escape dismisses; `CngxFocusTrap` recommended for modals
- **Focus management**: Focus returns to trigger element on close
- **SR announcements**: Title announced on open; errors announced via live region
- **Semantic HTML**: Uses native `<dialog>` element (full browser support)

## Composition

### Focus Trapping (Recommended for Modals)

Pair with `CngxFocusTrap` to prevent focus escape:

```typescript
<dialog cngxDialog [cngxFocusTrap]="dlg.isOpen()"
        #dlg="cngxDialog">
  <input cngxAutofocus />
  <button cngxDialogClose>Close</button>
</dialog>
```

### Focus Restoration

Use `CngxFocusRestore` to restore focus when the dialog closes:

```typescript
<dialog cngxDialog cngxFocusRestore #dlg="cngxDialog">
  <input />
  <button [cngxDialogClose]="true">Close</button>
</dialog>
```

### Async Submit with Error Handling

```typescript
readonly deleteState = createAsyncState<void>();

<dialog cngxDialog [submitAction]="deleteAction">
  <h2 cngxDialogTitle>Delete Item?</h2>
  <cngx-alert [state]="dlg.submitState"></cngx-alert>
  <button [cngxDialogClose]="true">Delete</button>
</dialog>

deleteAction = async () => {
  await this.api.deleteItem(this.itemId);
};
```

### Programmatic Opening (CngxDialogOpener)

```typescript
import { CngxDialogOpener } from '@cngx/common/dialog';

export class MyComponent {
  private readonly dialogOpener = inject(CngxDialogOpener);

  openConfirm(): void {
    const ref = this.dialogOpener.open(ConfirmComponent, {
      data: { message: 'Delete item?' }
    });

    ref.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteItem();
      }
    });
  }
}
```

## Styling

Dialog styling is fully in the consumer's hands. Basic example:

```scss
dialog[cngxDialog] {
  border: 1px solid var(--cngx-dialog-border, #ccc);
  border-radius: var(--cngx-dialog-border-radius, 8px);
  padding: var(--cngx-dialog-padding, 24px);
  box-shadow: var(--cngx-dialog-shadow, 0 4px 12px rgba(0,0,0,0.15));

  &.cngx-dialog--opening,
  &.cngx-dialog--closing {
    animation: slideUp 0.3s ease-out;
  }

  &.cngx-dialog--pending {
    pointer-events: none;
    opacity: 0.8;
  }

  &.cngx-dialog--error {
    border-color: var(--cngx-dialog-error-border, #f44336);
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }
}
```

## CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-dialog-backdrop-opacity` | `'0'` (when not topmost) | Managed by `CngxDialogStack` for stacked modals |
| `--cngx-dialog-x` | `'0px'` | Horizontal offset (set by `CngxDialogDraggable`) |
| `--cngx-dialog-y` | `'0px'` | Vertical offset (set by `CngxDialogDraggable`) |
| `--cngx-dialog-drag-cursor` | `'grab'` | Cursor when hovering drag handle |
| `--cngx-dialog-dragging-cursor` | `'grabbing'` | Cursor while dragging |

## Material Theme

A Material theme mixin is available in `@cngx/themes/material/dialog-theme.scss`:

```scss
@use '@cngx/themes/material/dialog-theme' as dialog;

html {
  @include dialog.theme($theme);
}
```

Sets backdrop, border-radius, padding, surface colors, and shadow from the Material palette. Supports both M2 and M3 themes. Includes a `density($level)` mixin for compact/default/comfortable spacing.

## See Also

- [CngxBottomSheet](../bottom-sheet/README.md) — Bottom sheet variant
- [CngxDialogDraggable](../draggable/README.md) — Drag behavior
- [CngxFocusTrap](../../a11y/src/focus/README.md) — Focus trap for modals
- [CngxFocusRestore](../../a11y/src/focus/README.md) — Focus restoration
- [CngxAutofocus](../../a11y/src/focus/README.md) — Autofocus on insertion
- Compodoc API documentation: `npm run docs:serve`
