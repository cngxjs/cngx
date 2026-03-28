# @cngx/common/dialog

Signal-driven dialog system built on the native `<dialog>` element.

## Overview

`@cngx/common/dialog` provides a complete dialog solution that wraps the browser's
native `<dialog>` element with a reactive Signal state machine, typed results,
deterministic focus management, animated open/close transitions, nested dialog
stacking, drag support, and full ARIA communication.

The system works in two modes:

- **Declarative** -- place `<dialog cngxDialog>` directly in your template. Use
  `#dlg="cngxDialog"` to get a typed reference. No service, no imperative
  boilerplate.
- **Programmatic** -- call `CngxDialogOpener.open(Component, config)` for
  dynamic component rendering. Compatible with `MatDialog` migration patterns.

Every dialog transitions through a four-state lifecycle:
`closed` -> `opening` -> `open` -> `closing` -> `closed`.
Each state is a Signal, each transition is deterministic, and CSS classes are
applied at every stage so animations work without JavaScript timing hacks.

No `@angular/material` dependency. No CDK overlay. Pure native `<dialog>`.

## Declarative Usage

### Simple confirmation

```html
<dialog cngxDialog #dlg="cngxDialog">
  <h2 cngxDialogTitle>Delete item?</h2>
  <p cngxDialogDescription>This action cannot be undone.</p>
  <button [cngxDialogClose]="false">Cancel</button>
  <button [cngxDialogClose]="true">Delete</button>
</dialog>

<button (click)="dlg.open()">Delete</button>

@if (dlg.result() === true) {
  <p>Item deleted.</p>
}
```

### Alert dialog (no dismiss)

```html
<dialog cngxDialog [closeOnBackdropClick]="false" [closeOnEscape]="false" #alert="cngxDialog">
  <h2 cngxDialogTitle>Session expired</h2>
  <p cngxDialogDescription>Please sign in again.</p>
  <button [cngxDialogClose]="'ok'">Sign in</button>
</dialog>
```

### Form dialog

```html
<dialog cngxDialog #formDlg="cngxDialog">
  <h2 cngxDialogTitle>Edit profile</h2>
  <form (ngSubmit)="formDlg.close(profileForm.value)">
    <input [(ngModel)]="name" name="name" />
    <button type="submit">Save</button>
    <button type="button" cngxDialogClose>Cancel</button>
  </form>
</dialog>

<button (click)="formDlg.open()">Edit</button>
```

### Reading the result reactively

```typescript
readonly profileResult = computed(() => {
  const r = this.formDlg.result();
  return r !== undefined && r !== 'dismissed' ? r : null;
});
```

## Programmatic Usage

For dynamic component dialogs, use `CngxDialogOpener`.

### Setup

```typescript
// app.config.ts
import { provideDialog } from '@cngx/common/dialog';

export const appConfig: ApplicationConfig = {
  providers: [provideDialog()],
};
```

### Opening a dialog

```typescript
import { CngxDialogOpener, CNGX_DIALOG_DATA, DIALOG_REF, type DialogRef } from '@cngx/common/dialog';

// Caller
class MyComponent {
  private readonly dialog = inject(CngxDialogOpener);

  openEditor(): void {
    const ref = this.dialog.open<User>(EditUserDialog, {
      data: { userId: 123 },
    });

    ref.afterClosed().subscribe(result => {
      if (result !== 'dismissed') {
        this.saveUser(result);
      }
    });
  }
}

// Dialog content component
class EditUserDialog {
  private readonly data = inject(CNGX_DIALOG_DATA) as { userId: number };
  private readonly dialogRef = inject(DIALOG_REF) as DialogRef<User>;

  save(user: User): void {
    this.dialogRef.close(user);
  }

  cancel(): void {
    this.dialogRef.dismiss();
  }
}
```

### Opening a template

```typescript
@ViewChild('tpl') tpl!: TemplateRef<unknown>;

open(): void {
  this.dialog.open(this.tpl, { data: { message: 'Hello' } });
}
```

### Comparison with MatDialog

