import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  CngxAsyncClick,
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  reflectAsyncDisplayStatus,
  type AsyncAction,
} from '@cngx/common/interactive';
import {
  buildAsyncStateView,
  createTransitionTracker,
  nextUid,
  type CngxAsyncState,
} from '@cngx/core/utils';
import { CngxToastOn, CngxToaster } from '@cngx/ui/feedback';

/**
 * Visual variant for the action button - maps to a CSS class.
 *
 * @category ui/action-button
 */
export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Action button organism with built-in status communication.
 *
 * Coordinates between the `CngxAsyncClick` atom (mechanism, ARIA, lifecycle)
 * and the consumer (intent, styling, labels). Provides template projection
 * for pending/succeeded/failed states and an `aria-live` region for screen
 * reader announcements.
 *
 * Uses `display: contents` - the host produces no DOM box. The inner `<button>`
 * carries the `[cngxAsyncClick]` directive directly.
 *
 * For full control, use `[cngxAsyncClick]` directly on any element instead.
 *
 * ### Minimal (covers 80% of cases)
 * ```html
 * <cngx-action-button [action]="save">Save</cngx-action-button>
 * ```
 *
 * ### With string labels
 * ```html
 * <cngx-action-button [action]="save"
 *   pendingLabel="Saving..." succeededLabel="Saved!" failedLabel="Failed">
 *   Save
 * </cngx-action-button>
 * ```
 *
 * ### With template slots
 * ```html
 * <cngx-action-button [action]="save">
 *   Save Draft
 *   <ng-template cngxPending><mat-spinner diameter="18" /> Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }} - retry?</ng-template>
 * </cngx-action-button>
 * ```
 *
 * ### With toast feedback
 * ```html
 * <cngx-action-button [action]="save" toastSuccess="Saved" toastError="Save failed">
 *   Save
 * </cngx-action-button>
 * ```
 *
 * @category ui/action-button
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/action-button/action-button.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick, CngxPending, CngxSucceeded, CngxFailed, CngxToaster
 * @slot cngxPending Replaces the label while the action runs.
 * @slot cngxSucceeded Replaces the label after the action succeeds.
 * @slot cngxFailed Replaces the label when the action fails; gets the error.
 * <example-url>http://localhost:4200/#/ui/action-button/async-button/random-outcome</example-url>
 * <example-url>http://localhost:4200/#/ui/action-button/async-button/string-labels</example-url>
 * <example-url>http://localhost:4200/#/ui/action-button/async-button/template-slots</example-url>
 */
@Component({
  selector: 'cngx-action-button',
  standalone: true,
  imports: [NgTemplateOutlet, CngxAsyncClick],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxActionButton',
  host: {
    style: 'display: contents',
  },
  template: `
    <ng-template #idle><ng-content /></ng-template>

    <button
      [type]="type()"
      [cngxAsyncClick]="action()"
      [feedbackDuration]="feedbackDuration()"
      [enabled]="clickEnabled()"
      [busy]="effectiveBusy()"
      [autoAnnounce]="false"
      [succeededAnnouncement]="succeededAnnouncement() ?? succeededLabel() ?? 'Action succeeded'"
      [failedAnnouncement]="failedAnnouncement() ?? failedLabel() ?? 'Action failed'"
      [attr.aria-describedby]="describedBy()"
      [class]="'cngx-action-button cngx-action-button--' + variant()"
    >
      @switch (effectiveStatus()) {
        @case ('pending') {
          @if (pendingTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else if (pendingLabel()) {
            {{ pendingLabel() }}
          } @else {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
        @case ('success') {
          @if (succeededTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else if (succeededLabel()) {
            {{ succeededLabel() }}
          } @else {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
        @case ('error') {
          @if (failedTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl.templateRef; context: { $implicit: effectiveError() }"
            />
          } @else if (failedLabel()) {
            {{ failedLabel() }}
          } @else {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
        @default {
          <ng-container *ngTemplateOutlet="idle" />
        }
      }
    </button>
    @if (disabledReason(); as reason) {
      <span [id]="reasonId" class="cngx-action-button__sr-only">{{ reason }}</span>
    }
    <span aria-live="polite" aria-atomic="true" class="cngx-action-button__sr-only">{{
      effectiveAnnouncement()
    }}</span>
  `,
  styleUrls: ['./action-button.css'],
})
export class CngxActionButton {
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly externalToastOn = inject(CngxToastOn, { self: true, optional: true });

