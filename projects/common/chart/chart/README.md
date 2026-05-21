# Chart Root

The `<cngx-chart>` container plus the DI contract every axis, layer, and slot reads from. This is where a chart composition starts: one root, one data binding, one reactive context that the children query for scales and dimensions.

## Import

```ts
import {
  CngxChart,
  CNGX_CHART_CONTEXT,
  CngxChartLoading,
  CngxChartEmpty,
  CngxChartError,
} from '@cngx/common/chart';
```

## Quick start

Composed atoms - bring your own axes and layers:

```html
<cngx-chart [data]="rows()" [summaryAccessor]="row => row.value">
  <svg:g cngxAxis position="bottom" type="time" [domain]="xDomain()" />
  <svg:g cngxAxis position="left" type="linear" [domain]="yDomain()" />
  <svg:g cngxLine [y]="row => row.value" />
</cngx-chart>
```

Async envelope - same root, state-machine routes between skeleton, empty, error, content:

```html
<cngx-chart [data]="state().data() ?? []" [state]="state()">
  <ng-template cngxChartEmpty let-small="small">
    @if (small) { <span>No data</span> }
    @else { <cngx-empty-state title="No telemetry yet" /> }
  </ng-template>
  <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 100]" />
  <svg:g cngxAxis position="left" type="linear" [domain]="[0, 1]" />
  <svg:g cngxArea [y]="d => d.share" />
</cngx-chart>
```

## What lives in this folder

| Export | Role |
|-|-|
| `CngxChart` | The `<cngx-chart>` container. Owns data, dimensions, scales, summary, async view. |
| `CNGX_CHART_CONTEXT` | DI token children inject to read `xScale` / `yScale` / `dimensions` / `dataLength` / `data<T>()`. |
| `CngxChartContext` | Interface shape behind the token. Used to type custom children. |
| `ScaleFn<TIn>` | `(v: TIn) => number` - the shape every `create*Scale` factory returns. |
| `XScaleInput` | `number \| Date \| string` - the union the X scale accepts before a layer narrows it. |
| `CngxChartLoading` | `<ng-template cngxChartLoading>` - per-instance skeleton override. |
| `CngxChartEmpty` | `<ng-template cngxChartEmpty>` - per-instance empty-state override. |
| `CngxChartError` | `<ng-template cngxChartError>` - per-instance error override, receives the live error as `$implicit`. |
| `CngxChartSlotContext` | Context every slot template gets: `{ width, height, small }`. |
| `CngxChartErrorContext` | Error-slot context: extends `CngxChartSlotContext` with `$implicit` / `error`. |
| `CHART_SMALL_BREAKPOINT_PX` | Threshold (px) below which `slotContext.small` flips true. Container-size based, not viewport. |

## Notes

- Scales come from content-child `[cngxAxis]` directives. Without a horizontal axis, `xScale` falls back to `() => 0`; same for `yScale` on missing vertical axis. Mount one axis per direction the chart actually uses.
- Layer atoms (`[cngxLine]`, `[cngxBar]`, ...) and `[cngxAxis]` mount on `<svg:g>` hosts, not as element selectors. Element selectors inside `<svg>` create XHTML-namespaced custom elements whose SVG children fail to lay out in real browsers (jsdom is permissive and would mask this).
- The SR data-table (`aria-describedby` target) is always in the DOM. Visibility flips through `aria-hidden` driven by the `accessibleTable` input. Single-value charts speak through the `aria-label` summary alone.
- `summary` and `aria-label` derive from `data` plus content-child `<svg:g cngxThreshold>` values via `computeChartSummary`. Override the announced label with `[ariaLabel]` when the default phrasing does not fit. Override the numeric projection with `[summaryAccessor]` for non-numeric data - a dev-mode warning fires when data is non-numeric and no accessor is bound.
- Responsive mode kicks in when neither `[width]` nor `[height]` is bound. Host fills its parent and derives height from `--cngx-chart-aspect-ratio` (default `5 / 2`). Bind both for fixed-dimension presets.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, host bindings, and tokens.
- Sibling folders: `axis/`, `layers/`, `legend/`, `presets/`, `i18n/`, `scales.ts`, `path.ts`.
- Entry: [`@cngx/common/chart`](../README.md).
