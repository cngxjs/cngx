import {
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Renderer2,
  untracked,
  type Signal,
} from '@angular/core';

import { nextUid } from '@cngx/core/utils';

/** Reactive surface {@link createSliderDisabledReason} hands back to the track. */
export interface CngxSliderDisabledReason {
  /**
   * `aria-describedby` value for the track host: the internal reason id
   * while `disabled && reason` applies, else the consumer passthrough id,
   * else `null`.
   */
  readonly resolvedDescribedBy: Signal<string | null>;
}

/**
 * Internal disabled-"why" mechanism shared by `CngxSliderTrack` and
 * `CngxRangeSliderTrack`. Appends an sr-only description span to the host
 * via `Renderer2` (the tracks are headless directives on consumer markup,
 * so there is no template to project into - same constraint and same shape
 * as `CngxChipInteraction`). Always-in-DOM per Pillar 2; both the span's
 * `aria-hidden` and the emitted id reference are gated on
 * `disabled() && reason()` (Toggle/Radio convergence): accname 1.2 §2A
 * traverses a directly referenced hidden node, so the id must only be
 * emitted while the description applies.
 *
 * Must run in an injection context (field initializer / constructor).
 * Not exported from `public-api.ts` - decompose glue, not a consumer
 * contract.
 *
 * @category common/interactive/slider
 */
export function createSliderDisabledReason(opts: {
  /** Uid prefix for the span id (`cngx-slider-desc` / `cngx-range-slider-desc`). */
  readonly idPrefix: string;
  readonly disabled: () => boolean;
  readonly reason: () => string;
  /** Consumer `cngxDescribedBy` passthrough consulted while the reason does not apply. */
  readonly describedBy: () => string | null;
}): CngxSliderDisabledReason {
  const hostEl = (inject(ElementRef) as ElementRef<HTMLElement>).nativeElement;
  const renderer = inject(Renderer2);
  const describedId = nextUid(opts.idPrefix);

  const span = renderer.createElement('span') as HTMLSpanElement;
  renderer.setAttribute(span, 'id', describedId);
  renderer.setAttribute(span, 'aria-hidden', 'true');
  // sr-only via inline styles - the directive runs in arbitrary markup, so it
  // cannot require a consumer stylesheet. Every value reads `--cngx-sr-only-*`
  // first so consumers can still override (structural/thematic split).
  renderer.setStyle(span, 'position', 'var(--cngx-sr-only-position, absolute)');
  renderer.setStyle(span, 'width', 'var(--cngx-sr-only-size, 1px)');
  renderer.setStyle(span, 'height', 'var(--cngx-sr-only-size, 1px)');
  renderer.setStyle(span, 'overflow', 'var(--cngx-sr-only-overflow, hidden)');
  renderer.setStyle(span, 'clip', 'var(--cngx-sr-only-clip, rect(0, 0, 0, 0))');
  renderer.setStyle(span, 'white-space', 'var(--cngx-sr-only-white-space, nowrap)');
  renderer.appendChild(hostEl, span);

  // Host may outlive the directive (structural re-projection) - without
  // explicit removal the span leaks and the next instance collides on id.
  inject(DestroyRef).onDestroy(() => {
    // Host may already be detached by a parent structural directive at the
    // same destroy tick; removeChild on a stale parent throws.
    if (span.parentNode === hostEl) {
      renderer.removeChild(hostEl, span);
    }
  });

  effect(() => {
    const reason = opts.disabled() && opts.reason() ? opts.reason() : '';
    untracked(() => {
      if (reason) {
        renderer.removeAttribute(span, 'aria-hidden');
        span.textContent = reason;
      } else {
        renderer.setAttribute(span, 'aria-hidden', 'true');
        span.textContent = '';
      }
    });
  });

  return {
    resolvedDescribedBy: computed<string | null>(() => {
      if (opts.disabled() && opts.reason()) {
        return describedId;
      }
      return opts.describedBy();
    }),
  };
}
