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

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { CngxToaster, type ToastState } from './toast.service';

/**
 * Position for the toast stack.
 *
 * @category ui/feedback/toast
 */
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
 * Place once in the app shell. Reads from `CngxToaster` reactively.
 * Requires `provideToasts()` or `provideFeedback(withToasts())`.
 *
 * ```html
 * <cngx-toast-outlet position="bottom-end" [maxVisible]="5" />
 * ```
 *
 * @playground Async state bridges ./examples/bridges/bridges-example.component.ts
 *
 * @category ui/feedback/toast
 *
 * <example-url>http://localhost:4200/#/ui/feedback/toast/custom-component-body</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/declarative-cngx-toast</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/programmatic-cngxtoaster</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/state-bridge-cngxtoaston</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/title-description</example-url>
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
        (pointerenter)="service.pauseTimer(toast.id)"
        (pointerleave)="service.resumeTimer(toast.id)"
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
          @if (toast.config.title) {
            <span class="cngx-toast__title">{{ toast.config.title }}</span>
            @if (toast.config.content) {
              <ng-container
                *ngComponentOutlet="toast.config.content; inputs: toast.config.contentInputs"
              />
            } @else {
              <span class="cngx-toast__description">
                {{ toast.config.description ?? toast.config.message }}
              </span>
            }
          } @else if (toast.config.content) {
            <ng-container
              *ngComponentOutlet="toast.config.content; inputs: toast.config.contentInputs"
            />
          } @else {
            <span class="cngx-toast__message">
              {{ toast.config.message }}
            </span>
          }
          @if (toast.count > 1) {
            <span class="cngx-toast__count">(x{{ toast.count }})</span>
          }
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
  styleUrls: ['./toast-outlet.css'],
})
export class CngxToastOutlet {
  protected readonly service = inject(CngxToaster);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  /** Stack position. */
  readonly position = input<ToastPosition>('bottom-end');

  /** Maximum visible toasts — oldest are evicted. */
  readonly maxVisible = input<number>(3);

  /** Insert new toasts at start or end of the stack. */
  readonly insertPosition = input<'start' | 'end'>('start');

  /** @internal */
  protected readonly positionClass = computed(() => `cngx-toast-outlet--${this.position()}`);

  /** @internal — slice to maxVisible, respecting insert position. */
  protected readonly visibleToasts = computed(() => {
    const all = this.service.toasts();
    const max = this.maxVisible();
    const sliced = all.length > max ? all.slice(0, max) : all;
    return this.insertPosition() === 'end' ? [...sliced].reverse() : sliced;
  });

  /** @internal — resolve icon component from global config or null. */
  protected iconFor(toast: ToastState) {
    return this.config?.alertIcons?.[toast.config.severity] ?? null;
  }
}
