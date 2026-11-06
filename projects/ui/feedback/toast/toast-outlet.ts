import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { CngxCloseButton } from '@cngx/common/button';
import { CNGX_LIVE_SURFACE_ATTR } from '@cngx/core/utils';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { setEqual } from '@cngx/utils';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { injectFeedbackI18n } from '../config/feedback-i18n';
import { CngxSeverityIcon } from '../config/severity-icon';
import type { TimerSegment } from '../internal/pausable-timer';
import { CngxToaster, type ToastState } from './toast.service';

const NO_QUEUE: ReadonlySet<number> = new Set();

interface QueueState {
  readonly hidden: ReadonlySet<number>;
  readonly held: boolean;
  /** Hidden ids whose registry segment still runs while the queue should hold them. */
  readonly running: ReadonlySet<number>;
}

/**
 * Position for the toast stack.
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/toast/toast-outlet.ts
 * @since 0.1.0
 * @relatedTo CngxToaster, CngxToast, CngxToastOn
 *
 * <example-url>/#/ui/feedback/toast/custom-component-body</example-url>
 * <example-url>/#/ui/feedback/toast/declarative-cngx-toast</example-url>
 * <example-url>/#/ui/feedback/toast/programmatic-cngxtoaster</example-url>
 * <example-url>/#/ui/feedback/toast/state-bridge-cngxtoaston</example-url>
 * <example-url>/#/ui/feedback/toast/title-description</example-url>
 */
