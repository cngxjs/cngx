---
title: "Language pack: live switch, common"
whenToUse: "The card, chart, interactive, display, layout and timeline copy is fed from computed signals through viewProviders. The copy inputs are left unbound, so each one follows its token; bind an input and it wins over the token as before."
symbols: [CngxCard, CngxChart, CngxCopyBlock, CngxBreadcrumb, CngxChip, CngxRangeSlider, CngxExpandableText, CngxTimeline]
---

# Language pack: live switch, common

The card, chart, interactive, display, layout and timeline copy is fed from computed signals through viewProviders. The copy inputs are left unbound, so each one follows its token; bind an input and it wins over the token as before.

## Symbols

- `CngxCard`
- `CngxChart`
- `CngxCopyBlock`
- `CngxBreadcrumb`
- `CngxChip`
- `CngxRangeSlider`
- `CngxExpandableText`
- `CngxTimeline`

## Setup

```ts
protected readonly range = signal<[number, number]>([20, 80]);
  protected readonly noData = buildAsyncStateView<readonly number[]>({
    status: signal('success' as const),
    data: signal<readonly number[]>([]),
    error: signal(undefined),
  });
  protected readonly noEvents: readonly { readonly at: Date }[] = [];
  protected readonly at = (event: { readonly at: Date }): Date => event.at;
```

## Wiring

```html
<div class="demo-stack">
    <cngx-card as="button" [selectable]="true">Selectable card</cngx-card>

    <cngx-chart [data]="[]" [state]="noData" [width]="240" [height]="80" />

    <cngx-copy-block [value]="'npm install @cngx/common'">
      <code>npm install &#64;cngx/common</code>
    </cngx-copy-block>

    <nav cngxBreadcrumb class="cngx-breadcrumb">
      <ol>
        <li><a href="#">Home</a></li>
        <li><a href="#" aria-current="page">Reports</a></li>
      </ol>
    </nav>

    <cngx-chip [removable]="true">Draft</cngx-chip>

    <cngx-range-slider [(value)]="range" [min]="0" [max]="100" />

    <cngx-expandable-text [lines]="1" [expanded]="true">
      A short note that stays expanded, so the toggle is always shown.
    </cngx-expandable-text>

    <cngx-timeline [items]="noEvents" [dateAccessor]="at">
      <ng-template cngxTimelineItem let-event>{{ event.at }}</ng-template>
    </cngx-timeline>
  </div>
```
