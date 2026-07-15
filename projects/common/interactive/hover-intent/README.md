# Hover Intent

Debounced hover-intent primitive. Turns raw pointer enter/leave into a boolean signal that flips `true` only after the pointer has rested on the host for `enterDelay` ms of continuous hover, and back to `false` after `leaveDelay` ms of continuous un-hover.

A pointer that merely passes over the host never fires - the pending timer is cancelled by the opposite event before it elapses. Reach for it instead of hand-rolling the same "fire only after N ms of continuous hover" timer in every hover-to-reveal panel or hover-to-prefetch trigger. An instant `mouseenter` reaction reads as nervous when the pointer is only travelling across the element; hover intent removes the flicker.

## Import

```typescript
import { CngxHoverIntent } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxHoverIntent } from '@cngx/common/interactive';

@Component({
  selector: 'app-card',
  template: `
    <div cngxHoverIntent #hi="cngxHoverIntent" [enterDelay]="150">
      <strong>Project Aurora</strong>
      @if (hi.active()) {
        <p>Owner: Dana Ruiz · 3 open tasks</p>
      }
    </div>
  `,
  imports: [CngxHoverIntent],
})
export class CardComponent {}
```

## API

- `[enterDelay]` (`input<number>`, default `120`) - ms of continuous hover before `active` settles to `true`.
- `[leaveDelay]` (`input<number>`, default `0`) - ms of continuous un-hover before `active` settles back to `false`.
- `active` (`Signal<boolean>`, readonly) - the debounced intent state. Read it via the `#hi="cngxHoverIntent"` template reference.
- `(intentChange)` (`output<boolean>`) - emits on every debounced edge: `true` on settle-in, `false` on settle-out.

`active` is derived from pointer events and is never consumer-writable, so it is exposed read-only plus an `intentChange` output rather than a two-way `model()`. Bind `(intentChange)` when you want the edge (prefetch, analytics); read `active()` when you want the current state (reveal, highlight).

## Accessibility

CngxHoverIntent is pointer-only by design:

- **ARIA roles:** None (behavioural, a11y-neutral).
- **Keyboard interaction:** None. Hover intent is a mouse concept and has no keyboard surface.
- **Screen reader:** No announcements.
- **Focus management:** No focus changes.

Because the directive has no keyboard path, never gate content behind `active()` alone - pair it with a focus path (`:focus-within` or a `focusin` handler) so the same content is reachable without a mouse. WCAG 2.1.1 (Keyboard): `@if (hi.active() || focused())`. The `hover-to-reveal` demo shows this pattern.

## Composition

- **Host directives:** None (but usable as a `hostDirective` composition primitive, like `CngxHoverable`).
- **Combines with:** any element that should react to *settled* hover rather than instant `mouseenter`. Pair with a focus-state directive for the keyboard path.
- **Provides:** No injectable tokens.

### As a hostDirective

```typescript
@Component({
  selector: 'app-nav-card',
  hostDirectives: [{ directive: CngxHoverIntent, inputs: ['enterDelay'], outputs: ['intentChange'] }],
})
export class NavCard {
  private readonly intent = inject(CngxHoverIntent, { host: true });
  readonly ready = this.intent.active; // Signal<boolean>
}
```

## Examples

### Hover to reveal (with keyboard path)

```typescript
@Component({
  selector: 'app-hover-card',
  template: `
    <div
      cngxHoverIntent
      #hi="cngxHoverIntent"
      [enterDelay]="150"
      tabindex="0"
      (focusin)="focused.set(true)"
      (focusout)="focused.set(false)"
    >
      <strong>Project Aurora</strong>
      @if (hi.active() || focused()) {
        <p>Owner: Dana Ruiz · Updated 2h ago · 3 open tasks</p>
      }
    </div>
  `,
  imports: [CngxHoverIntent],
})
export class HoverCard {
  protected readonly focused = signal(false);
}
```

### Hover to prefetch

```typescript
@Component({
  selector: 'app-prefetch-link',
  template: `
    <a
      href="/dashboard"
      cngxHoverIntent
      [enterDelay]="200"
      (intentChange)="$event && prefetch()"
    >
      Open dashboard
    </a>
  `,
  imports: [CngxHoverIntent],
})
export class PrefetchLink {
  prefetch(): void {
    // Kick off the data/route prefetch once hover intent is confirmed -
    // never on the first stray mouseenter.
  }
}
```

## Styling

CngxHoverIntent has no built-in styling. Drive visuals from `active()`:

```html
<div cngxHoverIntent #hi="cngxHoverIntent"
     [style.transform]="hi.active() ? 'scale(1.02)' : 'none'">
  …
</div>
```

## See Also

- [API on compodocx](https://cngxjs.github.io/cngx/)
- [CngxHoverable](../hoverable/) - instant, undebounced hover state
- [CngxLongPress](../gestures/) - held-pointer gesture with a threshold timer
- Demo: `examples/stories/common/interactive/hover-intent/`
- Tests: `projects/common/interactive/hover-intent/hover-intent.directive.spec.ts`
- [WCAG 2.1.1 Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html)