| Concern | MatDialog | CngxDialogOpener |
|-|-|
| Provider | `provideDialog()` from `@angular/cdk/dialog` | `provideDialog()` from `@cngx/common/dialog` |
| Data token | `MAT_DIALOG_DATA` | `CNGX_DIALOG_DATA` |
| Ref token (inside dialog) | `MatDialogRef` (class injection) | `DIALOG_REF` (injection token) |
| Result type | `afterClosed(): Observable<T>` | `afterClosed(): Observable<T \| 'dismissed'>` + `result()` Signal |
| Lifecycle signal | none | `lifecycle()`: `DialogState` |
| Native element | CDK overlay `<div>` | Native `<dialog>` element |
| Dismiss vs close | both via `close()` | `close(value)` vs `dismiss()` -- typed distinction |

## Template Directives

### CngxDialogTitle

Marks an element as the dialog's title for `aria-labelledby`.
Auto-generates a deterministic ID. The title text is announced via
`aria-live` when the dialog transitions to `'open'`.

```html
<h2 cngxDialogTitle>Confirm Delete</h2>
```

Selector: `[cngxDialogTitle]` -- exportAs `"cngxDialogTitle"`

| Signal | Type | Description |
|-|-|-|
| `id` | `string` | Auto-generated ID, set as `[id]` on host |
| `textContent` | `string` | Trimmed text content of the element |

### CngxDialogDescription

Marks an element as the dialog's description for `aria-describedby`.
Auto-generates a deterministic ID.

```html
<p cngxDialogDescription>This action cannot be undone.</p>
```

Selector: `[cngxDialogDescription]` -- exportAs `"cngxDialogDescription"`

| Signal | Type | Description |
|-|-|-|
| `id` | `string` | Auto-generated ID, set as `[id]` on host |

### CngxDialogClose

Close trigger for a dialog. Place on any clickable element inside a dialog.
Automatically sets `type="button"` on `<button>` hosts to prevent form submission.

```html
<!-- Dismiss (no value) -->
<button cngxDialogClose>Cancel</button>

<!-- Close with a typed value -->
<button [cngxDialogClose]="true">Confirm</button>
<button [cngxDialogClose]="selectedItem">Select</button>
```

