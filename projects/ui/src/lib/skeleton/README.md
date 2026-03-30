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
- **DOM efficiency:** Uses `display: contents` — no wrapper overhead
- **ARIA:** Sets `aria-busy="true"` while loading

The component is composable with `CngxSkeletonPlaceholder` directive (content projection). No boilerplate `@if/@for` needed — the component handles template repetition internally.

## API

### CngxSkeletonContainer

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| loading | `boolean` | `false` | Direct boolean control for loading state. |
| state | `CngxAsyncState<unknown> \| undefined` | `undefined` | Bind an async state — shows skeleton during `isFirstLoad()`. Takes precedence over `loading` input. |
| shimmer | `boolean` | `true` | Enable the `.cngx-skeleton--shimmer` CSS class. Animation respects `prefers-reduced-motion`. |
| count | `number` | `1` | Repeat count for the placeholder template. |

#### Signals
- `isLoading: Signal<boolean>` — Combined loading state (derived from `state.isFirstLoad()` or `loading` input).

### CngxSkeletonPlaceholder

Marks a template as the skeleton placeholder inside `cngx-skeleton`. The template is repeated `count` times while loading.

#### Template Context

The directive provides a rich context object:

```typescript
interface CngxSkeletonPlaceholderContext {
  $implicit: number;        // Current index (0-based)
  index: number;            // Current index (named)
  count: number;            // Total count
  first: boolean;           // Whether this is the first item
  last: boolean;            // Whether this is the last item
}
```

## Accessibility

`CngxSkeletonContainer` is fully accessible:

- **ARIA attributes:** `[attr.aria-busy]="isLoading()"` signals that content is being loaded.
- **Reduced motion:** Shimmer animation is disabled when `prefers-reduced-motion: reduce` is set.
- **Screen reader:** Skeletons are visual placeholders; their content is not announced. When loading completes, real content replaces placeholders seamlessly.

## Composition

`CngxSkeletonContainer` composes:

- **Async state integration:** Reads from `CngxAsyncState<T>` via `state()` input
- **Placeholder projection:** `CngxSkeletonPlaceholder` directive for template marking
- **Reduced motion detection:** Inline `matchMedia` listener for `prefers-reduced-motion`

## Styling

All animation values use CSS Custom Properties:

```scss
// Override in your component or global styles
:host {
  --cngx-spin-duration: 1.5s;
  --cngx-spin-easing: cubic-bezier(0.4, 0, 0.2, 1);
  --cngx-pulse-duration: 2s;
  --cngx-pulse-easing: ease-in-out;
}
```

### CSS Variables

| Property | Default | Description |
|-|-|-|
| `--cngx-spin-duration` | `0.8s` | Rotation animation duration |
| `--cngx-spin-easing` | `linear` | Rotation animation easing |
| `--cngx-pulse-duration` | `1.5s` | Pulse/shimmer animation duration |
| `--cngx-pulse-easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | Pulse animation easing |

### State Classes

- `.cngx-skeleton--loading` — Applied when `isLoading()` is true
- `.cngx-skeleton--shimmer` — Applied when shimmer is enabled and `isLoading()` is true

## Examples

### Basic Usage

```typescript
<cngx-skeleton [loading]="isLoading()">
  <ng-template cngxSkeletonPlaceholder>
    <div class="skeleton-line" style="height: 20px; margin: 8px 0;"></div>
  </ng-template>
  <p>Real content here</p>
</cngx-skeleton>
```

### Multiple Placeholders

```typescript
<cngx-skeleton [loading]="loading()" [count]="3">
  <ng-template cngxSkeletonPlaceholder>
    <div class="skeleton-card">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-text"></div>
    </div>
  </ng-template>

  <app-card *ngFor="let item of items()" [item]="item" />
</cngx-skeleton>
```

### With Async State

```typescript
readonly products = injectAsyncState(() => this.http.get('/api/products'));

<!-- Automatically shows skeleton during first load -->
<cngx-skeleton [state]="products()">
  <ng-template cngxSkeletonPlaceholder>
    <div class="product-skeleton">
      <div class="skeleton-img"></div>
      <div class="skeleton-title"></div>
      <div class="skeleton-price"></div>
    </div>
  </ng-template>

  <div class="product-grid">
    @for (product of products().data(); track product.id) {
      <app-product-card [product]="product" />
    }
  </div>
</cngx-skeleton>
```

### With Template Context

```typescript
<cngx-skeleton [loading]="loading()" [count]="5">
  <ng-template cngxSkeletonPlaceholder let-i let-first="first" let-last="last">
    <div class="skeleton-item">
      <!-- Vary width: full width except last item at 60% -->
      <div class="skeleton-line" [style.width]="last ? '60%' : '100%'"></div>
      @if (first) {
        <div class="skeleton-header">Header placeholder</div>
      }
    </div>
  </ng-template>

  <div class="item-list">
    @for (item of items(); track item.id) {
      <div class="item">{{ item.name }}</div>
    }
  </div>
</cngx-skeleton>
```

### Custom Shimmer

```typescript
// Disable shimmer for a cleaner static look
<cngx-skeleton [loading]="loading()" [shimmer]="false">
  <ng-template cngxSkeletonPlaceholder>
    <div class="skeleton-box"></div>
  </ng-template>
  <div>Real content</div>
</cngx-skeleton>
```

### Skeleton Styling

Define skeleton placeholder styles in your component or globally:

```scss
// In your component SCSS
.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.1),
    rgba(0, 0, 0, 0.05)
  );
  background-size: 200% 100%;
  border-radius: 4px;
}

// Animate with the component's shimmer class
cngx-skeleton--shimmer .skeleton-line {
  animation: shimmer var(--cngx-pulse-duration, 1.5s) var(--cngx-pulse-easing) infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
```

## Material Theme

Include the theme SCSS in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/skeleton/skeleton-theme' as skeleton;

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

## See Also

- [CngxAsyncState](../../../core/src/lib/utils/async-state/) — Async state contract
- [compodoc API documentation](../../../../../docs)
- Demo: `dev-app/src/app/demos/ui/skeleton-demo/`
- Tests: `projects/ui/src/lib/skeleton/skeleton-container.spec.ts`
