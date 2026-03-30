# CngxCard

Semantic card component that adapts its host element role based on the archetype (article/button/link). The host element **is** the semantic element — no inner wrapper, no double focus rings.

## Import

```typescript
import {
  CngxCard,
  CngxCardGrid,
  CngxCardSkeleton,
  CngxCardHeader,
  CngxCardBody,
  CngxCardFooter,
  CngxCardMedia,
  CngxCardActions,
  CngxCardBadge,
  CngxCardAccent,
  CngxCardTitle,
  CngxCardSubtitle,
  CngxCardTimestamp,
  CngxCardGridEmpty,
} from '@cngx/common/card';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import {
  CngxCard,
  CngxCardGrid,
  CngxCardHeader,
  CngxCardBody,
  CngxCardTitle,
} from '@cngx/common/card';

@Component({
  selector: 'app-example',
  template: `
    <cngx-card-grid [items]="items()">
      @for (item of items(); track item.id) {
        <cngx-card as="button" (clicked)="onSelect(item)">
          <header cngxCardHeader>
            <h3 cngxCardTitle>{{ item.name }}</h3>
          </header>
          <div cngxCardBody>{{ item.description }}</div>
        </cngx-card>
      }
    </cngx-card-grid>
  `,
  imports: [
    CngxCard,
    CngxCardGrid,
    CngxCardHeader,
    CngxCardBody,
    CngxCardTitle,
  ],
})
export class ExampleComponent {
  items = signal([
    { id: 1, name: 'Patient A', description: 'Active monitoring' },
    { id: 2, name: 'Patient B', description: 'In recovery' },
  ]);

  onSelect(item: (typeof this.items)[0]) {
    console.log('Selected:', item);
  }
}
```

## API

### CngxCard Component

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `as` | `'article' \| 'button' \| 'link'` | `'article'` | Semantic archetype; controls host element role and behavior |
| `href` | `string \| undefined` | `undefined` | Navigation URL for link cards; applied as `href` on host |
| `ariaLabel` | `string \| undefined` | `undefined` | Accessible label; overrides default SR announcement |
| `selected` | `boolean` | `false` | Two-way selection state (via model); only when `selectable=true` |
| `selectable` | `boolean` | `false` | Whether the card supports selection toggling |
| `loading` | `boolean` | `false` | Loading state; sets `aria-busy` and SR announcement |
| `disabled` | `boolean` | `false` | Disabled state; prevents interaction and sets `aria-disabled` |
| `disabledReason` | `string \| undefined` | `undefined` | Explanation for why disabled; communicated via `aria-describedby` to SR |

#### Outputs

| Output | Emits | Description |
|-|-|-|
| `clicked` | `void` | When an interactive card is clicked or activated via keyboard (Enter/Space) |

#### Signals

| Signal | Type | Description |
|-|-|-|
| `interactive` | `Signal<boolean>` | Computed: `true` when `as !== 'article'` |
| `state` | `Signal<'closed' \| 'opening' \| 'open' \| 'closing'>` | Current lifecycle state (Roving Tabindex) |

#### CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-card-bg` | Inherited | Background color |
| `--cngx-card-border` | `1px solid var(--cngx-border, #e0e0e0)` | Border styling |
| `--cngx-card-padding` | `16px` | Inner padding |
| `--cngx-card-gap` | `16px` | Gap between card sections |
| `--cngx-card-radius` | `8px` | Border radius |
| `--cngx-card-shadow` | `0 2px 8px rgba(0,0,0,0.08)` | Box shadow |
| `--cngx-card-hover-bg` | `#f9fafb` | Background on hover (interactive cards) |
| `--cngx-card-disabled-opacity` | `0.5` | Opacity when disabled |
| `--cngx-card-loading-opacity` | `0.7` | Opacity when loading |

#### Slot Directives

All slot directives add semantic classes and position elements within the card:

- **`[cngxCardHeader]`** — Must be placed on `<header>`. Renders before body.
- **`[cngxCardBody]`** — Main content area.
- **`[cngxCardFooter]`** — Must be placed on `<footer>`. Renders after body.
- **`[cngxCardMedia]`** — Image/video region. Inputs: `[decorative]` (default `true` — hidden from SR), `[aspectRatio]` (`'16/9' | '4/3' | '1/1' | 'auto'`).
- **`[cngxCardTitle]`** — Primary heading inside header. Adds font sizing/weight.
- **`[cngxCardSubtitle]`** — Secondary text below title.
- **`[cngxCardActions]`** — Action buttons area. Inputs: `[align]` (`'start' | 'end'`, default `'start'`).
- **`[cngxCardBadge]`** — Status indicator positioned at corner. Inputs: `[position]` (`'top-start' | 'top-end' | 'bottom-start' | 'bottom-end'`, default `'top-end'`).
- **`[cngxCardAccent]`** — Color-coded severity accent (top border + tinted background). Inputs: `[cngxCardAccent]` (`'info' | 'success' | 'warning' | 'danger' | 'neutral'`, default `'neutral'`).

