# CngxCard

Semantic card component that adapts its host element role based on the archetype (article/button/link). The host element **is** the semantic element — no inner wrapper, no double focus rings.

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
  imports: [CngxCard, CngxCardGrid, CngxCardHeader, CngxCardBody, CngxCardTitle],
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