Selector: `[cngxDialogClose]` -- exportAs `"cngxDialogClose"`

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxDialogClose` | `unknown` | `undefined` | Value to pass to `close()`. When `undefined` or `''`, calls `dismiss()` instead |

## CngxDialog API

Selector: `dialog[cngxDialog]` -- exportAs `"cngxDialog"`

Implements `DialogRef<T>`. Provided as `DIALOG_REF` for child injection.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `modal` | `boolean` | `true` | Whether the dialog opens as modal (`showModal()`) or non-modal (`show()`) |
| `closeOnBackdropClick` | `boolean` | `true` | Whether clicking the backdrop dismisses the dialog (modal only) |
| `closeOnEscape` | `boolean` | `true` | Whether Escape dismisses the dialog (modal only) |
| `autoFocus` | `'first-focusable' \| 'none' \| string` | `'first-focusable'` | Focus strategy on open. CSS selector string focuses matching element |
| `focusFallback` | `HTMLElement \| undefined` | `undefined` | Fallback focus target when the trigger element is no longer in the DOM |

### Signals

| Signal | Type | Description |
|-|-|-|
| `lifecycle` | `DialogState` | Current lifecycle state: `'closed'`, `'opening'`, `'open'`, `'closing'` |
| `result` | `T \| 'dismissed' \| undefined` | `undefined` before close, `'dismissed'` on dismiss, `T` on close with value |
| `id` | `string` | Unique dialog instance ID (`cngx-dialog-0`, `cngx-dialog-1`, ...) |

### Methods

| Method | Signature | Description |
|-|-|-|
| `open` | `open(): void` | Open the dialog. Resets result from previous cycle. No-op if not `'closed'` |
| `close` | `close(value: T): void` | Close with a typed result. No-op if not `'open'` or `'opening'` |
| `dismiss` | `dismiss(): void` | Dismiss without result. Sets result to `'dismissed'` |

### CSS Classes

| Class | When |
|-|-|
| `cngx-dialog--opening` | Transitioning from closed to open |
| `cngx-dialog--open` | Fully open |
| `cngx-dialog--closing` | Transitioning from open to closed |
| `cngx-dialog--modal` | Opened as modal |

### ARIA

- `aria-modal="true"` when modal and not closed
- `aria-labelledby` bound to `CngxDialogTitle` ID (auto-wired via `contentChild`)
- `aria-describedby` bound to `CngxDialogDescription` ID (auto-wired via `contentChild`)
- Title text announced via `aria-live="polite"` region when dialog reaches `'open'` state
- Focus returned to trigger element on close (falls back to `focusFallback` input)

### Focus Management

- **Modal dialogs**: focus moves to the first focusable element (or `[autofocus]` element, or CSS selector target) after the `opening` -> `open` transition
- **`autoFocus="none"`**: focus is not moved -- useful when managing focus manually
- **On close**: focus returns to the element that was active when `open()` was called. If that element is no longer in the DOM, `focusFallback` is used instead

### Scroll Lock

Modal dialogs acquire a ref-counted scroll lock on `<html>` (sets `overflow: hidden; scrollbar-gutter: stable`).
Multiple concurrent modal dialogs coordinate -- the lock is only released when the last modal closes.

## CngxDialogOpener API

Must be provided via `provideDialog()`.

### Methods

| Method | Signature | Description |
|-|-|-|
| `open` | `open<T, D>(component: Type, config?: CngxDialogConfig<D>): CngxDialogRef<T>` | Open a component inside a dialog |
| `open` | `open<T, D>(templateRef: TemplateRef, config?: CngxDialogConfig<D>): CngxDialogRef<T>` | Open a template inside a dialog |
| `closeAll` | `closeAll(): void` | Dismiss all open programmatic dialogs |

### CngxDialogConfig

| Property | Type | Default | Description |
|-|-|-|-|
| `data` | `D` | `undefined` | Data injected via `CNGX_DIALOG_DATA` inside the dialog component |
| `modal` | `boolean` | `true` | Modal or non-modal |
| `closeOnBackdropClick` | `boolean` | `true` | Backdrop click dismisses |
| `closeOnEscape` | `boolean` | `true` | Escape key dismisses |
| `autoFocus` | `'first-focusable' \| 'none' \| string` | `'first-focusable'` | Focus strategy |

### Providers

| Function | Returns | Description |
|-|-|-|
| `provideDialog()` | `Provider[]` | Provides `CngxDialogOpener`. Call in `app.config.ts` or at route level |

## CngxDialogRef API

Returned by `CngxDialogOpener.open()`. Wraps the inner `DialogRef<T>` with
Observable convenience methods for migration compatibility.

### Properties

| Property | Type | Description |
|-|-|-|
| `lifecycle` | `Signal<DialogState>` | Current lifecycle state |
| `result` | `Signal<T \| 'dismissed' \| undefined>` | Typed result signal |
| `id` | `Signal<string>` | Unique dialog ID |
| `componentRef` | `ComponentRef<unknown> \| null` | Reference to the content component instance |

### Methods

| Method | Signature | Description |
|-|-|-|
| `close` | `close(value: T): void` | Close with a typed result |
| `dismiss` | `dismiss(): void` | Dismiss without result |
| `afterClosed` | `afterClosed(): Observable<T \| 'dismissed'>` | Emits once when the dialog reaches `'closed'` state |
| `afterOpened` | `afterOpened(): Observable<void>` | Emits once when the dialog reaches `'open'` state |

## Dialog Stack (Nesting)

`CngxDialogStack` is a root-provided service that tracks all open modal dialogs
as a stack. When multiple modal dialogs are open simultaneously, only the topmost
dialog shows its `::backdrop` -- all others have `--cngx-dialog-backdrop-opacity: 0`.

This prevents backdrop stacking (multiple overlapping semi-transparent layers
becoming opaque) without any consumer configuration.

```html
<!-- Dialog A opens Dialog B -->
<dialog cngxDialog #a="cngxDialog">
  <h2 cngxDialogTitle>Step 1</h2>
  <button (click)="b.open()">Next</button>
