# Gestures

Pointer-based gesture detection directives.

- `CngxLongPress` - press-and-hold detection.
- `CngxSwipe` - directional swipe for **navigation**. Emits the resolved direction, so a single host drives bidirectional flows (carousels, paged views, prev/next steppers). Pin it to one axis via `axis`.
- `CngxSwipeDismiss` - single-direction swipe for **dismiss** actions (drawers, bottom sheets, dismissible cards). Emits a bare `swiped` when its one fixed direction passes the threshold.

Pick by intent: navigate between siblings -> `CngxSwipe`; remove/close the element -> `CngxSwipeDismiss`.

## Import

```typescript
import { CngxLongPress, CngxSwipe, CngxSwipeDismiss, type SwipeDirection } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxLongPress, CngxSwipeDismiss } from '@cngx/common/interactive';

@Component({
  selector: 'app-gestures',
  template: `
    <!-- Long press context menu -->
    <div cngxLongPress (longPressed)="showContextMenu($event)">
      Long press me for options
    </div>

    <!-- Swipe to dismiss -->
    <div cngxSwipeDismiss="left" (swiped)="dismiss()">
      Swipe left to dismiss
    </div>
  `,
  imports: [CngxLongPress, CngxSwipeDismiss],
})
export class GesturesComponent {
  showContextMenu(event: PointerEvent) {
    console.log('Context menu at', event.clientX, event.clientY);
  }

  dismiss() {
    console.log('Dismissed');
  }
}
```

## Accessibility

Both gesture directives are low-level interaction atoms:

