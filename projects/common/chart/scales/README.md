# Chart Scales

Pure-TS scale factories for the cngx chart system. Each factory takes a domain and a range and returns a callable mapping function. No Angular, no DI, no signals - call them from a `computed()` and feed the result into the chart context. The chart atoms (`[cngxAxis]`, `<cngx-bar>`, `<cngx-line>`, ...) consume the resulting functions; they never construct scales themselves.

## Import

```ts
import {
  createBandScale,
  createLinearScale,
  createOrdinalScale,
  createTimeScale,
  type BandScale,
} from '@cngx/common/chart';
```

## Quick start

```ts
import { computed, signal } from '@angular/core';
import { createBandScale, createLinearScale } from '@cngx/common/chart';

const data = signal([
  { month: 'Jan', value: 12 },
  { month: 'Feb', value: 18 },
  { month: 'Mar', value: 9 },
]);

const width = signal(320);
const height = signal(120);

const xScale = computed(() =>
  createBandScale(
    data().map((d) => d.month),
    [0, width()],
    0.2,
  ),
);

const yScale = computed(() =>
  createLinearScale([0, 20], [height(), 0]),
);
```

The Y range is inverted (`[height, 0]`) because SVG's origin is top-left. A linear scale handles that without a flag - just pass the range in the order the renderer needs.

## Scale family

| Factory | Domain | Range | Reach for it when |
|-|-|-|-|
| `createBandScale<T>` | discrete `T[]` | `[number, number]` | Categorical X axis for bar charts. Returns a callable with `bandwidth()` for slot width and optional `padding` for inter-band gaps. |
| `createLinearScale` | `[number, number]` | `[number, number]` | Continuous numeric axis. Linear interpolation, inverted domains supported, no clamping. |
| `createTimeScale` | `[Date \| number, Date \| number]` | `[number, number]` | Time axis. Coerces `Date` to epoch ms and delegates to `createLinearScale`. |
| `createOrdinalScale<T>` | discrete `T[]` | `readonly string[]` | Categorical colour mapping. Cycles modulo palette length; throws if the palette is empty. |

Unknown lookups: `createBandScale` returns `NaN`, `createOrdinalScale` returns the first palette entry, the continuous scales extrapolate.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for full signatures.
- `@cngx/common/chart/axis` for the directive that renders ticks against these scales.
- `@cngx/common/chart/layers` for the atoms (`CngxBar`, `CngxLine`, `CngxArea`, ...) that consume them.
