---
title: "CngxMiniBar: Async state machine"
whenToUse: "Single-value indicator with a four-state demo. Empty is reached by entering success without data (state.reset() + state.set(\"success\")); the preset paints its empty fallback instead of a bar at 0%, so the reader can distinguish \"no measurement yet\" from \"measured zero\"."
symbols: [CngxMiniBar]
---

# CngxMiniBar: Async state machine

Single-value indicator with a four-state demo. Empty is reached by entering success without data (state.reset() + state.set("success")); the preset paints its empty fallback instead of a bar at 0%, so the reader can distinguish "no measurement yet" from "measured zero".

## Symbols

- `CngxMiniBar`

## Setup

```ts
protected readonly state = createManualState<number>();
```

## Wiring

```html
<cngx-mini-bar [value]="64" [state]="state" aria-label="Demo metric" />
```
