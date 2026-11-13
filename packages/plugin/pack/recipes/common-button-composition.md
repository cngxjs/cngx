---
title: "Composition: Custom button host"
whenToUse: "Every cngx button renders on one host directive. appChipButton is a pill-shaped chip written in the app: it forwards variant, tone, disabled and disabledReason to CngxButtonBrain, pins its size with provideButtonHost(..., { fixed: { size: 'sm' } }), and paints itself from the attributes the brain sets (data-variant, data-tone, aria-disabled, data-busy). The disabled chip stays focusable and reads its reason through aria-describedby; activation is swallowed by the brain, not by the host. The Refresh chip co-hosts cngxAsyncClick: the brain reads its run through CNGX_ASYNC_RUN_STATE, so the busy layer and aria-disabled follow the run with no wiring in the host, and the result is spoken by the live region cngxAsyncClick renders. The fixture sits next to this story as _chip-button.component.ts. The dashed box below mirrors what a screen reader gets for the Archive and Refresh chips: role, name, description, state and the announcements are exposed or spoken, not painted."
symbols: [CngxButtonBrain, CngxAsyncClick]
---

# Composition: Custom button host

Every cngx button renders on one host directive. appChipButton is a pill-shaped chip written in the app: it forwards variant, tone, disabled and disabledReason to CngxButtonBrain, pins its size with provideButtonHost(..., { fixed: { size: 'sm' } }), and paints itself from the attributes the brain sets (data-variant, data-tone, aria-disabled, data-busy). The disabled chip stays focusable and reads its reason through aria-describedby; activation is swallowed by the brain, not by the host. The Refresh chip co-hosts cngxAsyncClick: the brain reads its run through CNGX_ASYNC_RUN_STATE, so the busy layer and aria-disabled follow the run with no wiring in the host, and the result is spoken by the live region cngxAsyncClick renders. The fixture sits next to this story as _chip-button.component.ts. The dashed box below mirrors what a screen reader gets for the Archive and Refresh chips: role, name, description, state and the announcements are exposed or spoken, not painted.

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
  <button appChipButton>Filter</button>
  <button appChipButton="solid" tone="primary">Active</button>
  <button
    appChipButton
    tone="danger"
    [disabled]="!canArchive()"
    disabledReason="Only owners can archive this view."
  >Archive</button>
  <button appChipButton tone="primary" [cngxAsyncClick]="refresh">Refresh</button>
</div>
```

## File `_chip-button.component.ts`

```ts
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxButtonBrain, provideButtonHost } from '@cngx/common/button';

/**
 * Fixture for `custom-host.story.ts`: a pill-shaped chip button built on
 * `CngxButtonBrain`. The brain owns the axes, `aria-disabled`, the
 * activation guard, `aria-describedby` and the run of a co-hosted
 * `cngxAsyncClick`; this host keeps only its template and its skin, which
 * reads the attributes the brain sets on the element.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[appChipButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: appChipButton', 'tone', 'disabled', 'disabledReason', 'cngxDescribedBy'],
    },
  ],
  providers: [provideButtonHost('appChipButton', { defaultVariant: 'outline', fixed: { size: 'sm' } })],
  host: { class: 'app-chip-button' },
  template: `
    <span class="app-chip-button__label"><ng-content /></span>
    @if (brain.busyVisible()) {
      <span class="app-chip-button__busy" aria-hidden="true"></span>
    }
    @if (brain.disabledReason(); as reason) {
      <span [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styles: `
    .app-chip-button {
      --app-chip-accent: var(--cngx-color-text, #1f2937);
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: var(--cngx-space-xs, 4px);
      min-block-size: var(--cngx-target-min, 32px);
      padding-block: var(--cngx-space-xs, 4px);
      padding-inline: var(--cngx-space-md, 12px);
      border: 1px solid var(--cngx-color-border, #d1d5db);
      border-radius: 999px;
      background: var(--cngx-color-surface, #fff);
      color: var(--app-chip-accent);
      font: inherit;
      font-size: var(--cngx-font-size-sm, 0.875rem);
      cursor: pointer;
    }
    .app-chip-button[data-tone='primary'] {
      --app-chip-accent: var(--cngx-color-primary-text, #1d4ed8);
    }
    .app-chip-button[data-tone='danger'] {
      --app-chip-accent: var(--cngx-color-danger-text, #b91c1c);
    }
    .app-chip-button[data-variant='solid'] {
      border-color: transparent;
      background: var(--app-chip-accent);
      color: var(--cngx-color-surface, #fff);
    }
    .app-chip-button[aria-disabled='true']:not([data-pending]) {
      border-color: var(--cngx-color-border, #d1d5db);
      background: var(--cngx-color-surface, #fff);
      color: var(--cngx-color-text-muted, #6b7280);
      cursor: not-allowed;
    }
    .app-chip-button[data-busy] > .app-chip-button__label {
      opacity: 0;
    }
    .app-chip-button__busy {
      position: absolute;
      inset: 0;
      margin: auto;
      inline-size: 1em;
      block-size: 1em;
      border: 2px solid currentColor;
      border-inline-end-color: transparent;
      border-radius: 50%;
      animation: app-chip-spin var(--cngx-spin-duration, 0.8s) linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .app-chip-button__busy {
        animation: none;
      }
    }
    @media (forced-colors: active) {
      .app-chip-button {
        border-color: ButtonText;
      }
      .app-chip-button[aria-disabled='true']:not([data-pending]) {
        border-color: GrayText;
        color: GrayText;
      }
    }
    @keyframes app-chip-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class ChipButton {
  protected readonly brain = inject(CngxButtonBrain);
}
```
