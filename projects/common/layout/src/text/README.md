# Text System

Text utilities for truncation, highlighting, expandable content, and skeleton loading. All directives use native DOM APIs and Angular signals for reactive state management.

## Import

```typescript
import {
  CngxTruncate,
  CngxHighlight,
  CngxExpandableText,
  CngxExpandableToggle,
  CngxSkeleton,
} from '@cngx/common/layout';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import {
  CngxTruncate,
  CngxHighlight,
  CngxExpandableText,
  CngxSkeleton,
} from '@cngx/common/layout';

@Component({
  selector: 'app-text-example',
  template: `
    <!-- Truncated text with expand toggle -->
    <p [cngxTruncate]="3" [(expanded)]="expanded" #trunc="cngxTruncate">
      Long text content that may or may not overflow…
    </p>
    @if (trunc.isClamped() || expanded()) {
      <button (click)="expanded.set(!expanded())">
        {{ expanded() ? 'Show less' : 'Show more' }}
      </button>
    }

    <!-- Search term highlighting -->
    <p [cngxHighlight]="searchTerm()">
      Angular Signals represent a fundamental shift in reactivity…
    </p>

    <!-- Expandable text component with built-in toggle -->
    <cngx-expandable-text [lines]="2">
      Long article text that collapses to 2 lines with a toggle button…
    </cngx-expandable-text>

    <!-- Skeleton loading placeholder -->
    <div [cngxSkeleton]="isLoading()" [count]="3" #sk="cngxSkeleton">
      @if (sk.loading()) {
        @for (i of sk.indices(); track i) {
          <div class="skeleton-line" aria-hidden="true"></div>
        }
      } @else {
        @for (item of items(); track item.id) {
          <p>{{ item.title }}</p>
        }
      }
    </div>
  `,
  imports: [CngxTruncate, CngxHighlight, CngxExpandableText, CngxSkeleton],
})
export class TextExampleComponent {
  readonly expanded = signal(false);
  readonly searchTerm = signal('Signals');
  readonly isLoading = signal(true);
  readonly items = signal([]);
}
```

---

## CngxTruncate

Manages text truncation with expand/collapse state detection via CSS `-webkit-line-clamp`. Detects whether text is actually clamped and exposes an `isClamped` signal so consumers can conditionally show a "Show more" toggle only when needed.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxTruncate` | `number` | Required | Maximum number of visible lines when collapsed. |
| `expanded` | `boolean` | `false` | Whether the text is expanded (full content visible). Supports two-way binding via `[(expanded)]`. |

### Signals

#### Public Signals (read-only)
- `isClamped: Signal<boolean>` — Whether text content exceeds the line limit and is being clamped.

#### Template-Accessible
- `expanded: WritableSignal<boolean>` — Two-way bindable signal for expand state.

### Host Styling

When collapsed, the directive automatically applies:
- `display: -webkit-box`
- `-webkit-box-orient: vertical`
- `overflow: hidden`
- `-webkit-line-clamp: <lines>`

When expanded, all styles are removed (set to `null`).

### Browser Support

Uses `-webkit-line-clamp` which is widely supported (Chrome, Firefox, Safari, Edge). Falls back to showing full text in older browsers.

### Usage Example

```html
<p [cngxTruncate]="3" [(expanded)]="isExpanded" #trunc="cngxTruncate">
  Long text content that may or may not overflow the container…
</p>

@if (trunc.isClamped() || isExpanded()) {
  <button (click)="isExpanded.set(!isExpanded())"
          [attr.aria-expanded]="isExpanded()">
    {{ isExpanded() ? 'Show less' : 'Show more' }}
  </button>
}
```

### Advanced: Responsive Line Count

```html
<p cngxMediaQuery="(max-width: 600px)" #mobile="cngxMediaQuery"
   [cngxTruncate]="mobile.matches() ? 2 : 5"
   [(expanded)]="expanded"
   #trunc="cngxTruncate">
  Responsive truncation based on viewport width…
</p>
```

---

## CngxHighlight

Search-text highlighting via `<mark>` elements. Walks text nodes of the host, splits at match boundaries, and wraps matches in `<mark>` elements. No `innerHTML` — safe by construction. The `<mark>` element has native SR semantics.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxHighlight` | `string` | Required | Search term to highlight. Empty string clears highlights. |
| `highlightCaseSensitive` | `boolean` | `false` | Whether matching is case-sensitive. |

### Signals

#### Public Signals (read-only)
- `matchCount: Signal<number>` — Number of matches found in current highlight pass.

### Behavior

- Walks all `TEXT_NODE` descendants of the host element.
- Wraps matched portions in `<mark>` elements (native HTML semantics).
- Original DOM structure is restored before each re-highlight.
- Empty term clears all highlights.

### Usage Example

```html
<div class="search-results">
  <p [cngxHighlight]="searchTerm()" #hl="cngxHighlight">
    Angular Signals represent a fundamental shift in reactivity and component state management.
  </p>
  <p>{{ hl.matchCount() }} matches found</p>
</div>
```

### Case-Sensitive Matching

