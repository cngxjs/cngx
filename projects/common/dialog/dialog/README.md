# Native Dialog

Signal-driven state machine for the native `<dialog>` element. Provides reactive state, typed results, deterministic focus management, full ARIA communication, and support for async submit actions.

## Directives

### CngxDialog

Applied as `dialog[cngxDialog]`. Implements the `DialogRef<T>` interface and manages the lifecycle of a native `<dialog>` element with full accessibility support.

#### Import

```typescript
import { CngxDialog, CngxDialogTitle, CngxDialogDescription, CngxDialogClose } from '@cngx/common/dialog';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `modal` | `boolean` | `true` | Whether the dialog opens as modal (blocks interaction) or non-modal. |
| `closeOnBackdropClick` | `boolean` | `true` | Close on backdrop click (modal only). |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key press (modal only). |
| `autoFocus` | `'first-focusable' \| 'none' \| CSS selector` | `'first-focusable'` | Focus strategy after dialog opens. `'first-focusable'` focuses the first tabbable element or `[autofocus]` element; a selector string targets a specific element. |
| `focusFallback` | `HTMLElement \| undefined` | `undefined` | Element to focus if the trigger element is gone when the dialog closes. |
| `state` | `CngxAsyncState<unknown> \| undefined` | `undefined` | Async state controlling `isPending()` and error display. Takes precedence over `[submitAction]` and `[error]`. |
| `submitAction` | `((value: T) => Promise \| Observable) \| undefined` | `undefined` | Async action executed when `close(value)` is called. On success, auto-closes; on error, stays open. |
| `error` | `boolean` | `false` | Manual error state fallback when neither `[state]` nor `[submitAction]` is set. |

#### Signals (read-only)

| Signal | Type | Description |
|-|-|-|
| `lifecycle` | `Signal<'closed' \| 'opening' \| 'open' \| 'closing'>` | Current dialog state. |
| `result` | `Signal<T \| 'dismissed' \| undefined>` | Typed result from `close(value)` or `'dismissed'` from backdrop/Escape. |
| `id` | `Signal<string>` | Unique auto-generated ID for this dialog instance. |
| `submitState` | `CngxAsyncState<unknown>` | Async state of the submit action (when `[submitAction]` is set). |

#### Methods

- `open(): void` — Open the dialog. Stores the currently focused element for focus return.
- `close(value: T): void` — Close with a typed result. If `[submitAction]` is set, executes the action first.
- `dismiss(): void` — Dismiss without a result (triggered by Escape or backdrop click).

#### CSS Classes

| Class | When Applied |
|-|-|
| `cngx-dialog--opening` | During open transition |
| `cngx-dialog--open` | Dialog is fully open |
| `cngx-dialog--closing` | During close transition |
| `cngx-dialog--modal` | When `modal=true` |
| `cngx-dialog--pending` | When `isPending()=true` |
| `cngx-dialog--error` | When an error is active |

#### Example

```typescript
// Declarative usage
<dialog cngxDialog #dlg="cngxDialog" [submitAction]="deleteFn">
  <h2 cngxDialogTitle>Delete item?</h2>
  <p cngxDialogDescription>This cannot be undone.</p>
  <button [cngxDialogClose]="false">Cancel</button>
  <button [cngxDialogClose]="true">Delete</button>
</dialog>

<button (click)="dlg.open()">Delete</button>

// Programmatic access inside dialog
<dialog cngxDialog>
  <button (click)="closeDialog()">Close</button>
</dialog>

export class MyComponent {
  protected readonly dlgRef = inject(DIALOG_REF);

  closeDialog(): void {
    this.dlgRef.close('confirmed');
  }
}
```

#### Lifecycle Diagram

```
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

---

### CngxDialogTitle

Marks an element as the dialog's title for ARIA labelling.

#### Import

```typescript
import { CngxDialogTitle } from '@cngx/common/dialog';
```

#### Signals (read-only)

- `id: Signal<string>` — Auto-generated unique ID, used by the parent dialog for `aria-labelledby`.

#### Example

