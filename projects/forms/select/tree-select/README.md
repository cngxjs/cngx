# CngxTreeSelect

Multi-value select backed by a hierarchical tree. Same chip-summary trigger as [`CngxMultiSelect`](../multi-select/README.md), but the panel renders a `role="tree"` body with W3C-APG keyboard navigation.
Optional cascade-toggle for select-all-descendants.

## When to use

- Selecting multiple values from a hierarchical option tree (folders, org-charts, permission groups, taxonomy nodes).
- ARIA tree popup semantics (`role="tree"` + `aria-expanded` per parent).

For flat multi-select reach for [`CngxMultiSelect`](../multi-select/README.md).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxTreeSelect, type CngxTreeNode } from '@cngx/forms/select';

@Component({
  selector: 'app-stack-picker',
  imports: [CngxTreeSelect],
  template: `
    <cngx-tree-select
      [label]="'Stack'"
      [nodes]="tree"
      [nodeIdFn]="nodeId"
      [(values)]="values"
      placeholder="Pick stack components…"
    />
  `,
})
export class StackPicker {
  protected readonly values = signal<string[]>([]);
  protected readonly nodeId = (v: string): string => v;
  protected readonly tree: CngxTreeNode<string>[] = [
    {
      value: 'frontend',
      label: 'Frontend',
      children: [
        { value: 'angular', label: 'Angular' },
        { value: 'react', label: 'React' },
      ],
    },
    {
      value: 'backend',
      label: 'Backend',
      children: [
        { value: 'node', label: 'Node' },
        { value: 'go', label: 'Go' },
      ],
    },
  ];
}
```

## Forms integration

Identical to [`CngxMultiSelect`](../multi-select/README.md#forms-integration). The `Field<T[]>` syncs bidirectionally with `(values)`.

## Common patterns

### Cascade-select descendants

```html
<cngx-tree-select [nodes]="tree" [nodeIdFn]="nodeId" [(values)]="values" [cascadeChildren]="true" />
```

Single-toggle path (node-row click without cascade) deselects exactly one value. Cascade-toggle (parent click with `cascadeChildren=true`) selects/deselects the whole subtree atomically and emits one `selectionChange` with `action: 'cascade-toggle'`. Disabled descendants keep their state either way.

### Chip display and overflow

```html
<cngx-tree-select [nodes]="tree" [nodeIdFn]="nodeId" [(values)]="values" [cascadeChildren]="true" chipDisplay="parents" [maxVisibleChips]="3" />
```

`chipDisplay` picks which selected nodes become trigger chips:

| Value | Chips |
|-|-|
| `'parents'` | One chip for the topmost fully selected node; its descendants get no chip of their own. Default with `cascadeChildren`. |
| `'leaves'` | A fully selected parent gets no chip; its selected descendants do. |
| `'all'` | Every selected value. Default without `cascadeChildren`. |

A parent is fully selected when its own value and every enabled descendant are selected. Removing a summarizing parent chip in `'parents'` deselects its subtree in one `cascade-toggle` commit; every other chip deselects its one value. The chip slot's `remove()` follows the same rule.

On a fine pointer the strip stays on one line: the first `maxVisibleChips` displayed chips (default `CNGX_SELECT_CONFIG.maxVisibleChips`, 3) render, the last one ellipsizes when space runs out, and the rest fold into a `+N` chip (`*cngxSelectChipOverflow`). The trigger height does not change with the selection. The `+N` chip is `aria-hidden`; while values are hidden a visually hidden summary carries the whole displayed selection, so a screen reader hears every chip. Under the touch floor the trigger shows the one-line summary from the same displayed list.

### Parent counts and footer

Each parent row shows a muted selected-of-total count at its inline end (`2/3`) once a descendant is selected; descendants of every level count. The count is `aria-hidden`, since `aria-checked` (`true` / `mixed` / `false`) already carries the state. `*cngxTreeSelectNodeCount` replaces it and renders for every parent, zero included.

Below the tree the panel shows a footer with the selected count and a clear-all button. Clear-all runs the commit-aware clear (announcement, `cleared`, `selectionChange`) and keeps focus in the panel. It shows whether or not `[clearable]` is set (that input governs the trigger ✕ only); with nothing selected it is `aria-disabled` and described by the count. Its label follows the trigger clear button: `clearButtonAriaLabel`, then `CNGX_SELECT_CONFIG.ariaLabels.clearButton`, then the `select.resetSelection` copy. `*cngxTreeSelectFooter` replaces the footer.

### Custom node-row rendering

```html
<cngx-tree-select [nodes]="tree" [nodeIdFn]="nodeId" [(values)]="values">
  <ng-template
    cngxTreeSelectNode
    let-node
    let-toggleExpand="toggleExpand"
    let-handleSelect="handleSelect"
  >
    <div [style.padding-left]="node.depth + 'rem'" (click)="handleSelect()">
      <button (click)="toggleExpand(); $event.stopPropagation()">
        @if (node.expanded) { ▾ } @else { ▸ }
      </button>
      <span>{{ node.label }}</span>
      @if (node.selected) { ✓ }
    </div>
  </ng-template>
