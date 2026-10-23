# @cngx/forms/select

The select family - eight specialised dropdown components sharing one signal-native core. Replaces the monolithic `[multiple]` / `[searchable]` / `[hierarchical]` flag pattern with one component per intent.

> For the deep architectural rationale and accepted-debt notes, see [`ARCHITECTURE.md`](./ARCHITECTURE.md) in this folder.

## When you reach for it

You need a dropdown surface in a form. The right variant follows the value shape and the interaction you want:

| Use case | Component |
|-|-|
| One value from a short list                              | `<cngx-select>`                   |
| Many values from a list                                  | `<cngx-multi-select>`             |
| Many values where the user filters by typing             | `<cngx-combobox>`                 |
| One value from a long async list, user filters by typing | `<cngx-typeahead>`                |
| Hierarchical multi-select (category trees, org charts)   | `<cngx-tree-select>`              |
| Multi-select where order matters and is user-editable    | `<cngx-reorderable-multi-select>` |
| Pick one and dispatch an action immediately              | `<cngx-action-select>`            |
| Pick many and dispatch on each toggle                    | `<cngx-action-multi-select>`      |

All eight integrate directly with `<cngx-form-field>` - no bridge directive needed.

## Mental model

Each variant is a thin orchestrator on top of one shared core (`createSelectCore`). The core owns the option model, the panel view machine, the ARIA projection, the disabled cascade, and the selection / commit controllers. The variants own only what is actually variant-specific: which value shape they take, whether the trigger has an inline input, which slot directives they expose.

Three properties make the family feel consistent:

- **Async-aware out of the box.** Bind `[state]` and the panel switches between skeleton, content, refresh, empty, and error views automatically. Bind `[commitAction]` and each pick is a transactional dispatch with optimistic or pessimistic rollback.
- **Communicates through DI.** Every variant provides `CNGX_STATEFUL`, so descendant transition bridges (`[cngxToastOn]`, `[cngxBannerOn]`, `[cngxAlertOn]`) auto-discover the commit state without explicit binding.
- **Replaceable by composition, not by configuration.** Every controller (selection, commit, display binding, focus, chip removal, navigation strategy, template registry) ships behind a factory token. Override the token in `viewProviders` to inject telemetry, retry-with-backoff, offline queues, or audit logging without forking the component.

## A11y

Every variant ships full WAI-ARIA 1.2:

- `role="combobox"` on the focusable trigger.
- `aria-expanded`, `aria-controls`, `aria-haspopup`, `aria-busy`, `aria-invalid`, `aria-required` all reactive - derived in the `computed` graph.
- Focus stays on the trigger; the active option is announced via `aria-activedescendant`. In the mobile sheet focus moves into the panel (see below).
- Tree variant: `role="tree"`, per-node `aria-level` / `aria-posinset` / `aria-setsize` / `aria-expanded` / `aria-checked` (true / false / `mixed` for partial cascade selection - APG checkbox-tree).
- Reorderable variant: chip-strip `role="group"` with manual roving tabindex; reorder moves announced through the live region.

## Mobile sheet

On a touch screen narrower than 48rem every variant opens its panel as a modal sheet: a content-sized bottom sheet, or fullscreen for the variants led by a text input. The sheet is a named `role="dialog"` with `aria-modal`; focus moves in on open (onto the list, or onto the search input when the open came from the keyboard, so a tap raises no soft keyboard) and back to the trigger on close (with the soft keyboard held down until the next tap or key there), the rest of the page is inert, and announcements are spoken from inside the sheet. The header shows the field label, a close button and, on multi and input variants, Done. Swipe the header down, tap outside or use the Android back gesture to close; while a pessimistic `[commitAction]` is pending the sheet stays open.

- `withMobileSheet('off')` keeps every select in its scope anchored, on phones too.
- `[presentation]` on a variant forces `'anchored'`, `'sheet'` or `'fullscreen'` and wins over the config.
- `[sheetLabel]` sets the sheet title when the field label is not the right one.
- `*cngxSelectSheetHandle` replaces the decorative drag handle.

### Summary trigger under the touch floor

The touch floor is on while `--cngx-target-min` resolves above `0px`: on a coarse pointer (`(any-pointer: coarse)`), with `[cngxTouchTarget]="'on'"`, `data-touch="on"` or the `.cngx-touch-on` class. Under it the five multi-value selects (`CngxMultiSelect`, `CngxCombobox`, `CngxTreeSelect`, `CngxReorderableMultiSelect`, `CngxActionMultiSelect`) replace the chip strip with one line in the 44px row: the placeholder with no value, the label with one value, and the first label plus a `+N` badge with two or more values.

- Assistive technology gets the whole selection. The div-based triggers (multi, tree, reorderable) carry it as visually hidden text inside the trigger. The input-led variants (combobox, action-multi) keep the input for the search term and reference a visually hidden copy of the selection through `aria-describedby`.
- Opt out with `[cngxTouchTarget]="'off'"` or `data-touch="off"` on the select or an ancestor. The chips come back.
- `chipOverflow`, `maxVisibleChips` and the chip slots (`*cngxMultiSelectChip`, `*cngxComboboxChip`, `*cngxTreeSelectChip`, `*cngxMultiSelectChipHandle`) apply on a fine pointer only, or with the opt-out.
- `*cngxSelectChipOverflow` also replaces the `+N` badge of the summary. `CngxReorderableMultiSelect` keeps the built-in `+N` badge; it does not render `*cngxSelectChipOverflow`.
- A trigger-label slot (`*cngxMultiSelectTriggerLabel`, `*cngxComboboxTriggerLabel`, `*cngxTreeSelectTriggerLabel`) replaces the summary in the same place it replaces the chips. The per-variant READMEs state the precedence against the placeholder.
- `CngxReorderableMultiSelect` moves its sorting into a list in the panel; see its README.

## Localisation

To translate the whole app, set a language pack with `provideCngxI18n(withPack(...))` from `@cngx/core/i18n` (see the localisation guide); the `select` section covers every string below.

Library defaults are English. Override on the per-instance level through ARIA-label inputs, or globally via `withAriaLabels` and `withFallbackLabels` features in the `provideCngxSelect(...)` aggregator.

## See also

- Component inputs, outputs, slot directives, and the 18 DI factory tokens in the **API** tab.
