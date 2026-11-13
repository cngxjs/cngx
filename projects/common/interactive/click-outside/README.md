# Click Outside

Emits when the user presses outside the host element. One document listener per instance, torn down with the directive. Reach for it to dismiss a dropdown, a panel or any surface that should close on an outside press.

The press that lands on the element controlling the host is not outside: when the nearest `[aria-controls]` ancestor of the target lists the host's `id`, nothing is emitted. Without this, the trigger's own press would close the panel and its click would open it again.

## Import

```typescript
import { CngxClickOutside } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { CngxClickOutside } from '@cngx/common/interactive';

@Component({
  selector: 'app-actions',
  template: `
    <button
      type="button"
      aria-controls="actions-panel"
      [attr.aria-expanded]="open()"
      (click)="open.set(!open())"
    >
      Actions
    </button>

    @if (open()) {
      <div
        id="actions-panel"
        cngxClickOutside
        (clickOutside)="open.set(false)"
        (keydown.escape)="open.set(false)"
      >
        <button type="button">Edit</button>
        <button type="button">Delete</button>
      </div>
    }
  `,
  imports: [CngxClickOutside],
})
export class ActionsComponent {
  protected readonly open = signal(false);
}
```

## API

- `[eventType]` (`'pointerdown' | 'click' | 'mousedown' | 'touchstart'`, default `'pointerdown'`) - the document event to listen for. `pointerdown` covers mouse, touch and pen.
- `[enabled]` (`boolean`, default `true`) - `false` stops emitting. Bind it to the open state when the host stays in the DOM while closed.
- `(clickOutside)` (`PointerEvent | MouseEvent | TouchEvent`) - the event whose target is outside the host.
- `exportAs: 'cngxClickOutside'`.

## Accessibility

- **ARIA roles:** None (behavioural).
- **Keyboard interaction:** None. An outside press is a pointer gesture, so pair it with a keyboard close path, usually `(keydown.escape)` on the host (WCAG 2.1.1).
- **Screen reader:** No announcements. The surface that closes announces its own state (`aria-expanded` on the trigger).
- **Focus management:** None. Restoring focus to the trigger after a close is the consumer's job.

## Composition

- **Host directives:** None. Composed as a host directive by `CngxDrawerSurface`, which drives it from its own state.
- **Combines with:** popovers, menus, drawers, any dismissible surface.
- **Provides:** No public tokens.

### Example: Composition Pattern

```html
<!-- Host stays in the DOM: gate it with [enabled] -->
<button type="button" aria-controls="filters" (click)="open.set(!open())">Filters</button>

<aside
  id="filters"
  cngxClickOutside
  [enabled]="open()"
  [hidden]="!open()"
  (clickOutside)="open.set(false)"
  (keydown.escape)="open.set(false)"
>
  ...
</aside>
```

## Styling

No built-in styling.

## Examples

### Listen for click instead of pointerdown

```html
<div cngxClickOutside [eventType]="'click'" (clickOutside)="dismiss()">...</div>
```

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/click-outside/)
- [Keyboard interactions](../keyboard/) - `CngxKeyboardShortcut`, hotkey registry, `CngxSearch`
- [Drawer](../../layout/drawer/) - composes `CngxClickOutside` through `CngxDrawerSurface`
- Demo: `examples/stories/common/interactive/gestures/click-outside/`
- Tests: `projects/common/interactive/click-outside/click-outside.directive.spec.ts`
- [WCAG 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
