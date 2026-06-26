# Select Panel Shell

Internal frame component every select-family panel sits inside. Owns the `activeView()` switch (skeleton, empty, none, first-load error, default) and the default-branch chrome stack (inline error, commit-error banner, refreshing indicator, action-top, body, action-bottom). The variant body is projected via `<ng-content />`. Distinct from `select/shared/panel/`: `panel/` is the flat option-loop body that delegates loading / empty / error to this shell - this file owns the chrome, `panel/` owns the option rows.

## Import

`CngxSelectPanelShell` is `@internal`. Variant components compose it; consumers do not.

```ts
import { CngxSelectPanelShell } from '../panel-shell/panel-shell.component';
```

## Quick start

Variant-side composition. The variant provides `CNGX_SELECT_PANEL_VIEW_HOST` (a `CngxSelectPanelViewHost<T>`) and projects its body as content:

```html
<cngx-select-panel-shell
  [actionFocusTrapEnabled]="bridge.focusTrapEnabled()"
  [actionPosition]="bridge.position()"
>
  <!-- variant body: option loop, tree, recycler viewport, ... -->
</cngx-select-panel-shell>
```

```ts
providers: [
  { provide: CNGX_SELECT_PANEL_VIEW_HOST, useExisting: forwardRef(() => CngxMyVariant) },
],
```

The shell reads only the narrow `CngxSelectPanelViewHost<T>` contract (`activeView`, `tpl`, `fallbackLabels`, `ariaLabels`, `errorContext`, `commitErrorContext`, `showInlineError`, `showCommitError`, `showRefreshIndicator`, `loadingVariant`, `refreshingVariant`, `commitErrorDisplay`, `skeletonIndices`, `handleRetry`, optional `searchTerm` / `unfilteredCount` / `previousLoadedCount` / `action*`). No option-loop or selection state.

## Default-branch render order

| Slot | Source | Fallback |
|-|-|-|
| inline error | `host.showInlineError()` | `*cngxSelectError` -> `cngx-select__error--inline` |
| commit-error banner | `host.showCommitError() && commitErrorDisplay() === 'banner'` | `*cngxSelectCommitError` -> `cngx-select__commit-error` |
| refreshing indicator | `host.showRefreshIndicator()` | `*cngxSelectRefreshing` -> `refreshingVariant()` switch (`spinner` / `dots` / `none` / default bar) |
| action top | `actionPosition() in {'top', 'both'}` && `host.tpl.action()` | `*cngxSelectAction` only - no fallback markup |
| body | `<ng-content />` | variant-supplied |
| action bottom | `actionPosition() in {'bottom', 'both'}` && `host.tpl.action()` | `*cngxSelectAction` only - no fallback markup |

Non-default branches (`skeleton`, `empty`, `none`, `error`) bypass the body entirely. Each has its slot (`*cngxSelectLoading`, `*cngxSelectEmpty`, `*cngxSelectError`) with cascaded fallbacks driven by `host.fallbackLabels` and `host.ariaLabels`.

## Action slot

`actionPosition` is the only public input on this component. Default `'bottom'`. When the view-host omits the optional `action*` fields, the shell substitutes `NOOP_ACTION_CALLBACKS` so action-unaware variants pass through unchanged. The `actionContext` `computed` carries a structural `equal` so per-keystroke `searchTerm` flips don't rebuild the outlet binding.

`CngxFocusTrap` rides as a host directive, re-exposed as `actionFocusTrapEnabled` - action-host variants flip it true on dirty workflows; everyone else leaves it `false`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the host contract and template slots.
- `select/shared/panel/` for the flat option-loop body that sits inside this shell.
- `@cngx/forms/select/shared` for the wider infrastructure overview.
