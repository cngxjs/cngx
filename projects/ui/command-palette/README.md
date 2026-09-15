# CngxCommandPalette

The opinionated Cmd/Ctrl+K palette preset. Renders a search-driven command list
inside a native modal `<dialog cngxDialog>`, so focus trapping, trigger storage
at open and focus restore after the close transition come from `CngxDialog` and
the platform - no hand-rolled focus machinery. The body composes existing
atoms: `CngxSearch` (debounced term), `CngxListbox` + `CngxOption`
(active-descendant navigation), `CngxHighlight` (match marking). Commands are
data from `@cngx/common/command` (`provideCommands`); the palette commits no
form value - it fires `command.run()`, the locked demarcation from `CngxCombobox`.

## Import

```typescript
import { CngxCommandPalette, CngxCommandPaletteTrigger } from '@cngx/ui/command-palette';
import { provideCommands } from '@cngx/common/command';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { provideCommands } from '@cngx/common/command';
import { CngxCommandPalette, CngxCommandPaletteTrigger } from '@cngx/ui/command-palette';

@Component({
  selector: 'app-example',
  providers: [
    provideCommands([
      { id: 'new-file', label: 'New file', run: () => void 0 },
      { id: 'toggle-theme', label: 'Toggle theme', group: 'View', run: () => void 0 },
    ]),
  ],
  template: `
    <button [cngxCommandPaletteTrigger]="palette">Search <kbd>Cmd K</kbd></button>
    <cngx-command-palette #palette />
  `,
  imports: [CngxCommandPalette, CngxCommandPaletteTrigger],
})
export class ExampleComponent {}
```

Pressing Cmd/Ctrl+K anywhere opens the palette. Type to filter, arrows to
navigate, Enter runs the highlighted command and dismisses.

## Opening

The open combo resolves per instance `[openShortcut]` (parsed via
`parseKeyCombo`, e.g. `'mod+shift+p'`; changing it live re-installs the
listener), then `withPaletteShortcut(...)` from the config cascade, then the
`'mod+k'` default.

The global keydown listener is installed by a swappable factory,
`CNGX_PALETTE_KEYBINDING_FACTORY` (default `createPaletteKeybinding`). Override
the token to replace the whole listener - an enterprise key-capture policy, a
test double - without touching the palette. To only change the combo, use the
input or the config feature. On SSR the default factory is an inert no-op.

`[cngxCommandPaletteTrigger]` is the optional explicit trigger: opens on click,
sets `aria-haspopup="dialog"` and derives `aria-expanded` from the palette's
`isOpen()` signal. The palette is passed by template reference - orthogonal
composition, no ancestor injection. `open()` and `dismiss()` are public methods
for programmatic control.

## Commands and matching

The static registry is `provideCommands(...sources)` - each source an array or
a `Signal<readonly CngxCommand[]>`, merged reactively. A `CngxCommand` is pure
data plus `run()`: `id`, `label`, optional `keywords`, `group`, `icon`,
`disabled` (a `Signal<boolean>`), `disabledReason`, and an `unknown` `data`
payload the row slot narrows.

Ranking runs through the swappable `CNGX_COMMAND_MATCH_FACTORY`
(`@cngx/common/command`); results group by `command.group`, rank order
preserved. The two-way `[(scope)]` model feeds the matcher's scope filter and
renders as a chip in the input row.

A disabled command stays in the list and communicates its why: the default row
wires `aria-describedby` to a visually hidden node carrying `disabledReason`,
with the reference gated on the disabled state while the node itself stays in
the DOM.

## Async results

Bind `[results]` to a `CngxAsyncState<CngxCommandGroup[]>` (from
`createAsyncState`/`injectAsyncState`) and the palette merges consumer groups
above the ranked static registry. An internal shell maps the state through
`resolveAsyncView()`:

- first load renders the loading state; a first-load failure the error state
  with a Retry button that emits `(retry)`;
- a re-query failure keeps stale results visible under an error banner;
- an empty success keeps the input mounted - the panel renders the empty slot
  off its own result count, so typing to refine the term keeps working.

When async groups arrive mid-navigation, the highlight is re-resolved by
command id, not index - Enter always runs the row the user saw.

## Template slots

Six structural directives, projected as palette content. Resolution per slot:
instance directive, then `config.templates`, then the built-in default.

| Slot | Context |
|-|-|
| `*cngxCommandRow` | `$implicit: CngxRankedCommand`, `term`, `data`, `active` |
| `*cngxCommandGroupHeader` | `$implicit: CngxCommandGroup` |
| `*cngxCommandPaletteEmpty` | `term` |
| `*cngxCommandPaletteLoading` | none |
| `*cngxCommandPaletteError` | `error`, `retry: () => void` |
| `*cngxCommandPaletteFooter` | none |

The row is one slot on purpose - icon, label and shortcut hint are laid out in
the consumer's template:

```html
<cngx-command-palette #palette [results]="results()">
  <ng-template cngxCommandRow let-entry let-active="active">
    <my-icon [name]="entry.command.icon" />
    <span>{{ entry.command.label }}</span>
  </ng-template>
</cngx-command-palette>
```

The default footer renders the configured keyboard legend as `<kbd>` rows.

## Host contract

The palette provides `CNGX_COMMAND_PALETTE_HOST` (`CngxCommandPaletteHost`):
`isOpen: Signal<boolean>` plus `dismiss()`. The panel uses it to dismiss after
a command runs and to reset term and highlight when the surface closes - the
dialog keeps its content mounted, so state must not leak into the next open.
The trigger binds `aria-expanded` to the same `isOpen()` seam.

## Configuration

