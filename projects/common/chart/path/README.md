# Chart Path

SVG path builder and curve interpolators that power the line / area layer atoms. Pure TypeScript, no DOM dependency, no Angular dependency. Consumed by `CngxLine` and `CngxArea` internally; exported so consumers can build custom layers against the same scale contract the rest of the chart uses.

## Import

```ts
import {
  buildCurvePath,
  createPathBuilder,
  type CngxCurve,
  type PathPoint,
  type PathBuilder,
  type PathBuilderOptions,
  type LineYAccessor,
  type LineXAccessor,
} from '@cngx/common/chart';
```

## Quick start

One-shot path from raw points:

```ts
const points: PathPoint[] = [
  { x: 0, y: 40 },
  { x: 20, y: 20 },
  { x: 40, y: 30 },
  { x: 60, y: 10 },
];

const d = buildCurvePath(points, 'monotone');
// 'M 0 40 C 6.67 33.33, 13.33 20, 20 20 C ...'
```

Cached builder for a chart layer (data + scales come from the chart context):

```ts
const builder = createPathBuilder<Row>({
  y: (row) => row.value,
  x: (_, i) => i,
  curve: 'linear',
});

const d = builder.build(data, xScale, yScale);
```

The builder memoises on reference identity of `(data, xScale, yScale)`. Two calls with the same triple skip projection and return the cached string.

## Curve types

| Value | Strategy |
|-|-|
| `linear` | Straight `L` segments between points. |
| `monotone` | Cubic Bezier with Fritsch-Carlson tangents on X. Never overshoots between data points. Requires strictly increasing `x`. |

## Public functions

| Symbol | Kind | Purpose |
|-|-|-|
| `buildCurvePath(points, curve)` | function | Build the full `d` attribute (`M` + interior commands) for a sequence of `PathPoint`s. Returns `''` for empty input, `M x y` for a single point. |
| `createPathBuilder(opts)` | function | Returns a `PathBuilder<T>` that projects rows through `(x, y)` accessors and scales, then builds the path with single-slot LRU memo on reference identity. |
| `PathBuilder<T>.build(data, xScale, yScale)` | method | Build (or return cached) `d` for the given data + scales. |
| `PathBuilder<T>.rebuildCount()` | method | Diagnostic counter for the compute-guard spec. Not part of the layer atom API. |
| `CngxCurve` | type | `'linear' | 'monotone'`. |
| `PathPoint` | type | `{ readonly x: number; readonly y: number }` in pixel space. |
| `PathBuilderOptions<T>` | type | `{ y: LineYAccessor<T>; x?: LineXAccessor<T>; curve: CngxCurve }`. `x` defaults to positional index. |
| `LineYAccessor<T>` | type | `(row: T, i: number) => number`. |
| `LineXAccessor<T>` | type | `(row: T, i: number) => XScaleInput`. |

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full chart surface.
- Sibling subfolders: `projects/common/chart/scales/`, `projects/common/chart/layers/`, `projects/common/chart/chart/`.
