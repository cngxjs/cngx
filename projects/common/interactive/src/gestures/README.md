# Gestures: Long Press and Swipe

Pointer-based gesture detection directives.

## Import

```typescript
import { CngxLongPress, CngxSwipeDismiss, type SwipeDirection } from '@cngx/common/interactive';
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

## API

### CngxLongPress

Detects long-press gestures via Pointer Events.

#### Inputs

|-|-|-|-|
| cngxLongPress | — | — | Presence enables long-press detection (no value required) |
| threshold | number | 500 | Time in ms the pointer must be held to trigger |
| enabled | boolean | true | Whether the directive is active |
| moveThreshold | number | 10 | Maximum pointer movement in px before gesture is cancelled |

#### Outputs

|-|-|-|
| longPressed | PointerEvent | Emitted when a long-press gesture completes |

#### Signals

- `longPressing: Signal<boolean>` — True while a long-press gesture is building (pointer held, timer running)

### CngxSwipeDismiss

Detects directional swipe gestures via Pointer Events.

#### Inputs

|-|-|-|-|
| cngxSwipeDismiss | SwipeDirection | required | Direction of swipe: 'left' \| 'right' \| 'up' \| 'down' |
| threshold | number | 50 | Minimum distance in px to register as a completed swipe |
| enabled | boolean | true | Whether the directive is active |

#### Outputs

|-|-|-|
| swiped | void | Emitted when a swipe gesture completes past the threshold |

#### Signals

- `swiping: Signal<boolean>` — True while a swipe gesture is in progress
- `swipeProgress: Signal<number>` — Progress 0–1 (clamped) representing distance traveled

## Accessibility

Both gesture directives are low-level interaction atoms:

- **ARIA roles:** None (gestures are supplementary interactions)
- **Keyboard interaction:**
  - Long press: Can be triggered via keyboard if the element is focusable and the consumer adds keyboard event listeners
  - Swipe: No standard keyboard equivalent (native alternative: escape key to dismiss)
- **Screen reader:**
  - Announce the action (e.g., "Press and hold for options") via visible text or aria-label
  - Gesture-triggered actions should announce their result via toast/alert
- **Focus management:**
  - Both directives preserve focus on the element
  - No focus traps or modal management

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

## Examples

### Long Press Context Menu

```typescript
<div cngxLongPress (longPressed)="openMenu($event)"
     role="button" tabindex="0">
  Right-click or long-press for options
</div>

@if (menuOpen()) {
  <div class="context-menu" [style.top.px]="menuY()" [style.left.px]="menuX()">
    <button (click)="delete()">Delete</button>
    <button (click)="edit()">Edit</button>
    <button (click)="share()">Share</button>
  </div>
}

openMenu(event: PointerEvent) {
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
     [style.opacity]="1 - (swipe.swipeProgress() * 0.3)"
     [style.transform]="'translateX(-' + (swipe.swipeProgress() * 100) + '%)'">
  <span>Notification message</span>
  <span class="hint" *ngIf="!swipe.swiping()">Swipe left to dismiss</span>
</div>

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

```typescript
readonly currentIndex = signal(0);

<div class="carousel">
  <div cngxSwipeDismiss="left" (swiped)="nextSlide()"
       [hidden]="currentIndex() !== 0">
    Slide 1
  </div>
  <div cngxSwipeDismiss="left" (swiped)="nextSlide()"
       [hidden]="currentIndex() !== 1">
    Slide 2
  </div>
  <div cngxSwipeDismiss="left" (swiped)="nextSlide()"
       [hidden]="currentIndex() !== 2">
    Slide 3
  </div>
</div>

nextSlide() {
  if (this.currentIndex() < 2) {
    this.currentIndex.update(i => i + 1);
  }
}
```

### Bottom Sheet with Swipe Dismiss

```typescript
<div cngxSwipeDismiss="down" #swipe="cngxSwipeDismiss"
     (swiped)="closeBottomSheet()"
     [style.transform]="'translateY(' + (swipe.swipeProgress() * 100) + '%)'">
  <div class="sheet-header">
    <div class="drag-handle" />
    <h2>Options</h2>
  </div>
  <div class="sheet-content">
    <!-- content -->
  </div>
</div>

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
     (longPressed)="openMenu($event)"
     (shortcutTriggered)="openMenu($event)"
     role="button"
     tabindex="0"
     aria-label="Open menu (press M or long-press)">
  Long press or press M for menu
</div>
```

## Implementation Notes

### Long Press Gesture

1. **pointerdown** on host → Set `longPressing` true, start timer
2. **Timer** (threshold ms) → Emit `longPressed` event, set `longPressing` false
3. **Cancel conditions:** pointerup, pointercancel, pointerleave, or movement > moveThreshold

Movement detection is calculated using Euclidean distance to allow natural hand drift while preventing accidental triggers during scrolling.

### Swipe Gesture

1. **pointerdown** on host → Start tracking position
2. **pointermove** on document → Calculate delta in specified direction, update `swipeProgress`
3. **pointerup** on document → If delta >= threshold, emit `swiped`; reset progress

Directional deltas:

- **left**: startX - endX
- **right**: endX - startX
- **up**: startY - endY
- **down**: endY - startY

Progress is clamped to 0–1: `min(1, delta / threshold)`

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxLongPress.html)
- [CngxKeyboardShortcut](../keyboard/) — Pair with gestures for keyboard alternatives
- Demo: `dev-app/src/app/demos/common/gestures-demo/`
- Tests: `projects/common/interactive/src/gestures/long-press.directive.spec.ts`
