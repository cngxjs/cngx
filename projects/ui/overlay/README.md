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
  template: ` <button (click)="openDialog()">Open Dialog</button> `,
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