</cngx-tree-select>
```

Context: `{ node, depth, expanded, hasChildren, selected, indeterminate, disabled, selectedCount, descendantCount, toggleExpand, handleSelect }`. `selectedCount` / `descendantCount` are the selected and total descendants of every level (`0` on a leaf).
The projected markup owns the whole treeitem: carry `role="treeitem"`, `[attr.id]="node.id"` (already unique per instance, see below), aria-level / posinset / setsize, and mirror `aria-checked` from the context's `selected` / `indeterminate` flags (`'mixed'` when indeterminate - APG checkbox-tree).

### Node ids

Every node id is prefixed per instance: `node.id`, `node.parentIds`, the `selectionChange` node and every `treeController` id read `<instance prefix>-<nodeIdFn result>`, so two trees on one page never share a treeitem id or an `aria-activedescendant` target. Pass ids read from those surfaces back unchanged. `[initiallyExpanded]` still takes raw `nodeIdFn` ids.

Migrating from raw ids: code that called `treeController.expand` / `collapse` / `toggle` / `isExpanded` / `findById` / `reveal` with a raw `nodeIdFn` id looks the node up by value instead:

```ts
const id = tree.treeController.findByValue(value)?.id;
if (id) {
  tree.treeController.expand(id);
}
```

### Custom chip / trigger summary

`*cngxTreeSelectChip` overrides individual chips; `*cngxTreeSelectTriggerLabel` replaces the entire chip strip.
Same context shape as the multi-select equivalents - see [`ARCHITECTURE.md`](../../../ARCHITECTURE.md#template-slot-system).

## Mobile sheet

On a touch screen narrower than 48rem the panel opens as a modal bottom sheet, named by the field label, with a close button, Done and a decorative handle. Focus moves into the sheet and back to the trigger on close. Force a presentation with `[presentation]` (`'anchored'`, `'sheet'`, `'fullscreen'`), set the title with `[sheetLabel]`, or turn the sheet off with `withMobileSheet('off')`. Details: [Mobile sheet](../README.md#mobile-sheet).

In the sheet the selected count sits after the title (`*cngxSelectSheetCount`) and the panel footer becomes the bottom Clear bar; Done stays in the header.

## Touch

Under the touch floor (`--cngx-target-min` above `0px`: `(any-pointer: coarse)`, `[cngxTouchTarget]="'on'"` or `data-touch="on"`) rows grow to the 44px floor, the leaf spacer floors like the twisty and the indent step grows with it, so every child stays inline-end of its parent (mirrored under RTL).

A finger or pen tap on a parent row expands or collapses it; a tap on its checkbox selects. The row expands only for the `click` that ends a `pointerdown` with `pointerType` `touch` or `pen` on that row. Every other activation selects, as `aria-checked` on a treeitem promises: a mouse click, Enter / Space, and a screen reader's double tap (VoiceOver and TalkBack activate with a click that has no pointer events). Screen readers expand through `aria-expanded` (TalkBack actions, ArrowRight / ArrowLeft). A fine pointer and the keyboard behave as before.

## Template slots

All [`CngxMultiSelect` shared slots](../multi-select/README.md#template-slots) (placeholder / loading / error / commitError / retry / etc.) plus:

| Slot | Replaces |
|-|-|
| `*cngxTreeSelectNode` | Per-node row markup |
| `*cngxTreeSelectChip` | Per-chip in the trigger strip |
| `*cngxTreeSelectTriggerLabel` | Whole chip strip with text/badge summary |
| `*cngxSelectChipOverflow` | The `+N` chip after `maxVisibleChips`, and the badge of the touch summary |
| `*cngxTreeSelectNodeCount` | The selected-of-total count on a parent row (config `templates.treeNodeCount`) |
| `*cngxTreeSelectFooter` | The panel footer with count and clear-all, the bottom bar in the sheet (config `templates.treeFooter`) |
| `*cngxSelectSheetCount` | The selected count after the sheet title (config `templates.sheetCount`) |

Copy: the node count uses `select.treeNodeCount` (`{selected}/{total}`), the footer and sheet count `select.selectedCount` (`{count} selected`), both through `CNGX_SELECT_CONFIG.fallbackLabels` and the language pack.

## Theming

Tokens added for the tree skin, all with fallbacks (full list in the Theming tab):

| Token | Default | Effect |
|-|-|-|
| `--cngx-tree-select-panel-min-inline-size` | `16rem` | Minimum anchored panel width, never below the trigger |
| `--cngx-tree-select-panel-max-block-size` | `20rem` | Anchored panel height before it scrolls |
| `--cngx-tree-select-guide-width` | `1px` | Depth guide lines; `0px` switches them off |
| `--cngx-tree-select-guide-color` | `--cngx-color-border` | Guide line colour (GrayText under forced colors) |
| `--cngx-tree-select-node-selected-font-weight` | `600` | Label weight of a checked row |
| `--cngx-tree-select-node-selected-bg` | `transparent` | Opt-in fill for a checked row |
| `--cngx-tree-select-twisty-size` | `1.25rem` | Chevron box, floored by `--cngx-target-min` |
| `--cngx-tree-select-count-color` | muted text | Parent count and footer count colour |
| `--cngx-tree-select-footer-gap` / `-padding` / `-border` | spacing / border tokens | Footer layout |
| `--cngx-tree-select-chip-remove-gap` | `0px` | Extra space before a chip's remove button |

The anchored panel aligns to the trigger's inline-start edge and grows toward inline-end; it flips when the viewport has no room.

## Default changes in 0.1.0

Not migratable by a schematic; each has a way back.

| Change | Before | Way back |
|-|-|-|
| A fully selected subtree shows one chip (`chipDisplay` `'parents'` with `cascadeChildren`); removing it clears the subtree | Parent chip plus every child chip; chip ✕ always single-deselect | `chipDisplay="all"`: every value gets a chip and each ✕ deselects one value |
| The chip strip stays on one line with a `+N` chip after `maxVisibleChips` | Every chip, wrapping onto more lines | Raise `[maxVisibleChips]` to show more chips on the line, or project `*cngxTreeSelectTriggerLabel` for a custom (also wrapping) strip |
| Under the touch floor a finger tap on a parent row expands it | A tap on the row selected the subtree | Tap the checkbox to select; `[cngxTouchTarget]="'off'"` on an ancestor drops the floor and the row tap, or a projected `*cngxTreeSelectNode` row owns its click |
| A checked row has no fill; the checkbox and a heavier label weight carry the selection (also under the Material bridge) | Selected rows were filled | `--cngx-tree-select-node-selected-bg` sets a fill again |

## Keyboard

W3C-APG treeview pattern. Active-descendant navigation; focus stays
on the trigger.

| Key | Behaviour |
|-|-|
| `Arrow Down` / `Up` | Move highlight (skips collapsed branches)                       |
| `Arrow Right`       | Expand if collapsed; move to first child if open; no-op on leaf |
| `Arrow Left`        | Collapse if open; move to parent if closed; no-op on root leaf  |
| `Home` / `End`      | Jump to first / last visible node                               |
| `Enter` / `Space`   | Toggle selection of the highlighted node                        |
| Printable key       | Typeahead match against visible labels                          |
| `Escape`            | Close panel                                                     |

## Limitations

The flat panels (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxReorderableMultiSelect`) support virtualisation via `CNGX_PANEL_RENDERER_FACTORY` + `injectRecycler`.
Tree virtualisation is **not implemented** - the recycler contract conflicts with expand-state mutations.
