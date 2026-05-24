# Select Shell

`CngxSelectShell` is the projection variant of the select family. Single-value dropdown that takes `<cngx-select-option>` / `<cngx-select-optgroup>` / `<cngx-select-divider>` / `<cngx-select-search>` children projected by the consumer and derives the option model from the DOM. Same shared core as the data-mode `CngxSelect` (`createSelectCore<T, T>`), same trigger ARIA, same template-slot cascade, same async commit machinery - the difference is where the options come from. Bridge between the raw-listbox compose-yourself path and the data-mode `[options]` path.

## Import

```ts
import {
  CngxSelectShell,
  CngxSelectOption,
  CngxSelectOptgroup,
  CngxSelectDivider,
  CngxSelectSearch,
} from '@cngx/forms/select';
```

## Quick start

```html
<cngx-select-shell label="Country" [(value)]="country" clearable>
  <cngx-select-option value="at">Austria</cngx-select-option>
  <cngx-select-option value="de">Germany</cngx-select-option>
  <cngx-select-option value="ch">Switzerland</cngx-select-option>
</cngx-select-shell>
```

Inside a form field:

```html
<cngx-form-field label="Country" [field]="f.country">
  <cngx-select-shell>
    <cngx-select-option value="at">Austria</cngx-select-option>
    <cngx-select-option value="de">Germany</cngx-select-option>
  </cngx-select-shell>
</cngx-form-field>
```

Provides `CNGX_FORM_FIELD_CONTROL` directly. No bridge directive.

## Projection contract

Direct children of `<cngx-select-shell>` are read through `contentChildren(CNGX_OPTION_CONTAINER, { descendants: false })`. Top-level entries become the option model in DOM order:

| Child | Role |
|-|-|
| `<cngx-select-option [value]>` | Leaf option. `value` typed `T`, label is the projected content. |
| `<cngx-select-optgroup [label]>` | Group parent. Children are options of the group. |
| `<cngx-select-divider>` | Visual divider inside the panel. |
| `<cngx-select-search>` | Inline filter input. Forwards keyboard nav into the listbox via `CNGX_SELECT_SHELL_SEARCH_HOST`. |

The shell flattens the projected tree into the same `CngxSelectOptionDef<T>` / `CngxSelectOptionGroupDef<T>` shape the data-mode `CngxSelect` consumes - downstream code (panel-shell, listbox, AD, commit machinery) sees one model, not two.

Custom value / label / disabled extraction (data-* attrs, signal-typed labels, async predicates) goes through `CNGX_PROJECTED_OPTION_MODEL_FACTORY`. Override the token in `viewProviders` instead of forking the component.

## Search

`[(searchTerm)]` is a two-way model. The shell wires it through `CngxOptionFilterHost` and hides non-matching options from both the visible list and the AD index, so keyboard nav skips filtered-out rows. Default match: case-insensitive substring on the label. Replace via `[searchMatchFn]` for fuzzy / server-hint matching.

The projected `<cngx-select-search>` calls into the shell through `CNGX_SELECT_SHELL_SEARCH_HOST` - no ancestor injection. `(searchTermChange)` fires after the debounce gate; the seed `''` emission is suppressed so server-driven autocomplete consumers don't fire a blank search at hydrate time.

## Async + commit

`[state]` accepts a `CngxAsyncState<CngxSelectOptionsInput<T>>` - the shell drives the panel view machine (loading skeleton, refresh indicator, empty state, error state) off the status. `[retryFn]` and `(retry)` cover the error-recovery handshake.

`[commitAction]` makes each pick a transactional dispatch through `CNGX_SCALAR_COMMIT_HANDLER_FACTORY`. `[commitMode]` is `'optimistic'` (default - close on `pending`) or `'pessimistic'` (hold open until success). Failed commits announce through `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY`; the policy is per-instance via `[commitErrorAnnouncePolicy]` or app-wide via `withCommitErrorAnnouncePolicy(...)` in `provideCngxSelect(...)`.

Every variant - including the shell - provides `CNGX_STATEFUL`, so descendant `[cngxToastOn]` / `[cngxBannerOn]` / `[cngxAlertOn]` bridges auto-discover the commit state without explicit binding.

## Template slots

Same 17-slot cascade as the rest of the family. Project a slot directive as a direct child to override:

```html
<cngx-select-shell label="Country" [(value)]="country">
  <ng-template cngxSelectCaret let-open="open">
    <cngx-icon>{{ open ? 'expand_less' : 'expand_more' }}</cngx-icon>
  </ng-template>
  <ng-template cngxSelectEmpty>No countries match.</ng-template>

  <cngx-select-option value="at">Austria</cngx-select-option>
  <cngx-select-option value="de">Germany</cngx-select-option>
</cngx-select-shell>
```

Cascade per slot: instance `contentChild` &rarr; `CNGX_SELECT_CONFIG.templates.<key>` &rarr; fallback. See the `shared/` README for the full slot list.

## A11y

Trigger carries `role="combobox"` with `aria-expanded`, `aria-controls`, `aria-haspopup="listbox"`, `aria-busy`, `aria-invalid`, `aria-required`, `aria-disabled` - all reactive, all in the `computed` graph. `aria-describedby` IDs are always rendered; visibility flips via `aria-hidden` on the message nodes. Focus restores to the trigger after panel close (configurable via `withRestoreFocus(...)`). Selection changes announce through `CngxSelectAnnouncer`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, slot directives, and the 18 DI factory tokens.
- The six sibling variants in `@cngx/forms/select`: `CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`.
- [`@cngx/forms/select/shared`](../shared/README.md) for the core factory, commit machinery, panel infrastructure, and configuration cascade.
