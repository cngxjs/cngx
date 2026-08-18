---
title: "CngxFilterBuilder: loading error content branches via cngx async container"
whenToUse: "Wraps in for state-driven UI. Demonstrates the consumer-side loading / error / refreshing pattern."
symbols: [CngxFilterBuilder, CngxAsyncContainer]
---

# CngxFilterBuilder: loading error content branches via cngx async container

Wraps in for state-driven UI. Demonstrates the consumer-side loading / error / refreshing pattern.

## Symbols

- `CngxFilterBuilder`
- `CngxAsyncContainer`

## Setup

```ts
protected readonly state = createManualState<readonly FilterFieldDef[]>();
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected loadFields(): void {
    this.state.set('loading');
    setTimeout(() => this.state.setSuccess(FILTER_BUILDER_FIELDS), 600);
  }
  protected failFields(): void {
    this.state.set('loading');
    setTimeout(() => this.state.setError(new Error('Field schema unavailable')), 400);
  }
  protected refreshFields(): void {
    this.state.set('refreshing');
    setTimeout(() => this.state.setSuccess(FILTER_BUILDER_FIELDS), 500);
  }
  protected resetState(): void {
    this.state.reset();
    this.tree.set(createEmptyFilterRoot());
  }
```

## Wiring

```html
<div class="demo-form">
    <div class="button-row">
      <button type="button" class="chip" (click)="loadFields()">Load</button>
      <button type="button" class="chip" (click)="refreshFields()">Refresh</button>
      <button type="button" class="chip" (click)="failFields()">Fail</button>
      <button type="button" class="chip" (click)="resetState()">Reset</button>
    </div>

    <cngx-async-container [state]="state" ariaLabel="Filter schema">
      <ng-template cngxAsyncSkeleton>
        <div class="demo-skeleton">
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
        </div>
      </ng-template>

      <ng-template cngxAsyncEmpty>
        <p class="demo-empty">Press <strong>Load</strong> to fetch the filter schema.</p>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <cngx-filter-builder [fields]="data" [(value)]="tree" />
      </ng-template>

      <ng-template cngxAsyncError let-err>
        <div role="alert" class="demo-error">
          <strong>Schema load failed:</strong> {{ (err)?.message ?? 'unknown error' }}
        </div>
      </ng-template>
    </cngx-async-container>

    <pre class="code-block"><code>{{ tree() | json }}</code></pre>
  </div>
```