```html
<p [cngxHighlight]="searchTerm()" [highlightCaseSensitive]="true">
  CamelCaseMatters in this text
</p>
```

### Real-World: Search Results

```typescript
@Component({
  template: `
    <input [(ngModel)]="searchTerm" placeholder="Search…" />
    <div class="results">
      @for (result of searchResults(); track result.id) {
        <article>
          <h3>{{ result.title }}</h3>
          <p [cngxHighlight]="searchTerm()" #hl="cngxHighlight">
            {{ result.excerpt }}
          </p>
          <p class="match-count">{{ hl.matchCount() }} matches</p>
        </article>
      }
    </div>
  `,
})
export class SearchResultsComponent {
  readonly searchTerm = signal('');
  readonly searchResults = computed(() => this.performSearch(this.searchTerm()));

  performSearch(term: string) {
    // Fetch and filter results
    return [];
  }
}
```

### CSS Styling `<mark>` Elements

```scss
mark {
  background-color: yellow;
  color: inherit;
  padding: 0.1em 0.2em;
  border-radius: 2px;
  font-weight: 500;
}

// Dark mode
@media (prefers-color-scheme: dark) {
  mark {
    background-color: #663300;
  }
}
```

---

## CngxExpandableText

Molecule wrapping `CngxTruncate` with a built-in expand/collapse toggle button. Projects content into a truncated container and conditionally renders a "Show more" / "Show less" button when content is actually clamped.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `lines` | `number` | `3` | Maximum visible lines when collapsed. |
| `expanded` | `boolean` | `false` | Whether the text is expanded. Supports two-way `[(expanded)]` binding. |
| `moreLabel` | `string` | `'Show more'` | Label for the "show more" button. |
| `lessLabel` | `string` | `'Show less'` | Label for the "show less" button. |

### Content Slots

- Default slot — The text to be truncated.
- `<ng-template cngxExpandableToggle>` (optional) — Custom toggle template.

### Signals

#### Template-Accessible
- `expanded: WritableSignal<boolean>` — Two-way bindable expand state.

### Usage Example

#### Basic Usage

```html
<cngx-expandable-text [lines]="3">
  Long article or description text that may or may not overflow the container…
</cngx-expandable-text>
```

#### Custom Labels

```html
<cngx-expandable-text [lines]="2"
                      moreLabel="Mehr anzeigen"
                      lessLabel="Weniger anzeigen">
  Langer Text mit Zeilenumbruch…
</cngx-expandable-text>
```

#### Custom Toggle Template

```html
<cngx-expandable-text [lines]="3">
  Long text content here…

  <ng-template cngxExpandableToggle let-expanded let-toggle="toggle">
    <button type="button" (click)="toggle()" [attr.aria-expanded]="expanded">
      <mat-icon>{{ expanded ? 'expand_less' : 'expand_more' }}</mat-icon>
    </button>
  </ng-template>
</cngx-expandable-text>
```

#### Two-Way Binding

```typescript
@Component({
  template: `
    <cngx-expandable-text [lines]="lines()" [(expanded)]="isExpanded">
      {{ description() }}
    </cngx-expandable-text>
    <p>Expanded: {{ isExpanded() }}</p>
  `,
})
export class CardComponent {
  readonly lines = signal(2);
  readonly isExpanded = signal(false);
}
```

### Built-In Button Styling

The built-in toggle button has the class `.cngx-expandable-text__toggle` for custom styling:

```scss
.cngx-expandable-text__toggle {
  background: none;
  border: none;
  color: var(--primary-color, #1976d2);
  cursor: pointer;
  font-size: inherit;
  text-decoration: underline;

  &:hover {
    color: var(--primary-color-dark, #1565c0);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color, #1976d2);
    outline-offset: 2px;
  }
}
```

---

## CngxSkeleton

Headless skeleton loading placeholder. Toggles between loading and content states via CSS classes and ARIA attributes. Exposes an `indices()` signal for `@for` rendering repeated skeleton elements. Respects `prefers-reduced-motion`.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxSkeleton` | `boolean` | Required | Controls the loading state. |
| `shimmer` | `boolean` | `true` | Enables the `.cngx-skeleton--shimmer` CSS class (respects `prefers-reduced-motion`). |
| `count` | `number` | `1` | Repeat count — exposed via `indices()` signal for `@for` rendering. |

### Signals

#### Public Signals (read-only)
- `loading: Signal<boolean>` — Whether the skeleton is in loading state. Mirrors the `cngxSkeleton` input.
- `indices: Signal<number[]>` — Array of indices [0, 1, ..., count-1] for `@for` rendering of repeated skeleton elements.

### CSS Classes

- `.cngx-skeleton` — Always applied.
- `.cngx-skeleton--loading` — Applied when in loading state.
- `.cngx-skeleton--shimmer` — Applied when loading and shimmer is enabled (respects `prefers-reduced-motion`).

### ARIA Attributes

- `aria-busy="true"` — Applied when in loading state (omitted when not loading).

### Usage Example

#### Basic Loading Placeholder

```html
<div [cngxSkeleton]="isLoading()" #sk="cngxSkeleton">
  @if (sk.loading()) {
    <div class="skeleton-line" aria-hidden="true"></div>
    <div class="skeleton-line" aria-hidden="true" style="width: 80%"></div>
    <div class="skeleton-line" aria-hidden="true" style="width: 60%"></div>
  } @else {
    <p>{{ content() }}</p>
  }