- **ARIA roles:** None (gestures are supplementary interactions)
- **Keyboard interaction:** none. The directives listen to pointer events only.
  - Long press: the consumer owns the keyboard path (a button, a menu entry or a key binding, see [Keyboard alternative](#accessibility-first-keyboard-alternative)).
  - Swipe and swipe-dismiss: WCAG 2.5.1 (Pointer Gestures) needs a single-pointer and keyboard alternative, and providing it is the consumer's job: a visible dismiss button next to a swipe-dismiss surface, prev/next buttons next to a swipe carousel.
- **Screen reader:**
  - Announce the action (e.g., "Press and hold for options") via visible text or aria-label
  - Gesture-triggered actions should announce their result via toast/alert
- **Focus management:**
  - Both directives preserve focus on the element
  - No focus traps or modal management

## Inputs

Gestures start on the primary button only (`button === 0`). Setting `enabled` to `false` mid-gesture cancels it: long press drops the timer, swipe stops reporting moves and settles without emitting.

### CngxLongPress

| Input | Type | Default | |
|-|-|-|-|
| `threshold` | `number` | `500` | Hold time in ms before `longPressed` fires. |
| `moveThreshold` | `number` | `10` | Pointer movement in px that cancels the press. |
| `enabled` | `boolean` | `true` | Turns the directive off; `false` mid-press cancels. |

A press also cancels on pointer up, `pointercancel` and `pointerleave`. After a completed long press the pointer `click` that follows the release is cancelled on the host, so a host `(click)` does not run on top of the long-press action. A short tap clicks as usual; keyboard and programmatic clicks (`detail === 0`) are never cancelled.

### CngxSwipe

| Input | Type | Default | |
|-|-|-|-|
| `threshold` | `number` | `50` | Distance in px on the dominant axis to register a swipe. |
| `axis` | `'x' \| 'y' \| 'both'` | `'both'` | Axis the gesture registers on; also sets `touch-action` (`pan-y`, `pan-x`, `none`). |
| `enabled` | `boolean` | `true` | Turns the directive off; `false` mid-drag cancels. |

### CngxSwipeDismiss

| Input | Type | Default | |
|-|-|-|-|
| `cngxSwipeDismiss` | `'left' \| 'right' \| 'up' \| 'down'` | required | The one direction that dismisses. |
| `threshold` | `number` | `50` | Distance in px to register a completed swipe. |
| `enabled` | `boolean` | `true` | Turns the directive off; `false` mid-drag cancels. |

### Directions are physical

`swiped` reports physical directions: `left` is always a leftward drag, regardless of `dir`. A consumer that maps a swipe to next/previous flips the mapping under `rtl`, as the stepper's `CngxStepperSwipeNav` does with `injectDirection()` from `@cngx/core` (forward is `left` under `ltr`, `right` under `rtl`).

## Composition

Gestures are orthogonal interaction atoms:

- **Host directives:** None
- **Combines with:** Any element needing gesture interaction (lists, cards, overlays)
- **Provides:** Pointer event streams converted to high-level gesture signals

### Example: Composition Pattern

```typescript
// List item with context menu on long press
<div cngxLongPress #lp="cngxLongPress"
     (longPressed)="showContextMenu($event)"
     [class.holding]="lp.longPressing()">
  List item
</div>

// Dismissible notification with swipe
<div cngxSwipeDismiss="left" #swipe="cngxSwipeDismiss"
     (swiped)="closeNotification()"
     [style.opacity]="1 - swipe.swipeProgress()">
  Swipe to dismiss
</div>
```

## Styling

### CngxLongPress

No built-in styling. Use the `longPressing()` signal for visual feedback:

```scss
div {
  transition: background-color 0.2s;
}

div.holding {
  background-color: var(--color-active);
}
```

Or bind directly to the signal:

```html
<div cngxLongPress #lp="cngxLongPress"
     [class.holding]="lp.longPressing()">
  Long press me
</div>

<style>
  .holding { background: rgba(0, 0, 0, 0.1); }
</style>
```

### CngxSwipeDismiss

Use the `swipeProgress()` signal for real-time visual feedback during the swipe:

```html
<div cngxSwipeDismiss="left" #swipe="cngxSwipeDismiss"
     [style.transform]="'translateX(-' + (swipe.swipeProgress() * 100) + '%)'">
  Swipe left to dismiss
</div>

<style>
  div {
    transition: transform 0.3s ease-out;
  }
</style>
```

### CngxSwipe

`swipeProgress()` and `swipeDirection()` drive mid-gesture feedback - nudge
the panel toward the incoming slide while the finger is down:

```html
<section cngxSwipe axis="x" #s="cngxSwipe"
     (swiped)="onSwipe($event)"
     [style.transform]="'translateX(' + (s.swipeDirection() === 'left' ? -1 : 1) * s.swipeProgress() * 12 + 'px)'">
  Swipe left or right
</section>

<style>
  section { transition: transform 0.2s ease-out; }
</style>
```

## Examples

### Long Press Context Menu

`cngxLongPress` reacts to the primary button only, so a right-click never
fires `longPressed`. Bind `(contextmenu)` next to it for the mouse path:

```typescript
<div cngxLongPress (longPressed)="openMenu($event)"
     (contextmenu)="$event.preventDefault(); openMenu($event)">
  Right-click or long-press for options
</div>

@if (menuOpen()) {
  <div class="context-menu" [style.top.px]="menuY()" [style.left.px]="menuX()">
    <button (click)="delete()">Delete</button>
    <button (click)="edit()">Edit</button>
    <button (click)="share()">Share</button>
  </div>
}

openMenu(event: MouseEvent) {
  this.menuX.set(event.clientX);
  this.menuY.set(event.clientY);
  this.menuOpen.set(true);
}
```

### Visual Feedback During Long Press

```typescript
<div cngxLongPress #lp="cngxLongPress"
     (longPressed)="handleLongPress()"
     [class.pressed]="lp.longPressing()">
  Hold for action
  @if (lp.longPressing()) {
    <div class="progress-indicator" />
  }
</div>

<style>
  .pressed {
    background: rgba(0, 0, 0, 0.1);
    scale: 0.98;
  }

  .progress-indicator {
    position: absolute;
    width: 100%;
    height: 4px;
    bottom: 0;
    background: linear-gradient(90deg, var(--color) var(--progress%), transparent var(--progress%));
    animation: progress linear 0.5s;
  }
</style>
```

### Dismissible Notification with Swipe

```typescript
<div cngxSwipeDismiss="left" #swipe="cngxSwipeDismiss"
     (swiped)="dismiss()"
     [class.swiping]="swipe.swiping()"
     [style.opacity]="1 - (swipe.swipeProgress() * 0.3)"
     [style.transform]="'translateX(-' + (swipe.swipeProgress() * 100) + '%)'">
  <span>Notification message</span>
  @if (!swipe.swiping()) {
    <span class="hint">Swipe left to dismiss</span>
  }
</div>
<button type="button" (click)="dismiss()">Dismiss</button>

<style>
  div {
    transition: opacity 0.2s, transform 0.2s;
    will-change: transform, opacity;
  }

  div.swiping {
    transition: none;
  }
</style>
```

### Carousel with Swipe Navigation

Use `CngxSwipe`, not `CngxSwipeDismiss`: navigation is not a dismiss. One
host reports the direction in the event, so it covers both ways. Pin it to
the x-axis so a vertical scroll never registers as a slide change. The
mapping below is for `ltr`; flip it under `rtl` (see
[Directions are physical](#directions-are-physical)). Keep prev/next buttons
as the single-pointer and keyboard path.

```typescript
readonly index = signal(0);
readonly slides = ['Slide 1', 'Slide 2', 'Slide 3'];

<section cngxSwipe axis="x" (swiped)="onSwipe($event)">
  {{ slides[index()] }}
</section>
<button type="button" (click)="onSwipe('right')">Previous</button>
<button type="button" (click)="onSwipe('left')">Next</button>

onSwipe(direction: SwipeDirection) {
  if (direction === 'left') {
    this.index.update(i => Math.min(i + 1, this.slides.length - 1));
  } else if (direction === 'right') {
    this.index.update(i => Math.max(i - 1, 0));
  }
}
```

### Bottom Sheet with Swipe Dismiss

```typescript
<div cngxSwipeDismiss="down" #swipe="cngxSwipeDismiss"
     (swiped)="closeBottomSheet()"
     [class.swiping]="swipe.swiping()"
     [style.transform]="'translateY(' + (swipe.swipeProgress() * 100) + '%)'">
  <div class="sheet-header">
    <div class="drag-handle" />
    <h2>Options</h2>
  </div>
  <div class="sheet-content">
    <!-- content -->
  </div>
</div>
<button type="button" (click)="closeBottomSheet()">Close</button>

<style>
  div {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  div.swiping {
    transition: none;
  }

  .drag-handle {
    width: 40px;
    height: 4px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }
</style>
```

### Long Press to Select

```typescript
readonly selectedItems = signal<string[]>([]);

<div cngxLongPress #lp="cngxLongPress"
     (longPressed)="toggleSelection(id)"
     [class.selected]="isSelected(id)"
     [class.holding]="lp.longPressing()">
  Item {{ id }}
</div>

toggleSelection(id: string) {
  this.selectedItems.update(items =>
    items.includes(id)
      ? items.filter(i => i !== id)
      : [...items, id]
  );
}

isSelected(id: string) {
  return this.selectedItems().includes(id);
}

<style>
  .holding {
    background: rgba(0, 0, 0, 0.05);
  }

  .selected {
    background: var(--color-primary);
    color: white;
  }
</style>
```

### Accessibility-First: Keyboard Alternative

```typescript
// Provide keyboard shortcut as alternative to gesture
<div cngxLongPress #lp="cngxLongPress"
     [cngxKeyboardShortcut]="'m'"
     (longPressed)="openMenu()"
     (shortcutTriggered)="openMenu()"
     role="button"
     tabindex="0"
     aria-label="Open menu (press M or long-press)">
  Long press or press M for menu
</div>
```

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/gestures/)
- [CngxKeyboardShortcut](../keyboard/) - Pair with gestures for keyboard alternatives
- Demo: `examples/stories/common/interactive/gestures/`
- Tests: `projects/common/interactive/gestures/long-press.directive.spec.ts`
