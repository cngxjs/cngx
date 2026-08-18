---
title: "CngxTimeline: Empty reasons"
whenToUse: "The organism cannot work the reason out for itself - only the consumer knows whether a filter cleared the list or the account is simply new - so it takes [emptyReason] and forwards it. The vocabulary is the same EmptyReason CngxCardGrid uses, which means an app writes one empty-state component and reuses it across both. Without the slot the body falls back to CNGX_TIMELINE_CONFIG.labels.emptyFallback, which is a sentence rather than a blank area, because an empty surface that says nothing reads as a broken one."
symbols: [CngxTimeline]
---

# CngxTimeline: Empty reasons

The organism cannot work the reason out for itself - only the consumer knows whether a filter cleared the list or the account is simply new - so it takes [emptyReason] and forwards it. The vocabulary is the same EmptyReason CngxCardGrid uses, which means an app writes one empty-state component and reuses it across both. Without the slot the body falls back to CNGX_TIMELINE_CONFIG.labels.emptyFallback, which is a sentence rather than a blank area, because an empty surface that says nothing reads as a broken one.

## Symbols

- `CngxTimeline`

## Wiring

```
<cngx-timeline
    [state]="feed"
    [dateAccessor]="at"
    [idAccessor]="byId"
    [emptyReason]="reason()"
    groupBy="day"
  >
    <ng-template cngxTimelineEmpty let-reason>
      @switch (reason) {
        @case ('no-results') { <p style="margin:0">No events match this filter.</p> }
        @case ('cleared') { <p style="margin:0">History cleared.</p> }
        @default { <p style="margin:0">Nothing has happened on this account yet.</p> }
      }
    </ng-template>

    <ng-template [cngxTimelineItem]="feed.data()" let-event let-last="last">
      <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
        <cngx-time cngxTimelineTime [date]="event.at" />
        <p style="margin:0">{{ event.summary }}</p>
      </cngx-timeline-item>
    </ng-template>
  </cngx-timeline>
```
