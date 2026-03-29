import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxCloseButton } from '@cngx/common/interactive';

import { CNGX_FEEDBACK_CONFIG } from '../feedback-config';
import { CngxSeverityIcon } from '../severity-icon';
import { CngxAlerter, type AlertState } from './alerter.service';

/**
 * Scoped alert stack — renders alerts from its own `CngxAlerter` instance.
 *
 * Provides `CngxAlerter` via `viewProviders` — child components that
 * `inject(CngxAlerter)` get this stack's instance. Supports nesting
 * (each stack is independent).
 *
 * @usageNotes
 *
 * ### In a dialog
 * ```html
 * <dialog cngxDialog [submitAction]="save">
 *   <header cngxDialogTitle>Edit user</header>
 *   <cngx-alert-stack scope="user-form" position="top" />
 *   <form>...</form>
 * </dialog>
 * ```
 *
 * ### Programmatic usage
 * ```typescript
 * private readonly alerter = inject(CngxAlerter);
 *
 * handleErrors(errors: string[]) {
 *   this.alerter.dismissAll();
 *   errors.forEach(e => this.alerter.show({ message: e, severity: 'error' }));
 * }
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-alert-stack',
  standalone: true,
  imports: [NgComponentOutlet, CngxCloseButton, CngxSeverityIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [CngxAlerter],
  host: {
    class: 'cngx-alert-stack',
    role: 'log',
    'aria-live': 'polite',
    '[class.cngx-alert-stack--reserve-space]': 'reserveSpace()',
  },
  template: `
    @for (alert of visibleAlerts(); track alert.id) {
      <div
        [id]="'cngx-alert-' + alert.id"
        class="cngx-alert-stack__item"
        [class.cngx-alert-stack__item--info]="alert.config.severity === 'info'"
        [class.cngx-alert-stack__item--success]="alert.config.severity === 'success'"
        [class.cngx-alert-stack__item--warning]="alert.config.severity === 'warning'"
        [class.cngx-alert-stack__item--error]="alert.config.severity === 'error'"
        [attr.role]="
          alert.config.severity === 'error' || alert.config.severity === 'warning'
            ? 'alert'
            : 'status'
        "
      >
        <div class="cngx-alert-stack__icon">
          @if (iconFor(alert); as iconCmp) {
            <ng-container *ngComponentOutlet="iconCmp" />
          } @else {
            <cngx-severity-icon
              [severity]="alert.config.severity"
              iconClass="cngx-alert-stack__default-icon"
            />
          }
        </div>
        <div class="cngx-alert-stack__body">
          @if (alert.config.title) {
            <strong class="cngx-alert-stack__title">{{ alert.config.title }}</strong>
          }
          <span class="cngx-alert-stack__message">{{ alert.config.message }}</span>
        </div>
        @if (alert.config.dismissible) {
          <cngx-close-button
            label="Dismiss"
            class="cngx-alert-stack__dismiss"
            (click)="alerter.dismiss(alert.id)"
          />
        }
      </div>
    }
    @if (overflowCount() > 0) {
      <button
        type="button"
        class="cngx-alert-stack__overflow"
        [attr.aria-expanded]="false"
        [attr.aria-controls]="overflowIds()"
        (click)="handleExpandOverflow()"
      >
        + {{ overflowCount() }} more
      </button>
    }
  `,
  styles: `
    .cngx-alert-stack {
      display: flex;
      flex-direction: column;
      gap: var(--cngx-alert-stack-gap, 8px);
    }

    .cngx-alert-stack--reserve-space {
      min-height: var(--cngx-alert-stack-reserve-height, 56px);
    }

    .cngx-alert-stack__item {
      display: flex;
      align-items: flex-start;
      gap: var(--cngx-alert-gap, 12px);
      padding: var(--cngx-alert-padding, 12px 16px);
      border-radius: var(--cngx-alert-border-radius, 8px);
      border: 1px solid var(--cngx-alert-border-color, transparent);
      background: var(--cngx-alert-bg, #f8fafc);
      color: var(--cngx-alert-color, inherit);
      animation: cngx-alert-enter var(--cngx-alert-enter-duration, 200ms) ease-out both;
    }

    .cngx-alert-stack__item--info {
      --cngx-alert-bg: var(--cngx-alert-info-bg, #eff6ff);
      --cngx-alert-border-color: var(--cngx-alert-info-border, #bfdbfe);
      --cngx-alert-icon-color: var(--cngx-alert-info-icon, #3b82f6);
    }

    .cngx-alert-stack__item--success {
      --cngx-alert-bg: var(--cngx-alert-success-bg, #f0fdf4);
      --cngx-alert-border-color: var(--cngx-alert-success-border, #bbf7d0);
      --cngx-alert-icon-color: var(--cngx-alert-success-icon, #22c55e);
    }

    .cngx-alert-stack__item--warning {
      --cngx-alert-bg: var(--cngx-alert-warning-bg, #fffbeb);
      --cngx-alert-border-color: var(--cngx-alert-warning-border, #fde68a);
      --cngx-alert-icon-color: var(--cngx-alert-warning-icon, #f59e0b);
    }

    .cngx-alert-stack__item--error {
      --cngx-alert-bg: var(--cngx-alert-error-bg, #fef2f2);
      --cngx-alert-border-color: var(--cngx-alert-error-border, #fecaca);
      --cngx-alert-icon-color: var(--cngx-alert-error-icon, #ef4444);
    }

    .cngx-alert-stack__icon {
      flex-shrink: 0;
      color: var(--cngx-alert-icon-color, currentColor);
    }

    .cngx-alert-stack__default-icon {
      width: var(--cngx-alert-icon-size, 20px);
      height: var(--cngx-alert-icon-size, 20px);
    }

    .cngx-alert-stack__body {
      flex: 1;
      min-width: 0;
    }

    .cngx-alert-stack__title {
      display: block;
      font-weight: var(--cngx-alert-title-weight, 600);
      margin-bottom: var(--cngx-alert-title-gap, 4px);
    }

    .cngx-alert-stack__message {
      font-size: var(--cngx-alert-stack-message-size, 0.875rem);
      line-height: var(--cngx-alert-stack-message-line-height, 1.5);
    }

    .cngx-alert-stack__dismiss {
      flex-shrink: 0;
    }

    .cngx-alert-stack__overflow {
      appearance: none;
      background: var(--cngx-alert-stack-overflow-bg, transparent);
      border: 1px dashed var(--cngx-alert-stack-overflow-border, #cbd5e1);
      border-radius: var(--cngx-alert-border-radius, 8px);
      padding: var(--cngx-alert-stack-overflow-padding, 8px 16px);
      cursor: pointer;
      font-size: var(--cngx-alert-stack-overflow-size, 0.8125rem);
      color: var(--cngx-alert-stack-overflow-color, #64748b);
      text-align: center;
      width: 100%;
    }

    .cngx-alert-stack__overflow:hover {
      background: var(--cngx-alert-stack-overflow-hover-bg, #f1f5f9);
    }

    .cngx-alert-stack__overflow:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    @keyframes cngx-alert-enter {
      from {
        opacity: 0;
        transform: translateY(calc(-1 * var(--cngx-alert-enter-offset, 8px)));
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cngx-alert-stack__item {
        animation: none;
      }
    }
  `,
})
export class CngxAlertStack {
  /** The scoped alerter instance — use to add/dismiss alerts programmatically. */
  readonly alerter = inject(CngxAlerter);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Scope filter — only shows alerts matching this scope. */
  readonly scope = input<string | undefined>(undefined);

  /** Maximum visible alerts before collapse overflow. */
  readonly maxVisible = input<number>(5);

  /** Where new alerts appear. */
  readonly position = input<'top' | 'bottom'>('top');

  /** Reserve min-height for one alert to prevent layout shift. */
  readonly reserveSpace = input<boolean>(false);

  /** Auto-scroll stack into view when new alert appears. */
  readonly autoScroll = input<boolean>(true);

  // ── Computed ──────────────────────────────────────────────

  /** @internal — expanded state. Resets when alert count drops to maxVisible or below. */
  private readonly expanded = linkedSignal({
    source: () => this.scopedAlerts().length <= this.maxVisible(),
    computation: (fitsInMax, previous) => (fitsInMax ? false : (previous?.value ?? false)),
  });

  /** @internal — alerts filtered by scope. */
  private readonly scopedAlerts = computed(() => {
    const s = this.scope();
    const all = this.alerter.alerts();
    return s !== undefined ? all.filter((a) => a.config.scope === s) : all;
  });

  /** @internal — alerts visible within maxVisible limit. */
  protected readonly visibleAlerts = computed(() => {
    const all = this.scopedAlerts();
    if (this.expanded()) {
      return all;
    }
    const max = this.maxVisible();
    return all.length > max ? all.slice(0, max) : all;
  });

  /** @internal — number of hidden overflow alerts. */
  protected readonly overflowCount = computed(() => {
    if (this.expanded()) {
      return 0;
    }
    return Math.max(0, this.scopedAlerts().length - this.maxVisible());
  });

  /** @internal — IDs of overflow alerts for aria-controls. */
  protected readonly overflowIds = computed(() =>
    this.scopedAlerts()
      .slice(this.maxVisible())
      .map((a) => `cngx-alert-${a.id}`)
      .join(' '),
  );

  /** @internal — resolve icon component from global config. */
  protected iconFor(alert: AlertState) {
    return this.config?.alertIcons?.[alert.config.severity] ?? null;
  }

  /** @internal */
  protected handleExpandOverflow(): void {
    this.expanded.set(true);
  }
}