  /** The async action to execute on click. */
  readonly action = input.required<AsyncAction>();

  /** Duration in ms to show success/error feedback. Passed through to `cngxAsyncClick`. */
  readonly feedbackDuration = input<number>(2000);

  /** When `false`, clicks are ignored. Passed through to `cngxAsyncClick`. */
  readonly enabled = input<boolean>(true);

  /** Button type attribute. Defaults to `'button'` to prevent accidental form submits. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /** Visual variant - sets CSS class `cngx-action-button--{variant}`. */
  readonly variant = input<ActionButtonVariant>('primary');

  /** SR announcement on success. Falls back to `succeededLabel`, then `'Action succeeded'`. */
  readonly succeededAnnouncement = input<string | undefined>(undefined);

  /** SR announcement on failure. Falls back to `failedLabel`, then `'Action failed'`. */
  readonly failedAnnouncement = input<string | undefined>(undefined);

  /** Fallback text while pending (when no `cngxPending` template is projected). */
  readonly pendingLabel = input<string | undefined>(undefined);

  /** Fallback text after success (when no `cngxSucceeded` template is projected). */
  readonly succeededLabel = input<string | undefined>(undefined);

  /** Fallback text after failure (when no `cngxFailed` template is projected). */
  readonly failedLabel = input<string | undefined>(undefined);

  /**
   * Bind an external async state to derive visual status from.
   * When set, the button's status display follows `externalState.status()`.
   */
  readonly externalState = input<CngxAsyncState<unknown> | undefined>(undefined);

  /**
   * Reason the button is disabled, announced to screen readers while
   * `[enabled]` is `false`. Rendered into a hidden region and referenced by
   * `aria-describedby` only while disabled - an enabled button never carries
   * the reference. No effect when `[enabled]` is `true`.
   */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Toast message on success. Requires `CngxToaster` (via `provideFeedback(withToasts())`
   * or `provideToasts()`). Silently ignored when toaster is not provided.
   *
   * `toastSuccessDuration` should be >= `feedbackDuration` to avoid rapid re-fire
   * on repeated clicks that floods the SR announcement queue.
   */
  readonly toastSuccess = input<string | undefined>(undefined);

  /** Toast message on error. */
  readonly toastError = input<string | undefined>(undefined);

  /** Include the error detail message in the error toast body. */
  readonly toastErrorDetail = input<boolean>(false);

  /** Duration for success toasts in ms. */
  readonly toastSuccessDuration = input<number>(3000);

  /** Duration for error toasts - `'persistent'` means manual dismiss only. */
  readonly toastErrorDuration = input<number | 'persistent'>('persistent');

  /** @internal - inner CngxAsyncClick directive instance. Non-required to allow safe pre-view-init reads. */
  private readonly asyncClick = viewChild(CngxAsyncClick);

  /**
   * @internal - effective status: reflects external `[externalState]` if
   * bound (through the shared `CngxAsyncStatus` reflection - one home for
   * the state→display-bucket mapping), otherwise reads the inner
   * `CngxAsyncClick` directive.
   */
  protected readonly effectiveStatus = computed(() => {
    const ext = this.externalState();
    if (ext) {
      return reflectAsyncDisplayStatus(ext);
    }
    // Guard against pre-view-init reads of `state` from consumers.
    const click = this.asyncClick();
    return click ? click.status() : ('idle' as const);
  });

  /** @internal - effective error value from external state or inner directive. */
  protected readonly effectiveError = computed(() => {
    const ext = this.externalState();
    if (ext) {
      return ext.error();
    }
    const click = this.asyncClick();
    return click ? click.error() : undefined;
  });

  /** @internal - busy while the effective status (inner or external) is pending. */
  protected readonly effectiveBusy = computed(() => this.effectiveStatus() === 'pending');

