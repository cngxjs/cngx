import { NgComponentOutlet } from '@angular/common';
import { CngxCloseButton } from '@cngx/common/interactive';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CNGX_FEEDBACK_CONFIG } from '../feedback-config';
import { CngxToastService, type ToastState } from './toast.service';

/** Position for the toast stack. */
export type ToastPosition =
  | 'top-start'
  | 'top-center'
  | 'top-end'
  | 'bottom-start'
  | 'bottom-center'
  | 'bottom-end';

/**
 * Toast outlet — renders the toast stack at a fixed viewport position.
 *
 * Place once in the app shell. Reads from `CngxToastService` reactively.
 * Requires `provideToasts()` or `provideFeedback(withToasts())`.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-toast-outlet position="bottom-end" [maxVisible]="5" />
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-toast-outlet',
  standalone: true,
  imports: [NgComponentOutlet, CngxCloseButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-toast-outlet',
    '[class]': 'positionClass()',
    role: 'region',
    'aria-label': 'Notifications',
  },
  template: `
    @for (toast of visibleToasts(); track toast.id) {
      <div
        class="cngx-toast"
        [class.cngx-toast--info]="toast.config.severity === 'info'"
        [class.cngx-toast--success]="toast.config.severity === 'success'"
        [class.cngx-toast--warning]="toast.config.severity === 'warning'"
        [class.cngx-toast--error]="toast.config.severity === 'error'"
        [attr.role]="
          toast.config.severity === 'error' || toast.config.severity === 'warning'
            ? 'alert'
            : 'status'
        "
        (mouseenter)="service.pauseTimer(toast.id)"
        (mouseleave)="service.resumeTimer(toast.id)"
        (focusin)="service.pauseTimer(toast.id)"
        (focusout)="service.resumeTimer(toast.id)"
      >
        <div class="cngx-toast__icon">
          @if (iconFor(toast); as iconCmp) {
            <ng-container *ngComponentOutlet="iconCmp" />
          } @else {
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="cngx-toast__default-icon"
            >
              @switch (toast.config.severity) {
                @case ('info') {
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                }
                @case ('success') {
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                }
                @case ('warning') {
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                }
                @case ('error') {
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                }
              }
            </svg>
          }
        </div>
        <div class="cngx-toast__body">
          <span class="cngx-toast__message">
            {{ toast.config.message }}
            @if (toast.count > 1) {
              <span class="cngx-toast__count">(x{{ toast.count }})</span>
            }
          </span>
          @if (toast.config.action; as action) {
            <button type="button" class="cngx-toast__action" (click)="action.handler()">
              {{ action.label }}
            </button>
          }
        </div>
        @if (toast.config.dismissible) {
          <cngx-close-button
            label="Dismiss"
            class="cngx-toast__dismiss"
            (click)="service.dismiss(toast.id)"
          />
        }
      </div>
    }
  `,
  styles: `
    .cngx-toast-outlet {
      position: fixed;
      z-index: var(--cngx-toast-z-index, 9999);
      display: flex;
      flex-direction: column;
      gap: var(--cngx-toast-gap, 8px);
      padding: var(--cngx-toast-outlet-padding, 16px);
      pointer-events: none;
      max-width: var(--cngx-toast-max-width, 420px);
      width: 100%;
    }

    .cngx-toast-outlet--top-start {
      top: 0;
      left: 0;
    }
    .cngx-toast-outlet--top-center {
      top: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .cngx-toast-outlet--top-end {
      top: 0;
      right: 0;
    }
    .cngx-toast-outlet--bottom-start {
      bottom: 0;
      left: 0;
    }
    .cngx-toast-outlet--bottom-center {
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
    }
    .cngx-toast-outlet--bottom-end {
      bottom: 0;
      right: 0;
    }

    .cngx-toast {
      display: flex;
      align-items: flex-start;
      gap: var(--cngx-toast-inner-gap, 10px);
      padding: var(--cngx-toast-padding, 12px 16px);
      border-radius: var(--cngx-toast-border-radius, 8px);
      background: var(--cngx-toast-bg, #fff);
      color: var(--cngx-toast-color, #1e293b);
      box-shadow: var(--cngx-toast-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));
      pointer-events: auto;
      animation: cngx-toast-enter var(--cngx-toast-enter-duration, 200ms)
        var(--cngx-toast-enter-easing, ease-out);
    }

    .cngx-toast--info {
      border-left: var(--cngx-toast-accent-width, 3px) solid var(--cngx-toast-info-accent, #3b82f6);
    }
    .cngx-toast--success {
      border-left: var(--cngx-toast-accent-width, 3px) solid
        var(--cngx-toast-success-accent, #22c55e);
    }
    .cngx-toast--warning {
      border-left: var(--cngx-toast-accent-width, 3px) solid
        var(--cngx-toast-warning-accent, #f59e0b);
    }
    .cngx-toast--error {
      border-left: var(--cngx-toast-accent-width, 3px) solid var(--cngx-toast-error-accent, #ef4444);
    }

    .cngx-toast__icon {
      flex-shrink: 0;
    }

    .cngx-toast--info .cngx-toast__icon {
      color: var(--cngx-toast-info-accent, #3b82f6);
    }
    .cngx-toast--success .cngx-toast__icon {
      color: var(--cngx-toast-success-accent, #22c55e);
    }
    .cngx-toast--warning .cngx-toast__icon {
      color: var(--cngx-toast-warning-accent, #f59e0b);
    }
    .cngx-toast--error .cngx-toast__icon {
      color: var(--cngx-toast-error-accent, #ef4444);
    }

    .cngx-toast__default-icon {
      width: var(--cngx-toast-icon-size, 20px);
      height: var(--cngx-toast-icon-size, 20px);
    }

    .cngx-toast__body {
      flex: 1;
      min-width: 0;
    }

    .cngx-toast__message {
      font-size: var(--cngx-toast-font-size, 0.875rem);
      line-height: var(--cngx-toast-line-height, 1.5);
    }

    .cngx-toast__count {
      opacity: var(--cngx-toast-count-opacity, 0.6);
      margin-left: var(--cngx-toast-count-gap, 4px);
    }

    .cngx-toast__action {
      appearance: none;
      background: none;
      border: none;
      padding: var(--cngx-toast-action-padding, 4px 0);
      cursor: pointer;
      font-weight: var(--cngx-toast-action-weight, 600);
      font-size: var(--cngx-toast-action-size, 0.8125rem);
      color: inherit;
      text-decoration: underline;
    }

    .cngx-toast__dismiss {
      flex-shrink: 0;
    }

    @keyframes cngx-toast-enter {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .cngx-toast {
        animation: none;
      }
    }
  `,
})
export class CngxToastOutlet {
  protected readonly service = inject(CngxToastService);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Stack position. */
  readonly position = input<ToastPosition>('bottom-end');

  /** Maximum visible toasts — oldest are evicted. */
  readonly maxVisible = input<number>(3);

  /** Insert new toasts at start or end of the stack. */
  readonly insertPosition = input<'start' | 'end'>('start');

  /** @internal */
  protected readonly positionClass = computed(() => `cngx-toast-outlet--${this.position()}`);

  /** @internal — slice to maxVisible. */
  protected readonly visibleToasts = computed(() => {
    const all = this.service.toasts();
    const max = this.maxVisible();
    return all.length > max ? all.slice(0, max) : all;
  });

  /** @internal — resolve icon component from global config or null. */
  protected iconFor(toast: ToastState) {
    return this.config?.alertIcons?.[toast.config.severity] ?? null;
  }
}
