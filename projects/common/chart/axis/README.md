# Chart Axis

Declarative axis layer for `<cngx-chart>`. Two directives, one contract. `CngxAxis` is an attribute directive on an `<svg:g>` host that reads the parent chart context, computes tick geometry, and renders the axis line, tick marks, tick labels, optional gridlines, and an optional axis title. `CngxAxisDomain` takes the same scale inputs and draws nothing. Both publish `CNGX_CHART_AXIS`, which is what the chart container queries to build its `xScale` / `yScale` signals and to size its plot area.

What it does not do: it does not build scales (see `@cngx/common/chart` `createLinearScale` / `createTimeScale` / `createBandScale`), does not project data, does not own colour or font tokens beyond axis-local CSS variables, and does not participate in the chart's accessible summary. Axis text is decoration; the host carries `aria-hidden="true"` and the semantic data view lives on the parent chart.

## Import

```ts
import {
  CngxAxis,
  CngxAxisDomain,
  CNGX_CHART_AXIS,
  type CngxChartAxis,
  type CngxAxisPosition,
  type CngxAxisType,
} from '@cngx/common/chart';
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

## Publishing a domain without drawing one

`CngxAxisDomain` is the second half of the pair. It takes the same `[position]` + `[type]` + `[domain]` inputs and publishes them to the chart's scale math, but renders nothing and reserves no room in the plot area.

```html
<cngx-chart [data]="readings" [width]="80" [height]="24">
  <svg:g cngxAxisDomain position="bottom" type="linear" [domain]="[0, 7]"></svg:g>
  <svg:g cngxAxisDomain position="left" type="linear" [domain]="[0, 100]"></svg:g>
  <svg:g cngxLine></svg:g>
</cngx-chart>
```

Reach for it whenever a mark needs a scale but the box has no space for decoration. The sparkline and mini-area presets are built on it: an 80x24 chart cannot afford a tick gutter, and `CngxAxis` would claim one because it draws labels that need the room.

## The contract both directives satisfy

`<cngx-chart>` does not query either class. It queries `CNGX_CHART_AXIS` and works against the `CngxChartAxis` interface:

|Signal|Purpose|
|-|-|
|`position`|Which plot edge this axis occupies|
|`type`|Scale kind the chart builds|
|`domain`|Value range the scale maps from|
|`reservation`|Room the decoration needs perpendicular to the axis line|
|`crossReservation`|Room it needs along its own line, past each plot corner|

Provide the token with `useExisting` and your own directive participates in scale building and plot insetting exactly as the shipped ones do - a logarithmic publisher, a domain fed from a service, decoration you draw yourself:

```ts
@Directive({
  selector: '[appLogAxis]',
  providers: [{ provide: CNGX_CHART_AXIS, useExisting: AppLogAxis }],
})
export class AppLogAxis implements CngxChartAxis {
  readonly position = signal<CngxAxisPosition>('left');
  readonly type = signal<CngxAxisType>('linear');
  readonly domain = computed(() => [0, this.max()]);
  readonly reservation = computed(() => 24);
  readonly crossReservation = computed(() => 6);
}
```

## Accessibility

Axis text is decoration. The directive sets `aria-hidden="true"` on its host so screen readers do not read tick labels twice (once from the axis, once from the chart's auto-summary). Set the consumer-facing label on the parent `<cngx-chart>` via `aria-label` / `aria-labelledby`, not here.

## See also

- API on compodocx: https://cngxjs.github.io/cngx/
- `@cngx/common/chart` (entry) for the chart context and the full atom list.
- `@cngx/common/chart/scales` for `createLinearScale` / `createTimeScale` / `createBandScale`.
- `@cngx/common/chart/path` for layer-side path building (`CngxLine`, `CngxArea`).
- Stories: `examples/stories/common/chart/primitives/`.
