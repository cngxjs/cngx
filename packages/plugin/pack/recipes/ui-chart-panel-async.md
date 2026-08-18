---
title: "CngxChartPanel: Panel chrome vs chart state"
whenToUse: "This is the demarcation the panel exists to hold. cngx-chart already owns the data-level view switch, its skeleton and error surfaces and its SR data table; reproducing that in the panel would put two managers on one state. Drive the two rows independently: a busy panel never blanks the chart, and a loading chart never dims the actions. aria-busy sits on the header, not on the group - on the region it would hold back the chart own live announcements and claim a stable chart is updating."
symbols: [CngxChartPanel]
---

# CngxChartPanel: Panel chrome vs chart state

This is the demarcation the panel exists to hold. cngx-chart already owns the data-level view switch, its skeleton and error surfaces and its SR data table; reproducing that in the panel would put two managers on one state. Drive the two rows independently: a busy panel never blanks the chart, and a loading chart never dims the actions. aria-busy sits on the header, not on the group - on the region it would hold back the chart own live announcements and claim a stable chart is updating.

## Symbols

- `CngxChartPanel`

## Setup

```ts
protected readonly series: readonly number[] = [42, 51, 47, 63, 58, 71, 69, 82];

  /** Drives the chart body - skeleton, content, error. */
  protected readonly chartState = createManualState<readonly number[]>();

  /** Drives panel chrome only - a range switch, an export, a re-query. */
  protected readonly panelState = createManualState<void>();
```

## Wiring

```html
<cngx-chart-panel [state]="panelState" style="max-width:520px">
    <h3 cngxChartPanelTitle>Revenue by quarter</h3>
    <button cngxChartPanelActions type="button" class="chip">Change range</button>

    <cngx-chart
      [data]="series"
      [state]="chartState"
      [height]="180"
      aria-label="Net revenue by quarter"
    >
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 90]" [grid]="true"></svg:g>
      <svg:g
        cngxAxisDomain
        position="bottom"
        type="linear"
        [domain]="[0, 7]"
      ></svg:g>
      <svg:g cngxLine [data]="series"></svg:g>
    </cngx-chart>
  </cngx-chart-panel>
```
