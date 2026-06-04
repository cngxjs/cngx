# Chart Axis

Declarative axis layer for `<cngx-chart>`. `CngxAxis` is an attribute directive on an `<svg:g>` host that reads the parent chart context, computes tick geometry, and renders the axis line, tick marks, tick labels, optional gridlines, and an optional axis title. It is the rendering half of the axis pair: the chart container reads the same `[position]` + `[type]` + `[domain]` inputs to build its `xScale` / `yScale` signals.

What it does not do: it does not build scales (see `@cngx/common/chart` `createLinearScale` / `createTimeScale` / `createBandScale`), does not project data, does not own colour or font tokens beyond axis-local CSS variables, and does not participate in the chart's accessible summary. Axis text is decoration; the host carries `aria-hidden="true"` and the semantic data view lives on the parent chart.

## Import

```ts
import { CngxAxis, type CngxAxisPosition, type CngxAxisType } from '@cngx/common/chart';
```

## Quick start

Bottom + left axis on a linear chart, with gridlines and axis titles:

```html
<cngx-chart [data]="series" [width]="480" [height]="200" aria-label="Monthly traffic.">
  <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true" label="Months"></svg:g>
  <svg:g cngxAxis position="left"   type="linear" [domain]="[0, 40]" [grid]="true" label="Requests / sec"></svg:g>
  <svg:g cngxLine [strokeWidth]="2"></svg:g>
</cngx-chart>
```

Categorical (band) X-axis:

```html
<svg:g cngxAxis position="bottom" type="band" [domain]="['Q1','Q2','Q3','Q4']"></svg:g>
```

Time axis with a custom formatter:

```html
<svg:g
  cngxAxis
  position="bottom"
  type="time"
  [domain]="[startDate, endDate]"
  [ticks]="7"
  [format]="formatMonthShort"
></svg:g>
```

## Accessibility

Axis text is decoration. The directive sets `aria-hidden="true"` on its host so screen readers do not read tick labels twice (once from the axis, once from the chart's auto-summary). Set the consumer-facing label on the parent `<cngx-chart>` via `aria-label` / `aria-labelledby`, not here.

## See also

- API on compodocx: https://cngxjs.github.io/cngx/
- `@cngx/common/chart` (entry) for the chart context and the full atom list.
- `@cngx/common/chart/scales` for `createLinearScale` / `createTimeScale` / `createBandScale`.
- `@cngx/common/chart/path` for layer-side path building (`CngxLine`, `CngxArea`).
- Stories: `examples/stories/common/chart/primitives/`.
