# Reduced Motion

Reactive signal reflecting the user's `prefers-reduced-motion` media query preference. Enables components to skip animations, disable auto-playing content, and choose instant transitions based on accessibility needs.

## Directive

### CngxReducedMotion

Reflects the user's `prefers-reduced-motion: reduce` media query as a reactive signal. Updates reactively when the OS preference changes (e.g., if the user toggles accessibility settings).

#### Import

```typescript
import { CngxReducedMotion } from '@cngx/common/a11y';
```

#### Signals (read-only)

- `prefersReducedMotion: Signal<boolean>` — `true` when the user prefers reduced motion, `false` otherwise.

#### Host Binding

The directive applies the `cngx-reduced-motion` CSS class to the host element, enabling CSS-based motion reduction.

#### Example

```typescript
// Conditional animation in template
<div cngxReducedMotion #rm="cngxReducedMotion"
     [style.animation]="rm.prefersReducedMotion() ? 'none' : 'spin 2s linear infinite'">
  Loading…
</div>

// TypeScript logic
readonly rm = viewChild(CngxReducedMotion);
readonly animationDuration = computed(() =>
  this.rm()?.prefersReducedMotion() ? 0 : 300
);

// Conditional class for CSS animations
<div cngxReducedMotion
     [class.animate]="!rm.prefersReducedMotion()">
  Animated content
</div>
```

#### Component Example

```typescript
import { CngxReducedMotion } from '@cngx/common/a11y';
import { inject, signal, computed } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `
    <div [class.spinning]="!rm.prefersReducedMotion()">
      Loading…
    </div>
  `,
  imports: [CngxReducedMotion],
})
export class SpinnerComponent {
  protected readonly rm = inject(CngxReducedMotion);
}
```

---

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

---

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

---

## Accessibility Requirements

WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions) requires:

- Animations triggered by user interaction should be optional or disableable
- Motion-based animations should respect `prefers-reduced-motion`
- Critical functionality must not rely on animation

`CngxReducedMotion` enables compliance:

```typescript
// Bad: Motion is required for feedback
@if (saved) {
  <div class="success-check" [@spinIn]>Saved!</div>
}

// Good: Respect motion preference
@if (saved) {
  <div class="success-check"
       [@spinIn]="!rm.prefersReducedMotion() ? 'in' : 'none'">
    Saved!
  </div>
}
```

---

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

---

## Animation Frameworks

### With Angular Animations (`@angular/animations`)

```typescript
import { trigger, state, style, animate, transition } from '@angular/animations';

export const slideAnimation = [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateX(-20px)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
  ])
];

@Component({
  template: `
    <div cngxReducedMotion #rm="cngxReducedMotion"
         [@slide]="rm.prefersReducedMotion() ? null : 'in'">
      Animated content
    </div>
  `,
  animations: [trigger('slide', slideAnimation)]
})
export class MyComponent {}
```

### With GSAP

```typescript
import gsap from 'gsap';

export class MyComponent {
  protected readonly rm = inject(CngxReducedMotion);

  animate(): void {
    if (this.rm.prefersReducedMotion()) {
      // Instant state
      gsap.to(this.element, { opacity: 1, duration: 0 });
    } else {
      // Animated
      gsap.to(this.element, { opacity: 1, duration: 0.3 });
    }
  }
}
```

---

## Testing

Mock the media query in tests:

```typescript
import { createMatchMediaMock } from '@cngx/testing';

it('respects reduced motion', () => {
  const matchMediaMock = createMatchMediaMock({ 'prefers-reduced-motion: reduce': true });
  // Component should skip animations
});
```

---

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

// Toast with motion control
<cngx-toast-outlet cngxReducedMotion
                   [animationDuration]="rm.prefersReducedMotion() ? 0 : 300">
</cngx-toast-outlet>
```

---

## See Also

- [Web.dev: prefers-reduced-motion](https://web.dev/articles/prefers-reduced-motion)
- [WCAG 2.1 Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- Compodoc API documentation: `npm run docs:serve`
