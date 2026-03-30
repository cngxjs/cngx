# Hoverable

Tracks hover state via mouse pointer.

## Import

```typescript
import { CngxHoverable } from '@cngx/common/interactive';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxHoverable } from '@cngx/common/interactive';

@Component({
  selector: 'app-card',
  template: `
    <div cngxHoverable #hover="cngxHoverable" [class.highlighted]="hover.hovered()">
      Hover me
    </div>
  `,
  imports: [CngxHoverable],
  styles: [`
    div.highlighted {
      background: rgba(0, 0, 0, 0.1);
    }
  `],
})
export class CardComponent {}
```

## API

### CngxHoverable

Directive that tracks hover state via mouseenter/mouseleave events.

#### Inputs

|-|-|-|-|
| cngxHoverable | — | — | Presence enables hover tracking (no value required) |

#### Outputs

|-|-|-|
| — | — | — |

#### Signals

- `hovered: WritableSignal<boolean>` — True while the pointer is over the host element

#### CSS Custom Properties

None

## Accessibility

CngxHoverable is a low-level interaction atom:

- **ARIA roles:** None (visual feedback only)
- **Keyboard interaction:** None (mouse-only, not keyboard-accessible)
- **Screen reader:** No announcements (purely visual feedback)
- **Focus management:** No focus changes

**Important:** Hover state is mouse-only. Use `cngxHoverable` for visual feedback only — never gate critical functionality behind hover states. Provide keyboard alternatives.

## Composition

CngxHoverable is typically used as a hostDirective composition primitive:

- **Host directives:** None (but often used as a hostDirective in other components)
- **Combines with:** Components that need hover styling
- **Provides:** Simple hover state signal for any component

### Example: Composition Pattern

```typescript
// As a hostDirective on a component
@Component({
  selector: 'app-table-row',
  hostDirectives: [CngxHoverable],
})
export class TableRowComponent {
  private readonly hover = inject(CngxHoverable, { host: true });
  readonly isHovered = this.hover.hovered;

  // In template: [class.highlighted]="isHovered()"
}

// Or standalone on any element
<div cngxHoverable #h="cngxHoverable" [class.highlight]="h.hovered()">
  Hover me
</div>
```

## Styling

CngxHoverable has no built-in styling. Use the `hovered()` signal to style as needed:

```scss
// Bind to CSS class
div[cngxHoverable][class.highlighted] {
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.2s;
}

// Or inline style
<div cngxHoverable #h="cngxHoverable"
     [style.background]="h.hovered() ? '#e0e0e0' : 'transparent'">
  Hover me
</div>
```

## Examples

