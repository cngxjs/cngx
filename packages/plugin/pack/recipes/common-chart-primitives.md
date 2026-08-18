---
title: "CngxChart: Async state machine on the primitive"
whenToUse: "Same four-state machine the presets follow, but applied to the lowest-level primitive composition. Array-valued, so the empty branch is reached by setSuccess([]). This story projects &lt;cngx-empty-state&gt; from @cngx/ui into the empty and error slots to demonstrate richer fallback content."
symbols: [CngxChart, CngxAxis, CngxLine, CngxArea, CngxThreshold, CngxBand, CngxChartEmpty, CngxChartError, CngxEmptyState]
---

# CngxChart: Async state machine on the primitive

Same four-state machine the presets follow, but applied to the lowest-level primitive composition. Array-valued, so the empty branch is reached by setSuccess([]). This story projects &lt;cngx-empty-state&gt; from @cngx/ui into the empty and error slots to demonstrate richer fallback content.

## Symbols

- `CngxChart`
- `CngxAxis`
- `CngxLine`
- `CngxArea`
- `CngxThreshold`
- `CngxBand`
- `CngxChartEmpty`
- `CngxChartError`
- `CngxEmptyState`

## Wiring

```
<div class="cngx-ex-chart-frame">
    <cngx-chart
      [data]="chartStateData"
      [state]="chartState"
      [width]="480"
      [height]="200"
      aria-label="Telemetry feed with custom empty and error fallbacks."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
      <svg:g cngxBand [from]="20" [to]="30" label="watch"></svg:g>
      <svg:g cngxArea></svg:g>
      <svg:g cngxLine [strokeWidth]="2"></svg:g>
      <svg:g cngxThreshold [value]="25" [label]="'target'" [dashed]="true"></svg:g>
      <ng-template cngxChartEmpty let-small="small">
        @if (small) {
          <span class="cngx-ex-status-readout">No telemetry</span>
        } @else {
          <cngx-empty-state
            title="No telemetry yet"
            description="Connect a feed or pick a different time window."
          />
        }
      </ng-template>
      <ng-template cngxChartError let-err="error" let-small="small">
        @if (small) {
          <span class="cngx-ex-status-readout">Feed failed</span>
        } @else {
          <cngx-empty-state
            title="Telemetry feed failed"
            [description]="err?.message ?? 'Try again in a moment.'"
          />
        }
      </ng-template>
    </cngx-chart>
  </div>
```