</dialog>

<dialog cngxDialog #b="cngxDialog">
  <h2 cngxDialogTitle>Step 2</h2>
  <button [cngxDialogClose]="'done'">Finish</button>
</dialog>
```

### CngxDialogStack API

Provided in root. No setup required.

| Member | Type | Description |
|-|-|-|
| `stack` | `Signal<readonly string[]>` | Current stack of dialog IDs (bottom to top) |
| `topmost` | `Signal<string \| null>` | ID of the topmost dialog, or `null` when empty |
| `push(id)` | `(id: string) => void` | Push a dialog onto the stack (called internally on open) |
| `pop(id)` | `(id: string) => void` | Remove a dialog from the stack (called internally on close) |

`provideDialogStack()` creates a scoped instance for isolated dialog stacking
within a subtree.

## Draggable

`CngxDialogDraggable` adds opt-in drag behavior to any `CngxDialog`. Position is
exposed as CSS custom properties `--cngx-dialog-x` and `--cngx-dialog-y` -- the
theme stylesheet applies the `transform` automatically.

```html
<dialog cngxDialog cngxDialogDraggable>
  <div class="dialog-header" #handle>Drag me</div>
  <!-- ... -->
</dialog>
```

With an explicit handle:

```html
<dialog cngxDialog cngxDialogDraggable [handle]="handle">
  <div #handle class="title-bar">Title</div>
  <div class="body">Content</div>
</dialog>
```

Selector: `[cngxDialogDraggable]` -- exportAs `"cngxDialogDraggable"`

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `handle` | `HTMLElement \| undefined` | `undefined` | Handle element for drag initiation. If not set, the entire dialog is the handle |
| `constrainToViewport` | `boolean` | `false` | Clamp position to viewport bounds during drag |
| `gridSize` | `number` | `0` | Snap position to a grid in pixels. `0` disables grid snap |
| `snapMode` | `'live' \| 'release'` | `'live'` | When to snap: `'live'` snaps during drag, `'release'` snaps on pointer up |

### Signals

| Signal | Type | Description |
|-|-|-|
| `position` | `{ x: number; y: number }` | Current offset position in px |
| `isDragging` | `boolean` | `true` while a drag operation is in progress |

### CSS Classes

| Class | When |
|-|-|
| `cngx-dialog--dragging` | Drag in progress (disables CSS transitions) |

### Keyboard Accessibility

The handle element automatically receives `tabindex="0"`,
`aria-roledescription="draggable"`, and `aria-label="Move dialog"`.

| Key | Action |
|-|-|
| Arrow keys | Move 10px (or `gridSize` px when grid is active) |
| Shift + Arrow keys | Move 50px (or `gridSize * 5` px when grid is active) |
| Home | Reset to origin (0, 0) |

Interactive elements inside the handle (buttons, links, inputs) are excluded
from drag initiation -- clicking them works normally.

## Bottom Sheet

`CngxBottomSheet` is a molecule directive that positions a `CngxDialog` at the
viewport bottom with a slide-up animation and an optional drag handle (rendered
via `::before` pseudo-element). When `CngxSwipeDismiss` is present on the same
element, swipe-to-dismiss is auto-wired -- no manual `(swiped)` binding needed.

```html
<dialog cngxDialog cngxBottomSheet [cngxSwipeDismiss]="'down'" #sheet="cngxDialog">
  <h2 cngxDialogTitle>Share</h2>
  <button [cngxDialogClose]="'copy'">Copy Link</button>
  <button [cngxDialogClose]="'email'">Email</button>
  <button cngxDialogClose>Cancel</button>
</dialog>