### CngxCardGrid Component

Responsive card grid with intrinsic sizing, keyboard navigation, and reason-based empty-state templates. Composes `CngxRovingTabindex` as a host directive.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `minWidth` | `string` | `'280px'` | Minimum card width for CSS Grid `minmax()` |
| `gap` | `string` | `'var(--cngx-gap-md, 16px)'` | Gap between grid items |
| `density` | `'compact' \| 'default' \| 'comfortable'` | `'default'` | Grid density level; controls spacing via CSS classes |
| `semanticList` | `boolean` | `false` | When `true`, renders `role="list"` (requires `role="listitem"` on cards) |
| `items` | `readonly unknown[] \| undefined` | `undefined` | Optional data source; when empty, shows matching empty-state template |
| `emptyReason` | `'first-use' \| 'no-results' \| 'cleared' \| undefined` | `undefined` | Reason for empty state; selects matching `cngxCardGridEmpty` template |
| `state` | `CngxAsyncState<unknown> \| undefined` | `undefined` | Bind async state; drives `isLoading` from `isFirstLoad()` and `empty` from `isEmpty()` |

#### Outputs

| Output | Emits | Description |
|-|-|-|
| (from CngxRovingTabindex) | - | Keyboard navigation Arrow/Home/End handled automatically |

#### Signals

| Signal | Type | Description |
|-|-|-|
| `isLoading` | `Signal<boolean>` | `true` during initial load (skeleton phase) |
| `empty` | `Signal<boolean>` | `true` when grid should show empty state |
| `activeEmptyTemplate` | `Signal<TemplateRef \| undefined>` | Selected template matching `emptyReason` (falls back to reason-less template) |

#### CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-card-grid-min` | Set dynamically from `minWidth` input | Minimum card width in CSS Grid |
| `--cngx-card-grid-gap` | Set from `gap` input (in default density) | Grid gap |
| `--cngx-card-grid-padding` | Varies by density | Padding inside cards in dense/comfortable modes |

#### Empty-State Template Selection

Use `ng-template[cngxCardGridEmpty]` to define reason-specific empty states:

```html
<cngx-card-grid [items]="items()" [emptyReason]="reason()">
  <ng-template cngxCardGridEmpty="no-results">
    <cngx-empty-state title="No matching results" />
  </ng-template>
  <ng-template cngxCardGridEmpty="first-use">
    <cngx-empty-state title="Get started" />
  </ng-template>
  <ng-template cngxCardGridEmpty>
    <!-- Fallback when no reason matches -->
    <cngx-empty-state title="Nothing here" />
  </ng-template>
</cngx-card-grid>
```

### CngxCardSkeleton Component

Skeleton placeholder for card content during loading. Renders shimmer rectangles for typical card patterns.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `lines` | `number` | `3` | Number of body text lines to show |
| `showMedia` | `boolean` | `false` | Whether to show a media placeholder block |

#### Usage

```html
<cngx-card [loading]="loading()">
  @if (loading()) {
    <cngx-card-skeleton [lines]="3" [showMedia]="true" />
  } @else {
    <header cngxCardHeader>...</header>
    <div cngxCardBody>...</div>
  }
</cngx-card>
```

### CngxCardTimestamp Component

Displays a formatted date/timestamp using `Intl.DateTimeFormat` with injected `LOCALE_ID`.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `date` | `Date \| string` | Required | Date to display; accepts Date objects or ISO strings |
| `prefix` | `string \| undefined` | `undefined` | Optional prefix text (e.g. "Evaluierung am:") |
| `format` | `Intl.DateTimeFormatOptions \| undefined` | `{ year: 'numeric', month: '2-digit', day: '2-digit' }` | Intl format options |

#### Usage

```html
<footer cngxCardFooter>
  <cngx-card-timestamp
    [date]="evaluationDate()"
    prefix="Evaluated:"
    [format]="{ year: 'numeric', month: 'long', day: 'numeric' }"
  />
</footer>
```

## Accessibility

CngxCard is fully accessible:

- **ARIA roles:** `role="article"` (default), `role="button"`, or `role="link"` based on `as` input
- **Keyboard interaction:**
  - `Enter` / `Space`: Activate interactive cards (button/link)
  - `Arrow Left/Right`: Navigate cards in grid (CngxRovingTabindex)
  - `Home` / `End`: Jump to first/last card in grid
- **Screen reader:** `aria-busy` when loading; live region announces "Loading", "Selected", "Deselected" state changes; `aria-describedby` points to disabled reason explanation
- **Focus management:** Interactive cards get `tabindex="0"` when standalone; CngxCardGrid's roving tabindex manages focus among cards

## Composition

CngxCard composes `CngxRovingItem` as a host directive for keyboard navigation within `CngxCardGrid`.

CngxCardGrid composes `CngxRovingTabindex` as a host directive — all arrow key/Home/End navigation is built in automatically.

