---
title: "Composition: Custom button host"
whenToUse: "Every cngx button renders on one host directive. demoChipButton is a pill-shaped chip written in the app: it forwards variant, tone, disabled and disabledReason to CngxButtonBrain, pins its size with provideButtonHost(..., { fixed: { size: 'sm' } }), and paints itself from the attributes the brain sets (data-variant, data-tone, aria-disabled, data-busy). The disabled chip stays focusable and reads its reason through aria-describedby; activation is swallowed by the brain, not by the host. The Refresh chip co-hosts cngxAsyncClick: the brain reads its run through CNGX_ASYNC_RUN_STATE, so the busy layer and aria-disabled follow the run with no wiring in the host, and the result is spoken by the live region cngxAsyncClick renders. The fixture sits next to this story as _chip-button.component.ts. The dashed box below mirrors what a screen reader gets for the Archive and Refresh chips: role, name, description, state and the announcements are exposed or spoken, not painted."
symbols: [CngxButtonBrain, CngxAsyncClick]
---

# Composition: Custom button host

Every cngx button renders on one host directive. demoChipButton is a pill-shaped chip written in the app: it forwards variant, tone, disabled and disabledReason to CngxButtonBrain, pins its size with provideButtonHost(..., { fixed: { size: 'sm' } }), and paints itself from the attributes the brain sets (data-variant, data-tone, aria-disabled, data-busy). The disabled chip stays focusable and reads its reason through aria-describedby; activation is swallowed by the brain, not by the host. The Refresh chip co-hosts cngxAsyncClick: the brain reads its run through CNGX_ASYNC_RUN_STATE, so the busy layer and aria-disabled follow the run with no wiring in the host, and the result is spoken by the live region cngxAsyncClick renders. The fixture sits next to this story as _chip-button.component.ts. The dashed box below mirrors what a screen reader gets for the Archive and Refresh chips: role, name, description, state and the announcements are exposed or spoken, not painted.

## Symbols

- `CngxButtonBrain`
- `CngxAsyncClick`

## Setup

```ts
protected readonly canArchive = signal(false);
protected readonly refreshed = signal(0);

protected readonly refresh = (): Promise<void> =>
  new Promise((resolve) =>
    setTimeout(() => {
      this.refreshed.update((n) => n + 1);
      resolve();
    }, 1500),
  );
```

## Wiring

```html
<div class="demo-inline-actions">
  <button demoChipButton>Filter</button>
  <button demoChipButton="solid" tone="primary">Active</button>
  <button
    demoChipButton
    tone="danger"
    [disabled]="!canArchive()"
    disabledReason="Only owners can archive this view."
  >Archive</button>
  <button demoChipButton tone="primary" [cngxAsyncClick]="refresh">Refresh</button>
</div>
```
