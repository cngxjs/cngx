---
title: "CngxChart: Streaming telemetry with injectChartBuffer"
whenToUse: "The buffer caps at 1000 samples and downsamples to 600 perceptually-faithful points, so the sine + occasional spike keeps its shape without unbounded DOM growth. Toggle the connection to see the [connectionState] reconnecting overlay - a channel independent of the data [state]."
symbols: [CngxChart, CngxAxis, CngxLine, CngxThreshold, CngxChartAnnouncer]
---

# CngxChart: Streaming telemetry with injectChartBuffer

The buffer caps at 1000 samples and downsamples to 600 perceptually-faithful points, so the sine + occasional spike keeps its shape without unbounded DOM growth. Toggle the connection to see the [connectionState] reconnecting overlay - a channel independent of the data [state].

## Symbols

- `CngxChart`
- `CngxAxis`
- `CngxLine`
- `CngxThreshold`
- `CngxChartAnnouncer`

## Wiring

```
<div class="cngx-ex-chart-frame">
    <cngx-chart
      #chart
      [data]="buffer.points()"
      [connectionState]="connection"
      [width]="480"
      [height]="200"
      aria-label="Live streaming telemetry buffered through injectChartBuffer."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 600]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 130]"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxThreshold [value]="80" [label]="'alert'" [dashed]="true"></svg:g>
    </cngx-chart>
    <cngx-chart-announcer [cngxChartAnnouncer]="chart" />
  </div>
```
