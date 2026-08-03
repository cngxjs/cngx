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

## Sizing and the plot area

The chart fills its host box. Inside that box it maps marks onto the **plot area**: the box minus the room the axes you projected need for their tick labels and titles. That is what keeps a `1,200,000` tick label inside a card instead of painting over its border, and it is why you never have to pad a container to catch overhanging axis text.

The reservation is derived. Which sides reserve comes from the axes you mounted; how much each reserves comes from the labels that axis formats. Every axis also reserves a little on the two sides perpendicular to it, because a tick label is centred on its tick and the end ticks sit on the plot corners - half of the first and last label would otherwise hang outside.

A chart with no axis reserves nothing and fills the box edge to edge. So does a chart whose axes are `[decorated]="false"` - that turns an axis into a pure domain publisher, drawing nothing and claiming no room, which is how the sparkline and mini-area presets declare their scales without paying for a gutter they never paint.

There is no knob. No input, no CSS custom property, no DI token sizes the gutter, because the component already knows everything needed to compute it. The one approximation is character width: the chart measures no text, so it estimates one character as a fraction of the default axis font size. Restyling `--cngx-axis-font-size` scales your labels but not the gutter they sit in. If that bites, the fix is a real measure pass or an escape hatch, and both are additive - open an issue with the font and the label that clipped.

## Status

Under active development. Treat the **preset molecules** as stable for adoption. Treat the **atom internals** (axis tick computation, layer projection caching, custom-layer authoring) as still in flux until the chart-area master plan closes - APIs may move between minor releases.


