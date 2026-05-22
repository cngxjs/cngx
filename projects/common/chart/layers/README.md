# Chart Layers

Data-rendering tiers stacked on top of `<cngx-chart>`. Each layer is an attribute directive on an `<svg:g>` host that reads scales and dimensions from the chart context and projects one slice of geometry (a path, a set of rects, a set of circles, a reference line, a value range). Layers are orthogonal: stack as many as the visualisation needs, in the order that gives the right Z-axis.

## Import

```ts
import {
  CngxLine,
  CngxArea,
  CngxBar,
  CngxScatter,
  CngxThreshold,
  CngxBand,
} from '@cngx/common/chart';
```

## Quick start

One layer, default accessor (the row itself is the Y value):

```html
<cngx-chart [data]="series()" [yDomain]="[0, 100]">
  <svg:g cngxLine></svg:g>
</cngx-chart>
```

Two layers stacked - an area fill under a line, plus a threshold reference on top:

```html
<cngx-chart [data]="revenue()" [yDomain]="[0, 1000]">
  <svg:g cngxArea [accessor]="getValue" baseline="0"></svg:g>
  <svg:g cngxLine [accessor]="getValue"></svg:g>
  <svg:g cngxThreshold [value]="target()" label="Target" dashed></svg:g>
</cngx-chart>
```

Background band behind primary content - render it first so it sits behind:

```html
<cngx-chart [data]="latency()" [yDomain]="[0, 500]">
  <svg:g cngxBand [from]="0" [to]="100" label="Good"></svg:g>
  <svg:g cngxLine [accessor]="getValue"></svg:g>
</cngx-chart>
```

## Layer family

| Directive | Host | Renders | Required input | Notes |
|-|-|-|-|-|
| `[cngxLine]` | `<svg:g>` | One `<path>` connecting points | none (defaults to `Number(d)`) | Cubic curve via `[curve]`. String-equal guarded `d`. |
| `[cngxArea]` | `<svg:g>` | One closed `<path>` filled to `[baseline]` | none | Reuses the line path builder, closes the polygon. |
| `[cngxBar]` | `<svg:g>` | One `<rect>` per datapoint | none | Slot width is geometric (`width / n`), shrunk by `[gap]`. Works with linear or band X axes. |
| `[cngxScatter]` | `<svg:g>` | One `<circle>` per datapoint | `[x]`, `[y]` accessors | Both axes carry data - no index defaults. |
| `[cngxThreshold]` | `<svg:g>` | Horizontal `<line>` at `yScale(value)` + optional label | `[value]` | `[dashed]` for warning targets. |
| `[cngxBand]` | `<svg:g>` | `<rect>` spanning a Y-range + optional label | `[from]`, `[to]` | Default opacity 0.12 - sits behind primary layers. |

All layers fall back to the chart's `[data]` input; pass `[data]` directly on a layer when one chart hosts multiple series.

## Why attribute selectors on `<svg:g>`

Element selectors create XHTML-namespaced custom elements inside SVG and break layout for the namespaced children. The host element is the SVG group itself, the directive renders into it. Apply each layer to its own `<svg:g>` so it can be ordered, toggled with `@if`, and styled independently.

## Z-order is template order

Layers paint in the order they appear in the template. Render bands and thresholds first if they are backdrops, last if they are overlays. There is no `z-index` token - move the `<svg:g>` instead.

## Per-layer CSS vars

Each layer reads its own colour token first and falls back to `--cngx-chart-primary` (or `--cngx-chart-danger` for `[cngxThreshold]`, `--cngx-chart-secondary` for `[cngxBand]`). Override on the layer host for one-off styling:

```html
<svg:g cngxLine style="--cngx-line-color: var(--cngx-chart-success)"></svg:g>
```

Enter animations honour `prefers-reduced-motion: reduce`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, accessors, and tokens.
- `@cngx/common/chart/axis` for tick rendering and axis positioning.
- `@cngx/common/chart/scales` for the scale factories (`createLinearScale`, `createTimeScale`, `createBandScale`, `createOrdinalScale`).
- `@cngx/common/chart/path` for the shared path builder used by `[cngxLine]` and `[cngxArea]`.
