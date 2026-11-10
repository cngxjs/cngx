import type { CngxTriggerFocusState } from '../trigger-focus';
import type { HostFocusWithin } from './host-focus-within';
import { isFocusOpenMode } from './open-on-focus-gesture';

/** @internal */
export interface CngxInputHostBlurLeave {
  /** The host element; a blur whose `relatedTarget` sits inside it is not a leave. */
  readonly host: HTMLElement;
  /** `false` skips the post-blur action (`[clearOnBlur]="false"`). */
  readonly clearOnBlur: () => boolean;
  /** The variant's own action once focus left the host, e.g. snapping the input text back. */
  readonly onLeave: () => void;
}

/** @internal */
export interface CngxInputHostHandlersOptions {
  readonly focusState: Pick<CngxTriggerFocusState, 'markFocused' | 'markBlurred'>;
  readonly focusWithin: Pick<HostFocusWithin, 'refocusOwnerBeforeRemoval'>;
  /** Current `openOn` mode (read from the resolved select config). */
  readonly openOn: () => 'click' | 'focus' | 'click+focus' | undefined;
  readonly open: () => void;
  /** `true` inside the post-close focus restore, which must not reopen under `openOn: 'focus'`. */
  readonly suppressOpenOnFocus: () => boolean;
  readonly disabled: () => boolean;
  readonly panelOpen: () => boolean;
  /** Moves focus into the input. */
  readonly focus: () => void;
  readonly inputEl: () => HTMLElement | undefined;
  /**
   * `CNGX_NESTED_INTERACTIVE_SELECTOR`. A wrapper click on a nested control
   * (chip remove, clear button) is left alone; omit it when the variant has
   * none, then every wrapper click focuses and opens.
   */
  readonly nestedInteractive?: string;
  /** Without it a blur only marks the trigger blurred. */
  readonly blurLeave?: CngxInputHostBlurLeave;
  readonly retryFn: () => (() => void) | null;
  /** Emits the variant's `retry` output. */
  readonly retry: () => void;
}

/** @internal */
export interface CngxInputHostHandlers {
  /** Bind to the input's `(focus)`. */
  readonly handleFocus: () => void;
  /** Bind to the input's `(blur)` with `$event`. */
  readonly handleBlur: (event?: FocusEvent) => void;
  /** Panel Retry button; refocuses the owner before the retry removes the button. */
  readonly handleRetry: () => void;
  /** Bind to the wrapper's `(click)`; `$event` is only needed with `nestedInteractive`. */
  readonly handleWrapperClick: (event?: MouseEvent) => void;
}

/**
 * Focus, blur, retry and wrapper-click handlers of the four input-owned
 * variants (typeahead, combobox, action-select, action-multi-select).
 * Typeahead and action-select snap the input text back on a blur that leaves
 * the host; combobox and action-multi-select keep the typed term, so the
 * post-blur action is the variant's `blurLeave`, not shared behaviour.
 */
export function createInputHostHandlers(opts: CngxInputHostHandlersOptions): CngxInputHostHandlers {
  return {
    handleFocus(): void {
      opts.focusState.markFocused();
      if (isFocusOpenMode(opts.openOn()) && !opts.suppressOpenOnFocus()) {
        opts.open();
      }
    },
    handleBlur(event?: FocusEvent): void {
      opts.focusState.markBlurred();
      const leave = opts.blurLeave;
      if (!leave?.clearOnBlur()) {
        return;
      }
      // Focus moving inside the host (panel Retry, option row, action button)
      // keeps the typed term: the blur races the click.
      const related = event?.relatedTarget as HTMLElement | null;
      if (related && leave.host.contains(related)) {
        return;
      }
      leave.onLeave();
    },
    handleRetry(): void {
      opts.focusWithin.refocusOwnerBeforeRemoval();
      opts.retryFn()?.();
      opts.retry();
    },
    handleWrapperClick(event?: MouseEvent): void {
      if (opts.disabled()) {
        return;
      }
      const target = event?.target as HTMLElement | null;
      const nested = opts.nestedInteractive ? target?.closest(opts.nestedInteractive) : null;
      // The own input matches the selector too; a click on it must still open.
      if (nested && nested !== opts.inputEl()) {
        return;
      }
      opts.focus();
      if (!opts.panelOpen()) {
        opts.open();
      }
    },
  };
}
