# Roving Tabindex

Implements the WAI-ARIA roving tabindex pattern for composite widgets. Enables keyboard navigation within a group of items while maintaining a single tab stop, and supports disabled items and custom navigation axes.

## Directives

### CngxRovingTabindex

Container directive implementing the roving tabindex pattern. Only the active item has `tabindex="0"`; all others get `tabindex="-1"`. Arrow keys navigate within the group; Tab leaves it.

#### Keyboard Interactions

- `ArrowRight` (horizontal/both): Move to next enabled item
- `ArrowLeft` (horizontal/both): Move to previous enabled item
- `ArrowDown` (vertical/both): Move to next enabled item
- `ArrowUp` (vertical/both): Move to previous enabled item
- `Home`: Jump to first enabled item
- `End`: Jump to last enabled item
- `Tab`: Leave the group (browser default)

Under `dir="rtl"` the horizontal arrows flip: `ArrowLeft` moves to the next item, `ArrowRight` to the previous one. Vertical arrows, Home and End are unaffected.

The group leaves a key alone when it carries Ctrl, Cmd or Alt, arrives already `preventDefault()`ed, belongs to an IME composition, comes from a text field (an `<input>` item or a field inside an item), or comes from a nested widget that owns its arrows (range input, slider, spinbutton, listbox, grid, menu, tablist and similar roles).

#### Example

```typescript
// Horizontal toolbar
<div cngxRovingTabindex orientation="horizontal">
  <button cngxRovingItem>Cut</button>
  <button cngxRovingItem>Copy</button>
  <button cngxRovingItem>Paste</button>
</div>

// Vertical menu with controlled index
<ul cngxRovingTabindex orientation="vertical" [(activeIndex)]="selectedIdx">
  @for (item of items(); track item.id) {
    <li cngxRovingItem>{{ item.label }}</li>
  }
</ul>

// Card grid with wrapping and loop
<div cngxRovingTabindex orientation="both" [loop]="true">
  @for (card of cards(); track card.id) {
    <div cngxRovingItem role="article">
      {{ card.title }}
    </div>
  }
</div>
```

### CngxRovingItem

Marker directive for focusable items within a `[cngxRovingTabindex]` container. The parent sets `tabindex` dynamically; the item must not manually set `tabindex`.

#### Example

```typescript
// Basic item
<button cngxRovingItem>Option 1</button>

// Disabled item (skipped during navigation)
<button cngxRovingItem [cngxRovingItemDisabled]="item.disabled">
  {{ item.label }}
</button>

// With custom content
<div cngxRovingItem role="option" aria-selected="false">
  <span>{{ item.name }}</span>
  <span>{{ item.count }}</span>
</div>
```

## Composition

`CngxRovingTabindex` works with any child elements that receive `cngxRovingItem`. It does not require specific HTML elements or roles.

### CngxCardGrid

`CngxCardGrid` (`@cngx/common/card`) automatically composes `CngxRovingTabindex` as a `hostDirective`, enabling keyboard navigation across cards without explicit wiring.

```typescript
<cngx-card-grid [items]="cards()" orientation="both">
  @for (card of cards(); track card.id) {
    <cngx-card [as]="'article'">
      {{ card.title }}
    </cngx-card>
  }
</cngx-card-grid>
```

## Accessibility

Roving tabindex is a core WAI-ARIA pattern for composite widgets:

- **Single tab stop**: Only the active item can be reached via Tab (WCAG 2.1 SC 2.1.1)
- **Keyboard navigation**: Arrow keys move the active item (WCAG 2.1 SC 2.1.1)
- **Disabled items**: Automatically skipped during navigation (WCAG 2.1 SC 2.4.3)
- **Semantic HTML**: Works with any focusable element (`<button>`, `<a>`, `[tabindex]`)
- **ARIA roles**: Consumer applies roles (`role="toolbar"`, `role="menubar"`, etc.) - roving tabindex is role-agnostic

### ARIA Requirements

The consumer is responsible for providing semantically correct roles:

- **Toolbars**: Apply `role="toolbar"` on the container
- **Tab lists**: Apply `role="tablist"` on the container; `role="tab"` on items
- **Menu bars**: Apply `role="menubar"` on the container; `role="menuitem"` on items
- **Listboxes**: Apply `role="listbox"` on the container; `role="option"` on items

## Advanced Patterns