</div>
```

#### Card List with Repeat Count

```html
<div [cngxSkeleton]="loading()" [count]="3" #sk="cngxSkeleton">
  @if (sk.loading()) {
    @for (i of sk.indices(); track i) {
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-avatar"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line" style="width: 70%"></div>
      </div>
    }
  } @else {
    @for (card of cards(); track card.id) {
      <app-card [data]="card" />
    }
  }
</div>
```

#### Respects Reduced Motion

```typescript
// Automatically disabled shimmer animation when prefers-reduced-motion is set
<div [cngxSkeleton]="loading()" [shimmer]="true">
  <!-- Shimmer animation is disabled if user prefers reduced motion -->
</div>
```

### CSS Styling Skeleton Elements

```scss
.skeleton-line {
  height: 16px;
  background: var(--skeleton-bg, #e0e0e0);
  border-radius: 4px;
  margin-bottom: 8px;
}

.cngx-skeleton--shimmer .skeleton-line {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--skeleton-bg, #e0e0e0);
  margin-bottom: 8px;
}

.skeleton-card {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--skeleton-border, #f0f0f0);
}

// Respect user motion preference
@media (prefers-reduced-motion: reduce) {
  .cngx-skeleton--shimmer .skeleton-line {
    animation: none;
    background: var(--skeleton-bg-static, #f5f5f5);
  }
}
```

---

## Accessibility

Text utilities are fully accessible:

- **ARIA roles:** `<mark>` elements have native SR semantics (announced as "highlighted"). Skeleton placeholder has `aria-busy="true"` during loading.
- **Keyboard interaction:** Truncate and expandable text buttons are fully keyboard operable. Tab/Enter to expand/collapse.
- **Screen reader:** `<mark>` elements are read as "highlighted". Expanded state available via `aria-expanded`. Skeleton placeholder announced as busy.
- **Focus management:** Expand/collapse buttons receive keyboard focus. Focus is not trapped.

## Composition

Text utilities compose as building blocks:

- **Host directives:** `CngxExpandableText` composes `CngxTruncate` internally.
- **Combines with:** `CngxHighlight` + search input, `CngxTruncate` + truncate/expand toggle, `CngxSkeleton` + data load state.
- **Provides:** No injectable tokens.

### Example: Search Results with Highlighter

```typescript
@Component({
  selector: 'app-search-page',
  template: `
    <input [(ngModel)]="searchTerm" placeholder="Search…" />

    <div class="results">
      @for (result of searchResults(); track result.id) {
        <article>
          <h3>{{ result.title }}</h3>
          <p [cngxHighlight]="searchTerm()"
             [cngxTruncate]="3"
             [(expanded)]="expandedIds()[result.id]"
             #trunc="cngxTruncate">
            {{ result.excerpt }}
          </p>
          @if (trunc.isClamped()) {
            <button (click)="expandedIds()[result.id].set(!expandedIds()[result.id]())">
              {{ expandedIds()[result.id]() ? 'Show less' : 'Show more' }}
            </button>
          }
        </article>
      }
    </div>
  `,
  imports: [CngxHighlight, CngxTruncate],
})
export class SearchPageComponent {
  readonly searchTerm = signal('');

  performSearch() {
    // Search logic
  }
}
```

### Example: Loading Skeleton → Content

```typescript
@Component({
  selector: 'app-article-list',
  template: `
    <div [cngxSkeleton]="isLoading()" [count]="5" #sk="cngxSkeleton">
      @if (sk.loading()) {
        @for (i of sk.indices(); track i) {
          <div class="article-skeleton" aria-hidden="true">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
          </div>
        }
      } @else {
        @for (article of articles(); track article.id) {
          <article>
            <h3>{{ article.title }}</h3>
            <cngx-expandable-text [lines]="3">
              {{ article.content }}
            </cngx-expandable-text>
          </article>
        }
      }
    </div>
  `,
  imports: [CngxSkeleton, CngxExpandableText],
})
export class ArticleListComponent {
  readonly isLoading = signal(true);
  readonly articles = signal<Article[]>([]);

  constructor() {
    this.loadArticles();
  }

  loadArticles() {
    // Load and set articles
  }
}
```

## Styling

Text utilities expose CSS classes for consumer styling:

### CSS Custom Properties

- No component-specific CSS variables (minimal styling overhead).

### User Preference Handling

`CngxSkeleton` automatically respects `prefers-reduced-motion` — shimmer animation is disabled for users who prefer reduced motion.

## See Also

- [compodoc API documentation](http://localhost:4200/docs/common/layout)
- Demo: `dev-app/src/app/demos/common/text-demo/`
- Tests: `projects/common/layout/src/text/*.spec.ts`
- `CngxResizeObserver` in `@cngx/common/layout` — Used internally by `CngxTruncate` for overflow detection
