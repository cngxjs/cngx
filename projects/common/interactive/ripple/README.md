# Ripple and Pressable

Touch and click feedback atoms - no Material dependency.

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

## Accessibility

Ripple and Pressable are low-level feedback atoms - no ARIA management required:

- **ARIA roles:** None (visual feedback only, not semantic)
- **Keyboard interaction:**
  - Native button behavior - no intervention
  - `CngxRipple` fires on primary-button pointer down only; keyboard activation draws no wave
  - `CngxPressable` applies `cngx-pressed` on pointer down and on an activation key (Enter / Space) pressed on the host itself
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
  <cngx-icon><mat-icon>favorite</mat-icon></cngx-icon>
</button>
```

## Styling

### CngxRipple

On the first press the directive appends one `<span class="cngx-ripple__container" aria-hidden="true">` to the host and renders every `<span class="cngx-ripple__wave">` into it. The host gets the `cngx-ripple` class. Default styles ship in `cngx-ripple.css` (imported by `@cngx/themes/cngx.css`):

- `.cngx-ripple` sets `position: relative` at zero specificity, so a host that is already positioned keeps its own value.
- `.cngx-ripple__container` covers the host (`position: absolute; inset: 0`), inherits its `border-radius`, clips with `overflow: hidden` and ignores pointer events.
- `.cngx-ripple__wave` is positioned from `--cngx-ripple-x`, `--cngx-ripple-y` and `--cngx-ripple-size` (set inline per press) and animates with `--cngx-ripple-duration` / `--cngx-ripple-opacity`.

Only the wave is clipped. The host is never clipped, so a corner badge or a focus ring stay intact.

Override in your component:

```scss
button {
  --cngx-ripple-color: rgba(255, 0, 0, 0.4);
  --cngx-ripple-duration: 0.8s;
  --cngx-ripple-opacity: 0.2;
}
```

Color precedence: `[rippleColor]` (written inline on the wave, only when bound) > `--cngx-ripple-color` on the host > the theme value (the Material bridge sets it on every `.cngx-ripple` host) > the `currentColor` default. With the bridge loaded, an override must sit on the host itself; an ancestor value is shadowed there. The easing is fixed (`ease-out`) and has no token.

### CngxPressable

Applies the `cngx-pressed` class on pointerdown. `cngxButton`, `cngxIconButton` and `cngxCloseButton` style that class as their built-in pressed state; on any other host define the visual effect yourself:

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

CngxRipple follows the app motion axis, decided in `cngx-ripple.css`, not in the directive: under a `[data-motion='reduced']` ancestor (`provideMotion`, `cngxMotionScope`), or under `prefers-reduced-motion: reduce` unless the root carries `data-motion='full'`, the wave does not expand and only fades. With the reduced-motion safety net of `@cngx/themes/cngx.css` loaded that fade collapses to 0.01ms. The wave element is still created, so `active()` still flips.

CngxPressable still applies the class (instant visual feedback is usually okay).

No configuration needed beyond loading the stylesheet.

## Examples

### Button with Ripple

```typescript
<button cngxRipple>Click me</button>
```

### Icon Button with Centered Ripple

```typescript
<button cngxPressRipple [rippleCentered]="true" class="icon-button">
  <cngx-icon><mat-icon>favorite</mat-icon></cngx-icon>
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

## Material Theme

A Material theme mixin is available in `@cngx/themes/material/ripple-theme.scss`:

```scss
@use '@cngx/themes/material/ripple-theme' as ripple;

$theme: mat.define-theme((...));

html {
  @include ripple.theme($theme);
}
```

The `theme()` mixin sets `--cngx-ripple-color` from the Material palette (`on-surface`, M3 themes only) and applies base defaults for `--cngx-ripple-opacity` (`0.12`) and `--cngx-ripple-duration` (`0.5s`).

## See Also

- [compodocx API documentation](https://cngxjs.github.io/cngx/main/common/interactive/ripple/)
- `cngx-ripple.css` - Default container and wave styles
- Demo: `examples/stories/common/interactive/ripple/`
- Tests: `projects/common/interactive/ripple/ripple.directive.spec.ts`