  /**
   * @internal - what the inner `CngxAsyncClick` may act on: only when the
   * consumer enabled it AND no effective operation is in flight. Feeding this
   * as `[enabled]` routes external-pending through the atom's own click guard,
   * so a click cannot start a second run while an external state is pending.
   */
  protected readonly clickEnabled = computed(
    () => this.enabled() && this.effectiveStatus() !== 'pending',
  );

  /**
   * @internal - SR announcement derived from the effective status, so an
   * external success/error settles audibly too (the inner directive only
   * knows its own runs). Mirrors the label fallback chain the template uses.
   */
  protected readonly effectiveAnnouncement = computed(() => {
    switch (this.effectiveStatus()) {
      case 'success':
        return this.succeededAnnouncement() ?? this.succeededLabel() ?? 'Action succeeded';
      case 'error':
        return this.failedAnnouncement() ?? this.failedLabel() ?? 'Action failed';
      default:
        return '';
    }
  });

  /** @internal - stable id for the disabled-reason region. */
  protected readonly reasonId = nextUid('cngx-action-button-reason');

  /**
   * @internal - reference the reason region only while actually disabled by
   * intent and a reason exists. accname traverses a directly referenced hidden
   * node, so the id must be gated on the state it describes rather than left
   * permanently pointing at a hidden region.
   */
  protected readonly describedBy = computed(() =>
    !this.enabled() && this.disabledReason() ? this.reasonId : null,
  );

  private readonly lastUpdatedState = signal<Date | undefined>(undefined);

  /**
   * Full `CngxAsyncState` view of this button's effective lifecycle.
   *
   * Reflects the external state when `[externalState]` is bound,
   * otherwise the inner `CngxAsyncClick` directive's state.
   *
   * Bind to any state consumer: `<cngx-alert [state]="btn.state" />`.
   */
  readonly state: CngxAsyncState<unknown> = buildAsyncStateView<unknown>({
    status: this.effectiveStatus,
    data: computed(() => undefined),
    error: this.effectiveError,
    lastUpdated: this.lastUpdatedState.asReadonly(),
  });

  /** @internal */
  protected readonly pendingTpl = contentChild(CngxPending);
  /** @internal */
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  /** @internal */
  protected readonly failedTpl = contentChild(CngxFailed);

  constructor() {
    // Double-toast guard, consumer placed [cngxToastOn] on the same element.
    if (
      typeof ngDevMode !== 'undefined' &&
      ngDevMode &&
      this.externalToastOn &&
      (this.toastSuccess() || this.toastError())
    ) {
      console.warn(
        'CngxActionButton: [toastSuccess]/[toastError] inputs and [cngxToastOn] ' +
          'on the same element will fire duplicate toasts. Use one or the other.',
      );
    }

    const tracker = createTransitionTracker(() => this.effectiveStatus());

    effect(() => {
      const status = tracker.current();
      const previous = tracker.previous();

      if (status === previous) {
        return;
      }

      // Only the transition edge may re-run this body. The toast inputs and
      // effectiveError are read untracked: previous() stays stale for the whole
      // settled window, so a tracked read would re-fire the toast on any input
      // rebind while status sits in success/error. Doctrine: bridge effects
      // untrack service calls.
      untracked(() => {
        if (status === 'success') {
          // Producer write for the buildAsyncStateView `lastUpdated` slot (no other
          // source feeds it) - state production, not derived-state sync. This is the
          // sanctioned signal-write-in-effect class, same as the async-state-view pattern.
          this.lastUpdatedState.set(new Date());
          const msg = this.toastSuccess();
          if (msg && this.toaster) {
            this.toaster.show({
              message: msg,
              severity: 'success',
              duration: this.toastSuccessDuration(),
            });
          }
        }

        if (status === 'error') {
          const msg = this.toastError();
          if (msg && this.toaster) {
            const err = this.effectiveError();
            const detail =
              this.toastErrorDetail() && err != null
                ? err instanceof Error
                  ? err.message
                  : typeof err === 'string'
                    ? err
                    : undefined
                : undefined;
            this.toaster.show({
              message: detail ? `${msg}: ${detail}` : msg,
              severity: 'error',
              duration: this.toastErrorDuration(),
            });
          }
        }
      });
    });
  }
}
