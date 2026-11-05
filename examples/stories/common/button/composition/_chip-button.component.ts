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
  selector: 'button[demoChipButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: demoChipButton', 'tone', 'disabled', 'disabledReason', 'cngxDescribedBy'],
    },
  ],
  providers: [provideButtonHost('demoChipButton', { defaultVariant: 'outline', fixed: { size: 'sm' } })],
  host: { class: 'demo-chip-button' },
  template: `
    <span class="demo-chip-button__label"><ng-content /></span>
    @if (brain.busyVisible()) {
      <span class="demo-chip-button__busy" aria-hidden="true"></span>
    }
    @if (brain.disabledReason(); as reason) {
      <span [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styles: `
    .demo-chip-button {
      --demo-chip-accent: var(--cngx-color-text, #1f2937);
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
      color: var(--demo-chip-accent);
      font: inherit;
      font-size: var(--cngx-font-size-sm, 0.875rem);
      cursor: pointer;
    }
    .demo-chip-button[data-tone='primary'] {
      --demo-chip-accent: var(--cngx-color-primary-text, #1d4ed8);
    }
    .demo-chip-button[data-tone='danger'] {
      --demo-chip-accent: var(--cngx-color-danger-text, #b91c1c);
    }
    .demo-chip-button[data-variant='solid'] {
      border-color: transparent;
      background: var(--demo-chip-accent);
      color: var(--cngx-color-surface, #fff);
    }
    .demo-chip-button[aria-disabled='true']:not([data-pending]) {
      border-color: var(--cngx-color-border, #d1d5db);
      background: var(--cngx-color-surface, #fff);
      color: var(--cngx-color-text-muted, #6b7280);
      cursor: not-allowed;
    }
    .demo-chip-button[data-busy] > .demo-chip-button__label {
      opacity: 0;
    }
    .demo-chip-button__busy {
      position: absolute;
      inset: 0;
      margin: auto;
      inline-size: 1em;
      block-size: 1em;
      border: 2px solid currentColor;
      border-inline-end-color: transparent;
      border-radius: 50%;
      animation: demo-chip-spin var(--cngx-spin-duration, 0.8s) linear infinite;
    }
    @media (prefers-reduced-motion: reduce) {
      .demo-chip-button__busy {
        animation: none;
      }
    }
    @media (forced-colors: active) {
      .demo-chip-button {
        border-color: ButtonText;
      }
      .demo-chip-button[aria-disabled='true']:not([data-pending]) {
        border-color: GrayText;
        color: GrayText;
      }
    }
    @keyframes demo-chip-spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class ChipButton {
  protected readonly brain = inject(CngxButtonBrain);
}