### Example: Card with Async State

```typescript
readonly loadState = injectAsyncState(() => this.loadData$);

readonly items = computed(() => this.loadState().data() ?? []);
readonly emptyReason = computed(() => {
  if (this.loadState().isLoading()) return 'first-use';
  return this.items().length === 0 ? 'no-results' : undefined;
});
```

```html
<cngx-card-grid
  [items]="items()"
  [emptyReason]="emptyReason()"
  [state]="loadState()"
>
  @for (item of items(); track item.id) {
    <cngx-card as="button" (clicked)="selectItem(item)">
      <header cngxCardHeader>
        <h3 cngxCardTitle>{{ item.name }}</h3>
      </header>
      <div cngxCardBody>{{ item.description }}</div>
    </cngx-card>
  }

  <ng-template cngxCardGridEmpty="no-results">
    <cngx-empty-state title="No patients found" />
  </ng-template>
</cngx-card-grid>
```

## Styling

All colors, spacing, and sizes use CSS Custom Properties with sensible Material 3 defaults.

```scss
// Override in your component
:host {
  --cngx-card-bg: #ffffff;
  --cngx-card-padding: 20px;
  --cngx-card-radius: 12px;
  --cngx-card-shadow: 0 4px 12px rgba(0,0,0,0.12);
}
```

### Density Variants

CngxCardGrid supports three density levels via the `density` input:
- `'compact'` — minimal spacing, dense layout
- `'default'` — standard spacing
- `'comfortable'` — generous spacing

Each applies CSS classes (`cngx-card-grid--compact`, `cngx-card-grid--comfortable`) to enable per-density styling.

### Interactive Card Styling

When `as="button"` or `as="link"`, cards receive:
- `cngx-card--interactive` class
- `cngx-card--selected` class when selected
- `cngx-card--loading` class when loading
- `cngx-card--disabled` class when disabled
- `:hover` styling (background color, shadow elevation)

## Examples

### Article Card (Display Only)

```html
<cngx-card>
  <img cngxCardMedia alt="Patient photo" src="patient.jpg" />
  <header cngxCardHeader>
    <h3 cngxCardTitle>Maria Müller</h3>
    <span cngxCardSubtitle>Room 12, Ward 3A</span>
  </header>
  <div cngxCardBody>
    <p>Last assessment: 2 days ago</p>
    <p>Status: Stable</p>
  </div>
</cngx-card>
```

### Button Card with Selection

```html
<cngx-card
  as="button"
  [selectable]="true"
  [(selected)]="isSelected"
  (clicked)="onCardClick()"
>
  <header cngxCardHeader>
    <h3 cngxCardTitle>Select Action</h3>
  </header>
  <div cngxCardBody>Choose an option below</div>
  <div cngxCardActions align="end">
    <button type="button">Apply</button>
  </div>
</cngx-card>
```

### Link Card with Badge and Accent

```html
<cngx-card as="link" href="/patients/42" cngxCardAccent="warning">
  <cngx-status-badge cngxCardBadge status="pending" />
  <img cngxCardMedia alt="Patient" src="avatar.jpg" [aspectRatio]="'1/1'" />
  <header cngxCardHeader>
    <h3 cngxCardTitle>View Patient</h3>
  </header>
  <div cngxCardBody>Patient requires attention</div>
  <footer cngxCardFooter>
    <cngx-card-timestamp [date]="assessmentDate()" prefix="Last seen:" />
  </footer>
</cngx-card>
```

### Responsive Grid with Async Loading

```html
<cngx-card-grid
  minWidth="280px"
  density="default"
  [items]="patients()"
  [state]="patientsState()"
>
  @for (patient of patients(); track patient.id) {
    <cngx-card as="link" [href]="'/patients/' + patient.id">
      <img cngxCardMedia [decorative]="false" [src]="patient.photoUrl" />
      <header cngxCardHeader>
        <h3 cngxCardTitle>{{ patient.name }}</h3>
      </header>
      <div cngxCardBody>{{ patient.diagnosis }}</div>
    </cngx-card>
  }

  <ng-template cngxCardGridEmpty="no-results">
    <div style="padding: 2rem; text-align: center;">
      <p>No patients match your search.</p>
    </div>
  </ng-template>
</cngx-card-grid>
```

## Material Theme

CngxCard ships with Material 3 styling via CSS custom properties. To apply full Material theming (density, typography, color tokens), import the theme file in your global styles:

```scss
@import '@cngx/common/card/card-theme';

@include cngx-card-theme($material-theme);
@include cngx-card-density(-1); // compact
```

Density levels:
- `-2` → extra compact
- `-1` → compact
- `0` → default (Material default)
- `1` → comfortable

## See Also

- [compodoc API documentation](https://cngxjs.dev/docs/modules/common_card.html)
- Demo: `dev-app/src/app/demos/common/card-demo/`
- Tests: `projects/common/card/src/` (spec files)
