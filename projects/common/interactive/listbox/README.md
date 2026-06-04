# Listbox

Low-level listbox primitive: option list with single/multi selection, optional search filter, optional dropdown trigger. The select family in `@cngx/forms/select` (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`) is built on top of it. Use directly when a composite-select would be overkill; use the select family when forms wiring, error rendering, async commit, or template slots are needed. Forms-agnostic by design - no `@angular/forms` import.

## Import

```ts
import {
  CngxListbox,
  CngxOption,
  CngxOptionGroup,
  CngxListboxSearch,
  CngxListboxTrigger,
} from '@cngx/common/interactive';
```

## Quick start

```html
<!-- Single select, content-projected options -->
<div cngxListbox [label]="'Fruit'" tabindex="0" [(value)]="fruit">
  <div cngxOption value="apple">Apple</div>
  <div cngxOption value="banana">Banana</div>
  <div cngxOption value="cherry" [disabled]="true">Cherry</div>
</div>

<!-- Multi select with grouping -->
<div cngxListbox [label]="'Food'" [multiple]="true" tabindex="0" [(selectedValues)]="food">
  <div cngxOptionGroup [label]="'Fruits'">
    <div cngxOption value="apple">Apple</div>
    <div cngxOption value="banana">Banana</div>
  </div>
  <div cngxOptionGroup [label]="'Vegetables'">
    <div cngxOption value="carrot">Carrot</div>
  </div>
</div>

<!-- Search-filtered listbox -->
<input cngxListboxSearch type="search" aria-label="Filter" #search="cngxListboxSearch" />
<div cngxListbox [label]="'Commands'" [cngxSearchRef]="search" tabindex="0">
  @for (cmd of commands(); track cmd.value) {
    <div cngxOption [value]="cmd.value" [label]="cmd.label">{{ cmd.label }}</div>
  }
</div>

<!-- Dropdown trigger + popover -->
<button type="button" [cngxListboxTrigger]="lb" [popover]="pop" (click)="pop.toggle()">
  {{ lb.selectedLabel() ?? 'Choose' }}
</button>
<div cngxPopover #pop="cngxPopover">
  <div cngxListbox [label]="'Color'" tabindex="0" #lb="cngxListbox">
    <div cngxOption value="red">Red</div>
    <div cngxOption value="green">Green</div>
  </div>
</div>
```

`value` and `selectedValues` are `model()` signals - one-way `[value]`, output `(valueChange)`, and two-way `[(value)]` all work. Selection wins via `compareWith` (default `Object.is`).

## Composable parts

| Directive | Selector | Role |
|-|-|-|
| `CngxListbox<T>` | `[cngxListbox]` | Container. Owns `value` / `selectedValues`, drives `aria-selected` / `aria-multiselectable`, hosts `CngxActiveDescendant` for roving navigation and typeahead. |
| `CngxOption` | `[cngxOption]` | Single selectable row. Renders `role="option"`, stable `id` for `aria-activedescendant`, click + hover handlers. Label resolves from `[label]` input or trimmed `textContent`. |
| `CngxOptionGroup` | `[cngxOptionGroup]` | Visual + semantic grouping under `role="group"`. Children stay flat in the AD item list - groups are presentational. Nested groups dev-warn. |
| `CngxListboxSearch` | `input[cngxListboxSearch]` | Search input. Hosts `CngxSearch` for debounce + term tracking; exposes `term` and `matchFn`. Bind via `[cngxSearchRef]` on the listbox - orthogonal composition, no ancestor injection. |
| `CngxListboxTrigger<T>` | `[cngxListboxTrigger]` | Trigger atom. Pairs a focusable element with a listbox and a popover via explicit template refs. Owns the keyboard model (open/close, navigate, activate, focus return). Fires `backspaceOnEmpty` for tag-input deletion when co-located with a `CngxListboxSearch`. |

## DI host tokens

Five tokens decouple the option from its surroundings so consumers can build custom container variants without re-implementing `CngxOption`. Every one is `optional: true` on the option's side - standalone use needs none of them.

| Token | What it lets a host override |
|-|-|
| `CNGX_OPTION_CONTAINER` | The hierarchy contract. `CngxOption` and `CngxOptionGroup` both register here with a `kind` discriminator. Hierarchy-aware projection roots query this token to walk direct children in DOM order without importing the directive classes. |
| `CNGX_OPTION_STATUS_HOST` | Per-option infrastructure status (commit pending spinner, commit error glyph). Pull-based: the host returns `Signal<CngxOptionStatus \| null>` for a value; `CngxOption` renders the template in a reserved internal slot and reflects `[attr.data-status]`. |
| `CNGX_OPTION_FILTER_HOST` | Per-option `hidden` visibility driven by a host-owned `searchTerm` signal and a host-owned `matches` policy. Empty term short-circuits to "show everything". Lets a parent filter without the option knowing how matching is decided. |
| `CNGX_OPTION_INTERACTION_HOST` | Fallback highlight + activate routing for content-projected options whose own `inject(CngxActiveDescendant)` returns `null` (their element-injector anchors in the consumer view, outside the shell's AD). Surface is `activeId` / `activate` / `highlight`. |

The select-family shell in `@cngx/forms/select` provides all five tokens on itself and is the reference implementation.

## Accessibility

`CngxListbox` carries `role="listbox"`, `aria-label` (required), and `aria-multiselectable` when `[multiple]="true"`. The host directive `CngxActiveDescendant` drives `aria-activedescendant` from the currently highlighted option's stable `id`.

`CngxOption` carries `role="option"`, `aria-selected`, and `aria-disabled` - all reactive `computed()` host bindings. Hidden options reflect both `[class.cngx-option--hidden]` and the native `[attr.hidden]` so AT skip them.

Keyboard model on a focused `cngxListbox`:

| Key | Action |
|-|-|
| `ArrowDown` / `ArrowUp` | Move highlight, skipping disabled. |
| `Home` / `End` | Highlight first / last enabled. |
| `Enter` / `Space` | Activate the highlighted option (selects in single mode, toggles in multi). |
| Printable chars | Typeahead jump to next matching label. |

Keyboard model on a focused `cngxListboxTrigger`:

| State | Key | Action |
|-|-|-|
| closed | `Enter` / `Space` / `ArrowDown` | Open and highlight first enabled. |
| closed | `ArrowUp` | Open and highlight last enabled. |
| open | `ArrowDown` / `ArrowUp` / `Home` / `End` | Delegate to AD. |
| open | `Enter` / `Space` | Activate; close if `closeOnSelect()` (default `true`). |
| any | `Escape` | Close and restore focus to trigger. |

When the trigger element is itself an `<input cngxListboxSearch cngxListboxTrigger>`, printable-character typeahead is suppressed so keystrokes reach the native input value and the debounced search term updates.

`Backspace` on an empty input fires `(backspaceOnEmpty)` on the trigger - the tag-input "delete trailing chip" path lives at the trigger so consumers wire a single subscription.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, signals, and tokens.
- Stories:
  - `examples/stories/common/interactive/listbox/`
  - `examples/stories/common/interactive/listbox-search/`
  - `examples/stories/common/interactive/listbox-trigger/`
  - `examples/stories/common/interactive/option/`
- High-level consumer: the `CngxSelect` family in `@cngx/forms/select` (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`) - all six composites share the listbox primitive and implement the host tokens above.
