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
  type CngxActionOutcome,
  type CngxAnnouncementCover,
} from '@cngx/common/interactive';
import { injectLazySelf } from '@cngx/core/utils';

import { CNGX_POPOVER_PANEL_CONFIG } from './popover-panel.config';
import { CngxPopover } from './popover.directive';

/**
 * Closes the composing `CngxPopover` after each success outcome of the
 * co-hosted `CngxActionStatusBrain` (an own run, or a `success` edge of a
 * bound `[externalState]`): `CNGX_POPOVER_PANEL_CONFIG.closeOnSuccessDelay`
 * (`withCloseOnSuccess()`), or `[closeOnSuccessDelay]` per instance. A
 * follow-up run cancels a scheduled close. Focus returns to the trigger
 * through the panel's restore claim; this directive restores nothing.
 *
 * The runner's live region sits inside the panel, which hides after the
 * delay (maybe 0 ms) and can take the text with it before AT reads it. So
 * a success that arms a close is covered (`CNGX_ANNOUNCEMENT_COVER`, the
 * region gets `''`) and spoken through `CngxLiveAnnouncer` outside, scoped
 * to the popover's parent, once, with the text `CNGX_ACTION_STATUS` resolves
 * for it, unless another co-hosted cover (a toast) voices it already. A
 * selector-less host directive; `CngxPopoverAction` co-hosts it
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
  providers: [
    { provide: CNGX_ANNOUNCEMENT_COVER, useExisting: CngxPopoverCloseOnSuccess, multi: true },
  ],
})
export class CngxPopoverCloseOnSuccess implements CngxAnnouncementCover {
  private readonly popover = inject(CngxPopover, { optional: true });
  private readonly config = inject(CNGX_POPOVER_PANEL_CONFIG);
  private readonly announcer = inject(CngxLiveAnnouncer);
  private readonly status = inject(CNGX_ACTION_STATUS);
  private readonly injector = inject(Injector);
  private readonly coverUnits = injectLazySelf(CNGX_ANNOUNCEMENT_COVER, { optional: true });

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
    // The status outcome, not the runner's settle: it follows a bound
    // [externalState] and is silent for the own runs while one is bound.
    this.status.outcome.subscribe((outcome) => this.handleOutcome(outcome));

    // A follow-up run cancels a scheduled close, so a re-triggered action
    // never yanks the panel away mid-interaction.
    effect(() => {
      if (this.status.status() === 'pending') {
        untracked(() => this.clearCloseOnSuccessTimer());
      }
    });

    inject(DestroyRef).onDestroy(() => this.clearCloseOnSuccessTimer());
  }

  /** `true` for a success that arms a close: it is spoken outside the panel instead. */
  covers(status: 'success' | 'error'): boolean {
    return this.closeDelayFor(status) !== undefined;
  }

  /** One outcome: re-arms the close and speaks a closing success outside the panel. */
  private handleOutcome(outcome: CngxActionOutcome): void {
    this.clearCloseOnSuccessTimer();
    const delay = this.closeDelayFor(outcome.status);
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
    if (text === '' || this.coveredElsewhere()) {
      return;
    }
    const scope = this.popover?.elementRef.nativeElement.parentElement ?? null;
    untracked(() => this.announcer.announce(text, 'polite', scope));
  }

  /** `true` when another co-hosted cover (a toast) already voices the success. */
  private coveredElsewhere(): boolean {
    return untracked(
      () => this.coverUnits()?.some((c) => c !== this && c.covers('success')) ?? false,
    );
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
