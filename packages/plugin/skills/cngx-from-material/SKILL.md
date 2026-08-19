---
name: cngx-from-material
description: How to migrate an Angular Material screen to cngx - the symbol mapping from each mat-* widget to its cngx equivalent, and the idiom shifts the move requires (ControlValueAccessor to the field contract, NgModule to standalone, options-objects to composed directives, decorators to signals, imperative feedback to a root opt-in). Use when a task says "replace mat-X with cngx", "migrate this Material screen", "move off Angular Material", or when you meet mat-* markup in an app that imports any @cngx/* package.
---

# Migrating from Angular Material to cngx

Angular Material and cngx solve the same problems from opposite ends. Material
ships one widget per role, configured through a large options surface and wired to
a global theme and root providers. cngx ships focused composites you assemble, with
ARIA in the reactive graph and root capabilities opted into explicitly. Migrating
is therefore two moves at once: swap each symbol, and shift the idiom. This skill
gives you both maps. It names no input and no slot on purpose - those drift, so you
confirm them live from the MCP tools, and you hand the actual composition to
`cngx-wire` and `cngx-forms`.

## 1. Map the symbol

Find the cngx equivalent of the Material widget by role, then confirm it with
`find_component` before wiring - the mapping picks the *symbol*, the MCP picks the
exact variant for your need.

| Angular Material | cngx equivalent |
|-|-|
| `mat-select` (single) | `CngxSelect` |
| `mat-select` (`[multiple]`) | `CngxMultiSelect` |
| `mat-autocomplete` (filter list) | `CngxCombobox` |
| `mat-autocomplete` (async scalar) | `CngxTypeahead` |
| tree / hierarchy picker | `CngxTreeSelect` |
| `mat-form-field` | `cngx-form-field` |
| `mat-checkbox` | `CngxCheckbox` |
| `mat-radio-group` | `CngxRadioGroup` / `CngxRadio` |
| `mat-slide-toggle` | `CngxToggle` |
| `mat-button-toggle-group` | `CngxButtonToggleGroup` / `CngxButtonToggle` |
| `mat-chip-list` | `CngxChipGroup` / `CngxChip` |
| `mat-snack-bar` | `CngxToaster` |
| `mat-dialog` | `CngxDialog` |
| bottom sheet | `CngxBottomSheet` |
| `mat-menu` | `CngxMenu` |
| `mat-tooltip` | `CngxTooltip` |
| `cdk-overlay` / anchored panel | `CngxPopover` / `CngxOverlay` |
| `mat-sidenav` / `mat-drawer` | `CngxDrawer` |
| `mat-tab-group` | `CngxTabGroup` / `CngxTab` |
| `mat-stepper` | `CngxStepGroup` / `CngxStep` |
| `mat-expansion-panel` / `mat-accordion` | `CngxExpandable` |
| `mat-card` | `CngxCard` |
| `mat-icon` | `CngxIcon` |
| `mat-divider` | `CngxDivider` |
| `mat-badge` | `CngxBadge` |
| `mat-table` | no drop-in - compose `CngxSort` / `CngxFilter` / `CngxPaginate` + `injectDataSource` (see `cngx-data` / `cngx-wire`) |
| `mat-paginator` | `CngxPaginate` |
| `matSort` | `CngxSort` |
| skeleton / shimmer | `CngxSkeleton` |

Where a row offers two targets, the split is the point: cngx ships a focused
composite per mode instead of one widget behind a flag. Do not reach for
`CngxSelect` with a made-up `[multiple]`; pick `CngxMultiSelect`. When the role is
not in this table, ask `find_component` in plain words - the table is a starting
map, not the registry.

## 2. Shift the idiom

The symbol swap is the easy half. The Material patterns around it do not carry
over, and leaving them in place is where a migration goes wrong:

- **`ControlValueAccessor` becomes the field contract.** Material form controls
  implement CVA; cngx controls provide `CNGX_FORM_FIELD_CONTROL` and bind through
  `<cngx-form-field [field]="f.x">`. Drop the CVA plumbing and hand the form to
  `cngx-forms`, which owns the field pattern and the select-family decision tree.
- **NgModule becomes standalone.** Material's `MatXModule` imports disappear;
  import the cngx symbol directly into the standalone component's `imports`.
- **The options-object becomes composed directives.** A Material widget you tuned
  through inputs and config maps to cngx's composition surface: a template slot for
  custom markup, a `with*` feature function for an optional capability, a `provide*`
  config for subtree defaults. Reach for those before any boolean input. `cngx-wire`
  teaches this loop - route to it rather than porting the flag pile.
- **Decorators become signals.** `@Input()` / `@Output()` become `input()` /
  `model()` / `output()`; constructor injection becomes `inject()`; a value you
  synced by hand becomes a `computed()`.
- **Imperative feedback becomes a root opt-in.** `MatSnackBar.open(...)` worked
  because Material registered it globally. `CngxToaster` / `CngxAlerter` /
  `CngxBanner` are not `providedIn: 'root'`: you opt in with
  `provideFeedback(withToasts()/withAlerts()/withBanners())` at bootstrap. Skip it
  and the surface has no host to render into - the same gap the doctor's
  `toaster-without-withtoasts` finding reports.
- **A11y stops being an afterthought.** Material leaves much ARIA to you; cngx puts
  `aria-busy` / `aria-invalid` / `aria-describedby` in the `computed()` graph. When
  you override a template slot, preserve that wiring rather than re-inventing it.

## 3. Confirm every target before you wire it

The mapping names the symbol; it never names the symbol's API, because inputs,
slots, and tokens move between releases. For each target you land on:
`get_api` for its real inputs, outputs, and two-way signals; `get_slots` for the
template slots; `get_di_tokens` for the factory and config tokens. Then compose it
with `cngx-wire` (screens and features) or `cngx-forms` (anything form-shaped),
which carry the composition procedure this skill deliberately does not repeat.

## Never guess

Ground every `@cngx/*` symbol against the MCP tools or the published docs
(`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text) before
you use it. A remembered Material-to-cngx input equivalence is a guess; confirm the
cngx side live. A guessed API is a defect, not a shortcut.
