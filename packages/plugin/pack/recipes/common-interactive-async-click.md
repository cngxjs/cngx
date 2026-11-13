---
title: "CngxAsyncClick: Basic happy path"
whenToUse: "Wraps a click handler in an async-state machine. The action factory you bind to [cngxAsyncClick] can return a Promise or an Observable; the directive runs it on click, flips its pending() signal while in flight, then settles to succeeded() or failed() for feedbackDuration ms (default 2000) before returning to idle. The host class .cngx-async--pending / --success / --error mirrors the lifecycle; --pending follows the show delay of the loading config (a run faster than 120 ms never gets it) and is held for the min-dwell once shown. pending() and the settle announcement are immediate; aria-busy and aria-disabled are set at the click and held until the busy visual releases, so the host refuses a double-click for the whole dwell, through aria-disabled and a click guard, never the native disabled attribute, so it keeps focus. busyVisible() reports whether the busy visual is on screen, next to pending() for the run itself. Template branches via @switch (btn.status())."
symbols: [CngxAsyncClick]
---

# CngxAsyncClick: Basic happy path

Wraps a click handler in an async-state machine. The action factory you bind to [cngxAsyncClick] can return a Promise or an Observable; the directive runs it on click, flips its pending() signal while in flight, then settles to succeeded() or failed() for feedbackDuration ms (default 2000) before returning to idle. The host class .cngx-async--pending / --success / --error mirrors the lifecycle; --pending follows the show delay of the loading config (a run faster than 120 ms never gets it) and is held for the min-dwell once shown. pending() and the settle announcement are immediate; aria-busy and aria-disabled are set at the click and held until the busy visual releases, so the host refuses a double-click for the whole dwell, through aria-disabled and a click guard, never the native disabled attribute, so it keeps focus. busyVisible() reports whether the busy visual is on screen, next to pending() for the run itself. Template branches via @switch (btn.status()).

## Symbols

- `CngxAsyncClick`

## Setup

```ts
protected readonly saveAction = () => of(undefined).pipe(delay(200));
```

## Wiring

```html
<button type="button" [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
  @switch (btn.status()) {
    @case ('pending') { Saving... }
    @case ('success') { Saved! }
    @case ('error') { Failed }
    @default { Save }
  }
</button>
```