<button (click)="sheet.open()">Share</button>
```

Selector: `dialog[cngxBottomSheet]` -- exportAs `"cngxBottomSheet"`

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `showHandle` | `boolean` | `true` | Whether the drag handle bar is visible (rendered via `::before`) |

### CSS Custom Properties

Themed via `bottom-sheet-theme.scss` (`@include bottom-sheet.theme($theme)`):

| Property | Default | Description |
|-|-|-|
| `--cngx-bottom-sheet-radius` | `16px 16px 0 0` | Border radius (top corners only) |
| `--cngx-bottom-sheet-padding` | `24px` | Content padding |
| `--cngx-bottom-sheet-max-width` | `100%` | Maximum width |
| `--cngx-bottom-sheet-max-height` | `80vh` | Maximum height |
| `--cngx-bottom-sheet-handle-width` | `40px` | Handle bar width |
| `--cngx-bottom-sheet-handle-height` | `4px` | Handle bar height |
| `--cngx-bottom-sheet-handle-color` | `#ccc` | Handle bar color (M3: `--mat-sys-outline-variant`) |
| `--cngx-bottom-sheet-handle-radius` | `2px` | Handle bar border radius |
| `--cngx-bottom-sheet-handle-margin` | `0 auto 16px` | Handle bar margin |

## Non-Modal

Set `[modal]="false"` to open a non-modal dialog via the native `show()` method
instead of `showModal()`.

```html
<dialog cngxDialog [modal]="false" #tooltip="cngxDialog">
  <p>This is a non-modal popover.</p>
</dialog>
```

Differences from modal:

| Behavior | Modal | Non-modal |
|-|-|-|
| Backdrop | Yes (`::backdrop` pseudo-element) | No |
| Focus trap | Yes (browser-native) | No |
| Escape key | Fires `cancel` event (handled by `closeOnEscape`) | No `cancel` event |
| Scroll lock | Yes (ref-counted on `<html>`) | No |
| `aria-modal` | `"true"` | Not set |
| Focus management | `autoFocus` strategy applied | No automatic focus |
| Dialog stack | Registered in `CngxDialogStack` | Not registered |

## Theming

Include the theme mixin in your global stylesheet alongside your Material theme:

```scss
@use '@angular/material' as mat;
@use '@cngx/common/dialog/dialog-theme' as dialog;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include dialog.theme($theme);
}

// Dark mode
[data-theme='dark'] {
  @include mat.all-component-colors($dark-theme);
  @include dialog.theme($dark-theme);
}
```

### CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-dialog-backdrop-bg` | `rgba(0, 0, 0, 0.5)` | Backdrop background color |
| `--cngx-dialog-backdrop-blur` | `0px` | Backdrop blur amount |
| `--cngx-dialog-backdrop-opacity` | `1` | Backdrop opacity (managed by `CngxDialogStack` for nesting) |
| `--cngx-dialog-transition-duration` | `0.2s` | Open/close transition duration |
| `--cngx-dialog-transition-easing` | `ease` | Open/close transition easing |
| `--cngx-dialog-border-radius` | `8px` | Dialog border radius |
| `--cngx-dialog-padding` | `24px` | Dialog padding |
| `--cngx-dialog-max-width` | `560px` | Maximum dialog width |
| `--cngx-dialog-max-height` | `80vh` | Maximum dialog height |
| `--cngx-dialog-bg` | `#fff` | Dialog background (M3: `--mat-sys-surface-container-high`) |
| `--cngx-dialog-color` | `inherit` | Dialog text color (M3: `--mat-sys-on-surface`) |
| `--cngx-dialog-shadow` | `0 8px 32px rgba(0, 0, 0, 0.12)` | Dialog box shadow |
| `--cngx-dialog-drag-cursor` | `grab` | Cursor on drag handle |
| `--cngx-dialog-dragging-cursor` | `grabbing` | Cursor during active drag |

### Transition Animation

The theme applies open/close transitions via opacity and transform:

- **Opening**: `opacity: 0`, `translateY(8px) scale(0.98)` -> `opacity: 1`, `translateY(0) scale(1)`
- **Closing**: reverse of opening
- **Draggable**: `translate()` includes `--cngx-dialog-x/y` offsets at all stages
- **Dragging**: transitions disabled for smooth pointer tracking
- **Reduced motion**: all transitions disabled via `prefers-reduced-motion: reduce`

The `CngxDialog` directive detects CSS `transitionDuration` at close time. If a
transition is active, it enters the `'closing'` state and waits for `transitionend`
(with a fallback timeout) before finalizing. If no transition is set, finalization
is immediate.

