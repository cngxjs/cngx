# Expandable

Passive expand/collapse behaviour atom for elements whose open state is driven from the outside, typically a `CngxTreeController` or any host that manages a shared expansion set. Mirrors `aria-expanded` and `aria-controls` onto the host and exposes a resolved `expanded()` signal. Carries no click, no key handling, no UI of its own. For self-triggering disclosures (FAQ rows, accordion headings), reach for `CngxDisclosure` instead.

## Import

```ts
import { CngxExpandable } from '@cngx/common/interactive';
```

## Quick start

Uncontrolled, toggled via a sibling button:

```html
<div role="tree" aria-label="Files">
  <div
    role="treeitem"
    aria-level="1"
    cngxExpandable
    #row="cngxExpandable"
    [controls]="'children-1'"
  >
    <button type="button" tabindex="-1" (click)="row.toggle()">
      {{ row.expanded() ? '▾' : '▸' }}
    </button>
    <span>Documents</span>
  </div>
  <div id="children-1" [hidden]="!row.expanded()">…</div>
</div>
```

Controlled by a tree controller. The bound input wins over internal state:

```html
<div role="tree" aria-label="Files">
  <div
    role="treeitem"
    aria-level="1"
    cngxExpandable
    [cngxExpandableOpen]="ctrl.isExpanded(id)()"
    [controls]="childrenId"
  >
    <button type="button" tabindex="-1" (click)="ctrl.toggle(id)">▸</button>
    <span>{{ label }}</span>
  </div>
  <div [id]="childrenId" [hidden]="!ctrl.isExpanded(id)()">…</div>
</div>
```

## Accessibility

Two host attributes, both derived from inputs:

| Attribute | Source |
|-|-|
| `aria-expanded` | `expanded()` (always present, `true` or `false`) |
| `aria-controls` | `controls()` when set, otherwise omitted |

No keyboard handling. The directive is passive by design: in a `treeitem` row, clicks / Enter / Space belong to the selection flow, and expand/collapse is wired to ArrowLeft/Right by the surrounding nav directive or to a dedicated twisty button. Owners of the controlled content are responsible for hiding it (`[hidden]`, `@if`, or DOM removal) so screen readers do not announce collapsed subtrees.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, and host bindings.
- `CngxDisclosure` in `@cngx/common/interactive` for the self-triggering variant (button or heading that toggles its own state on click / Enter / Space).
- Stories: `examples/stories/common/interactive/expandable/`.
