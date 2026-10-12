---
title: "CngxChart: connection lost and reconnecting"
whenToUse: "The connection channel is independent of the data [state]: the drawn series stays on screen and the overlay sits on top of it. Status error renders the connection-lost overlay inside a role=\"alert\" wrapper, status refreshing renders the reconnecting overlay inside a role=\"status\" wrapper; both wrappers stay library-owned. Both templates receive { $implicit: error, error, width, height, small, plot }, where error is the connection state's current error. createManualState only clears the error on success, so the reconnecting overlay still sees the error that dropped the connection."
symbols: [CngxChart, CngxChartConnectionError, CngxChartReconnecting, CngxAxis, CngxLine]
---

# CngxChart: connection lost and reconnecting

The connection channel is independent of the data [state]: the drawn series stays on screen and the overlay sits on top of it. Status error renders the connection-lost overlay inside a role="alert" wrapper, status refreshing renders the reconnecting overlay inside a role="status" wrapper; both wrappers stay library-owned. Both templates receive { $implicit: error, error, width, height, small, plot }, where error is the connection state's current error. createManualState only clears the error on success, so the reconnecting overlay still sees the error that dropped the connection.

## Symbols

- `CngxChart`
- `CngxChartConnectionError`
- `CngxChartReconnecting`
- `CngxAxis`
- `CngxLine`

## Setup

```ts
protected readonly readings: readonly number[] = [18, 22, 21, 26, 30, 28, 33, 31, 35, 34, 38, 36];
protected readonly connection = createManualState<unknown>();
protected readonly customSlots = signal(true);
protected errorText(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}
```

## Wiring

```html
<div class="cngx-ex-chart-frame">
  <cngx-chart
    [data]="readings"
    [connectionState]="connection"
    [width]="480"
    [height]="200"
    aria-label="Server load over the last 12 minutes, in percent."
  >
    <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 50]"></svg:g>
    <svg:g cngxLine></svg:g>
    @if (customSlots()) {
      <ng-template cngxChartConnectionError let-error let-small="small">
        <span class="demo-chart-connection">
          <strong>Live feed lost</strong>
          @if (!small) {
            <span>{{ errorText(error) }}</span>
          }
        </span>
      </ng-template>
      <ng-template cngxChartReconnecting let-error let-plot="plot">
        <span class="demo-chart-connection">
          Reconnecting after "{{ errorText(error) }}" (plot {{ plot.width }} wide)
        </span>
      </ng-template>
    }
  </cngx-chart>
</div>
```
