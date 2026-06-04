# Chart Presets

Pre-composed chart molecules for the small, repetitive shapes that show up next to KPIs and table cells: sparklines, mini bars, donuts, bullets, deviation strips, stacked-share bars. Each preset wires the right atoms (`<cngx-chart>`, `[cngxAxis]`, layer directives) or pure DOM together behind one element, exposes a tight input surface, and renders a built-in async state envelope (skeleton / empty / error / content) when a `[state]` is bound.

## Import

```ts
import {
  CngxSparkline,
  CngxMiniArea,
  CngxMiniBar,
  CngxDeviationBar,
  CngxDonut,
  CngxBullet,
  CngxStackedBar,
} from '@cngx/common/chart';
```

## Quick start

```html
<!-- Inline trend next to a value -->
<span>
  Revenue 4.2M
  <cngx-sparkline [data]="trend()" aria-label="Revenue last 12 months"></cngx-sparkline>
</span>

<!-- Bounded indicator with reactive ARIA -->
<cngx-donut [value]="score()" [max]="100" label="Score" aria-label="Customer health"></cngx-donut>

<!-- Async state envelope built in -->
<cngx-mini-bar [value]="usage().value" [state]="usage()" aria-label="Storage usage"></cngx-mini-bar>
```

## Available presets

| Preset | Selector | Shape | ARIA role |
|-|-|-|-|
| `CngxSparkline` | `cngx-sparkline` | Inline line (+ optional area fill) | `img` via `<cngx-chart>` |
| `CngxMiniArea` | `cngx-mini-area` | Inline filled area, no stroke | `img` via `<cngx-chart>` |
| `CngxMiniBar` | `cngx-mini-bar` | Single-value horizontal fill | `meter` |
| `CngxDeviationBar` | `cngx-deviation-bar` | Signed bar diverging from a baseline | `meter` |
| `CngxDonut` | `cngx-donut` | Circular gauge, value vs max | `meter` |
| `CngxBullet` | `cngx-bullet` | Stephen Few bullet: ranges + actual + target marker | `meter` |
| `CngxStackedBar` | `cngx-stacked-bar` | Proportional share strip across labelled segments | `img` |

`CngxSparkline` and `CngxMiniArea` compose `<cngx-chart>` + `[cngxAxis]` + layer atoms internally. The other five render pure DOM and skip SVG entirely. Skeleton, empty, and error views ship inline; bind `[state]` (a `CngxAsyncState`) to switch them on.

## Preset vs primitives

Reach for a preset when the shape is one of the seven above and the data is one of `number`, `readonly number[]`, `readonly CngxStackedSegment[]`, or `readonly CngxBulletRange[]`. Drop down to `<cngx-chart>` + `[cngxAxis]` + `[cngxLine]` / `[cngxArea]` / `[cngxBar]` / `[cngxScatter]` / `[cngxThreshold]` / `[cngxBand]` when the shape needs multiple series, custom axes, a legend, or a layer combination the presets do not cover.

```html
<!-- Preset: one element, one shape -->
<cngx-sparkline [data]="series()"></cngx-sparkline>

<!-- Primitives: same shape, full control over scales, axes, layers -->
<cngx-chart [data]="series()" [width]="80" [height]="24">
  <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, series().length - 1]"></svg:g>
  <svg:g cngxAxis position="left" type="linear" [domain]="yDomain()"></svg:g>
  <svg:g cngxLine [strokeWidth]="1.5"></svg:g>
</cngx-chart>
```

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, tokens, and per-preset details.
- Primitives: `@cngx/common/chart/chart` (container + context), `@cngx/common/chart/axis`, `@cngx/common/chart/layers`.
- Stories: `examples/stories/common/chart/`.
