# Select Panel

Internal panel body shared by the flat (non-tree) select variants. Wraps `<cngx-select-panel-shell>` and contributes the grouped / flat option loop with `viewChildren(CngxOption)`, the renderer-windowed `renderItems` computed, the AD-driven `isHighlighted(opt)` predicate, and the default checkbox / radio indicator. Loading, empty, error, refreshing, and commit-error surfaces stay on the shell. Tree-select uses its own panel body (`tree-select/tree-select-panel.component.ts`) because the loop is a recursive `role="tree"` structure, not a flat option list.

The component itself is `@internal` and not exported from `@cngx/forms/select`. Variants compose it via the `imports` array of their own `@Component`. The public extension surface is the set of DI tokens it consumes: host contract, renderer factory, selection-indicator atoms.

## Import

Internal. Variant components add it to their own template:

```ts
import { CngxSelectPanel } from '../shared/panel/panel.component';
```

## Quick start

Composition inside a variant component (single-select shape):

```html
<div
  cngxPopover
  [popoverOpen]="open()"
  [style.--cngx-select-panel-min-width]="panelWidthCss()"
>
  <div cngxListbox [items]="panelRef.items()" [explicitOptions]="panelRef.options()">
    <cngx-select-panel #panelRef="cngxSelectPanel" />
  </div>
</div>
```

The outer `cngxPopover` and `cngxListbox` stay on the variant so the trigger's `[popover]` and `[cngxListboxTrigger]` references resolve. The panel renders only the listbox children, forwards `viewChildren(CngxOption)` to `[explicitOptions]`, and projects an AD-item bundle through `[items]` so `CngxActiveDescendant` can see options that live inside the panel view rather than the listbox's projected content.

The variant must provide `CNGX_SELECT_PANEL_HOST` (typically `useExisting: forwardRef(() => SelfComponent)`) so the panel can resolve `host.activeView()`, `host.flatOptions()`, `host.isSelected(opt)`, the resolved slot templates, the indicator config, and the commit-error context.

## DI tokens consumed

| Token | Purpose |
|-|-|
| `CNGX_SELECT_PANEL_HOST` | Full option-loop host contract (`CngxSelectPanelHost<T>`). Provided by every flat variant via `useExisting`. |
| `CNGX_PANEL_RENDERER_FACTORY` | Pluggable renderer factory. Default identity returns `flatOptions()` verbatim. Recycler renderer (built via `createRecyclerPanelRendererFactory(recycler)`) slices a contiguous window and exposes `offsetBefore` / `offsetAfter` / `setsize` for virtualisation. Grouped lists bypass the renderer. |

The host contract itself is the broader extension point - see `../panel-host.ts` (`CngxSelectPanelHost<T>`, `CngxSelectPanelViewHost<T>`, `CngxSelectPanelShellTemplates<T>`).

## See also

- API on compodocx https://cngxjs.github.io/cngx/
- `@cngx/forms/select/shared` for the rest of the family infrastructure (commit machinery, lifecycle helpers, template registry, configuration cascade).
- Variants composing this panel: `CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxActionSelect`, `CngxActionMultiSelect`, `CngxReorderableMultiSelect`. `CngxTreeSelect` ships its own panel body.
