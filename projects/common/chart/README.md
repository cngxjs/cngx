# @cngx/common/chart

Declarative, Signal-first chart system. Built as two layers: composable atoms (one container, one directive per axis or layer) and preset molecules (sparkline, donut, stacked bar, threshold gauge) for the common shapes.

## When you reach for it

You are visualising data inside an Angular template and want chart behaviour that lives in the same reactivity graph as the rest of your component - not a wrapper around an imperative library. Typical reasons:

- A single-series sparkline next to a value cell - no axes, no legend, just a glanceable trend.
- A KPI tile with a donut or stacked bar showing composition or progress.
- A custom chart shape that the presets do not cover, where you want to compose your own `<svg:g>` layers against scales the container provides.
- Async data sources where loading, refresh, and error states should render through the same surface as the chart itself rather than as separate UI.

## Mental model

A cngx chart is just an SVG with a shared **chart context** - scales, dimensions, and theme tokens - exposed via DI to its children. Atoms read the context to render their slice (axis ticks, line path, bar rectangles, scatter points). Preset molecules wire the common combinations together so you do not assemble them every time.

Three properties make the chart system feel different from a wrapped library:

- **Reactive scales.** The X and Y scales are signals derived from the data and container dimensions. Resizing the container or swapping data triggers exactly the layers whose inputs changed - no full re-layout.
- **Async-native.** Bind `[state]` and the chart switches between skeleton, content, refresh, empty, and error views the same way every other cngx surface does. Loading is a built-in mode, not a parent wrapper.
- **Override slots.** Loading, empty, and error placeholders are template slots; the chart never blocks you from owning the UX of a failed fetch.

## Status

Under active development. Treat the **preset molecules** as stable for adoption. Treat the **atom internals** (axis tick computation, layer projection caching, custom-layer authoring) as still in flux until the chart-area master plan closes - APIs may move between minor releases.


