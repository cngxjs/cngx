---
title: "CngxActionButton: External state"
whenToUse: "The button reads its status from a createManualState() that something else drives, here the four chrome buttons standing in for a server push or a second tab. While the state is loading the button carries aria-busy and aria-disabled and refuses clicks, without having been clicked. Each success or error edge the button observes is spoken once in the live region next to it, and the dashed box below logs what that region receives. The [action] only asks for a sync: it flips the shared state to loading and returns, the outcome still arrives from outside."
symbols: [CngxActionButton]
---

# CngxActionButton: External state

The button reads its status from a createManualState() that something else drives, here the four chrome buttons standing in for a server push or a second tab. While the state is loading the button carries aria-busy and aria-disabled and refuses clicks, without having been clicked. Each success or error edge the button observes is spoken once in the live region next to it, and the dashed box below logs what that region receives. The [action] only asks for a sync: it flips the shared state to loading and returns, the outcome still arrives from outside.

## Symbols

- `CngxActionButton`

## Setup

```ts
protected readonly sync = createManualState<void>();

protected readonly requestSync = async (): Promise<void> => {
  this.sync.set('loading');
};
```

## Wiring

```html
<button
  cngxActionButton
  tone="primary"
  [action]="requestSync"
  [externalState]="sync"
  pendingLabel="Syncing..."
  succeededLabel="Synced"
  failedLabel="Sync failed"
>Sync now</button>
```
