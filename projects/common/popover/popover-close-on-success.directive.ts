import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  inject,
  Injector,
  input,
  untracked,
} from '@angular/core';
import { CngxLiveAnnouncer } from '@cngx/common/a11y';
import {
  CNGX_ACTION_STATUS,
  CNGX_ANNOUNCEMENT_COVER,
  CNGX_ASYNC_RUN_STATE,
  type CngxAnnouncementCover,
  type CngxAsyncSettle,
} from '@cngx/common/interactive';
import { injectLazySelf } from '@cngx/core/utils';

import { CNGX_POPOVER_PANEL_CONFIG } from './popover-panel.config';
import { CngxPopover } from './popover.directive';

/**
 * Closes the composing `CngxPopover` after each success of the co-hosted
 * `cngxAsyncClick` run: `CNGX_POPOVER_PANEL_CONFIG.closeOnSuccessDelay`
 * (`withCloseOnSuccess()`), or `[closeOnSuccessDelay]` per instance. A
 * follow-up run cancels a scheduled close. Focus returns to the trigger
 * through the panel's restore claim; this directive restores nothing.
 *
 * The runner's live region sits inside the panel, which hides after the
 * delay (maybe 0 ms) and can take the text with it before AT reads it. So
 * a success that arms a close is covered (`CNGX_ANNOUNCEMENT_COVER`, the
 * region gets `''`) and spoken through `CngxLiveAnnouncer` outside, scoped
 * to the popover's parent, once, with the text `CNGX_ACTION_STATUS` resolves
 * for it. A selector-less host directive; `CngxPopoverAction` co-hosts it
 * next to `CngxActionStatusBrain`.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-close-on-success.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverAction, CngxActionStatusBrain, CNGX_ANNOUNCEMENT_COVER, CNGX_POPOVER_PANEL_CONFIG
 * <example-url>/#/common/popover/popover-panel/close-on-success</example-url>
 * @axis level molecule
 */
@Directive({
  standalone: true,
  exportAs: 'cngxPopoverCloseOnSuccess',
  providers: [{ provide: CNGX_ANNOUNCEMENT_COVER, useExisting: CngxPopoverCloseOnSuccess }],
})
export class CngxPopoverCloseOnSuccess implements CngxAnnouncementCover {
  private readonly popover = inject(CngxPopover, { optional: true });
  private readonly config = inject(CNGX_POPOVER_PANEL_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly status = inject(CNGX_ACTION_STATUS);
  private readonly injector = inject(Injector);
  private readonly runState = injectLazySelf(CNGX_ASYNC_RUN_STATE);

  /**
   * Per-instance close-on-success, named after the
   * `CNGX_POPOVER_PANEL_CONFIG.closeOnSuccessDelay` it overrides. A number
   * closes the composing popover that many ms after each success, also
   * without `withCloseOnSuccess()`; `null` keeps this confirm's popover open
   * although the config closes it; unbound (`undefined`) uses the config.
   */
  readonly closeOnSuccessDelay = input<number | null | undefined>(undefined);

  private closeOnSuccessTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // The runner cannot be read during construction (it injects the host
    // state that reads the status brain), and a settle needs a click on the
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

  /** `true` for a success that arms a close: it is spoken outside the panel instead. */
  covers(status: 'success' | 'error'): boolean {
    return this.closeDelayFor(status) !== undefined;
  }

  /** One settle: re-arms the close and speaks a closing success outside the panel. */
  private handleSettled(settle: CngxAsyncSettle): void {
    this.clearCloseOnSuccessTimer();
    const delay = this.closeDelayFor(settle.status);
    if (delay === undefined) {
      return;
    }
    this.closeOnSuccessTimer = setTimeout(() => {
      this.closeOnSuccessTimer = null;
      this.popover?.hide();
    }, delay);
    // After render, so the result cell shows this settle before its text is read.
    afterNextRender({ write: () => this.announceOutside() }, { injector: this.injector });
  }

  private announceOutside(): void {
    const text = this.status.outcomeText('success');
    if (text === '') {
      return;
    }
    const scope = this.popover?.elementRef.nativeElement.parentElement ?? null;
    untracked(() => this.announcer.announce(text, 'polite', scope));
  }

  /** The close delay an outcome arms, or `undefined` when it closes nothing. */
  private closeDelayFor(status: 'success' | 'error'): number | undefined {
    if (status !== 'success' || !this.popover) {
      return undefined;
    }
    const delay = untracked(this.closeOnSuccessDelay);
    if (delay === null) {
      return undefined;
    }
    return delay ?? this.config.closeOnSuccessDelay;
  }

  private clearCloseOnSuccessTimer(): void {
    if (this.closeOnSuccessTimer) {
      clearTimeout(this.closeOnSuccessTimer);
      this.closeOnSuccessTimer = null;
    }
  }
}