## Migration from MatDialog

### Provider setup

```typescript
// Before (MatDialog)
import { provideDialog } from '@angular/cdk/dialog';

// After (CngxDialog)
import { provideDialog } from '@cngx/common/dialog';
```

### Opening a dialog

```typescript
// Before
const ref = this.matDialog.open(MyComponent, { data: { id: 1 } });
ref.afterClosed().subscribe(result => { ... });

// After
const ref = this.dialog.open<ResultType>(MyComponent, { data: { id: 1 } });
ref.afterClosed().subscribe(result => {
  if (result !== 'dismissed') { ... }
});
```

### Inside the dialog component

```typescript
// Before
class MyDialog {
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef);
  save() { this.ref.close(this.result); }
}

// After
class MyDialog {
  private readonly data = inject(CNGX_DIALOG_DATA);
  private readonly ref = inject(DIALOG_REF) as DialogRef<ResultType>;
  save() { this.ref.close(this.result); }
}
```

### Template close buttons

```html
<!-- Before -->
<button mat-dialog-close>Cancel</button>
<button [mat-dialog-close]="true">Confirm</button>

<!-- After -->
<button cngxDialogClose>Cancel</button>
<button [cngxDialogClose]="true">Confirm</button>
```

### Key differences

- `result()` is a Signal -- read it reactively without subscribing
- Dismiss and close are distinct. `'dismissed'` is an explicit value in the result union, not `undefined`
- `lifecycle()` Signal gives full lifecycle visibility (`opening`, `closing` states for animation)
- Declarative mode (`<dialog cngxDialog>`) requires zero service setup
- No CDK overlay -- uses native `<dialog>` for backdrop, focus trap, and top-layer stacking
- `[error]` input with `aria-invalid` and `cngx-dialog--error` class for form error states

## A11y Guidelines

### Close buttons

Icon-only close buttons (e.g. "X") must have an `aria-label`:

```html
<button cngxDialogClose aria-label="Close dialog">X</button>
```

### Non-modal dialogs

Non-modal dialogs (`[modal]="false"`) have no focus trap — screen readers are not
automatically informed that content appeared. Add an `aria-live` region near the
trigger so SR users know the dialog opened. A dev-mode warning is logged if no
`aria-live` sibling is detected.

### Multi-step content

`CngxDialog` moves focus once on open. If dialog content changes dynamically (e.g.
wizard steps, tab panels), the consumer is responsible for managing focus within the
dialog. Call `.focus()` on the first meaningful element of each step after the
content updates.

### Error state

Set `[error]="true"` to apply `cngx-dialog--error` and `aria-invalid="true"` on
the dialog host. Pair with `cngx-form-errors` (`role="alert"`) inside the dialog
for WCAG-compliant form error announcements:

```html
<dialog cngxDialog [error]="form.invalid && submitted" #dlg="cngxDialog">
  <cngx-form-errors [fields]="formFields" [show]="submitted" />
  <!-- form content -->
</dialog>
```

## Exports

```typescript
// Types
type DialogRef<T>
type DialogState   // 'closed' | 'opening' | 'open' | 'closing'
type CngxDialogConfig<D>

// Tokens
DIALOG_REF          // InjectionToken<DialogRef>
CNGX_DIALOG_DATA    // InjectionToken<unknown>

// Directives
CngxDialog              // dialog[cngxDialog]
CngxDialogTitle         // [cngxDialogTitle]
CngxDialogDescription   // [cngxDialogDescription]
CngxDialogClose         // [cngxDialogClose]
CngxDialogDraggable     // [cngxDialogDraggable]
CngxBottomSheet         // dialog[cngxBottomSheet]

// Services
CngxDialogOpener       // programmatic open/closeAll
CngxDialogStack         // nested dialog backdrop management

// Classes
CngxDialogRef<T>        // returned by CngxDialogOpener.open()

// Providers
provideDialog()         // provides CngxDialogOpener
provideDialogStack()    // provides scoped CngxDialogStack
```
