# Declarative Select Elements

The template-driven authoring path. Four projection elements (`<cngx-option>`, `<cngx-optgroup>`, `<cngx-select-divider>`, `<cngx-select-search>`) for cases where the eight data-driven composites do not fit: rich per-option markup, listbox surfaces assembled from atoms, or the `<cngx-select-shell>` projection variant. Not a select of their own - these elements have no value model of their own and no panel chrome. The host (a `[cngxListbox]` instance or `<cngx-select-shell>`) owns selection, ARIA, and commit.

## Import

```ts
import {
  CngxSelectOption,
  CngxSelectOptgroup,
  CngxSelectDivider,
  CngxSelectSearch,
} from '@cngx/forms/select';
```

## Quick start

Consumer-assembled listbox using the `[cngxListbox]` atom plus the declarative elements:

```html
<button type="button"
        [cngxPopoverTrigger]="pop"
        [cngxListboxTrigger]="lb"
        [popover]="pop"
        (click)="pop.toggle()">
  Choose a color
</button>

<div cngxPopover #pop="cngxPopover" placement="bottom">
  <div cngxListbox #lb="cngxListbox" [label]="'Color'" [(value)]="color">
    <cngx-optgroup label="Warm">
      <cngx-option [value]="'red'">Red</cngx-option>
      <cngx-option [value]="'orange'">Orange</cngx-option>
    </cngx-optgroup>

    <cngx-select-divider />

    <cngx-optgroup label="Cold">
      <cngx-option [value]="'blue'">Blue</cngx-option>
    </cngx-optgroup>
  </div>
</div>
```

Or as direct children of `<cngx-select-shell>` (panel chrome plus form-field bridge, options projected as DOM):

```html
<cngx-select-shell [(value)]="city">
  <cngx-select-search [placeholder]="'Filter cities…'" />
  @for (c of cities; track c) {
    <cngx-option [value]="c">{{ c }}</cngx-option>
  }
</cngx-select-shell>
```

## The four elements

|Element|Wraps|Purpose|
|-|-|-|
|`<cngx-option>`|`CngxOption` atom (host directive)|Single picker row. Projects `[value]`, `[disabled]`, `[label]` to the atom and re-exposes `CNGX_AD_ITEM` so the enclosing listbox or active-descendant controller discovers it.|
|`<cngx-optgroup>`|`CngxOptionGroup` atom (host directive)|Renders a non-focusable header (`aria-hidden`) and groups projected `<cngx-option>` children under `role="group"`.|
|`<cngx-select-divider>`|nothing - standalone|Visual separator. `role="presentation"`, `aria-hidden`. Same intent as `<hr>` inside a native `<select>`.|
|`<cngx-select-search>`|nothing - reads `CNGX_SELECT_SHELL_SEARCH_HOST` from DI|Projects an `<input type="search">` into the parent shell's panel above the listbox. Two-way binds `searchTerm` and forwards `ArrowUp/Down`/`Home`/`End`/`Enter`/`Escape` into the listbox active-descendant.|

`<cngx-select-search>` is shell-only - it requires a host that provides `CNGX_SELECT_SHELL_SEARCH_HOST`. The other three work inside any `[cngxListbox]` and inside `<cngx-select-shell>`.

## When to reach for this

|Situation|Reach for|
|-|-|
|Single value from a short list|`<cngx-select>` (data mode, `[options]` array)|
|Many values from a list|`<cngx-multi-select>`|
|Combobox / tag-input filter|`<cngx-combobox>`|
|Single async value with typing|`<cngx-typeahead>`|
|Hierarchical multi-select|`<cngx-tree-select>`|
|Reorderable chip strip|`<cngx-reorderable-multi-select>`|
|Pick one and dispatch an action immediately|`<cngx-action-select>`|
|Pick many and dispatch on each toggle|`<cngx-action-multi-select>`|
|All chrome of the data-driven variants above, but options written as template DOM|`<cngx-select-shell>` + the declarative elements|
|Rich per-row content (icons, sublines, badges) without an options array|consumer-assembled `[cngxListbox]` + the declarative elements|
|Custom trigger or popover surface, declarative option list|consumer-assembled `[cngxListbox]` + the declarative elements|

The eight data-driven composites consume options as a data array via `[options]`. The declarative elements **are not supported as children of data-mode `<cngx-select>`/`<cngx-multi-select>`/etc.** - those components project from `[options]`, not from light DOM.

## Inside `<cngx-select-shell>`

`<cngx-select-shell>` is the projection-mode variant of the family: trigger button, panel, popover, form-field bridge, async-state views, commit lifecycle - everything the data-driven composites provide, except options come from the projected DOM instead of an `[options]` array. The shell builds its option list from `<cngx-option>` / `<cngx-optgroup>` / `<cngx-select-divider>` children via `CNGX_OPTION_CONTAINER`, and projects `<cngx-select-search>` above the listbox.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, exposed signals, and tokens.
- Sibling READMEs for the eight data-driven composites: [`CngxSelect`](../single-select/README.md), [`CngxMultiSelect`](../multi-select/README.md), [`CngxCombobox`](../combobox/README.md), [`CngxTypeahead`](../typeahead/README.md), [`CngxTreeSelect`](../tree-select/README.md), [`CngxReorderableMultiSelect`](../reorderable-multi-select/README.md), [`CngxActionSelect`](../action-select/README.md), [`CngxActionMultiSelect`](../action-multi-select/README.md).
- [`CngxSelectShell`](../select-shell/README.md) - the projection-mode host these elements were built for.
- Stories: `examples/stories/forms/select/select-shell/` and `examples/stories/forms/select/declarative/assemble-it-yourself.story.ts`.
