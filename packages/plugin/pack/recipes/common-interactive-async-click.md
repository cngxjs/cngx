---
title: "CngxAsyncClick: Basic happy path"
whenToUse: "Wraps a click handler in an async-state machine. The action factory you bind to [cngxAsyncClick] can return a Promise or an Observable; the directive runs it on click, flips its pending() signal while in flight, then settles to succeeded() or failed() for feedbackDuration ms (default 2000) before returning to idle. The host class .cngx-async--pending / --success / --error mirrors the lifecycle, and ARIA aria-busy / aria-disabled + the native disabled attribute (on form controls) prevent double-clicks. Template branches via @switch (btn.status())."
symbols: [CngxAsyncClick]
---

# CngxAsyncClick: Basic happy path

Wraps a click handler in an async-state machine. The action factory you bind to [cngxAsyncClick] can return a Promise or an Observable; the directive runs it on click, flips its pending() signal while in flight, then settles to succeeded() or failed() for feedbackDuration ms (default 2000) before returning to idle. The host class .cngx-async--pending / --success / --error mirrors the lifecycle, and ARIA aria-busy / aria-disabled + the native disabled attribute (on form controls) prevent double-clicks. Template branches via @switch (btn.status()).

## Symbols

- `CngxAsyncClick`

## Wiring

```
<button type="button" [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
    @switch (btn.status()) {
      @case ('pending') { Saving... }
      @case ('success') { Saved! }
      @case ('error') { Failed }
      @default { Save }
    }
  </button>
```
