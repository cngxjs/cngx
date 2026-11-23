# Reduced Motion

Reactive signal reflecting `prefers-reduced-motion`. Surfaces `.cngx-reduced-motion` on the host for CSS-only opt-outs; consumers branch on the signal for template and animation-trigger logic.

## Directive

### CngxReducedMotion

Reflects the user's `prefers-reduced-motion: reduce` media query as a reactive signal. Updates reactively when the OS preference changes (e.g., if the user toggles accessibility settings).

It reads the OS query only. An in-app pick through `provideMotion()` / `injectMotion()` (`CNGX_MOTION`, `<html data-motion>`) is not seen here. To decide in JS on the motion the user actually gets, read `injectEffectiveMotion()` from `@cngx/core`: the `CNGX_MOTION` pick when it is `'reduced'` or `'full'`, else the OS query.

```typescript
import { injectEffectiveMotion } from '@cngx/core';

private readonly motion = injectEffectiveMotion();
protected readonly duration = computed(() => (this.motion() === 'reduced' ? 0 : 300));
```

## CSS Integration

Use the `cngx-reduced-motion` class for motion-specific styling:

```scss
.animated-card {
  // Default: animate on all browsers except those requesting reduced motion
  animation: slideIn 0.3s ease-out;

  // When user prefers reduced motion, no animation
  &.cngx-reduced-motion {
    animation: none;
    // Instant state (if needed)
    opacity: 1;
    transform: translateX(0);
  }
}

.spinner {
  // Spin by default
  animation: spin 2s linear infinite;

  // Respect motion preference
  .cngx-reduced-motion & {
    animation: none;
    opacity: 0.5; // Visual indicator without motion
  }
}

.toast {
  // Slide in from bottom
  animation: slideUp 0.2s ease-out;

  .cngx-reduced-motion & {
    animation: none;
    // Instant appearance
    transform: translateY(0);
  }
}
```

## Advanced Patterns

### Media Query Listener

The directive sets up a `MediaQueryList` listener internally. The signal updates reactively when the OS setting changes:

```typescript
// User changes OS accessibility settings → signal updates automatically
readonly prefersReducedMotion = signal(/* initial value from matchMedia */);
// → Component renders without animation instantly
```

### Conditional Animation Duration

```typescript
readonly duration = computed(() =>
  this.rm.prefersReducedMotion() ? 0 : 300 // ms
);

<div [style.transition]="'opacity ' + duration() + 'ms ease-out'">
  Content
</div>
```

### Auto-Playing Media

```typescript
readonly shouldAutoPlay = computed(() =>
  !this.rm.prefersReducedMotion()
);

<video [autoplay]="shouldAutoPlay()">
  <source src="video.mp4" type="video/mp4" />
</video>
```

## Accessibility Requirements

WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions) requires:

- Animations triggered by user interaction should be optional or disableable
- Motion-based animations should respect `prefers-reduced-motion`
- Critical functionality must not rely on animation

`CngxReducedMotion` enables compliance:

```html
<!-- Bad: motion is the only feedback -->
@if (saved()) {
  <div class="success-check spin-in"></div>
}

<!-- Good: text carries the feedback, motion is opt-out -->
@if (saved()) {
  <div class="success-check" [class.spin-in]="!rm.prefersReducedMotion()">Saved</div>
}
```

## Media Query

The directive monitors the standard `prefers-reduced-motion` media query:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations, transitions, and auto-play disabled */
}
```

Support:

- Modern browsers (Chrome 63+, Firefox 63+, Safari 10.1+, Edge 79+)
- OS-level setting: Windows, macOS, iOS, Android all support this preference
- Fallback: When unsupported, `prefersReducedMotion()` is always `false`

## Animation Frameworks

### With GSAP

JS-driven animation reads the effective motion, so an in-app pick wins over the OS query:

```typescript
import gsap from 'gsap';
import { injectEffectiveMotion } from '@cngx/core';

export class MyComponent {
  private readonly motion = injectEffectiveMotion();

  animate(): void {
    if (this.motion() === 'reduced') {
      // Instant state
      gsap.to(this.element, { opacity: 1, duration: 0 });
    } else {
      // Animated
      gsap.to(this.element, { opacity: 1, duration: 0.3 });
    }
  }
}
```

## Testing

Stub `matchMedia` in tests. Inside this repo, `createMatchMediaMock(initialMatches)` from the repo-internal test kit `@cngx/testing` (not published) does it:

```typescript
import { createMatchMediaMock } from '@cngx/testing';

it('respects reduced motion', () => {
  const mock = createMatchMediaMock(true); // every query matches initially
  mock.install(window);
  // ... create the fixture, assert prefersReducedMotion() is true
  mock.trigger(false); // OS preference switched off
  mock.restore(window);
});
```

Outside the repo, stub `window.matchMedia` with an object whose `matches` is `true` and whose `addEventListener` records the change listener.

## Composition

`CngxReducedMotion` pairs well with animations, transitions, and feedback components:

```typescript
// Dialog with respectful animations
<dialog cngxDialog>
  <div cngxReducedMotion #rm="cngxReducedMotion"
       [style.animation]="rm.prefersReducedMotion() ? 'none' : 'slideUp 0.3s ease-out'">
    Dialog content
  </div>
</dialog>

// Toast list with motion control
<ul cngxReducedMotion #rm="cngxReducedMotion">
  @for (n of notifications(); track n.id) {
    <li class="toast" [class.toast--animate]="!rm.prefersReducedMotion()">{{ n.text }}</li>
  }
</ul>
```
