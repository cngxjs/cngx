# CngxActiveDescendant

WAI-ARIA active-descendant keyboard model for composite widgets where focus stays on a single container (listbox, menu, combobox) and the currently active option is communicated via `aria-activedescendant`.

Counterpart to `CngxRovingTabindex` — use AD when options should not be individual tab stops; use roving when each item should hold focus directly.

## Material / CDK equivalent

- `cdk-listbox` — CDK's own listbox primitive uses `aria-activedescendant` for selection-follows-focus modes.
- `mat-select` — Material's select uses the AD pattern internally for its overlay panel.
- `mat-menu` / `cdk-menu` — Material's menu actually uses roving tabindex, not AD; our menu stack unifies the two models behind `CngxActiveDescendant`.

## Why better than Material

1. **Signal-first state.** Every ARIA attribute is a `computed()`. `aria-activedescendant` never goes stale because it is derived, not pushed.
2. **Unified model.** Listbox, menu, and combobox all consume the same directive. Material has three subtly different implementations.
3. **Typeahead is first-class.** `typeaheadDebounce` is configurable, the buffer is testable, and `skipDisabled` is respected during scanning.
4. **Virtualization-aware.** `virtualCount` + `pendingHighlight` mirror the recycler protocol we already use for `CngxRovingTabindex`.
5. **Hybrid item registration.** Combobox-style consumers pass `items` explicitly; listbox/menu consumers rely on `CNGX_AD_ITEM` DI.

## Usage

```html
<div cngxActiveDescendant
     role="listbox"
     aria-label="Fruits"
     tabindex="0"
     [items]="fruits()"
     #ad="cngxActiveDescendant">
  @for (fruit of fruits(); track fruit.id) {
    <div role="option"
         [id]="fruit.id"
         [attr.aria-selected]="ad.activeId() === fruit.id">
      {{ fruit.label }}
    </div>
  }
</div>
```

## WAI-ARIA keyboard matrix

| Key | Vertical orientation | Horizontal orientation |
|-|-|-|
| ArrowDown | next item | — |
| ArrowUp | previous item | — |
| ArrowRight | — | next item |
| ArrowLeft | — | previous item |
| Home | first enabled item | first enabled item |
| End | last enabled item | last enabled item |
| Enter / Space | activate current | activate current |
| printable character | typeahead (debounced) | typeahead (debounced) |

Disabled items are skipped when `skipDisabled()` is `true` (default). `loop()` controls wrap-around.

## Composition with third-party peers

- **`@angular/cdk/overlay` / `CngxPopoverTrigger`** — The trigger implements its own keymap and calls `highlightFirst/Last/Next/Prev` + `activateCurrent` on the AD hostDirective. AD does not implement open/close.
- **`CngxRovingTabindex`** — Do not nest an AD inside a roving group. They model different focus strategies.
- **Recycler / virtual scroll** — With `virtualCount`, out-of-range targets surface as `pendingHighlight`. Consumers scroll the index into view, then call `clearPendingHighlight()`.

See the [interactive demo](../../../../../../dev-app/src/app/demos/common/a11y/active-descendant-demo/active-descendant-demo.story.ts) for usage.