```typescript
provideCommandPaletteConfig(
  withCommandPaletteLabels({ searchPlaceholder: 'Befehl eingeben...', emptyLabel: 'Keine Treffer.' }),
  withPaletteShortcut('mod+shift+p'),
  withKeyboardLegend([{ keys: 'enter', label: 'Ausfuehren' }]),
  withResultCountFormatter((n) => `${n} Ergebnisse`),
  withCommandPaletteTemplates({ row: myRowTemplate }),
);
```

Root, or scoped to a subtree with `provideCommandPaletteConfigAt` in
`viewProviders`, where features merge onto the enclosing scope. Defaults are
English; supply your locale through the cascade.

## Accessibility

- The surface is a native modal dialog: `showModal()` traps focus, Escape
  closes, focus returns to the trigger after the close transition settles.
  `[ariaLabel]` names the dialog (default `'Command palette'`).
- The input is `role="combobox"` with `aria-autocomplete="list"`,
  `aria-controls` on the listbox and `aria-activedescendant` tracking the
  highlighted row; focus never leaves the input while navigating.
- ArrowDown/ArrowUp move the highlight, Home/End jump, Enter activates.
  Modified combos (Ctrl/Meta/Alt) pass through untouched so browser and app
  shortcuts keep working; printable keys fall through to the search term.
- A polite `aria-live` region announces the result count on every re-rank,
  formatted by `config.resultCount`.
- Groups render as `role="group"` with `aria-labelledby` pointing at minted,
  panel-unique DOM ids - never raw consumer strings.
- Forced-colors mode re-signals the active row with the system Highlight pair
  and pins the modal border to `CanvasText`.

## CSS custom properties

All spacing tokens are set from the global `--cngx-space-*` scale at the hosts,
so a root `[data-density]` swap re-scales the whole palette.

| Property | Default | Purpose |
|-|-|-|
| `--cngx-command-width` | `min(40rem, calc(100vw - 2rem))` | Dialog inline size |
| `--cngx-command-max-h` | `min(32rem, calc(100vh - 6rem))` | Dialog max block size |
| `--cngx-command-bg` / `--cngx-command-color` | surface / inherit | Dialog surface pair |
| `--cngx-command-border` / `--cngx-command-border-width` | `--cngx-color-border` / `1px` | Border, input row and footer separators |
| `--cngx-command-radius` | `--cngx-radius-lg` | Dialog corner radius |
| `--cngx-command-shadow` | elevation shadow | Dialog elevation |
| `--cngx-command-backdrop` | `rgb(0 0 0 / 0.4)` | `::backdrop` scrim |
| `--cngx-command-input-color` / `--cngx-command-placeholder-color` | inherit / muted | Search input text |
| `--cngx-command-input-gap` / `--cngx-command-input-pad` | `sm` / `md` space | Input row layout |
| `--cngx-command-chip-bg` / `--cngx-command-chip-color` / `--cngx-command-chip-size` / `--cngx-command-chip-radius` / `--cngx-command-chip-pad` | muted / inherit / `0.8125rem` / `--cngx-radius-sm` / `sm` space | Scope chip |
| `--cngx-command-listbox-max-h` / `--cngx-command-listbox-pad` | `22rem` / `xs` space | Results scroll area |
| `--cngx-command-header-color` / `--cngx-command-header-size` / `--cngx-command-header-weight` / `--cngx-command-header-pad-y` / `--cngx-command-header-pad-x` | muted / `0.75rem` / `600` / `xs` / `sm` space | Group headers |
| `--cngx-command-row-color` / `--cngx-command-row-radius` / `--cngx-command-row-gap` / `--cngx-command-row-pad` | inherit / `--cngx-radius-sm` / `sm` / `sm` space | Command rows |
| `--cngx-command-row-active-bg` / `--cngx-command-row-active-color` | accent / inherit | Highlighted row |
| `--cngx-command-row-disabled-opacity` | `0.5` | Disabled row |
| `--cngx-command-mark-bg` | `--cngx-color-highlight` | Match `<mark>` |
| `--cngx-command-state-pad` / `--cngx-command-state-color` / `--cngx-command-error-color` / `--cngx-command-retry-bg` | `lg` space / muted / danger / transparent | Loading, empty and error chrome |
| `--cngx-command-footer-gap` / `--cngx-command-footer-pad-y` / `--cngx-command-footer-pad-x` / `--cngx-command-footer-size` / `--cngx-command-footer-color` | `md` / `sm` / `md` space / `0.75rem` / muted | Legend footer |
| `--cngx-command-kbd-bg` / `--cngx-command-kbd-color` | muted / inherit | `<kbd>` chips |
| `--cngx-command-focus-outline` / `--cngx-command-focus-offset` | `2px solid` focus color / `2px` | Focus ring |

## Material Theme

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/command-palette-theme' as command-palette;

html {
  @include command-palette.theme($theme);
}
```

Without the bridge the palette uses the cngx foundation `--cngx-color-*`
tokens with a native look. The bridge paints an M3 dialog/menu hybrid:
surface-container-high modal on a scrim backdrop, secondary-container active
rows, container-tone chip and kbd sub-surfaces, error roles for the failure
chrome. Spacing stays on `--cngx-space-*` so density tracking keeps working.

## See Also

- `@cngx/common/command` - the framework-level command registry and matcher
- [CngxDialog](../../common/dialog/) - the modal surface the palette composes
- [CngxListbox](../../common/interactive/) - the navigation atom under the rows
- [API on compodocx](https://cngxjs.github.io/cngx/)
- Tests: `projects/ui/command-palette/palette/command-palette.component.spec.ts`, `panel/command-panel.component.spec.ts`
