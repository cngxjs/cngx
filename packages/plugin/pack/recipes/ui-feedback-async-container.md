---
title: "CngxAsync: one line"
whenToUse: "Bare-minimum binding: *cngxAsync=\"state; let data\" on a single element. No skeleton, no error template, just content rendered when the state succeeds."
symbols: [CngxAsyncContainer, CngxAsync]
---

# CngxAsync: one line

Bare-minimum binding: *cngxAsync="state; let data" on a single element. No skeleton, no error template, just content rendered when the state succeeds.

## Symbols

- `CngxAsyncContainer`
- `CngxAsync`

## Setup

```ts
protected readonly simple = createManualState<string[]>();
  protected loadSimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setSuccess(['Alice', 'Bob', 'Charlie']), 2000);
  }
  protected emptySimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setSuccess([]), 2000);
  }
  protected errorSimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setError('Network error'), 2000);
  }
```

## Wiring

```html
<ul *cngxAsync="simple; let data" class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
    @for (name of data; track name) {
      <li class="demo-card-tile">{{ name }}</li>
    }
  </ul>
```
