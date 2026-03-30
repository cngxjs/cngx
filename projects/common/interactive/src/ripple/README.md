# Ripple and Pressable

Touch and click feedback atoms — no Material dependency.

## Import

```typescript
import { CngxRipple, CngxPressable, CngxPressRipple } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxRipple, CngxPressable, CngxPressRipple } from '@cngx/common/interactive';

@Component({
  selector: 'app-button',
  template: `
    <!-- Ripple alone -->
    <button cngxRipple>Click me</button>

    <!-- Press feedback alone -->
    <button cngxPressable>Hold me</button>

    <!-- Both together -->
    <button cngxPressRipple>Full feedback</button>
  `,
  imports: [CngxRipple, CngxPressable, CngxPressRipple],
  styles: [`
    button {
      transition: scale 0.1s;
    }
    button.cngx-pressed {
      scale: 0.97;
    }
  `],
})
export class ButtonComponent {}
```

## API

### CngxRipple

Touch/click ripple feedback without Material dependency.

#### Inputs

|-|-|-|-|
| cngxRipple | — | — | Presence enables ripple (no value required) |
| rippleColor | string | 'currentColor' | Ripple color — passed as --cngx-ripple-color |
| rippleCentered | boolean | false | Whether ripple originates from center (icon buttons) |
| rippleDisabled | boolean | false | Disable ripple effect |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

- `active: Signal<boolean>` — Whether a ripple animation is currently playing

#### CSS Custom Properties

- `--cngx-ripple-x` (px) — Ripple origin X coordinate (set by directive)
- `--cngx-ripple-y` (px) — Ripple origin Y coordinate (set by directive)
- `--cngx-ripple-size` (px) — Ripple diameter (set by directive)
- `--cngx-ripple-color` (currentColor) — Ripple color (from rippleColor input)
- `--cngx-ripple-duration` (0.6s) — Animation duration
- `--cngx-ripple-easing` (cubic-bezier(0.4, 0, 0.2, 1)) — Animation easing

### CngxPressable

Instant press feedback via CSS class on pointerdown.

#### Inputs

|-|-|-|-|
| cngxPressable | — | — | Presence enables press feedback (no value required) |
| pressableReleaseDelay | number | 80 | Minimum time (ms) the pressed class stays active — prevents flash on quick taps |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

- `pressed: Signal<boolean>` — Whether the element is currently pressed

#### CSS Custom Properties

None (apply your own visual styles to the `.cngx-pressed` class)

### CngxPressRipple

Molecule combining CngxPressable and CngxRipple as hostDirectives.

#### Inputs

|-|-|-|-|
| cngxPressRipple | — | — | Presence enables both press and ripple |
| pressableReleaseDelay | number | 80 | From CngxPressable |
| rippleColor | string | 'currentColor' | From CngxRipple |
| rippleCentered | boolean | false | From CngxRipple |
| rippleDisabled | boolean | false | From CngxRipple |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

- `pressed: Signal<boolean>` — From CngxPressable
- `active: Signal<boolean>` — From CngxRipple

## Accessibility

Ripple and Pressable are low-level feedback atoms — no ARIA management required:

- **ARIA roles:** None (visual feedback only, not semantic)
- **Keyboard interaction:**
  - Native button behavior — no intervention
  - Ripple fires on both pointer and keyboard activation
- **Screen reader:**
  - No announcements (purely visual feedback)
  - Keyboard navigation unaffected
- **Focus management:**
  - No focus changes or traps
  - Focus ring remains visible throughout interaction

## Composition

Ripple and Pressable are typically composed together via CngxPressRipple, but can be used independently:

- **Host directives:**
  - CngxPressRipple composes both as hostDirectives
  - Consumers rarely need to compose manually
- **Combines with:** Button styling, Material design systems
- **Provides:** Instant visual feedback for interaction

### Example: Composition Pattern

```typescript
// Default composition
<button cngxPressRipple>Click me</button>

// Individual atoms for custom timing
<button cngxPressable [pressableReleaseDelay]="120"
        cngxRipple [rippleColor]="'rgba(0,0,0,0.3)'">
  Custom feedback
</button>

// Icon button with centered ripple
<button cngxPressRipple [rippleCentered]="true">
  <mat-icon>favorite</mat-icon>
</button>
```

## Styling

### CngxRipple

The ripple creates a `<span class="cngx-ripple__wave">` injected into the DOM. All visual styling is your responsibility. Ships with `_ripple.scss` defaults:

```scss
// projects/common/interactive/src/ripple/_ripple.scss
.cngx-ripple__wave {
  position: absolute;
  pointer-events: none;
  top: calc(var(--cngx-ripple-y) - var(--cngx-ripple-size) / 2);
  left: calc(var(--cngx-ripple-x) - var(--cngx-ripple-size) / 2);
  width: var(--cngx-ripple-size);
  height: var(--cngx-ripple-size);
  border-radius: 50%;
  background: var(--cngx-ripple-color, currentColor);
  opacity: 0.3;
  animation: cngx-ripple-animation var(--cngx-ripple-duration, 0.6s)
    var(--cngx-ripple-easing, cubic-bezier(0.4, 0, 0.2, 1)) forwards;
}

@keyframes cngx-ripple-animation {
  from {
    opacity: 0.3;
    transform: scale(0);
  }
  to {
    opacity: 0;
    transform: scale(1);
  }
}
```

Override in your component:

```scss
button {
  --cngx-ripple-color: rgba(255, 0, 0, 0.4);
  --cngx-ripple-duration: 0.8s;
  --cngx-ripple-easing: ease-out;
}
```

### CngxPressable

Applies the `cngx-pressed` class on pointerdown. Define the visual effect yourself:

```scss
button {
  transition: scale 0.1s ease-out;
}

button.cngx-pressed {
  scale: 0.97;
  // Or use transform:
  // transform: scale(0.97);
}
```

### Respecting Reduced Motion

Both directives respect `prefers-reduced-motion`:

- CngxRipple: Skips animation entirely if reduced motion is preferred
- CngxPressable: Still applies the class (instant visual feedback is usually okay)

No configuration needed — the directives detect motion preference automatically.

## Examples

### Button with Ripple

```typescript
<button cngxRipple>Click me</button>
```

### Icon Button with Centered Ripple

```typescript
<button cngxPressRipple [rippleCentered]="true" class="icon-button">
  <mat-icon>favorite</mat-icon>
</button>

<style>
  .icon-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
  }
</style>
```

### Disable Ripple on Preference

```typescript
<button cngxRipple [rippleDisabled]="prefersReducedMotion()">
  Click me
</button>
```

### Card with Press Feedback

```typescript
<div cngxPressable class="card" [class.elevated]="cardHovered()">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

<style>
  .card {
    transition: scale 0.08s, box-shadow 0.2s;
  }
  .card.cngx-pressed {
    scale: 0.98;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
```

### Custom Ripple Color

```typescript
<button cngxPressRipple [rippleColor]="'rgba(0, 150, 255, 0.5)'">
  Custom ripple color
</button>
```

### Reduced Motion with Custom Fallback

```typescript
<button cngxPressRipple
        [rippleDisabled]="prefersReducedMotion()"
        [class.no-ripple]="prefersReducedMotion()">
  Accessible button
</button>

<style>
  button.no-ripple.cngx-pressed {
    background-color: rgba(0, 0, 0, 0.1);
  }
</style>
```

## Implementation Notes

### Ripple Wave Element

The ripple creates a temporary `<span class="cngx-ripple__wave">` as a child of the host element. The directive sets:

- Position via `--cngx-ripple-x/y` (center coordinates)
- Size via `--cngx-ripple-size` (diameter in px)
- Color via `--cngx-ripple-color`

The element is removed after the `animationend` event (with a 1s fallback timeout).

### Press Feedback Timing

CngxPressable uses:

1. **pointerdown** → Set `cngx-pressed` immediately (0ms latency)
2. **pointerup** → Schedule removal with `releaseDelay` (prevents flash on quick taps)
3. **pointercancel/leave** → Immediate removal (no delay)

The delay is configurable per element via `[pressableReleaseDelay]`.

## Material Theme

A Material theme mixin is available in `ripple-theme.scss`:

```scss
@use '@cngx/common/interactive/ripple-theme' as ripple;

$theme: mat.define-theme((...));

html {
  @include ripple.theme($theme);
}
```

The `theme()` mixin sets `--cngx-ripple-color` from the Material palette (`on-surface` for M3, `foreground.base` for M2) and applies base defaults for `--cngx-ripple-opacity` (`0.12`) and `--cngx-ripple-duration` (`0.5s`).

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxRipple.html)
- `_ripple.scss` — Default ripple animation styles
- Demo: `dev-app/src/app/demos/common/ripple-demo/`
- Tests: `projects/common/interactive/src/ripple/ripple.directive.spec.ts`
