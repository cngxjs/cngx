import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  untracked,
  viewChild,
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
  type CngxAsyncSettle,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import {
  buildAsyncStateView,
  createTransitionTracker,
  resolveSpokenText,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';
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
 * idle label stays in place under the busy spinner. The spinner and the
 * pending label wait for the `cngxAsyncClick` busy gate
 * (`CNGX_LOADING_CONFIG.showDelay`, held for `minDwell`; `[showDelay]` /
 * `[minDwell]` per button), so a fast run goes from the idle label straight
 * to the result. The success and failure labels, `aria-busy` and the
 * announcement follow the run at once.
 *
 * The status announcement is spoken through the `cngxAsyncClick` live
 * region next to the button, once per run (`(settled)`), also for a bound
 * `[externalState]` (once per observed edge). It speaks what the button
 * shows: on failure `failedAnnouncement`, then the text of a projected
 * `cngxFailed` template, then `failedLabel`, then
 * `CNGX_INTERACTIVE_I18N.asyncClickFailed`. An outcome a shown toast already
 * announces is not spoken twice (see `autoAnnounce`).
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
 * @slot cngxPending Replaces the label while the action runs, once the run outlasts the show delay.
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
      inputs: ['cngxAsyncClick: action', 'feedbackDuration', 'showDelay', 'minDwell'],
      outputs: ['settled'],
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
    '[attr.data-busy]': 'core.busyVisible() ? "true" : null',
    '[attr.data-pending]': 'effectiveBusy() ? "true" : null',
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
          #failedCell
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
    @if (core.busyVisible() && activeCell() === 'idle') {
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
   * SR announcement on failure. Falls back to the text of a projected
   * `cngxFailed` template (what the button shows, `aria-hidden` parts
   * skipped), then `failedLabel`, then `CNGX_INTERACTIVE_I18N.asyncClickFailed`.
   */
  readonly failedAnnouncement = input<string | undefined>(undefined);

  /**
   * What the `cngxAsyncClick` live region next to the button speaks. Unbound,
   * it speaks every settle except an outcome a shown toast already announces
   * (`toastSuccess` / `toastError` set and a `CngxToaster` provided), so it
   * is heard once. `true` speaks every settle, also next to a toast. `false`
   * keeps the region silent: it stays in the DOM (the co-hosted
   * `cngxAsyncClick` owns it) but receives no text; drive your own region
   * from `(settled)` then. Accepts `boolean | undefined`, so a signal that
   * starts unset binds as is.
   */
  readonly autoAnnounce = input<boolean | undefined>(undefined);

  /**
   * Fallback text while pending (when no `cngxPending` template is projected).
   * Shows once the run outlasts the show delay, like the spinner.
   */
  readonly pendingLabel = input<string | undefined>(undefined);

  /** Fallback text after success (when no `cngxSucceeded` template is projected). */
  readonly succeededLabel = input<string | undefined>(undefined);

  /** Fallback text after failure (when no `cngxFailed` template is projected). */
  readonly failedLabel = input<string | undefined>(undefined);

  /**
   * Bind an external async state to derive visual status from.
   * When set, the button's status display, `state`, toasts and announcement
   * follow `externalState`, and clicks are refused while it is pending.
   *
   * Exclusive with the button's own runs: bind either `[action]` (the button
   * runs it and reports each settle) or `[externalState]` (the button
   * reflects a run it does not own). With both bound, the external state
   * wins for display, `state` and feedback. External state is state: the
   * toast and the announcement fire once per observed `success` / `error`
   * edge, so an identical settle with no change in between is not re-spoken,
   * and a state that is already settled when bound is not an edge.
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
   * else the idle content. Gated on the busy visual: a run faster than the
   * show delay goes idle -> result with no pending flash; while the busy
   * visual is held (the run and its dwell) the pending cell stays if there is
   * one, else idle under the spinner, and the result cells render only once it
   * releases - so a result label never sits under `data-busy` and the
   * start/end slots never hide beneath it (E2, A-n3).
   */
  protected readonly activeCell = computed<LabelCell>(() => {
    const status = this.effectiveStatus();
    const cells = this.hasCell();
    if (this.core.busyVisible()) {
      return cells.pending ? 'pending' : 'idle';
    }
    // Busy visual not shown: the delay window and fast runs stay idle (no
    // pending flash), and result cells render only once the visual has
    // released.
    if (status === 'success' && cells.success) {
      return 'success';
    }
    if (status === 'error' && cells.error) {
      return 'error';
    }
    return 'idle';
  });

  /**
   * @internal - what the co-hosted `CngxAsyncClick` folds in: the blocked
   * flag, the external busy bit and the announcement, read by the directive
   * once per own settle after render with that settle's outcome. While
   * `[externalState]` is bound the own runs speak nothing: the external
   * edges own the region, like the toast.
   */
  readonly hostInteraction: CngxHostInteractionState = {
    disabled: this.blocked,
    busy: this.externalBusy,
    announcement: (settle) =>
      settle && !untracked(this.externalState) ? this.resolveAnnouncement(settle.status) : '',
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

  /**
   * @internal - one source per mode: the external state's stamp while
   * `[externalState]` is bound (no fall-through to the own runs), else the
   * co-hosted `CngxAsyncClick`.
   */
  private readonly effectiveLastUpdated = computed(() => {
    const ext = this.externalState();
    return ext ? ext.lastUpdated() : this.asyncClick.state.lastUpdated();
  });

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
    lastUpdated: this.effectiveLastUpdated,
  });

  /** @internal */
  protected readonly pendingTpl = contentChild(CngxPending);
  /** @internal */
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  /** @internal */
  protected readonly failedTpl = contentChild(CngxFailed);

  private readonly failedCell = viewChild('failedCell', { read: ElementRef });

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

    // Own runs: one toast per settle. The co-hosted directive cannot be read
    // during construction (it injects the host state this component
    // provides), and a settle needs a click on the rendered button.
    afterNextRender(() => {
      this.asyncClick.settled.subscribe((settle) => this.handleOwnSettle(settle));
    });

    // External runs: state, so one toast and one announcement per edge.
    const tracker = createTransitionTracker(() => this.effectiveStatus());
    effect(() => {
      const status = tracker.current();
      const previous = tracker.previous();
      if (status === previous) {
        return;
      }
      // Only the edge re-runs this body; everything else is read untracked,
      // so a toast-input rebind inside the settled window cannot re-fire.
      untracked(() => this.handleExternalEdge(status));
    });
  }

  private handleOwnSettle(settle: CngxAsyncSettle): void {
    if (untracked(this.externalState)) {
      return;
    }
    untracked(() => this.showToast(settle.status, settle.error));
  }

  private handleExternalEdge(status: AsyncStatus): void {
    if (!this.externalState()) {
      return;
    }
    // Back to idle closes the feedback window: empty the region so no stale
    // outcome stays readable, as the directive does for its own runs.
    if (status === 'idle') {
      this.asyncClick.announce('');
      return;
    }
    if (status !== 'success' && status !== 'error') {
      return;
    }
    this.showToast(status, this.effectiveError());
    // After render, so a projected failed template shows the new error
    // before its text is read. The edge status, not the status at render.
    afterNextRender(
      { write: () => this.asyncClick.announce(this.resolveAnnouncement(status)) },
      { injector: this.injector },
    );
  }

  private showToast(status: 'success' | 'error', err: unknown): void {
    if (!this.toaster) {
      return;
    }
    if (status === 'success') {
      const msg = this.toastSuccess();
      if (msg) {
        this.toaster.show({
          message: msg,
          severity: 'success',
          duration: this.toastSuccessDuration(),
        });
      }
      return;
    }
    const msg = this.toastError();
    if (!msg) {
      return;
    }
    const detail = this.toastErrorDetail() && err != null ? this.errorDetail(err) : undefined;
    this.toaster.show({
      message: detail ? this.feedbackI18n().errorWithDetail(msg, detail) : msg,
      severity: 'error',
      duration: this.toastErrorDuration(),
    });
  }

  /** `true` when a shown toast already announces this outcome. */
  private toastCovers(status: 'success' | 'error'): boolean {
    if (!this.toaster) {
      return false;
    }
    return status === 'success' ? !!this.toastSuccess() : !!this.toastError();
  }

  /**
   * The settle text the region speaks, read once per settle after render:
   * the same precedence as the visible cell. `''` under
   * `[autoAnnounce]="false"`, and for an outcome a shown toast covers unless
   * `[autoAnnounce]="true"`.
   */
  private resolveAnnouncement(status: 'success' | 'error'): string {
    return untracked(() => {
      const auto = this.autoAnnounce();
      if (auto === false) {
        return '';
      }
      if (this.toastCovers(status) && auto !== true) {
        return '';
      }
      if (status === 'success') {
        return (
          this.succeededAnnouncement() ?? this.succeededLabel() ?? this.i18n().asyncClickSucceeded
        );
      }
      // The rendered template ranks between the explicit announcement and
      // the label, like the visible cell.
      const explicit = this.failedAnnouncement();
      if (explicit !== undefined) {
        return explicit;
      }
      const rendered = this.renderedFailedText();
      if (rendered !== undefined) {
        return rendered;
      }
      return this.failedLabel() ?? this.i18n().asyncClickFailed;
    });
  }

  /** Text of the rendered `cngxFailed` template, or `undefined` without one. */
  private renderedFailedText(): string | undefined {
    const cell = this.failedTpl() ? this.failedCell() : undefined;
    if (!cell) {
      return undefined;
    }
    const text = resolveSpokenText(cell.nativeElement as Element);
    return text === '' ? undefined : text;
  }
}