@Component({
  selector: 'cngx-toast-outlet',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxCloseButton, CngxSeverityIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-toast-outlet',
    [CNGX_LIVE_SURFACE_ATTR]: '',
    '[class]': 'positionClass()',
    role: 'region',
    '[attr.aria-label]': 'regionLabel()',
  },
  template: `
    @for (toast of visibleToasts(); track toast.id) {
      @let timer = segments().get(toast.id) ?? null;
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
        (pointerenter)="service.pauseTimer(toast.id, 'pointer')"
        (pointerleave)="service.resumeTimer(toast.id, 'pointer')"
        (focusin)="service.pauseTimer(toast.id, 'focus')"
        (focusout)="service.resumeTimer(toast.id, 'focus')"
        [attr.data-timer]="timerState(timer)"
        [style.--cngx-toast-timer-duration.ms]="timer?.total ?? null"
        [style.--cngx-toast-timer-offset.ms]="timerOffset(timer)"
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
          <div class="cngx-toast__text">
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
              <span class="cngx-toast__count">{{ repeatCount()(toast.count) }}</span>
            }
          </div>
          @if (toast.config.action; as action) {
            <button type="button" class="cngx-toast__action" (click)="action.handler()">
              {{ action.label }}
            </button>
          }
        </div>
        @if (toast.config.dismissible) {
          <button
            cngxCloseButton
            [attr.aria-label]="dismissLabel()"
            class="cngx-toast__dismiss"
            (click)="service.dismiss(toast.id)"
          ></button>
        }
        @if (timer) {
          @for (s of [timer]; track s.serial) {
            <span class="cngx-toast__timer" aria-hidden="true"></span>
          }
        }
      </div>
    }
  `,
  styleUrls: ['../styles/feedback-severity.css', './toast-outlet.css'],
})
export class CngxToastOutlet {
  protected readonly service = inject(CngxToaster);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });

  private readonly i18n = injectFeedbackI18n();

  /**
   * @internal - repeat-marker formatter for toasts, which are live regions. The toast
   * list is the only tracked source; the formatter is read untracked, so a copy flip
   * never rewrites a shown toast and the next toast transition picks it up.
   */
  protected readonly repeatCount = computed(() => {
    this.service.toasts();
    return untracked(() => this.i18n().toastRepeatCount);
  });

  /**
   * @internal - dismiss-button name inside the toast live regions, keyed on the
   * toast list like {@link repeatCount}.
   */
  protected readonly dismissLabel = computed(() => {
    this.service.toasts();
    return untracked(() => this.i18n().dismissLabel);
  });

  /** @internal - region name of the plain `role="region"` host; follows a switch at once. */
  protected readonly regionLabel = computed(() => this.i18n().notificationsRegionLabel);

  /** Stack position. */
  readonly position = input<ToastPosition>('bottom-end');

  /**
   * Maximum visible toasts. Toasts beyond it wait, with their timer held,
   * until a visible one leaves; when every visible toast is persistent,
   * queued toasts keep their timer running.
   */
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

  /**
   * @internal - the toaster's countdown segments, the only timer source of the
   * view. A toast is timed exactly when it has a segment: a dedup restart that
   * switches between timed and persistent never leaves a stale config behind.
   */
  protected readonly segments = this.service.timerSegments;

  /**
   * @internal - ids kept out of view by `maxVisible`, and whether their timers
   * are held. Not held while no visible toast is timed: a held queue would
   * never move. `running` reads the hold back from the registry segments, so a
   * hidden toast whose timer (re)starts without the queue hold - a dedup repeat
   * turning a persistent toast timed, or a restart after `clear()` - is held
   * again instead of expiring unseen.
   */
  private readonly queue = computed<QueueState>(
    () => {
      const visible = this.visibleToasts();
      const segments = this.segments();
      const shown = new Set(visible.map((t) => t.id));
      const queued = this.service
        .toasts()
        .filter((t) => !shown.has(t.id))
        .map((t) => t.id);
      const held = visible.some((t) => segments.has(t.id));
      const running = held ? queued.filter((id) => segments.get(id)?.running) : [];
      return {
        hidden: queued.length === 0 ? NO_QUEUE : new Set(queued),
        held,
        running: running.length === 0 ? NO_QUEUE : new Set(running),
      };
    },
    {
      equal: (a, b) =>
        a.held === b.held && setEqual(a.hidden, b.hidden) && setEqual(a.running, b.running),
    },
  );

  constructor() {
    const hidden = new Set<number>();
    const held = new Set<number>();
    effect(() => {
      const queue = this.queue();
      untracked(() => {
        for (const id of queue.hidden) {
          if (!hidden.has(id)) {
            hidden.add(id);
            // The removed element fires no pointerleave and no reliable focusout.
            this.service.dropHolds(id, ['pointer', 'focus']);
          }
          // A running segment on a held id means the registry lost the hold.
          if (queue.held && (!held.has(id) || queue.running.has(id))) {
            held.add(id);
            this.service.pauseTimer(id, 'queue');
          }
        }
        for (const id of hidden) {
          if (!queue.hidden.has(id)) {
            hidden.delete(id);
          }
        }
        for (const id of held) {
          if (!queue.held || !queue.hidden.has(id)) {
            held.delete(id);
            this.service.resumeTimer(id, 'queue');
          }
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      // The toaster outlives the outlet; unmounted rows fire no pointerleave.
      for (const toast of untracked(this.visibleToasts)) {
        this.service.dropHolds(toast.id, ['pointer', 'focus']);
      }
      for (const id of held) {
        this.service.resumeTimer(id, 'queue');
      }
      held.clear();
      hidden.clear();
    });
  }

  /** @internal - `data-timer` value: absent without a segment. */
  protected timerState(segment: TimerSegment | null): 'running' | 'paused' | null {
    if (!segment) {
      return null;
    }
    return segment.running ? 'running' : 'paused';
  }

  /** @internal - negative elapsed time of the segment, the animation start offset. */
  protected timerOffset(segment: TimerSegment | null): number | null {
    return segment ? segment.remaining - segment.total : null;
  }

  /** @internal - resolve icon component from global config or null. */
  protected iconFor(toast: ToastState) {
    return this.config?.alertIcons?.[toast.config.severity] ?? null;
  }
}
