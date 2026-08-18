---
title: "CngxAsyncBoundary: per-source error attribution"
whenToUse: "The aggregate's own error stays the first error for the single-error toast/bridge path; failures() is the persistent per-source breakdown. Fail either source to see both surfaces label the failure from f.label."
symbols: [CngxAsyncBoundary, CngxAsyncContainer, CngxAlert, CngxBannerTrigger]
---

# CngxAsyncBoundary: per-source error attribution

The aggregate's own error stays the first error for the single-error toast/bridge path; failures() is the persistent per-source breakdown. Fail either source to see both surfaces label the failure from f.label.

## Symbols

- `CngxAsyncBoundary`
- `CngxAsyncContainer`
- `CngxAlert`
- `CngxBannerTrigger`

## Wiring

```
<div [cngxAsyncBoundary]="sources()" #b="cngxAsyncBoundary">
    <cngx-async-container [state]="b.state" ariaLabel="Account bootstrap">
      <ng-template cngxAsyncSkeleton>
        <div class="demo-skeleton-bar" style="height:20px"></div>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <ul class="demo-stack" style="list-style:none;padding:0;margin:0;gap:6px">
          <li class="demo-card-tile">User: {{ data[0] }}</li>
          <li class="demo-card-tile">Permissions: {{ data[1] }}</li>
          <li class="demo-card-tile">Feature flags: {{ data[2] }}</li>
        </ul>
      </ng-template>

      <ng-template cngxAsyncError>
        <div class="demo-stack" style="display:flex;flex-direction:column;gap:8px">
          @for (f of b.failures(); track f.key) {
            <cngx-alert severity="error" [title]="f.label ?? f.key">{{ f.error }}</cngx-alert>
            <cngx-banner-trigger
              [when]="true"
              [message]="(f.label ?? f.key) + ' failed to load'"
              [id]="'async-boundary:' + f.key"
              severity="error" />
          }
        </div>
      </ng-template>
    </cngx-async-container>
  </div>
```
