# @cngx/forms/select

The select family - eight specialised dropdown components sharing one signal-native core. Replaces the monolithic `[multiple]` / `[searchable]` / `[hierarchical]` flag pattern with one component per intent.

> For the deep architectural rationale and accepted-debt notes, see [`ARCHITECTURE.md`](./ARCHITECTURE.md) in this folder.

## When you reach for it

You need a dropdown surface in a form. The right variant follows the value shape and the interaction you want:

| Use case                                                 | Component                         |
| -------------------------------------------------------- | --------------------------------- |
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
- Focus stays on the trigger; the active option is announced via `aria-activedescendant`.
- Tree variant: `role="tree"`, `aria-multiselectable`, per-node `aria-level` / `aria-posinset` / `aria-setsize` / `aria-expanded` / `aria-selected`.
- Reorderable variant: chip-strip `role="group"` with manual roving tabindex; reorder moves announced through the live region.

## Localisation

Library defaults are English. Override on the per-instance level through ARIA-label inputs, or globally via `withAriaLabels` and `withFallbackLabels` features in the `provideCngxSelect(...)` aggregator.

## See also

- Component inputs, outputs, slot directives, and the 18 DI factory tokens in the **API** tab.
