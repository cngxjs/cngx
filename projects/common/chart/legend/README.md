# Chart Legend

Presentational legend atom that pairs coloured swatches with labels. Decoupled from `<cngx-chart>` and the layer atoms by design - the consumer owns the `items` array, so the legend stays a pure rendering surface with no opinions about series-discovery, visibility-toggling, or interaction. Compose it next to any chart (atoms or presets) wherever a multi-layer view needs a label key.

## Import

```ts
import { CngxChartLegend, type CngxChartLegendItem } from '@cngx/common/chart';
```

## Quick start

```html
<cngx-chart [data]="series">
  <svg:g cngxLine [data]="traffic" style="--cngx-line-color: #3b82f6"></svg:g>
  <svg:g cngxLine [data]="errors"  style="--cngx-line-color: #d2452f"></svg:g>
</cngx-chart>

<cngx-chart-legend
  [items]="[
    { label: 'Traffic', color: '#3b82f6' },
    { label: 'Errors',  color: '#d2452f' }
  ]"
/>
```

Vertical stack, end-aligned:

```html
<cngx-chart-legend
  orientation="vertical"
  align="end"
  [items]="legendItems()"
/>
```

`CngxChartLegendItem<T>` carries an optional `value: T` so the consumer can stash a domain key (layer id, accessor name, row reference) on each entry without a second lookup when wiring interactions later.

## Accessibility

The host renders `role="list"` and each entry renders `role="listitem"`. The swatch is `aria-hidden="true"` - colour alone is not announced, so the `label` text must carry the full meaning of the entry on its own. When the legend stands in for a series toggle, the toggle UI is the consumer's responsibility - this atom does not project interactive children.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- `@cngx/common/chart` entry: [../README.md](../README.md).
- Sibling chart subfolders: [chart/](../chart/), [axis/](../axis/), [layers/](../layers/), [presets/](../presets/).
