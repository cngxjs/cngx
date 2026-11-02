import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  Injector,
  input,
  signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  injectButtonCore,
  provideButtonDescribedBy,
  type CngxButtonSize,
  type CngxButtonTone,
  type CngxButtonType,
  type CngxButtonVariant,
} from '@cngx/common/button';
import {
  CNGX_HOST_INTERACTION_STATE,
  CngxAsyncClick,
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  injectInteractiveI18n,
  reflectAsyncDisplayStatus,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import { buildAsyncStateView, createTransitionTracker, type CngxAsyncState } from '@cngx/core/utils';
import { CngxToastOn, CngxToaster, injectErrorDetail, injectFeedbackI18n } from '@cngx/ui/feedback';
import { cngxDevWarn } from '@cngx/utils';

type LabelCell = 'idle' | 'pending' | 'success' | 'error';

/**
 * Action button organism with built-in status communication, on the
 * cngx button core.
 *
 * Sits on the native `<button>`: `cngxAsyncClick` runs as a host directive
 * on the same element, the visual axes (`variant`, `tone`, `size`) and
 * `disabled` / `disabledReason` come from the `CngxButton` brain, and every
 * attribute the consumer writes lands on the real button. The component
 * adds the status labels, the toast integration and the `state` view.
 *
 * The idle content and the pending, succeeded and failed labels (or
 * templates) render stacked in one grid cell; only the active one is
 * visible and named, so the button is always as wide as its widest label
 * and never jumps after a run. Without a pending label or template, the
 * idle label stays in place under the busy spinner.
 *
 * The status announcement is spoken through the `cngxAsyncClick` live
 * region next to the button, also for a bound `[externalState]`.
 *
 * For full control, use `cngxButton` with `[cngxAsyncClick]` directly.
 *
 * ### Minimal (covers 80% of cases)
 * ```html
 * <button cngxActionButton tone="primary" [action]="save">Save</button>
 * ```
 *
 * ### With string labels
 * ```html
 * <button cngxActionButton [action]="save"
 *   pendingLabel="Saving..." succeededLabel="Saved!" failedLabel="Failed">
 *   Save
 * </button>
 * ```
 *
 * ### With template slots
 * ```html
 * <button cngxActionButton [action]="save">
 *   Save Draft
 *   <ng-template cngxPending>Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }} - retry?</ng-template>
 * </button>
 * ```
 *
 * ### With toast feedback
 * ```html
 * <button cngxActionButton [action]="save" toastSuccess="Saved" toastError="Save failed">
 *   Save
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/action-button/action-button.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxAsyncClick, CngxPending, CngxSucceeded, CngxFailed, CngxToaster
 * @slot cngxPending Replaces the label while the action runs.
 * @slot cngxSucceeded Replaces the label after the action succeeds.
 * @slot cngxFailed Replaces the label when the action fails; gets the error.
 * <example-url>/#/ui/action-button/async-button/random-outcome</example-url>
 * <example-url>/#/ui/action-button/async-button/string-labels</example-url>
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * @axis level organism
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxActionButton]',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxActionButton',
  hostDirectives: [
    {
      directive: CngxAsyncClick,
      inputs: ['cngxAsyncClick: action', 'feedbackDuration'],
    },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => inject(CngxActionButton).hostInteraction,
    },
    provideButtonDescribedBy('CngxActionButton'),
  ],
  host: {
    class: 'cngx-button cngx-action-button',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'effectiveBusy() ? "true" : null',
    '[attr.data-status]': 'effectiveStatus()',
    '[attr.data-status-label]': 'activeCell() === "idle" ? null : ""',
    '[attr.aria-disabled]': 'core.ariaDisabled()',
    '[attr.aria-describedby]': 'core.describedBy()',
    '[attr.type]': 'core.hostType()',
    '[attr.disabled]': 'null',
  },
  template: `
    <span class="cngx-button__label cngx-action-button__labels">
      <span
        class="cngx-action-button__label"
        [attr.data-active]="activeCell() === 'idle' ? '' : null"
        [attr.aria-hidden]="activeCell() === 'idle' ? null : 'true'"
        ><ng-content
      /></span>
      @if (hasCell().pending) {
        <span
          class="cngx-action-button__label"
          [attr.data-active]="activeCell() === 'pending' ? '' : null"
          [attr.aria-hidden]="activeCell() === 'pending' ? null : 'true'"
        >
          @if (pendingTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else {
            {{ pendingLabel() }}
          }
        </span>
      }
      @if (hasCell().success) {
        <span
          class="cngx-action-button__label"
          [attr.data-active]="activeCell() === 'success' ? '' : null"
          [attr.aria-hidden]="activeCell() === 'success' ? null : 'true'"
        >
          @if (succeededTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else {
            {{ succeededLabel() }}
          }
        </span>
      }
      @if (hasCell().error) {
        <span
          class="cngx-action-button__label"
          [attr.data-active]="activeCell() === 'error' ? '' : null"
          [attr.aria-hidden]="activeCell() === 'error' ? null : 'true'"
        >
          @if (failedTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl.templateRef; context: { $implicit: effectiveError() }"
            />
          } @else {
            {{ failedLabel() }}
          }
        </span>
      }
    </span>
    @if (effectiveBusy() && activeCell() === 'idle') {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrls: ['../../common/button/button.component.css', './action-button.css'],
})
export class CngxActionButton {
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly errorDetail = injectErrorDetail();
  private readonly feedbackI18n = injectFeedbackI18n();
  private readonly externalToastOn = inject(CngxToastOn, { self: true, optional: true });
  protected readonly i18n = injectInteractiveI18n();

  // The host directive is resolved on first read: CngxAsyncClick is created
  // before this component and injects the CNGX_HOST_INTERACTION_STATE it
  // provides, so an eager inject here would be a cycle.
  private readonly injector = inject(Injector);
  private asyncClickRef: CngxAsyncClick | undefined;
  private get asyncClick(): CngxAsyncClick {
    return (this.asyncClickRef ??= this.injector.get(CngxAsyncClick, undefined, { self: true }));
  }

  /**
   * Emphasis, bound through the selector: `cngxActionButton="outline"`. The
   * bare attribute falls through to the group, the config and `solid`.
   */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { alias: 'cngxActionButton', transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. Falls through to the config and `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Size. `md` matches the form-control row. Falls through to the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /**
   * Rendered as `aria-disabled`; the button stays focusable and clicks are
   * swallowed, so the action never starts.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Why the button is disabled, referenced through `aria-describedby` only
   * while `[disabled]` is set.
   */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Ids of external description elements, joined into the button's
   * `aria-describedby` before the disabled reason.
   */
  readonly describedBy = input<string | null>(null, { alias: 'cngxDescribedBy' });

  /** Native `type`. Defaults to `'button'` so the button never submits a form by accident. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  /**
   * SR announcement on success. Falls back to `succeededLabel`, then
   * `CNGX_INTERACTIVE_I18N.asyncClickSucceeded`.
   */
  readonly succeededAnnouncement = input<string | undefined>(undefined);

  /**
   * SR announcement on failure. Falls back to `failedLabel`, then
   * `CNGX_INTERACTIVE_I18N.asyncClickFailed`.
   */
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

  /**
   * @internal - effective status: reflects external `[externalState]` if
   * bound (through the shared `CngxAsyncStatus` reflection - one home for
   * the state->display-bucket mapping), otherwise reads the co-hosted
   * `CngxAsyncClick`.
   */
  protected readonly effectiveStatus = computed(() => {
    const ext = this.externalState();
    if (ext) {
      return reflectAsyncDisplayStatus(ext);
    }
    return this.asyncClick.status();
  });

  /** @internal - effective error value from external state or the directive. */
  protected readonly effectiveError = computed(() => {
    const ext = this.externalState();
    if (ext) {
      return ext.error();
    }
    return this.asyncClick.error();
  });

  /** @internal - busy while the effective status (directive or external) is pending. */
  protected readonly effectiveBusy = computed(() => this.effectiveStatus() === 'pending');

  /** @internal - an external run in flight; the directive does not know about it. */
  private readonly externalBusy = computed(
    () => this.externalState() !== undefined && this.effectiveBusy(),
  );

  /**
   * @internal - what the button core and the directive refuse: the
   * consumer's `[disabled]`, or an external run in flight, so a click cannot
   * start a second run while an external state is pending.
   */
  private readonly blocked = computed(() => this.disabled() || this.externalBusy());

  /** @internal - the reason applies to the consumer's `[disabled]` only. */
  private readonly reason = computed(() => (this.disabled() ? this.disabledReason() : undefined));

  /** @internal - which status cells render: a label or a template for the state. */
  protected readonly hasCell = computed(
    () => ({
      pending: !!this.pendingTpl() || !!this.pendingLabel(),
      success: !!this.succeededTpl() || !!this.succeededLabel(),
      error: !!this.failedTpl() || !!this.failedLabel(),
    }),
    {
      equal: (a, b) => a.pending === b.pending && a.success === b.success && a.error === b.error,
    },
  );

  /**
   * @internal - the visible, named cell: the status cell when it exists,
   * else the idle content.
   */
  protected readonly activeCell = computed<LabelCell>(() => {
    const status = this.effectiveStatus();
    const cells = this.hasCell();
    if (status === 'pending' && cells.pending) {
      return 'pending';
    }
    if (status === 'success' && cells.success) {
      return 'success';
    }
    if (status === 'error' && cells.error) {
      return 'error';
    }
    return 'idle';
  });

  /**
   * @internal - SR announcement derived from the effective status, so an
   * external success/error settles audibly too (the directive only knows
   * its own runs). Spoken by the directive's live region through
   * `CNGX_HOST_INTERACTION_STATE.announcement`. Mirrors the label fallback
   * chain the template uses.
   */
  protected readonly effectiveAnnouncement = computed(() => {
    switch (this.effectiveStatus()) {
      case 'success':
        return untracked(
          () =>
            this.succeededAnnouncement() ??
            this.succeededLabel() ??
            this.i18n().asyncClickSucceeded,
        );
      case 'error':
        return untracked(
          () => this.failedAnnouncement() ?? this.failedLabel() ?? this.i18n().asyncClickFailed,
        );
      default:
        return '';
    }
  });

  /**
   * @internal - what the co-hosted `CngxAsyncClick` folds in: the blocked
   * flag, the external busy bit and the announcement.
   */
  readonly hostInteraction: CngxHostInteractionState = {
    disabled: this.blocked,
    busy: this.externalBusy,
    announcement: this.effectiveAnnouncement,
  };

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.blocked,
      disabledReason: this.reason,
      describedBy: this.describedBy,
      type: this.type,
    },
    { variant: 'solid' },
  );

  private readonly lastUpdatedState = signal<Date | undefined>(undefined);

  /**
   * Full `CngxAsyncState` view of this button's effective lifecycle.
   *
   * Reflects the external state when `[externalState]` is bound,
   * otherwise the co-hosted `CngxAsyncClick` state.
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
    // After the first render: template-bound inputs are unset in the constructor.
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.externalToastOn) {
      afterNextRender(() => {
        if (this.toastSuccess() || this.toastError()) {
          cngxDevWarn(
            'CNGX3008',
            '[cngxActionButton] [toastSuccess]/[toastError] inputs and [cngxToastOn] ' +
              'on the same element will fire duplicate toasts. Use one or the other.',
          );
        }
      });
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
              this.toastErrorDetail() && err != null ? this.errorDetail(err) : undefined;
            this.toaster.show({
              message: detail ? this.feedbackI18n().errorWithDetail(msg, detail) : msg,
              severity: 'error',
              duration: this.toastErrorDuration(),
            });
          }
        }
      });
    });
  }
}