### Programmatic Selection

```typescript
readonly roving = viewChild(CngxRovingTabindex);
readonly rovingItems = viewChildren(CngxRovingItem);

selectItemAt(index: number): void {
  // Moves the tab stop only; writing activeIndex does not move focus.
  this.roving()?.activeIndex.set(index);
  this.rovingItems()[index]?.focus();
}
```

Only arrow / Home / End presses move focus; a programmatic write updates `tabindex` and leaves focus where it is.

### Two-Way Binding

```typescript
// Template
<div cngxRovingTabindex [(activeIndex)]="selectedIdx">
  @for (item of items(); track item.id) {
    <button cngxRovingItem>{{ item }}</button>
  }
</div>

// Component
protected readonly selectedIdx = signal(0);
```

### Dynamic Item Lists

```typescript
<div cngxRovingTabindex [loop]="true">
  @for (item of dynamicItems(); track item.id) {
    <button cngxRovingItem [cngxRovingItemDisabled]="item.disabled">
      {{ item.label }}
    </button>
  }
</div>
```

When the list changes and `activeIndex` did not, the item that held the tab stop is looked up again by element: a removal or reorder before it keeps the stop on that item and rewrites `activeIndex` to its new position. If the item is gone, the index is clamped to the list; a disabled target falls back to the first enabled item. An empty list leaves `activeIndex` untouched, so a repopulated list restores it.

### Virtual Mode

Bind `virtualCount` to the full item count when only a window of items is rendered (recycler / virtual scroll). `activeIndex` then ranges over `[0, virtualCount)`, items are matched by their `data-cngx-recycle-index` attribute (written by `CngxVirtualItem` / `CngxMeasure`), and disabled items are not skipped. While the active index is outside the rendered window, the nearest rendered item keeps the tab stop.

An arrow press to an unrendered index sets the read-only `pendingFocus` signal. `connectRecyclerToRoving(recycler, roving)` from `@cngx/common/data` scrolls that index into view, focuses the item and calls `clearPendingFocus()`.

```html
<div cngxRovingTabindex orientation="vertical" [virtualCount]="recycler.ariaSetSize()">
  @for (item of visibleItems(); track item.id; let i = $index) {
    <div cngxRovingItem [cngxVirtualItem]="recycler" [cngxVirtualItemIndex]="recycler.start() + i">
      {{ item.name }}
    </div>
  }
</div>
```

### Navigation-Key Handshake

`consumeNavigationKey()` returns `true` once when the last focus move came from an arrow / Home / End press, then resets. A group that auto-selects on arrow (radio group, button-toggle group) calls it from the newly focused item's `(focus)` handler, so Tab into the group does not select.

## Styling

Roving tabindex manages `tabindex` attributes only; styling is the consumer's responsibility.

`CngxRovingItem` writes no attribute or class for `cngxRovingItemDisabled`. Bind one yourself to expose the state to assistive tech and CSS:

```html
<button cngxRovingItem [cngxRovingItemDisabled]="item.disabled" [attr.aria-disabled]="item.disabled || null">
  {{ item.label }}
</button>
```

```scss
// Highlight the active item
[cngxRovingItem]:focus {
  outline: 2px solid var(--focus-color, blue);
  background-color: var(--active-bg, #f0f0f0);
}

// Disabled items
[cngxRovingItem][aria-disabled='true'] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Common Use Cases

| Widget | Orientation | Loop | Notes |
|-|-|-|-|
| Toolbar | `horizontal` | `false` | No wrapping; Arrow keys move between buttons |
| Tab bar | `horizontal` | `false` | Tab-like navigation; Home/End select first/last |
| Menu bar | `horizontal` | `true` | Arrow keys move between menu items; loops |
| Vertical menu | `vertical` | `true` | Up/Down navigate; loops to opposite end |
| Card grid | `both` | `true` | Both axes enabled; full 2D navigation |
| Combobox popup | `vertical` | `false` | Up/Down select options; no wrapping |

## See Also

- [CngxCardGrid](../../card/README.md) - Automatic roving tabindex for card layouts
- [CngxAriaExpanded](../aria/README.md) - Pair with roving tabindex for disclosure patterns
- Compodoc API documentation: `npm run docs:serve`
- [WAI-ARIA: Roving Tabindex](https://www.w3.org/WAI/ARIA/apg/patterns/roving_tabindex/)
