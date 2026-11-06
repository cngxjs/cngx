import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import {
  CngxButtonBrain,
  CngxButtonEnd,
  CngxButtonStart,
  provideButtonHost,
} from '@cngx/common/button';
import {
  CNGX_ASYNC_RUN_STATE,
  CNGX_HOST_INTERACTION_STATE,
  CngxAsyncClick,
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  injectInteractiveI18n,
  type CngxAsyncSettle,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import {
  buildAsyncStateView,
  injectLazySelf,
  resolveSpokenText,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';

import { CNGX_POPOVER_PANEL_CONFIG } from './popover-panel.config';
import { CngxPopover } from './popover.directive';

/**
 * Async confirm button for a `cngx-popover-panel` footer. A
 * `CngxButtonBrain` host on the native `<button>` with `cngxAsyncClick`
 * co-hosted: `[action]` (required) runs on click, and the button stylesheet
 * paints it. The variant is the selector's own value (default `outline`),
 * `tone` and `size` are inputs, and the size is pinned to `sm` against the
 * group and the config (the input still wins). Tone comes from the button
 * family, not from the panel variant. To close without a run, use
 * `button[cngxPopoverDismiss]`.
 *
 * `disabled` renders `aria-disabled="true"`, keeps the button focusable,
 * refuses the run and references a `disabledReason` through
 * `aria-describedby`. `aria-busy`, `data-pending` and `data-busy` come from
 * the brain over the co-hosted run.
 *
 * Supports the `cngxPending` / `cngxSucceeded` / `cngxFailed` templates of
 * `CngxActionButton`, or use `status()` + `@switch` for full control. The
 * label follows the busy gate (`CNGX_LOADING_CONFIG.showDelay`, held for
 * `minDwell`; `[showDelay]` / `[minDwell]` per button): while the busy
 * visual shows, through the run and its dwell after the settle, the pending
 * template stays visible with no spinner, and without one the spinner covers
 * the idle label. The result templates show once the busy visual releases, so
 * a fast run goes from the idle label straight to the result. `status()`
 * stays immediate; branch a hand-rolled `@switch` on {@link busyVisible} for
 * the same timing.
 *
 * Each settle is spoken once through the `cngxAsyncClick` live region next
 * to the button: `succeededAnnouncement` / `failedAnnouncement`, else the
 * text of the rendered result template (`aria-hidden` parts skipped; read
 * from its cell even while the dwell still hides it), else
 * `CNGX_INTERACTIVE_I18N.asyncClickSucceeded` / `asyncClickFailed`.
 * `[autoAnnounce]="false"` keeps the region empty. Under
 * `withCloseOnSuccess()` the panel closes once per success; focus returns
 * to the trigger through the panel's restore claim; `[closeOnSuccessDelay]`
 * overrides the config per confirm (`null` turns it off). A success that closes
 * the panel is spoken through `CngxLiveAnnouncer` outside it instead (the
 * sibling region hides with the panel), still once.
 *
 * Migration from `cngx-popover-action`: `variant="primary"` is
 * `cngxPopoverAction="solid" tone="primary"`, `variant="danger"` is
 * `cngxPopoverAction="solid" tone="danger"`, `variant="ghost"` is
 * `cngxPopoverAction="ghost"`, `variant="secondary"` is the default
 * `outline`; `role="dismiss"` is `button[cngxPopoverDismiss]`.
 *
 * ### Confirm with templates
 * ```html
 * <button cngxPopoverAction="solid" tone="primary" [action]="save">
 *   Save
 *   <ng-template cngxPending>Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }}</ng-template>
 * </button>
 * ```
 *
 * ### With @switch
 * ```html
 * <button cngxPopoverAction [action]="save" #act="cngxPopoverAction">
 *   @switch (act.status()) {
 *     @case ('pending') { Saving... }
 *     @case ('success') { Done }
 *     @default { Save }
 *   }
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-action.component.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverDismiss, CngxPopoverPanel, CngxPopoverFooter, CngxButtonBrain, CngxAsyncClick
 * @slot cngxPending Replaces the label while the action runs, once the run outlasts the show delay.
 * @slot cngxSucceeded Replaces the label after the action succeeds, once the busy visual releases.
 * @slot cngxFailed Replaces the label when the action fails, once the busy visual releases; gets the error.
 * <example-url>/#/common/popover/popover-panel/with-footer-actions</example-url>
 * <example-url>/#/common/popover/popover-panel/with-dividers</example-url>
 * <example-url>/#/common/popover/popover-panel/footer-actions-plain</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxPopoverAction]',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxPopoverAction',
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxPopoverAction',
        'tone',
        'size',
        'disabled',
        'disabledReason',
        'cngxDescribedBy',
        'type',
      ],
    },
    {
      directive: CngxAsyncClick,
      inputs: ['cngxAsyncClick: action', 'feedbackDuration', 'showDelay', 'minDwell'],
      outputs: ['settled'],
    },
  ],
  providers: [
    provideButtonHost('cngxPopoverAction', { defaultVariant: 'outline', fixed: { size: 'sm' } }),
    // Wins over the brain's entry (host providers beat host-directive
    // providers); only adds the announcement to the brain's state.
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => inject(CngxPopoverAction).hostInteraction,
    },
  ],
  host: {
    class: 'cngx-button cngx-popover-action',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
    '[attr.data-status-label]': 'activeCell() === "idle" ? null : ""',
  },
  template: `
    <ng-template #idle><ng-content /></ng-template>
    <ng-content select="[cngxButtonStart]" />
    <span class="cngx-button__label cngx-popover-action__labels">
      @if (activeCell() === 'idle') {
        <span class="cngx-popover-action__label" data-active>
          <ng-container *ngTemplateOutlet="idle" />
        </span>
      }
      @if (activeCell() === 'pending' && pendingTpl(); as tpl) {
        <span class="cngx-popover-action__label" data-active>
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        </span>
      }
      @if (resultCell() === 'success' && succeededTpl(); as tpl) {
        <span
          #succeededCell
          class="cngx-popover-action__label"
          [attr.data-active]="activeCell() === 'success' ? '' : null"
          [attr.aria-hidden]="activeCell() === 'success' ? null : 'true'"
        >
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        </span>
      }
      @if (resultCell() === 'error' && failedTpl(); as tpl) {
        <span
          #failedCell
          class="cngx-popover-action__label"
          [attr.data-active]="activeCell() === 'error' ? '' : null"
          [attr.aria-hidden]="activeCell() === 'error' ? null : 'true'"
        >
          <ng-container
            *ngTemplateOutlet="tpl.templateRef; context: { $implicit: state.error() }"
          />
        </span>
      }
    </span>
    <ng-content select="[cngxButtonEnd]" />
    @if (brain.busyVisible() && activeCell() === 'idle') {
      <span class="cngx-button__busy" aria-hidden="true">
        @if (brain.spinner; as spinner) {
          <ng-container *ngComponentOutlet="spinner" />
        } @else {
          <span class="cngx-button__spinner"></span>
        }
      </span>
    }
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styleUrls: ['../button/button.component.css', './popover-action.component.css'],
})
export class CngxPopoverAction {
  private readonly popover = inject(CngxPopover, { optional: true });
  private readonly config = inject(CNGX_POPOVER_PANEL_CONFIG);
  private readonly i18n = injectInteractiveI18n();
  private readonly announcer = inject(CngxLiveAnnouncer);
  // The co-hosted run is resolved on first read: the runner is created before
  // this component and injects the CNGX_HOST_INTERACTION_STATE it provides,
  // so an eager inject here would be a cycle.
  private readonly runState = injectLazySelf(CNGX_ASYNC_RUN_STATE);

  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);
  protected readonly pendingTpl = contentChild(CngxPending);
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  protected readonly failedTpl = contentChild(CngxFailed);

  private readonly succeededCell = viewChild('succeededCell', { read: ElementRef });
  private readonly failedCell = viewChild('failedCell', { read: ElementRef });

  /**
   * @internal - the result cell the run's status asks for: `'success'` /
   * `'error'` while that status holds and its template is projected, else
   * `null`. It is rendered from the settle on, `aria-hidden` until it is the
   * {@link activeCell}, so the settle announcement reads the result text
   * while the busy visual still holds the pending or idle cell.
   */
  protected readonly resultCell = computed<'success' | 'error' | null>(() => {
    const status = this.status();
    if (status === 'success' && this.succeededTpl()) {
      return 'success';
    }
    if (status === 'error' && this.failedTpl()) {
      return 'error';
    }
    return null;
  });

  /**
   * @internal - the visible, named label cell, gated on the busy visual as on
   * `CngxActionButton`: while it is held (the run and its post-settle dwell)
   * the `cngxPending` cell shows if one is projected, else the idle label
   * under the spinner; result cells show only once it releases. A run faster
   * than the show delay goes from idle to the result with no pending flash.
   * Any cell but `'idle'` sets `data-status-label`, which keeps the label
   * visible under `data-busy` and drops the spinner.
   */
  protected readonly activeCell = computed<'idle' | 'pending' | 'success' | 'error'>(() => {
    if (this.brain.busyVisible()) {
      return this.pendingTpl() ? 'pending' : 'idle';
    }
    return this.resultCell() ?? 'idle';
  });

  /**
   * SR announcement on success. Falls back to the text of a projected
   * `cngxSucceeded` template, then `CNGX_INTERACTIVE_I18N.asyncClickSucceeded`.
   */
  readonly succeededAnnouncement = input<string | undefined>(undefined);

  /**
   * SR announcement on failure. Falls back to the text of a projected
   * `cngxFailed` template, then `CNGX_INTERACTIVE_I18N.asyncClickFailed`.
   */
  readonly failedAnnouncement = input<string | undefined>(undefined);

  /**
   * `false` keeps the `cngxAsyncClick` live region next to the button empty:
   * it stays in the DOM but receives no text; drive your own region from
   * `(settled)` then. Unbound or `true`, every settle is spoken.
   */
  readonly autoAnnounce = input<boolean | undefined>(undefined);

  /**
   * Per-instance close-on-success, named after the
   * `CNGX_POPOVER_PANEL_CONFIG.closeOnSuccessDelay` it overrides. A number
   * closes the composing popover that many ms after each success, also
   * without `withCloseOnSuccess()`; `null` keeps this confirm's popover open
   * although the config closes it; unbound (`undefined`) uses the config.
   */
  readonly closeOnSuccessDelay = input<number | null | undefined>(undefined);

  /**
   * Lifecycle status of the run - `'idle' | 'pending' | 'success' |
   * 'error'`, from the co-hosted `cngxAsyncClick`. Immediate, not gated.
   */
  readonly status = computed<AsyncStatus>(() => this.runState().state.status());

  /**
   * `true` while the busy visual shows: the run after the loading config's
   * show delay, held for its min-dwell.
   */
  readonly busyVisible = this.brain.busyVisible;

  /**
   * Full `CngxAsyncState` view of the run. Bind it to a state consumer:
   * `[state]="act.state"` on `cngxToastOn` or `cngxAlertOn`.
   */
  readonly state: CngxAsyncState<unknown> = buildAsyncStateView<unknown>({
    status: this.status,
    data: computed(() => undefined),
    error: computed(() => this.runState().state.error()),
    lastUpdated: computed(() => this.runState().state.lastUpdated()),
  });

  /**
   * @internal - what the co-hosted `cngxAsyncClick` folds in: the brain's
   * state plus the announcement, read once per settle after render.
   */
  readonly hostInteraction: CngxHostInteractionState = {
    ...this.brain.interaction,
    announcement: (settle) => (settle ? this.routeAnnouncement(settle) : ''),
  };

  private closeOnSuccessTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // The runner cannot be read during construction (it injects the host
    // state this component provides), and a settle needs a click on the
    // rendered button.
    afterNextRender(() => {
      this.runState().settled.subscribe((settle) => this.handleSettled(settle));
    });

    // A follow-up run cancels a scheduled close, so a re-triggered action
    // never yanks the panel away mid-interaction.
    effect(() => {
      if (this.runState().pending()) {
        untracked(() => this.clearCloseOnSuccessTimer());
      }
    });

    inject(DestroyRef).onDestroy(() => this.clearCloseOnSuccessTimer());
  }

  /** One settle: re-arms close-on-success (`withCloseOnSuccess()`). */
  private handleSettled(settle: CngxAsyncSettle): void {
    this.clearCloseOnSuccessTimer();
    const delay = this.closeDelayFor(settle);
    if (delay === undefined) {
      return;
    }
    this.closeOnSuccessTimer = setTimeout(() => {
      this.closeOnSuccessTimer = null;
      this.popover?.hide();
    }, delay);
  }

  /** The close delay a settle arms, or `undefined` when it closes nothing. */
  private closeDelayFor(settle: CngxAsyncSettle): number | undefined {
    if (settle.status !== 'success' || !this.popover) {
      return undefined;
    }
    const delay = untracked(this.closeOnSuccessDelay);
    if (delay === null) {
      return undefined;
    }
    return delay ?? this.config.closeOnSuccessDelay;
  }

  /**
   * Where a settle is spoken. A success that closes the panel goes through
   * `CngxLiveAnnouncer`, scoped to the popover's parent: the `cngxAsyncClick`
   * region sits inside the panel, which hides after the close delay (maybe
   * 0 ms) and can take the text with it before AT reads it. That region gets
   * `''` for the settle, so it is spoken once.
   */
  private routeAnnouncement(settle: CngxAsyncSettle): string {
    const text = this.resolveAnnouncement(settle.status);
    if (text === '' || this.closeDelayFor(settle) === undefined) {
      return text;
    }
    const scope = this.popover?.elementRef.nativeElement.parentElement ?? null;
    untracked(() => this.announcer.announce(text, 'polite', scope));
    return '';
  }

  /**
   * The settle text the region speaks, read once per settle after render:
   * the explicit announcement, the rendered result template, the i18n copy.
   */
  private resolveAnnouncement(status: 'success' | 'error'): string {
    return untracked(() => {
      if (this.autoAnnounce() === false) {
        return '';
      }
      const success = status === 'success';
      const explicit = success ? this.succeededAnnouncement() : this.failedAnnouncement();
      if (explicit !== undefined) {
        return explicit;
      }
      // The settle's own result cell, rendered (and aria-hidden while the
      // busy visual holds) since the settle; never the pending cell.
      const cell = success ? this.succeededCell() : this.failedCell();
      const rendered = cell ? resolveSpokenText(cell.nativeElement as Element) : '';
      if (rendered !== '') {
        return rendered;
      }
      return success ? this.i18n().asyncClickSucceeded : this.i18n().asyncClickFailed;
    });
  }

  private clearCloseOnSuccessTimer(): void {
    if (this.closeOnSuccessTimer) {
      clearTimeout(this.closeOnSuccessTimer);
      this.closeOnSuccessTimer = null;
    }
  }
}
