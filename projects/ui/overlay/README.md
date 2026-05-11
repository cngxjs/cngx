# CngxOverlay

Typed wrapper service over Angular CDK Overlay with typed result streams.

## Import

```typescript
import { CngxOverlay, provideOverlay } from '@cngx/ui/overlay';
```

## Quick Start

```typescript
import { Component, inject } from '@angular/core';
import { CngxOverlay, provideOverlay } from '@cngx/ui/overlay';

@Component({
  selector: 'app-example',
  template: `
    <button (click)="openDialog()">Open Dialog</button>
  `,
  providers: [provideOverlay()],
})
export class ExampleComponent {
  private readonly overlay = inject(CngxOverlay);

  openDialog(): void {
    const ref = this.overlay.open(MyDialogComponent, { hasBackdrop: true });
    ref.afterClosed$.subscribe((result) => {
      console.log('Dialog closed with:', result);
    });
  }
}
```

## Overview

`CngxOverlay` is a thin, type-safe service wrapper over Angular CDK Overlay. It simplifies the component attachment pattern and provides a typed result stream via `CngxOverlayRef<R>`.

Key features:
- **Type-safe result streams** — `CngxOverlayRef<R>` with generic result type
- **Sensible defaults** — Centered backdrop by default; customize via CDK `OverlayConfig`
- **Simple API** — `open(component, config)` and `close(result)`
- **Backdrop dismiss** — Auto-closes on backdrop click (configurable)

## API

### CngxOverlay Service

#### Methods

- **`open<C, R>(component: Type<C>, config?: CngxOverlayConfig): CngxOverlayRef<R>`**
  - Opens `component` in a CDK overlay panel and returns a typed ref.
  - `component` — Component class to attach as a portal.
  - `config` — Optional CDK overlay configuration (merged with defaults).
  - Returns `CngxOverlayRef<R>` — Typed reference with `afterClosed$` stream.

### CngxOverlayRef

Typed wrapper around CDK `OverlayRef`. Passed to the component instance via DI and `afterClosed$` Observable.

#### Signals
None — this is a simple wrapper.

#### Properties

- **`afterClosed$: Observable<R | undefined>`** — Emits once with the close result when the overlay is dismissed, then completes.

#### Methods

- **`close(result?: R): void`** — Closes the overlay, emits `result` on `afterClosed$`, then disposes the CDK ref.

### provideOverlay

Standalone provider function:

```typescript
provideOverlay(): EnvironmentProviders
```

Returns an `EnvironmentProviders` that registers `CngxOverlay` as an injectable service. Use in `bootstrapApplication` providers or component-scoped `providers`.

## Configuration

`CngxOverlayConfig` is a type alias for the CDK `OverlayConfig` object. Supported options:

```typescript
type CngxOverlayConfig = Partial<OverlayConfig>;

// Example:
const ref = overlay.open(MyComponent, {
  hasBackdrop: true,
  backdropClass: 'my-backdrop',
  panelClass: 'my-panel',
  maxHeight: '80vh',
  width: '600px',
  positionStrategy: overlay.position().global().centerHorizontally(),
  scrollStrategy: overlay.scrollStrategies.block(),
});
```

Default behavior:
- `hasBackdrop: true`
- `positionStrategy: global().centerHorizontally().centerVertically()`
- All other CDK defaults

## Accessibility

`CngxOverlay` provides the CDK overlay service and component portal attachment. Accessibility is the responsibility of the overlay component:

- **Focus trap** — Use CDK's `cdkTrapFocus` on your overlay content
- **Backdrop dismissal** — Backdrop click auto-closes; use `closeOnBackdropClick` in your component
- **Focus restoration** — Store focus before opening, restore on close (standard pattern)
- **ARIA roles** — Overlay component must declare `role="dialog"`, `role="menu"`, etc.

## Composition

`CngxOverlay` composes:

- **CDK Overlay service** — Position strategies, scroll strategies, portal attachment
- **ComponentPortal** — Attaches components to the overlay DOM
- **Injector.create** — Creates a child injector with the overlay ref available to the component

## Examples

### Basic Overlay (Modal)

```typescript
@Component({
  selector: 'app-dialog',
  template: `
    <div role="dialog" (click)="close()">
      <h2>Confirm Action</h2>
      <p>Are you sure?</p>
      <button (click)="close(true)">Yes</button>
      <button (click)="close(false)">No</button>
    </div>
  `,
})
class ConfirmDialog {
  constructor(private readonly ref = inject(CngxOverlayRef<boolean>)) {}

  close(result: boolean): void {
    this.ref.close(result);
  }
}

// Usage
const ref = overlay.open<ConfirmDialog, boolean>(ConfirmDialog);
ref.afterClosed$.subscribe((confirmed) => {
  if (confirmed) {
    this.deleteItem();
  }
});
```

### Menu Overlay

```typescript
@Component({
  selector: 'app-dropdown-menu',
  template: `
    <ul role="menu" (click)="handleMenuClick($event)">
      <li role="menuitem">Profile</li>
      <li role="menuitem">Settings</li>
      <li role="menuitem">Logout</li>
    </ul>
  `,
})
class DropdownMenu {
  constructor(private readonly ref = inject(CngxOverlayRef<string>)) {}

  handleMenuClick(event: Event): void {
    const target = event.target as HTMLElement;
    this.ref.close(target.textContent?.toLowerCase());
  }
}
```

### Notification Overlay (Top-Right)

```typescript
const ref = overlay.open(NotificationComponent, {
  hasBackdrop: false,
  positionStrategy: overlay
    .position()
    .global()
    .right('20px')
    .top('20px'),
  width: '400px',
});

ref.afterClosed$.subscribe(() => {
  console.log('Notification dismissed');
});
```

### Centered Panel with Size

```typescript
const ref = overlay.open<MyPanelComponent, MyResult>(MyPanelComponent, {
  hasBackdrop: true,
  backdropClass: 'dimmed-backdrop',
  width: '90vw',
  maxWidth: '800px',
  maxHeight: '90vh',
  panelClass: 'custom-panel',
});

ref.afterClosed$.subscribe((result) => {
  // Process result
});
```

## Type Safety

The generic type parameters on `open` provide compile-time type checking:

```typescript
// Result type is inferred from the second generic
const ref = overlay.open<MyComponent, MyResultType>(MyComponent);

// ref.afterClosed$ is Observable<MyResultType | undefined>
ref.afterClosed$.subscribe((result: MyResultType | undefined) => {
  // TS knows result type here
});
```

## See Also

- [Angular CDK Overlay](https://material.angular.io/cdk/overlay/overview) — The underlying service
- [compodoc API documentation](../../../../../docs)
- Demo: `dev-app/src/app/demos/ui/overlay-demo/`
- Tests: `projects/ui/overlay/src/*.spec.ts`
