---
title: "CngxBullet: Async state machine"
whenToUse: "Drives the bullet through every async-state branch via four buttons. The single-value chart has no value-driven empty representation, so empty is triggered by transitioning to success without setting data: state.reset() followed by state.set(\"success\") leaves data undefined, isEmpty resolves to true, and the preset paints its empty fallback."
symbols: [CngxBullet]
---

# CngxBullet: Async state machine

Drives the bullet through every async-state branch via four buttons. The single-value chart has no value-driven empty representation, so empty is triggered by transitioning to success without setting data: state.reset() followed by state.set("success") leaves data undefined, isEmpty resolves to true, and the preset paints its empty fallback.

## Symbols

- `CngxBullet`

## Setup

```ts
protected readonly state = createManualState<number>();
```

## Wiring

```html
<div style="max-width:400px">
    <cngx-bullet
      [actual]="78"
      [target]="80"
      [max]="100"
      [state]="state"
      [ranges]="[
        { from: 0, to: 50, color: 'color-mix(in oklch, currentColor 10%, transparent)', label: 'poor' },
        { from: 50, to: 75, color: 'color-mix(in oklch, currentColor 18%, transparent)', label: 'fair' },
        { from: 75, to: 100, color: 'color-mix(in oklch, currentColor 28%, transparent)', label: 'good' }
      ]"
      aria-label="Demo bullet"
    />
  </div>
```
