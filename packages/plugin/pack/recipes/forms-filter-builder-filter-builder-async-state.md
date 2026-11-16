---
title: "CngxFilterBuilder: loading error content branches via cngxAsync"
whenToUse: "Renders &lt;cngx-filter-builder&gt; through *cngxAsync once its field schema has loaded. The skeleton and error templates cover the first load; a refresh or a failed reload keeps the builder and its tree, because a structural directive renders one template at a time."
symbols: [CngxFilterBuilder, CngxAsync]
---

# CngxFilterBuilder: loading error content branches via cngxAsync

Renders &lt;cngx-filter-builder&gt; through *cngxAsync once its field schema has loaded. The skeleton and error templates cover the first load; a refresh or a failed reload keeps the builder and its tree, because a structural directive renders one template at a time.

## Symbols

- `CngxFilterBuilder`
- `CngxAsync`

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

  @if (state.status() === 'idle') {
    <p class="demo-empty">Press <strong>Load</strong> to fetch the filter schema.</p>
  }

  <div [attr.aria-busy]="state.isBusy()">
    <cngx-filter-builder
      *cngxAsync="state; let data; skeleton: skeletonTpl; error: errorTpl"
      [fields]="data"
      [(value)]="tree"
    />
  </div>

  <ng-template #skeletonTpl>
    <div class="demo-skeleton">
      <div class="demo-skeleton-row"></div>
      <div class="demo-skeleton-row"></div>
      <div class="demo-skeleton-row"></div>
    </div>
  </ng-template>

  <ng-template #errorTpl let-err>
    <div role="alert" class="demo-error">
      <strong>Schema load failed:</strong> {{ (err)?.message ?? 'unknown error' }}
    </div>
  </ng-template>

  <pre class="code-block"><code>{{ tree() | json }}</code></pre>
</div>
```
