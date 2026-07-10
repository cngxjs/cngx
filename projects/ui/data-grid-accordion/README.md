# @cngx/ui/data-grid-accordion

A disclosure accordion whose header, every row, and footer share one column
contract, so N arbitrary cells align down the grid. Hosts the headless
`CngxAccordion` brain (`@cngx/common/interactive`) as a `hostDirective`, so the
open-set coordinator, roving keyboard nav, and disclosure ARIA come with it. It is
a table-shaped accordion, not a data grid: no `role="grid"`, no cell edit, no
selection model, no keyboard grid navigation.

## Anatomy

```html
<cngx-data-grid-accordion [multi]="true" [(openIds)]="open">
  <cngx-data-grid-header>
    <span cngxDgCell col="sm">ID</span>
    <span cngxDgCell col="grow">Name</span>
    <span cngxDgCell col="md" align="end">Amount</span>
  </cngx-data-grid-header>

  <cngx-data-grid-row panelId="1">
    <span cngxDgCell>INV-1</span>
    <span cngxDgCell primary>Northwind Traders</span>
    <span cngxDgCell align="end">$1,280</span>
    Net 30 terms. Two line items, no disputes.
  </cngx-data-grid-row>

  <cngx-data-grid-footer>
    <span cngxDgCell>1 invoice</span>
    <span cngxDgCell></span>
    <span cngxDgCell align="end">$1,280</span>
  </cngx-data-grid-footer>
</cngx-data-grid-accordion>
```

Each row is a `role="heading"` wrapping a `button[aria-expanded]` plus a labelled
`role="region"`. Mark one cell `primary` so the row's accessible name is that cell
alone; the disclosure chevron rides a leading gutter track, never a data column.

## Columns

Declare widths on the header cells with `col`, and the group derives one shared
`grid-template-columns` from them - no hand-written string:

| `col` | Track |
|-|-|
| `grow` | `minmax(0, 1fr)` - fills remaining width |
| `fit` | `auto` - hugs its content, aligned across every row via subgrid |
| `sm` / `md` / `lg` | fixed `--cngx-dga-col-sm` / `-md` / `-lg` (5 / 7 / 10rem) |

Unset, the `primary` column grows and the rest fit. For track syntax the vocabulary
cannot express (`ch`, `minmax`, a synthesised gutter) set the raw `[columns]` escape
hatch instead; it holds content columns only, since the chevron rides its own gutter.

## Overflow

Above `--cngx-dga-min-width` the grid fills 100%; below it the host scrolls sideways
(`overflow-x: auto`) with every column intact. No column is ever dropped - horizontal
scroll over silent information loss.

## Skins

Six built-in skins select via the `[skin]` input, reflected onto a `[data-skin]` host
attribute (the same pattern as `<cngx-tab-group>`). The skin CSS ships with the
component - no theme import, no scope class. Every skin renders the identical
structure, cells, ARIA, and keyboard model; only the paint changes.

```html
<cngx-data-grid-accordion [skin]="'ledger'">...</cngx-data-grid-accordion>
```

| Skin | `[skin]` value | notes |
|-|-|-|
| Ledger | `ledger` | zebra rows, mono amounts, sum footer, inset accent detail |
| Spreadsheet | `spreadsheet` | cell hairlines, derived row-number gutter + column letters |
| Log-stream | `log-stream` | mono console, severity edge, level badge, stacktrace region |
| Master-detail | `master-detail` | primary-tinted open row, projected sub-table detail |
| Report | `report` | frameless, `3px double` head + foot rules, over-budget cells red |
| Density | `density` | row padding + type ride `--cngx-dga-row-py` / `-fs`, transitioned |

Set an app-wide default with `provideDataGridAccordionConfig(withDataGridSkin('ledger'))`;
a per-instance `[skin]` still wins. Columns are per-instance, so there is no
`withDataGridColumns` - `[columns]` / `col` stay on the element.

## Config

`provideDataGridAccordionConfig(...)` / `provideDataGridAccordionConfigAt(...)` with the
single `withDataGridSkin(name)` feature; read it back with
`injectDataGridAccordionConfig()`.

## Sort and filter

Orthogonal. The component injects neither `CngxSort` nor `CngxFilter`; host them in the
header slot and derive row order in the consumer via `computed()`. The open set is keyed
by `[panelId]`, so a sorted row stays open while it moves.