```typescript
<dialog cngxDialog>
  <h2 cngxDialogTitle>Confirm Delete</h2>
  <p>This action cannot be undone.</p>
</dialog>
```

#### Notes

- The title text is announced via `aria-live` when the dialog transitions to `'open'`
- The ID is automatically derived from the parent dialog's ID (e.g., `cngx-dialog-0-title`)

---

### CngxDialogDescription

Marks an element as the dialog's description for ARIA.

#### Import

```typescript
import { CngxDialogDescription } from '@cngx/common/dialog';
```

#### Signals (read-only)

- `id: Signal<string>` — Auto-generated unique ID, used by the parent dialog for `aria-describedby`.

#### Example

```typescript
<dialog cngxDialog>
  <h2 cngxDialogTitle>Delete item?</h2>
  <p cngxDialogDescription>This action cannot be undone.</p>
</dialog>
```

---

### CngxDialogClose

Trigger for closing or dismissing the dialog.

#### Import

```typescript
import { CngxDialogClose } from '@cngx/common/dialog';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxDialogClose` | `unknown` | `undefined` | Value to pass to `close()`. When `undefined`, calls `dismiss()` instead. |
| `cngxDialogCloseLabel` | `string \| undefined` | `undefined` | Explicit `aria-label` override. When not set, auto-detects if the host text is descriptive. |

#### Behavior

- With a value: `[cngxDialogClose]="'confirmed'"` calls `dialogRef.close('confirmed')`
- Without a value: `cngxDialogClose` (static attribute) calls `dialogRef.dismiss()`
- Auto-sets `type="button"` on `<button>` hosts to prevent accidental form submission
- Auto-sets `aria-label="Close dialog"` for icon-only buttons

#### Example

```typescript
<dialog cngxDialog>
  <button [cngxDialogClose]="false">Cancel</button>
  <button [cngxDialogClose]="true">Confirm</button>
  <button cngxDialogClose aria-label="Close">
    <i class="icon-x"></i>
  </button>
</dialog>
```

---

## Accessibility

Dialog is fully WCAG 2.1 Level AA compliant:

- **ARIA labelling**: `aria-labelledby` + `aria-describedby` always set (Title + Description)
- **ARIA modal**: `aria-modal="true"` on modal dialogs
- **Keyboard navigation**: Escape dismisses; `CngxFocusTrap` recommended for modals
- **Focus management**: Focus returns to trigger element on close
- **SR announcements**: Title announced on open; errors announced via live region
- **Semantic HTML**: Uses native `<dialog>` element (full browser support)

---

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

---

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

---

## CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-dialog-backdrop-opacity` | `'0'` (when not topmost) | Managed by `CngxDialogStack` for stacked modals |
| `--cngx-dialog-x` | `'0px'` | Horizontal offset (set by `CngxDialogDraggable`) |
| `--cngx-dialog-y` | `'0px'` | Vertical offset (set by `CngxDialogDraggable`) |
| `--cngx-dialog-drag-cursor` | `'grab'` | Cursor when hovering drag handle |
| `--cngx-dialog-dragging-cursor` | `'grabbing'` | Cursor while dragging |

---

## Material Theme

A Material theme mixin is available in `dialog-theme.scss`:

```scss
@use '@cngx/common/dialog/dialog-theme' as dialog;

html {
  @include dialog.theme($theme);
}
```

Sets backdrop, border-radius, padding, surface colors, and shadow from the Material palette. Supports both M2 and M3 themes. Includes a `density($level)` mixin for compact/default/comfortable spacing.

---

## See Also

- [CngxBottomSheet](../bottom-sheet/README.md) — Bottom sheet variant
- [CngxDialogDraggable](../draggable/README.md) — Drag behavior
- [CngxFocusTrap](../../a11y/src/focus/README.md) — Focus trap for modals
- [CngxFocusRestore](../../a11y/src/focus/README.md) — Focus restoration
- [CngxAutofocus](../../a11y/src/focus/README.md) — Autofocus on insertion
- Compodoc API documentation: `npm run docs:serve`
