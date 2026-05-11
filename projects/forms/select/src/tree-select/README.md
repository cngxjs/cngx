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

## Inputs (cheat-sheet)

Most inputs mirror [`CngxMultiSelect`](../multi-select/README.md#inputs-cheat-sheet). Tree-specific:

| Input                                           | Type                                            | Purpose                                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `[(values)]`                                    | `model<T[]>`                                    | Two-way bound array of selected values                                                                                                          |
| `[nodes]`                                       | `readonly CngxTreeNode<T>[]`                    | Source tree                                                                                                                                     |
| `[nodeIdFn]`                                    | `(value: T, path: readonly number[]) => string` | **Required** — must survive re-ordering / filtering. Use a domain id (e.g. `(v) => v.id`) — positional fallback silently breaks expansion state |
| `[labelFn]`                                     | `(value: T) => string`                          | Defaults to `String(value)`                                                                                                                     |
| `[keyFn]`                                       | `(value: T) => unknown`                         | Membership key for selection (defaults to identity)                                                                                             |
| `[initiallyExpanded]`                           | `'all' \| 'none' \| readonly string[]`          | One-shot at mount                                                                                                                               |
| `[cascadeChildren]`                             | `boolean`                                       | When `true`, toggling a parent atomically selects/deselects all descendants                                                                     |
| `[twistyExpandLabel]` / `[twistyCollapseLabel]` | `string`                                        | ARIA labels on the twisty button (defaults from config)                                                                                         |

## Outputs

| Output                                     | Payload                   | Fires on                      |
| ------------------------------------------ | ------------------------- | ----------------------------- |
| `(selectionChange)`                        | `CngxTreeSelectChange<T>` | Any user-driven values change |
| `(openedChange)` / `(opened)` / `(closed)` | as `CngxMultiSelect`      | Panel lifecycle               |
| `(cleared)`                                | `void`                    | Clear-all clicked             |
| `(retry)` / `(commitError)`                | as `CngxMultiSelect`      | Async surfaces                |

`CngxTreeSelectChange<T>` carries `{ values, previousValues, added, removed, node, action: 'toggle' \| 'cascade-toggle' \| 'clear' }`. Cascade-toggle aggregates the `added` / `removed` arrays into a single event.

## Forms integration

Identical to [`CngxMultiSelect`](../multi-select/README.md#forms-integration). The `Field<T[]>` syncs bidirectionally with `(values)`.

## Common patterns

### Cascade-select descendants

```html
<cngx-tree-select [nodes]="tree" [nodeIdFn]="nodeId" [(values)]="values" [cascadeChildren]="true" />
```

Single-toggle path (chip ✕ + node-row click without cascade) deselects exactly one value. Cascade-toggle (parent click with `cascadeChildren=true`) selects/deselects the whole subtree atomically and emits one `selectionChange` with `action: 'cascade-toggle'`.

Chip-remove always stays single-deselect even with `cascadeChildren=true`
— the consumer explicitly removed one chip; cascading would surprise remove invisible descendants.

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

Context: `{ node, depth, expanded, hasChildren, selected, indeterminate, disabled, toggleExpand, handleSelect }`.
Panel keeps the `role="treeitem"` ARIA wiring (aria-level / posinset / setsize / expanded / selected) regardless of the projected markup.

### Custom chip / trigger summary

`*cngxTreeSelectChip` overrides individual chips; `*cngxTreeSelectTriggerLabel` replaces the entire chip strip.
Same context shape as the multi-select equivalents — see [`ARCHITECTURE.md`](../../../ARCHITECTURE.md#template-slot-system).

## Template slots

All [`CngxMultiSelect` shared slots](../multi-select/README.md#template-slots) (placeholder / loading / error / commitError / retry / etc.) plus:

| Slot                          | Replaces                                 |
| ----------------------------- | ---------------------------------------- |
| `*cngxTreeSelectNode`         | Per-node row markup                      |
| `*cngxTreeSelectChip`         | Per-chip in the trigger strip            |
| `*cngxTreeSelectTriggerLabel` | Whole chip strip with text/badge summary |

## Theming

| Variable                              | Default                                           |
| ------------------------------------- | ------------------------------------------------- |
| `--cngx-tree-select-min-width`        | `16ch`                                            |
| `--cngx-tree-select-trigger-height`   | `2.25rem`                                         |
| `--cngx-tree-select-tree-padding`     | `0.25rem`                                         |
| `--cngx-tree-select-node-height`      | `1.75rem`                                         |
| `--cngx-tree-select-base-indent`      | `0.5rem`                                          |
| `--cngx-tree-select-level-indent`     | `1rem`                                            |
| `--cngx-tree-select-node-bg`          | `transparent`                                     |
| `--cngx-tree-select-node-hover-bg`    | `var(--cngx-surface-2, rgba(0,0,0,0.04))`         |
| `--cngx-tree-select-node-selected-bg` | `var(--cngx-primary-soft, rgba(25,118,210,0.08))` |
| `--cngx-tree-select-twisty-size`      | `1.25rem`                                         |
| `--cngx-tree-select-twisty-color`     | `currentColor`                                    |
| `--cngx-tree-select-twisty-font-size` | `0.875rem`                                        |

Plus the family-shared chip-strip variables from `select-base.css`.

## Keyboard

W3C-APG treeview pattern. Active-descendant navigation; focus stays
on the trigger.

| Key                 | Behaviour                                                       |
| ------------------- | --------------------------------------------------------------- |
| `Arrow Down` / `Up` | Move highlight (skips collapsed branches)                       |
| `Arrow Right`       | Expand if collapsed; move to first child if open; no-op on leaf |
| `Arrow Left`        | Collapse if open; move to parent if closed; no-op on root leaf  |
| `Home` / `End`      | Jump to first / last visible node                               |
| `Enter` / `Space`   | Toggle selection of the highlighted node                        |
| Printable key       | Typeahead match against visible labels                          |
| `Escape`            | Close panel                                                     |

## Limitations

The flat panels (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxReorderableMultiSelect`) support virtualisation via `CNGX_PANEL_RENDERER_FACTORY` + `injectRecycler`.
Tree virtualisation is **not implemented** — the recycler contract conflicts with expand-state mutations.
Tracked as accepted debt; deferred until real-world demand emerges. See [`ARCHITECTURE.md` § Tracked architectural debt](../../../ARCHITECTURE.md#tracked-architectural-debt)
entry #4.
