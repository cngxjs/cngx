# Draggable Dialog

Opt-in drag behavior for dialogs. Exposes position as CSS custom properties and includes keyboard-based movement for accessibility.

## Directive

### CngxDialogDraggable

Applied to `[cngxDialog]` elements to enable pointer-based drag and keyboard-based movement. Position is exposed via CSS custom properties `--cngx-dialog-x` and `--cngx-dialog-y`.

#### Import

```typescript
import { CngxDialogDraggable } from '@cngx/common/dialog';
```

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `handle` | `HTMLElement \| undefined` | `undefined` | Explicit drag handle element. When not set, the entire dialog is draggable. |
| `constrainToViewport` | `boolean` | `false` | Clamp position to viewport bounds (prevents dragging off-screen). |
| `gridSize` | `number` | `0` | Grid snap size in pixels. When `0`, no snapping. Positive values snap to grid increments. |
| `snapMode` | `'live' \| 'release'` | `'live'` | When to apply grid snapping: `'live'` snaps during drag; `'release'` snaps on pointer up. |

#### Signals (read-only)

| Signal | Type | Description |
|-|-|-|
| `position` | `Signal<{x: number, y: number}>` | Current offset position in pixels. |
| `isDragging` | `Signal<boolean>` | Whether a drag operation is in progress. |

#### CSS Custom Properties Set

- `--cngx-dialog-x` — Horizontal offset in pixels (e.g., `10px`)
- `--cngx-dialog-y` — Vertical offset in pixels (e.g., `10px`)

#### CSS Classes

| Class | When Applied |
|-|-|
| `cngx-dialog--dragging` | During active pointer drag |

#### Example

```typescript
// Basic draggable dialog
<dialog cngxDialog cngxDialogDraggable
        [style.transform]="'translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px))'"
        #dlg="cngxDialog">
  <h2 cngxDialogTitle>Draggable</h2>
  <p>Drag this dialog around.</p>
  <button [cngxDialogClose]="true">Close</button>
</dialog>

// With explicit drag handle
<dialog cngxDialog cngxDialogDraggable [handle]="header" #dlg="cngxDialog">
  <header #header>Title</header>
  <p>Content</p>
</dialog>

// With grid snapping
<dialog cngxDialog cngxDialogDraggable [gridSize]="10" [snapMode]="'release'">
  <h2>Snap to grid</h2>
</dialog>
```

---

## Pointer Interaction

### Mouse Drag

- Primary button (left click) initiates drag
- Position updates on every pointer move
- Text selection is prevented during drag
- Cursor changes from `grab` to `grabbing` during drag

### Touch Drag

- Touch down initiates drag
- Supports multi-touch scenarios (uses pointer capture)
- Works on all touch devices

### Drag Handle

When `[handle]` is specified:

- Only the handle element initiates drag (not the entire dialog)
- Interactive elements inside the handle (`<button>`, `<a>`, `<input>`) are not dragged
- Automatically made focusable (`tabindex="0"`) if not already interactive
- Marked with `aria-roledescription="draggable"` and `aria-label="Move dialog"`

---

## Keyboard Interaction

Arrow keys move the dialog (mandatory for accessibility):

- `Arrow Left` — Move 10px left (or grid size left)
- `Arrow Right` — Move 10px right (or grid size right)
- `Arrow Up` — Move 10px up (or grid size up)
- `Arrow Down` — Move 10px down (or grid size down)
- `Shift + Arrow` — Move 50px (or 5x grid size)
- `Home` — Reset to origin (0, 0)

Grid size affects arrow key stepping: when grid is active, arrows step by the grid size (or 5x with Shift).

---

## CSS Integration

Apply the position via `transform`:

```scss
dialog[cngxDialogDraggable] {
  // Apply the CSS custom properties from the directive
  transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));

  // Optional: smooth transition when not dragging
  transition: transform 0.1s ease-out;

  &.cngx-dialog--dragging {
    // No transition during drag (allow instant feedback)
    transition: none;
  }
}

// Optional: drag handle styling
dialog[cngxDialogDraggable] > header {
  cursor: var(--cngx-dialog-drag-cursor, grab);

  dialog[cngxDialogDraggable].cngx-dialog--dragging & {
    cursor: var(--cngx-dialog-dragging-cursor, grabbing);
  }
}
```

---

## Accessibility

Dialog dragging is fully keyboard-accessible:

- **Focus management**: Handle element is focusable (`tabindex="0"`)
- **ARIA labels**: Handle is marked with `aria-roledescription="draggable"` and `aria-label="Move dialog"`
- **Keyboard movement**: Arrow keys provide full control (10px steps, 50px with Shift, Home to reset)
- **Touch support**: Pointer Events handle both mouse and touch uniformly
- **Focus visible**: Keyboard focus shows on the drag handle with visible outline (CSS responsibility)

---

## Advanced Patterns

### Grid Snapping

```typescript
// Snap to 16px grid during drag (live mode)
<dialog cngxDialog cngxDialogDraggable [gridSize]="16" snapMode="'live'">
  …
</dialog>

// Snap to 20px grid on release (free drag, then snap)
<dialog cngxDialog cngxDialogDraggable [gridSize]="20" snapMode="'release'">
  …
</dialog>
```

### Viewport Constraints

```typescript
// Prevent dragging off-screen
<dialog cngxDialog cngxDialogDraggable [constrainToViewport]="true">
  …
</dialog>
```

### Separate Handle Element

```typescript
<dialog cngxDialog cngxDialogDraggable [handle]="titleBar" #dlg="cngxDialog">
  <header #titleBar>
    <h2 cngxDialogTitle>Title</h2>
    <button [cngxDialogClose]="false">Close</button>
  </header>
  <div>Content</div>
</dialog>
```

The handle is automatically focusable and keyboard-navigable, but buttons inside remain interactive.

### Programmatic Position Reset

```typescript
protected readonly draggable = viewChild(CngxDialogDraggable);

resetPosition(): void {
  // Simulate Home key
  const evt = new KeyboardEvent('keydown', { key: 'Home' });
  this.draggable()?.nativeElement.dispatchEvent(evt);
}
```

---

## Performance

- Drag events use native Pointer Events (not Angular change detection)
- Position updates are synchronous (no debouncing)
- CSS `transform` is GPU-accelerated (preferred over position changes)
- `user-select: none` is applied during drag to prevent text selection

---

## Styling Example

```scss
dialog[cngxDialog][cngxDialogDraggable] {
  // Base position
  transform: translate(var(--cngx-dialog-x, 0px), var(--cngx-dialog-y, 0px));

  // Smooth exit transitions (not during drag)
  &:not(.cngx-dialog--dragging) {
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  // Handle styling
  > .dialog-header {
    padding: 16px;
    background: var(--dialog-header-bg, #f5f5f5);
    cursor: var(--cngx-dialog-drag-cursor, grab);
    display: flex;
    align-items: center;
    justify-content: space-between;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    button {
      cursor: pointer;
    }
  }

  // Dragging state
  &.cngx-dialog--dragging > .dialog-header {
    cursor: var(--cngx-dialog-dragging-cursor, grabbing);
    background: var(--dialog-header-active-bg, #efefef);
  }

  // Content area
  > .dialog-content {
    padding: 16px;
    overflow-y: auto;
    max-height: 60vh;
  }
}
```

---

## See Also

- [CngxDialog](../dialog/README.md) — Base dialog directive
- [CngxBottomSheet](../bottom-sheet/README.md) — Bottom sheet (typically not draggable)
- Compodoc API documentation: `npm run docs:serve`
