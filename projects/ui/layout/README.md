# Layout Components

Composable flex and grid layout components with CSS custom property theming.

## Import

```typescript
import { CngxGrid, CngxStack } from '@cngx/ui/layout';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxGrid, CngxStack } from '@cngx/ui/layout';

@Component({
  selector: 'app-example',
  template: `
    <cngx-stack direction="column" gap="lg" align="center">
      <h1>Welcome</h1>

      <cngx-grid columns="3" gap="24px">
        <div class="card">Card 1</div>
        <div class="card">Card 2</div>
        <div class="card">Card 3</div>
      </cngx-grid>
    </cngx-stack>
  `,
  imports: [CngxGrid, CngxStack],
})
export class ExampleComponent {}
```

## Overview

Layout components are minimal, stateless, pure CSS grid/flex wrappers. They use CSS custom properties with sensible defaults, allowing consumers to override spacing, direction, and alignment at any scope without re-binding inputs.

Both components use `display: contents` to avoid DOM nesting and work seamlessly in responsive contexts.

## CngxGrid

CSS Grid layout component with column control.

## CngxStack

Flex-based stack layout component with named gap tokens and alignment control.

| Input     | Type                                             | Default     | Description                                                                                                                    |
| --------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| direction | `'row' \| 'column'`                              | `'column'`  | Flex direction — stack items vertically (column) or horizontally (row).                                                        |
| gap       | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`      | Named gap token that resolves via CSS custom properties (`--cngx-gap-*`). Defaults: xs=4px, sm=8px, md=16px, lg=24px, xl=32px. |
| align     | `'start' \| 'center' \| 'end' \| 'stretch'`      | `'stretch'` | Cross-axis alignment. Maps to `align-items`: `flex-start`, `center`, `flex-end`, or `stretch`.                                 |

### Gap Defaults

| Token | Value | CSS Variable    |
| ----- | ----- | --------------- |
| none  | 0     | N/A             |
| xs    | 4px   | `--cngx-gap-xs` |
| sm    | 8px   | `--cngx-gap-sm` |
| md    | 16px  | `--cngx-gap-md` |
| lg    | 24px  | `--cngx-gap-lg` |
| xl    | 32px  | `--cngx-gap-xl` |

Override at any scope:

```scss
:host {
  --cngx-gap-md: 20px; // override default 16px
  --cngx-gap-lg: 32px; // override default 24px
}
```

## Composition Pattern

Stack and Grid are orthogonal and compose cleanly:

```typescript
<cngx-stack direction="column" gap="xl">
  <h1>Dashboard</h1>

  <cngx-grid columns="4" gap="lg">
    <cngx-stack direction="column" gap="md" align="center">
      <span class="metric">42</span>
      <span class="label">Users</span>
    </cngx-stack>
    <cngx-stack direction="column" gap="md" align="center">
      <span class="metric">1.2K</span>
      <span class="label">Sessions</span>
    </cngx-stack>
  </cngx-grid>

  <cngx-stack direction="row" gap="lg">
    <button>Primary</button>
    <button>Secondary</button>
  </cngx-stack>
</cngx-stack>
```

Both components use `display: flex` / `display: grid` at `:host` scope and `display: contents` for the wrapper. No additional DOM nesting.

Override flex/grid properties directly or via inputs:

```scss
// Direct override
cngx-grid {
  grid-auto-rows: minmax(100px, auto);
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

cngx-stack {
  flex-wrap: wrap;
}

// Via CSS variables
:host {
  --cngx-gap-md: 20px;
}
```

## Accessibility

Both components are purely structural — no ARIA roles, no focus management. They inherit accessibility properties from their children. A grid of cards, for example, relies on each card's own `role="article"` or `role="button"`.

## Performance

- **Zero JavaScript state** — Pure CSS grid/flex
- **Display: contents** — No extra DOM layer
- **No animation overhead** — Static layout, no transitions
- **Signal-free** — No change detection overhead for layout itself

Use these components as the foundation for responsive layouts without JavaScript weight.
