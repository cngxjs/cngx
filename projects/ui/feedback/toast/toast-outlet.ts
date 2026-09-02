import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
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
import { CngxSeverityIcon } from '../config/severity-icon';
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
 * Toast outlet - renders the toast stack at a fixed viewport position.
 *
 * Place once in the app shell. Reads from `CngxToaster` reactively.
 * Requires `provideToasts()` or `provideFeedback(withToasts())`.
 *
 * One outlet per toaster instance: projected toast bodies (`CngxToast`
 * content) are captured as templates whose DOM nodes exist exactly once -
 * a second outlet on the same toaster renders those bodies empty.
 *
 * ```html
 * <cngx-toast-outlet position="bottom-end" [maxVisible]="5" />
 * ```
 *
 * @playground Async state bridges ./examples/bridges/bridges-example.component.ts
 *
 * @category ui/feedback/toast
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/toast/toast-outlet.ts
 * @since 0.1.0
 * @relatedTo CngxToaster, CngxToast, CngxToastOn
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
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxCloseButton, CngxSeverityIcon],
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
            <cngx-severity-icon
              [severity]="toast.config.severity"
              iconClass="cngx-toast__default-icon"
            />
          }
        </div>
        <div class="cngx-toast__body">
          @if (toast.config.title) {
            <span class="cngx-toast__title">{{ toast.config.title }}</span>
          }
          @if (toast.config.contentTemplate) {
            <ng-container *ngTemplateOutlet="toast.config.contentTemplate" />
          } @else if (toast.config.content) {
            <ng-container
              *ngComponentOutlet="toast.config.content; inputs: toast.config.contentInputs"
            />
          } @else if (toast.config.title) {
            <span class="cngx-toast__description">
              {{ toast.config.description ?? toast.config.message }}
            </span>
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

  /** Maximum visible toasts - oldest are evicted. */
  readonly maxVisible = input<number>(3);

  /** Insert new toasts at start or end of the stack. */
  readonly insertPosition = input<'start' | 'end'>('start');

  /** @internal */
  protected readonly positionClass = computed(() => `cngx-toast-outlet--${this.position()}`);

  /** @internal - slice to maxVisible, respecting insert position. ToastState is immutable per slot. */
  protected readonly visibleToasts = computed(
    () => {
      const all = this.service.toasts();
      const max = this.maxVisible();
      const sliced = all.length > max ? all.slice(0, max) : all;
      return this.insertPosition() === 'end' ? [...sliced].reverse() : sliced;
    },
    { equal: (a, b) => a.length === b.length && a.every((t, i) => t === b[i]) },
  );

  /** @internal - resolve icon component from global config or null. */
  protected iconFor(toast: ToastState) {
    return this.config?.alertIcons?.[toast.config.severity] ?? null;
  }
}
