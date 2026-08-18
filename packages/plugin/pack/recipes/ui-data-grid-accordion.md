---
title: "Data-grid accordion: Lazy-loading rows"
whenToUse: "Each row&apos;s [state] is driven by a per-row manual async state. There is no open output on the row, so the fetch is kicked from the group&apos;s (openIdsChange): when a row id first enters the open set and its state is still idle, the fetch runs. The region binds aria-busy while loading and un-hides itself in the error state so the role=\"alert\" is announced even from a collapsed row. The third row always fails so the error + retry path is visible."
symbols: [CngxDataGridAccordion, CngxDataGridRow, CngxDgaRowBusy, CngxDgaRowError]
---

# Data-grid accordion: Lazy-loading rows

Each row&apos;s [state] is driven by a per-row manual async state. There is no open output on the row, so the fetch is kicked from the group&apos;s (openIdsChange): when a row id first enters the open set and its state is still idle, the fetch runs. The region binds aria-busy while loading and un-hides itself in the error state so the role="alert" is announced even from a collapsed row. The third row always fails so the error + retry path is visible.

## Symbols

- `CngxDataGridAccordion`
- `CngxDataGridRow`
- `CngxDgaRowBusy`
- `CngxDgaRowError`

## Setup

```ts
protected readonly overviewState = createManualState<string>();
  protected readonly metricsState = createManualState<string>();
  protected readonly auditState = createManualState<string>();

  private fetch(state: ManualAsyncState<string>, payload: string, fail: boolean): void {
    if (state.status() === 'loading' || state.status() === 'success') {
      return;
    }
    state.set('loading');
    setTimeout(() => {
      if (fail) {
        state.setError(new Error('Request failed'));
      } else {
        state.setSuccess(payload);
      }
    }, 900);
  }

  protected onOpenChange(open: ReadonlySet<string>): void {
    if (open.has('overview')) {
      this.fetch(this.overviewState, 'Traffic is up 12% week over week across all regions.', false);
    }
    if (open.has('metrics')) {
      this.fetch(this.metricsState, 'p95 latency 180ms, error rate 0.2%, 4 active alerts.', false);
    }
    if (open.has('audit')) {
      this.fetch(this.auditState, '', true);
    }
  }

  protected retry(state: ManualAsyncState<string>): void {
    state.reset();
    this.fetch(state, '', true);
  }
```

## Wiring

```html
<div style="max-width:40rem">
    <cngx-data-grid-accordion
      [skin]="'ledger'"
      [multi]="true"
      [headingLevel]="3"
      (openIdsChange)="onOpenChange($event)"
    >
      <cngx-dga-header>
        <span cngxDgaCell col="grow">Section</span>
        <span cngxDgaCell col="md" align="end">Status</span>
      </cngx-dga-header>

      <cngx-dga-row panelId="overview" [state]="overviewState">
        <span cngxDgaCell primary>Overview</span>
        <span cngxDgaCell align="end">{{ overviewState.status() }}</span>
        <ng-template cngxDgaRowBusy let-status>Loading overview… ({{ status }})</ng-template>
        {{ overviewState.data() }}
      </cngx-dga-row>

      <cngx-dga-row panelId="metrics" [state]="metricsState">
        <span cngxDgaCell primary>Live metrics</span>
        <span cngxDgaCell align="end">{{ metricsState.status() }}</span>
        <ng-template cngxDgaRowBusy>Loading metrics…</ng-template>
        {{ metricsState.data() }}
      </cngx-dga-row>

      <cngx-dga-row
        panelId="audit"
        [state]="auditState"
        [errorMessage]="'The audit log could not be loaded.'"
      >
        <span cngxDgaCell primary>Audit log</span>
        <span cngxDgaCell align="end">{{ auditState.status() }}</span>
        <ng-template cngxDgaRowBusy>Loading audit log…</ng-template>
        <ng-template cngxDgaRowError let-message="message">
          {{ message }}
          <button type="button" (click)="retry(auditState)">Retry</button>
        </ng-template>
        {{ auditState.data() }}
      </cngx-dga-row>
    </cngx-data-grid-accordion>
  </div>
```
