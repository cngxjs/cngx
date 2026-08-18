---
title: "Accordion panel: Lazy fetch per panel"
whenToUse: "Drive each item&apos;s [state] from a per-panel manual async state. There is no open output on the item, so the fetch is kicked from the group&apos;s (openIdsChange): when a panel id first enters the open set and its state is still idle, the fetch runs. The busy, error, and content slots are chosen by the state machine, not by the accordion. Each slot receives a CngxAccordionItemStateContext: the busy template reads the status via let-status, the error template the resolved message via let-message=\"message\". The third panel always fails so the error + retry path is visible."
symbols: [CngxAccordionGroup, CngxAccordionItem]
---

# Accordion panel: Lazy fetch per panel

Drive each item&apos;s [state] from a per-panel manual async state. There is no open output on the item, so the fetch is kicked from the group&apos;s (openIdsChange): when a panel id first enters the open set and its state is still idle, the fetch runs. The busy, error, and content slots are chosen by the state machine, not by the accordion. Each slot receives a CngxAccordionItemStateContext: the busy template reads the status via let-status, the error template the resolved message via let-message="message". The third panel always fails so the error + retry path is visible.

## Symbols

- `CngxAccordionGroup`
- `CngxAccordionItem`

## Wiring

```
<cngx-accordion-group
    [multi]="true"
    [headingLevel]="3"
    (openIdsChange)="onOpenChange($event)"
    style="max-width:520px"
  >
    <cngx-accordion-item panelId="overview" [state]="overviewState">
      <span cngxAccordionItemTitle>Overview</span>
      <span cngxAccordionItemSubtitle>Loaded on first open.</span>
      <ng-template cngxAccordionItemBusy let-status>
        <p>Loading overview… <small>({{ status }})</small></p>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <p>{{ overviewState.data() }}</p>
      </ng-template>
    </cngx-accordion-item>

    <cngx-accordion-item panelId="metrics" [state]="metricsState">
      <span cngxAccordionItemTitle>Live metrics</span>
      <span cngxAccordionItemSubtitle>Fetched independently.</span>
      <ng-template cngxAccordionItemBusy>
        <p>Loading metrics…</p>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <p>{{ metricsState.data() }}</p>
      </ng-template>
    </cngx-accordion-item>

    <cngx-accordion-item
      panelId="audit"
      [state]="auditState"
      [errorMessage]="'The audit log could not be loaded.'"
    >
      <span cngxAccordionItemTitle>Audit log</span>
      <span cngxAccordionItemSubtitle>This endpoint fails on purpose.</span>
      <ng-template cngxAccordionItemBusy>
        <p>Loading audit log…</p>
      </ng-template>
      <ng-template cngxAccordionItemError let-message="message">
        <p>{{ message }}</p>
        <button type="button" (click)="retry(auditState, '', true)">Retry</button>
      </ng-template>
      <ng-template cngxAccordionItemContent>
        <p>{{ auditState.data() }}</p>
      </ng-template>
    </cngx-accordion-item>
  </cngx-accordion-group>
```