### Card with Hover Highlight

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="card" cngxHoverable #hover="cngxHoverable"
         [class.elevated]="hover.hovered()">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </div>
  `,
  imports: [CngxHoverable],
  styles: [`
    .card {
      padding: 16px;
      border-radius: 8px;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .card.elevated {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
  `],
})
export class CardComponent {
  @Input() title = '';
  @Input() description = '';
}
```

### List Item with Hover Actions

```typescript
@Component({
  selector: 'app-list-item',
  template: `
    <div class="list-item" cngxHoverable #hover="cngxHoverable">
      <span class="label">{{ label }}</span>

      <!-- Actions visible only on hover -->
      @if (hover.hovered()) {
        <div class="actions">
          <button (click)="edit()">Edit</button>
          <button (click)="delete()">Delete</button>
        </div>
      }
    </div>
  `,
  imports: [CngxHoverable],
  styles: [`
    .list-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      border-bottom: 1px solid var(--color-border);
    }

    .actions {
      display: flex;
      gap: 8px;
      opacity: 0;
      animation: fadeIn 0.2s forwards;
    }

    @keyframes fadeIn {
      to { opacity: 1; }
    }
  `],
})
export class ListItemComponent {
  @Input() label = '';
  @Output() edited = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  edit() { this.edited.emit(); }
  delete() { this.deleted.emit(); }
}
```

### Table Row Highlight on Hover

```typescript
@Component({
  selector: 'app-table-row',
  template: `
    <tr cngxHoverable #row="cngxHoverable"
        [class.highlighted]="row.hovered()">
      <td>{{ item.id }}</td>
      <td>{{ item.name }}</td>
      <td>{{ item.email }}</td>
    </tr>
  `,
  imports: [CngxHoverable],
  styles: [`
    tr.highlighted {
      background: rgba(0, 0, 0, 0.05);
    }
  `],
})
export class TableRowComponent {
  @Input() item: any;
}
```

### Image Gallery with Zoom on Hover

```typescript
@Component({
  selector: 'app-gallery-item',
  template: `
    <img cngxHoverable #img="cngxHoverable"
         [src]="imageUrl"
         [class.zoomed]="img.hovered()"
         alt="{{ alt }}" />
  `,
  imports: [CngxHoverable],
  styles: [`
    img {
      display: block;
      width: 100%;
      transition: transform 0.3s ease;
      cursor: pointer;
    }

    img.zoomed {
      transform: scale(1.05);
    }
  `],
})
export class GalleryItemComponent {
  @Input() imageUrl = '';
  @Input() alt = '';
}
```

### Button Group with Hover State

```typescript
@Component({
  selector: 'app-button-group',
  template: `
    <div class="group">
      @for (btn of buttons; track btn.id) {
        <button cngxHoverable #hover="cngxHoverable"
                [class.active]="btn.active"
                [class.dimmed]="groupHovered() && !hover.hovered()"
                (click)="selectButton(btn)">
          {{ btn.label }}
        </button>
      }
    </div>
  `,
  imports: [CngxHoverable],
  styles: [`
    .group {
      display: flex;
      gap: 8px;
    }

    button {
      transition: opacity 0.2s;
    }

    button.dimmed {
      opacity: 0.5;
    }
  `],
  hostDirectives: [
    {
      directive: CngxHoverable,
      outputs: ['hovered'],
    }
  ],
})
export class ButtonGroupComponent {
  @Input() buttons: any[] = [];

  readonly groupHovered = inject(CngxHoverable, { host: true }).hovered;
}
```

### As HostDirective on Component

```typescript
@Component({
  selector: 'app-row',
  template: `
    <div class="row" [class.highlighted]="isHovered()">
      <ng-content />
    </div>
  `,
  styles: [`
    .row {
      padding: 12px;
      transition: background 0.2s;
    }

    .row.highlighted {
      background: var(--color-hover);
    }
  `],
  hostDirectives: [CngxHoverable],
})
export class RowComponent {
  // Inject the host directive to read hover state
  private readonly hoverable = inject(CngxHoverable, { host: true });
  protected readonly isHovered = this.hoverable.hovered;
}

// Usage:
<app-row>
  Content that responds to row hover
</app-row>
```

### Tooltip on Hover

```typescript
@Component({
  selector: 'app-help-icon',
  template: `
    <div cngxHoverable #hover="cngxHoverable">
      <svg class="icon" aria-hidden="true"><!-- help icon --></svg>

      @if (hover.hovered()) {
        <div class="tooltip">
          {{ helpText }}
        </div>
      }
    </div>
  `,
  imports: [CngxHoverable],
  styles: [`
    div {
      position: relative;
      display: inline-block;
    }

    .icon {
      width: 20px;
      height: 20px;
      cursor: help;
    }

    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 0.875rem;
      white-space: nowrap;
      pointer-events: none;
      margin-bottom: 4px;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
  `],
})
export class HelpIconComponent {
  @Input() helpText = '';
}
```

## Implementation Notes

### Mouse-Only Interaction

CngxHoverable uses mouseenter/mouseleave events, which are **mouse-only**. Touch and keyboard users will not trigger hover state.

This is appropriate for:
- Visual polish (shadows, highlights, animations)
- Non-critical UI (hidden actions on hover)
- Aesthetic effects

This is **NOT appropriate for**:
- Critical functionality (hide important controls behind hover)
- Essential information (show important content only on hover)

Always provide keyboard alternatives for any functionality that depends on hover.

### Writable Signal

The `hovered` signal is writable (`WritableSignal<boolean>`), allowing parent components to manually control hover state if needed:

```typescript
const hover = inject(CngxHoverable, { host: true });
hover.hovered.set(true);  // Force hover state
```

This is rarely needed but enables special cases like testing or forced states.

## See Also

- [compodoc API documentation](../../../../../../../docs/modules/CngxHoverable.html)
- [CngxPressable](../ripple/) — Press feedback (pointer-down)
- [CngxRipple](../ripple/) — Ripple animation (pointer-down)
- Demo: `dev-app/src/app/demos/common/hoverable-demo/`
- Tests: `projects/common/interactive/src/hoverable/hoverable.directive.spec.ts`
