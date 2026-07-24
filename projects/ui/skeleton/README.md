# CngxSkeletonContainer

Skeleton loading container with built-in placeholder repetition and async state integration.

## Import

```typescript
import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxSkeletonContainer, CngxSkeletonPlaceholder } from '@cngx/ui';

@Component({
  selector: 'app-example',
  template: `
    <cngx-skeleton [state]="data()">
      <ng-template cngxSkeletonPlaceholder>
        <div class="skeleton-card"></div>
      </ng-template>
      <app-card *ngFor="let item of data().data()" [item]="item" />
    </cngx-skeleton>
  `,
  imports: [CngxSkeletonContainer, CngxSkeletonPlaceholder],
})
export class ExampleComponent {
  readonly data = injectAsyncState(() => this.http.get('/api/items'));
}
```

## Overview

`CngxSkeletonContainer` (selector: `<cngx-skeleton>`) manages skeleton placeholder rendering and transitions. It handles:

- **Conditional rendering:** Shows placeholders during loading, content when loaded
- **Repetition:** Repeats placeholder template via `[count]` input
- **Shimmer animation:** Optional shimmer effect that respects `prefers-reduced-motion`
- **Async state integration:** Automatically hides when data arrives (via `[state]` input)
- **Flash suppression:** Debounces its first-load placeholder through `createVisibilityGate`, so a load faster than `CNGX_LOADING_CONFIG.showDelay` never flashes a skeleton and a shown skeleton stays for at least `minDwell`
- **DOM efficiency:** Uses `display: contents` - no wrapper overhead
- **ARIA:** Sets `aria-busy="true"` while loading

The component is composable with `CngxSkeletonPlaceholder` directive (content projection). No boilerplate `@if/@for` needed - the component handles template repetition internally.

## Accessibility

- **ARIA attributes:** `[attr.aria-busy]="isLoading()"` signals that content is being loaded.
- **Reduced motion:** Shimmer animation is disabled when `prefers-reduced-motion: reduce` is set.
- **Screen reader:** Skeletons are visual placeholders; their content is not announced. When loading completes, real content replaces placeholders seamlessly.

## Composition

`CngxSkeletonContainer` composes:

- **Async state integration:** Reads from `CngxAsyncState<T>` via `state()` input
- **Visibility gate:** `createVisibilityGate` from `@cngx/core/utils` for the show-delay / min-dwell flash suppression
- **Placeholder projection:** `CngxSkeletonPlaceholder` directive for template marking
- **Reduced motion detection:** Inline `matchMedia` listener for `prefers-reduced-motion`



## Material Theme

Include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/skeleton-theme' as skeleton;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include skeleton.theme($theme);
}
```

The theme mixin provides:

- Base animation timing (`--cngx-spin-duration`, `--cngx-pulse-duration`)
- Color tokens derived from Material palette
- Reduced-motion respecting animations
- Support for both M3 and M2 themes
