---
title: "CngxAsync: one line"
whenToUse: "Bare-minimum binding: *cngxAsync=\"state; let data\" on a single element. No skeleton, no error template, just content rendered when the state succeeds. The story loads once on open. Each \"First load\" button starts from scratch (loading phase, then content, empty or error); \"Refresh\" and \"Refresh fails\" run against the loaded list. Every load takes 1.5s. Without templates every state but content renders nothing, so the stage stays empty during the first load, after an empty result and after a first-load error; a failed refresh keeps the old list."
symbols: [CngxAsync, CngxAsyncContainer]
---

# CngxAsync: one line

Bare-minimum binding: *cngxAsync="state; let data" on a single element. No skeleton, no error template, just content rendered when the state succeeds. The story loads once on open. Each "First load" button starts from scratch (loading phase, then content, empty or error); "Refresh" and "Refresh fails" run against the loaded list. Every load takes 1.5s. Without templates every state but content renders nothing, so the stage stays empty during the first load, after an empty result and after a first-load error; a failed refresh keeps the old list.

## Symbols

- `CngxAsync`
- `CngxAsyncContainer`

## Setup

```ts
protected readonly simple = createManualState<string[]>();
```

## Wiring

```html
<ul *cngxAsync="simple; let data" class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
  @for (name of data; track name) {
    <li class="demo-card-tile">{{ name }}</li>
  }
</ul>
```
